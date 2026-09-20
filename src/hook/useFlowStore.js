import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Node, Edge, addEdge, applyNodeChanges, applyEdgeChanges, Connection } from '@xyflow/react';
import { DEFAULT_WHATSAPP_SETTINGS, normalizeWhatsappSettings } from '@/app/[locale]/automations/atoms/whatsapp-flow-settings';
import { isValidFlowConnection } from '@/app/[locale]/automations/utils/isValidFlowConnection';
import { getRunPathEdgeIds } from '@/app/[locale]/automations/utils/isRunPathEdge';

const EMPTY_RUN_PATH_IDS = new Set();

function attachRunPath(set, get) {
  return (partial, replace) => {
    if (typeof partial === 'function') {
      return set((state) => {
        const resolved = partial(state);
        if (!resolved || replace === true) return resolved;
        if (!Object.prototype.hasOwnProperty.call(resolved, 'edges')
          && !Object.prototype.hasOwnProperty.call(resolved, 'currentRun')) {
          return resolved;
        }
        const currentRun = Object.prototype.hasOwnProperty.call(resolved, 'currentRun')
          ? resolved.currentRun
          : state.currentRun;
        const edges = Object.prototype.hasOwnProperty.call(resolved, 'edges')
          ? resolved.edges
          : state.edges;
        return { ...resolved, runPathEdgeIds: getRunPathEdgeIds(currentRun, edges) };
      }, replace);
    }
    if (partial && replace !== true
      && (Object.prototype.hasOwnProperty.call(partial, 'edges')
        || Object.prototype.hasOwnProperty.call(partial, 'currentRun'))) {
      const state = get();
      const currentRun = Object.prototype.hasOwnProperty.call(partial, 'currentRun')
        ? partial.currentRun
        : state.currentRun;
      const edges = Object.prototype.hasOwnProperty.call(partial, 'edges')
        ? partial.edges
        : state.edges;
      return set({ ...partial, runPathEdgeIds: getRunPathEdgeIds(currentRun, edges) }, replace);
    }
    return set(partial, replace);
  };
}

const calculatePosition = (sourceNode, handleId) => {
  let offsetX = 0;
  const offsetY = 280; // Vertical spacing

  // Smart X-positioning based on branches
  if (sourceNode.type === 'condition') {
    // Conditions usually have 2 branches: true/false
    offsetX = handleId === 'true' ? -180 : 180;
  } else if (sourceNode.type === 'action') {
    const branches = sourceNode.data?.config?.branches || [];
    if (branches.length === 2) {
      // If exactly 2 branches, spread them left and right
      const branchIndex = branches.findIndex(b => b.id === handleId);
      offsetX = branchIndex === 0 ? -180 : 180;
    } else if (branches.length > 2) {
      const branchIndex = branches.findIndex(
        b => b.id === handleId
      );

      const spacing = 280;

      // Center all branches around 0
      offsetX = (branchIndex - (branches.length - 1) / 2) * spacing;
    }
  }

  return {
    x: sourceNode.position.x + offsetX,
    y: sourceNode.position.y + offsetY
  };
};


// Flag to temporarily prevent saving to localStorage
let preventStorageSave = false;
const FLOW_STORAGE_KEY = 'whatsapp-automation-flow';
const SKIP_DELETE_KEY = 'skip_delete';

const createEdgeId = (source, target, sourceHandle) =>
  `edge_${source}_${sourceHandle || 'out'}_${target}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function getDownstreamNodeIds(edges, startId) {
  const collected = [];
  const visited = new Set();

  const walk = (nodeId) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    edges
      .filter((edge) => edge.source === nodeId)
      .forEach((edge) => {
        if (visited.has(edge.target)) return;
        collected.push(edge.target);
        walk(edge.target);
      });
  };

  walk(startId);
  return [...new Set(collected)];
}

// Reusable function to clear flow localStorage while preserving skipDeleteConfirmation
const clearFlowStorage = () => {
  if (typeof window === 'undefined') return;
  
  try {
    const existingItem = localStorage.getItem(FLOW_STORAGE_KEY);
    const skipDeleteValue = localStorage.getItem(SKIP_DELETE_KEY);
    const skipDeleteBool = skipDeleteValue === 'true';
    
    localStorage.removeItem(FLOW_STORAGE_KEY);
    
    if (existingItem) {
      try {
        const parsed = JSON.parse(existingItem);
        // Preserve skipDeleteConfirmation by storing minimal state
        const minimalState = {
          state: {
            skipDeleteConfirmation: parsed?.state?.skipDeleteConfirmation ?? skipDeleteBool
          },
          version: parsed?.version
        };
        localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(minimalState));
      } catch (e) {
        // If parsing fails, just set skipDeleteConfirmation from standalone key
        const minimalState = {
          state: { skipDeleteConfirmation: skipDeleteBool },
          version: 0
        };
        localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(minimalState));
      }
    }
  } catch (e) {
    // Fallback if anything fails
    localStorage.removeItem(FLOW_STORAGE_KEY);
  }
};

// Custom storage adapter that only saves when we actually want to
const createCustomStorage = () => {
  const baseStorage = createJSONStorage(() => localStorage);
  
  return {
    getItem: async (name) => {
      return baseStorage.getItem(name);
    },
    setItem: async (name, value) => {
      // If preventStorageSave is true, skip saving completely
      if (preventStorageSave) {
        return;
      }
      // Parse the value to check mode before saving
      try {
        const parsedValue = JSON.parse(value);
        // Only save if mode is create, otherwise just save skipDeleteConfirmation
        if (parsedValue?.state?.mode !== 'create') {
          // Only save skipDeleteConfirmation in non-create modes
          const minimalState = {
            state: { skipDeleteConfirmation: parsedValue?.state?.skipDeleteConfirmation },
            version: parsedValue?.version
          };
          return baseStorage.setItem(name, JSON.stringify(minimalState));
        }
      } catch (e) {
        // Fall through
      }
      // Otherwise proceed normally
      return baseStorage.setItem(name, value);
    },
    removeItem: async (name) => {
      return baseStorage.removeItem(name);
    }
  };
};

export const useFlowStore = create(
  persist(
    (set, get) => {
    set = attachRunPath(set, get);
    return {
      nodes: [],
      edges: [],
      name: '',
      nameError: null,
      nodeErrors: {}, // { nodeId: "error message" }
      nodeHydration: {}, // { nodeId: { isHydrated: bool, changes: [] } }
      nodeLoading: {}, // { nodeId: bool }
      mode: 'create', // 'create' | 'edit' | 'view' | 'run'
      currentRun: null, // AutomationRunEntity
      runPathEdgeIds: EMPTY_RUN_PATH_IDS,
      automationId: null,
      selectedNodeId: null,
      pendingConnection: null, // { nodeId, type }
      deleteConfirm: null, // { type: 'node' | 'edge' | 'clear', id, downstreamCount }
      skipDeleteConfirmation: typeof window !== 'undefined' ? localStorage.getItem('skip_delete') === 'true' : false,
      previewResumeLoading: false, // Loading state for preview resume API call
      whatsappSettings: { ...DEFAULT_WHATSAPP_SETTINGS },
      cycleHighlight: null, // { nodeIds: string[], edgeIds: string[] } | null

      setNodes: (nodes) => set({ nodes, cycleHighlight: null }),
      setEdges: (edges) => set({ edges, cycleHighlight: null }),
      setName: (name) => set({ name, nameError: null }),
      setNameError: (error) => set({ nameError: error }),
      setMode: (mode) => set((state) => {
        // Clear localStorage when switching from create to edit/view modes
        if (typeof window !== 'undefined' && state.mode === "create" && mode !== "create") {
          clearFlowStorage();
        }
        return { mode };
      }),
      setCurrentRun: (run) => set({ currentRun: run }),
      setAutomationId: (id) => set({ automationId: id }),
      setFlowData: ({ nodes, edges, name, id, whatsapp }) => {
        // Prevent storage save when setting flow data for existing automation
        preventStorageSave = true;
        if (id && typeof window !== 'undefined') {
          clearFlowStorage();
        }
        const result = set({
          nodes: nodes || [],
          edges: edges || [],
          name: name || '',
          automationId: id || null,
          mode: id ? 'edit' : 'create',
          nodeErrors: {},
          nodeHydration: {},
          nodeLoading: {},
          previewResumeLoading: false,
          whatsappSettings: normalizeWhatsappSettings(whatsapp),
          cycleHighlight: null,
        });
        setTimeout(() => { preventStorageSave = false; }, 0);
        return result;
      },
      setWhatsappSettings: (whatsappSettings) => set({
        whatsappSettings: normalizeWhatsappSettings(whatsappSettings),
      }),
      setNodeError: (nodeId, error) => set((s) => ({
        nodeErrors: { ...s.nodeErrors, [nodeId]: error }
      })),
      setNodeHydration: (nodeId, hydration) => set((s) => ({
        nodeHydration: { ...s.nodeHydration, [nodeId]: hydration }
      })),
      setNodeLoading: (nodeId, isLoading) => set((s) => ({
        nodeLoading: { ...s.nodeLoading, [nodeId]: isLoading }
      })),
      setPendingConnection: (conn) => set({ pendingConnection: conn }),
      setDeleteConfirm: (confirm) => set({ deleteConfirm: confirm }),
      setPreviewResumeLoading: (loading) => set({ previewResumeLoading: loading }),
      setCycleHighlight: (cycleHighlight) => set({ cycleHighlight }),
      clearCycleHighlight: () => set({ cycleHighlight: null }),


      restoreFlow: (snapshot) => set({
        nodes: snapshot.nodes || [],
        edges: snapshot.edges || [],
        name: snapshot.name || '',
        nameError: snapshot.nameError ?? null,
        nodeErrors: snapshot.nodeErrors || {},
        nodeHydration: snapshot.nodeHydration || {},
        nodeLoading: snapshot.nodeLoading || {},
        mode: snapshot.mode || 'create',
        currentRun: snapshot.currentRun || null,
        automationId: snapshot.automationId || null,
        selectedNodeId: snapshot.selectedNodeId || null,
        pendingConnection: snapshot.pendingConnection || null,
        deleteConfirm: snapshot.deleteConfirm || null,
        skipDeleteConfirmation: snapshot.skipDeleteConfirmation ?? false,
        previewResumeLoading: false,
        whatsappSettings: normalizeWhatsappSettings(snapshot.whatsappSettings),
        cycleHighlight: null,
      }),

      resetFlow: () => {
        preventStorageSave = true;
       
        set({
          nodes: [],
          edges: [],
          name: '',
          nameError: null,
          nodeErrors: {},
          nodeHydration: {},
          nodeLoading: {},
          mode: 'create',
          automationId: null,
          selectedNodeId: null,
          pendingConnection: null,
          deleteConfirm: null,
          previewResumeLoading: false,
          whatsappSettings: { ...DEFAULT_WHATSAPP_SETTINGS },
          cycleHighlight: null,
        });
        // Ensure no save even after set
        if (typeof window !== 'undefined') {
          clearFlowStorage();
        }
        setTimeout(() => { preventStorageSave = false; }, 100);
      },

      setSkipDeleteConfirmation: (skip) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('skip_delete', skip ? 'true' : 'false');
        }
        set({ skipDeleteConfirmation: skip });
      },

      onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) });
      },
      onEdgesChange: (changes) => {
        const graphChanged = changes.some((change) => change.type === 'remove' || change.type === 'add');
        set({
          edges: applyEdgeChanges(changes, get().edges),
          ...(graphChanged ? { cycleHighlight: null } : {}),
        });
      },

      onConnect: (connection) => {
        console.log("connection add edge: ", connection)
        const { edges } = get();
        if (!isValidFlowConnection(connection, edges)) {
          return;
        }
        set({
          edges: addEdge({
            ...connection,
            id: createEdgeId(connection.source, connection.target, connection.sourceHandle),
            animated: true,
            type: 'custom',
          }, edges),
          pendingConnection: null,
          cycleHighlight: null,
        });
      },
      setSelectedNode: (id) => set({ selectedNodeId: id }),

      addNode: (node) => {
        const { pendingConnection, edges, nodes } = get();
        let newNode = { ...node };

        // Auto-connect and position if there's a pending connection
        if (pendingConnection) {
          const sourceNode = nodes.find(n => n.id === pendingConnection.nodeId);

          if (sourceNode) {
            const position = calculatePosition(sourceNode, pendingConnection.handleId);
            newNode.position = position;
          }

          const newEdge = {
            id: createEdgeId(pendingConnection.nodeId, newNode.id, pendingConnection.handleId),
            source: pendingConnection.nodeId,
            sourceHandle: pendingConnection.handleId,
            target: newNode.id,
            animated: true,
            type: 'custom'
          };

          set({
            nodes: [...nodes, newNode],
            edges: [...edges, newEdge],
            pendingConnection: null,
            cycleHighlight: null,
          });
        } else {
          set({ nodes: [...nodes, newNode], cycleHighlight: null });
        }
      },

      reorderFlow: () => {
        const { nodes, edges } = get();
        const triggerNode = nodes.find(n => n.type === 'trigger');
        if (!triggerNode) return;

        const newNodes = [...nodes];
        const positionedNodeIds = new Set();

        const updatePosition = (nodeId, x, y) => {
          const nodeIndex = newNodes.findIndex(n => n.id === nodeId);
          if (nodeIndex === -1 || positionedNodeIds.has(nodeId)) return;

          newNodes[nodeIndex] = {
            ...newNodes[nodeIndex],
            position: { x, y }
          };
          positionedNodeIds.add(nodeId);

          // Find children and sort them by handleId to maintain order if possible
          const outgoingEdges = edges.filter(e => e.source === nodeId);

          outgoingEdges.forEach(edge => {
            const childNode = nodes.find(n => n.id === edge.target);
            if (!childNode) return;

            const newPos = calculatePosition(newNodes[nodeIndex], edge.sourceHandle);
            updatePosition(edge.target, newPos.x, newPos.y);
          });
        };

        // Start trigger at its current X, but reset Y to 100 for a clean start
        updatePosition(triggerNode.id, triggerNode.position.x, 100);
        set({ nodes: newNodes });
      },

      addEdge: (edge) => {
        console.log("add edge: ", edge)
        const { edges } = get();
        if (!isValidFlowConnection(edge, edges, edge.id)) {
          return;
        }
        set({
          edges: [...edges, {
            ...edge,
            id: edge.id || createEdgeId(edge.source, edge.target, edge.sourceHandle),
            animated: true,
            type: 'custom',
          }],
          pendingConnection: null,
          cycleHighlight: null,
        });
      },

      updateNodeData: (id, data, auto = false) => {
        const { nodes, edges, setNodeError, setNodeHydration } = get();
        const currentNode = nodes.find(n => n.id === id);
        let updatedEdges = [...edges];

        // If branches are changing, we just disconnect edges from removed branches
        if (data?.config?.branches && currentNode?.data?.config?.branches) {
          const oldBranches = currentNode.data.config.branches;
          const newBranches = data.config.branches;

          // 1. Find handles (branch IDs) that were removed entirely
          const removedHandleIds = oldBranches
            .filter(ob => !newBranches.some(nb => nb.id === ob.id))
            .map(ob => ob.id);

          // 2. Handle ID migration
          const edgesToMigrate = updatedEdges.filter(e => e.source === id);
          edgesToMigrate.forEach(edge => {
            const oldBranchIndex = oldBranches.findIndex(b => b.id === edge.sourceHandle);
            if (oldBranchIndex !== -1 && oldBranchIndex < newBranches.length) {
              const newBranch = newBranches[oldBranchIndex];
              if (newBranch.id !== edge.sourceHandle) {
                updatedEdges = updatedEdges.map(e =>
                  e.id === edge.id ? { ...e, sourceHandle: newBranch.id } : e
                );
              }
            }
          });

          if (removedHandleIds.length > 0) {
            // Just filter out the edges from removed handles
            updatedEdges = updatedEdges.filter(e => !(e.source === id && removedHandleIds.includes(e.sourceHandle)));
          }
        }

        set({
          nodes: nodes.map((node) =>
            node.id === id ? { ...node, data: { ...node.data, ...data } } : node
          ),
          edges: updatedEdges,
          cycleHighlight: null,
        });
      },

      disconnectEdge: (edgeId) => {
        set({
          edges: get().edges.filter(e => e.id !== edgeId),
          cycleHighlight: null,
        });
      },

      deleteNode: (id) => {
        const { nodes, edges, setDeleteConfirm, skipDeleteConfirmation, executeDeletion, mode } = get();
        const isEditMode = mode === 'edit';
        const node = nodes.find(n => n.id === id);

        if (isEditMode && node?.type === 'trigger') {
          return;
        }

        const downstreamIds = getDownstreamNodeIds(edges, id);

        if (skipDeleteConfirmation) {
          executeDeletion(id, downstreamIds);
          return;
        }

        if (downstreamIds.length > 0) {
          setDeleteConfirm({ type: 'node', id, downstreamCount: downstreamIds.length });
          return;
        }

        // If no downstream, delete immediately or just set confirm with 0
        setDeleteConfirm({ type: 'node', id, downstreamCount: 0 });
      },

      deleteEdge: (edgeId) => {
        const { edges, deleteNode } = get();
        const edge = edges.find(e => e.id === edgeId);
        if (!edge) return;

        // Deleting an edge is like deleting the target node and its branches
        deleteNode(edge.target);
      },

      executeDeletion: (id, downstreamIds) => {
        const { nodes, edges, nodeErrors, nodeHydration, nodeLoading } = get();
        const allIdsToDelete = [id, ...downstreamIds];

        const newNodeErrors = { ...nodeErrors };
        const newNodeHydration = { ...nodeHydration };
        const newNodeLoading = { ...nodeLoading };

        allIdsToDelete.forEach(toDeleteId => {
          delete newNodeErrors[toDeleteId];
          delete newNodeHydration[toDeleteId];
          delete newNodeLoading[toDeleteId];
        });

        set({
          nodes: nodes.filter((node) => !allIdsToDelete.includes(node.id)),
          edges: edges.filter((edge) => !allIdsToDelete.includes(edge.source) && !allIdsToDelete.includes(edge.target)),
          nodeErrors: newNodeErrors,
          nodeHydration: newNodeHydration,
          nodeLoading: newNodeLoading,
          selectedNodeId: allIdsToDelete.includes(get().selectedNodeId) ? null : get().selectedNodeId,
          pendingConnection: allIdsToDelete.includes(get().pendingConnection?.nodeId) ? null : get().pendingConnection,
          deleteConfirm: null,
          cycleHighlight: null,
        });
      },

      confirmDelete: () => {
        const { nodes, edges, deleteConfirm, executeDeletion, mode, name } = get();
        const isEditMode = mode === 'edit';

        if (!deleteConfirm) return;

        if (deleteConfirm.type === 'clear') {
          const triggerNode = nodes.find(n => n.type === 'trigger');
          set({
            nodes: triggerNode && isEditMode ? [triggerNode] : [],
            edges: [],
            name: isEditMode ? name : '',
            nameError: null,
            nodeErrors: {},
            nodeHydration: {},
            nodeLoading: {},
            selectedNodeId: null,
            pendingConnection: null,
            deleteConfirm: null,
            previewResumeLoading: false,
            cycleHighlight: null,
          });
          return;
        }

        const { id } = deleteConfirm;

        const downstreamIds = getDownstreamNodeIds(edges, id);
        executeDeletion(id, downstreamIds);
      },

      clearFlow: () => {
        preventStorageSave = true;

        const { nodes, name, mode } = get();
        const triggerNode = nodes.find(n => n.type === 'trigger');
        const isEditMode = mode === 'edit';

        set({
          nodes: triggerNode && isEditMode ? [triggerNode] : [],
          edges: [],
          name: isEditMode ? name : '',
          selectedNodeId: null,
          pendingConnection: null,
          nameError: null,
          nodeErrors: {},
          currentRun: null,
          nodeHydration: {},
          nodeLoading: {},
          mode: 'create', // إرجاع الوضع الافتراضي
          automationId: null,
          deleteConfirm: null,
          whatsappSettings: { ...DEFAULT_WHATSAPP_SETTINGS },
          cycleHighlight: null,
        });

        // Clear again after set to ensure persist middleware doesn't save
        if (typeof window !== 'undefined') {
          clearFlowStorage();
        }
        setTimeout(() => { preventStorageSave = false; }, 100);
      },

      saveDraft: () => {
        // Since persist middleware auto-saves on every state change, 
        // we just provide a timestamp to confirm to the user that a "checkpoint" was reached.
        set({ lastDraftAt: new Date().toISOString() });
      },

      isValidFlow: () => {
        const { nodes, edges } = get();
        if (nodes.length === 0) return true;

        const hasTrigger = nodes.some(n => n.type === 'trigger');
        if (!hasTrigger) return false;

        // Add more validation logic as needed
        return true;
      }
    };
    },
    {
      name: 'whatsapp-automation-flow',
      storage: createCustomStorage(),
      partialize: (state) => {
        if (state.mode !== 'create') {
          return {
            skipDeleteConfirmation: state.skipDeleteConfirmation,
          };
        }

        const {
          skipDeleteConfirmation,
          nameError,
          nodeErrors,
          currentRun,
          runPathEdgeIds,
          nodeHydration,
          nodeLoading,
          deleteConfirm,
          pendingConnection,
          cycleHighlight,
          ...rest
        } = state;
        return rest;
      }
    }
  )
);
