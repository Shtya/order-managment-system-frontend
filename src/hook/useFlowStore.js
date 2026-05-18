import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Node, Edge, addEdge, applyNodeChanges, applyEdgeChanges, Connection } from '@xyflow/react';

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

export const useFlowStore = create(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      name: '',
      nameError: null,
      nodeErrors: {}, // { nodeId: "error message" }
      nodeHydration: {}, // { nodeId: { isHydrated: bool, changes: [] } }
      nodeLoading: {}, // { nodeId: bool }
      mode: 'create', // 'create' | 'edit' | 'view'
      automationId: null,
      selectedNodeId: null,
      pendingConnection: null, // { nodeId, type }
      deleteConfirm: null, // { type: 'node' | 'edge' | 'clear', id, downstreamCount }
      skipDeleteConfirmation: typeof window !== 'undefined' ? localStorage.getItem('skip_delete') === 'true' : false,

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
      setName: (name) => set({ name, nameError: null }),
      setNameError: (error) => set({ nameError: error }),
      setMode: (mode) => set({ mode }),
      setAutomationId: (id) => set({ automationId: id }),
      setFlowData: ({ nodes, edges, name, id }) => set({
        nodes: nodes || [],
        edges: edges || [],
        name: name || '',
        automationId: id || null,
        mode: id ? 'edit' : 'create',
        nodeErrors: {},
        nodeHydration: {},
        nodeLoading: {}
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

      resetFlow: () => set({
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
        deleteConfirm: null
      }),

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
        set({ edges: applyEdgeChanges(changes, get().edges) });
      },

      onConnect: (connection) => {
        console.log("connection add edge: ", connection)
        set({
          edges: addEdge({ ...connection, animated: true, type: 'custom' }, get().edges),
          pendingConnection: null
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
            id: `edge_${pendingConnection.nodeId}_${newNode.id}`,
            source: pendingConnection.nodeId,
            sourceHandle: pendingConnection.handleId,
            target: newNode.id,
            animated: true,
            type: 'custom'
          };

          set({
            nodes: [...nodes, newNode],
            edges: [...edges, newEdge],
            pendingConnection: null
          });
        } else {
          set({ nodes: [...nodes, newNode] });
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
        set({
          edges: [...get().edges, { ...edge, animated: true, type: 'custom' }],
          pendingConnection: null
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
          edges: updatedEdges
        });


        // if (!auto) {
        //   setNodeError(id, '');
        //   setNodeHydration(id, { isHydrated: true, changes: [] });
        // }
      },

      disconnectEdge: (edgeId) => {
        set({
          edges: get().edges.filter(e => e.id !== edgeId)
        });
      },

      deleteNode: (id) => {
        const { nodes, edges, setDeleteConfirm, skipDeleteConfirmation, executeDeletion, mode } = get();
        const isEditMode = mode === 'edit';
        const node = nodes.find(n => n.id === id);

        if (isEditMode && node?.type === 'trigger') {
          return;
        }
        // Find all nodes that are downstream from this node
        const getDownstreamNodeIds = (nodeId) => {
          let connectedNodeIds = [];
          const outgoingEdges = edges.filter(e => e.source === nodeId);

          outgoingEdges.forEach(edge => {
            connectedNodeIds.push(edge.target);
            connectedNodeIds = [...connectedNodeIds, ...getDownstreamNodeIds(edge.target)];
          });

          return [...new Set(connectedNodeIds)];
        };

        const downstreamIds = getDownstreamNodeIds(id);

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
          deleteConfirm: null
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
            deleteConfirm: null
          });
          return;
        }

        const { id } = deleteConfirm;

        // Find all nodes that are downstream from this node
        const getDownstreamNodeIds = (nodeId) => {
          let connectedNodeIds = [];
          const outgoingEdges = edges.filter(e => e.source === nodeId);

          outgoingEdges.forEach(edge => {
            connectedNodeIds.push(edge.target);
            connectedNodeIds = [...connectedNodeIds, ...getDownstreamNodeIds(edge.target)];
          });

          return [...new Set(connectedNodeIds)];
        };

        const downstreamIds = getDownstreamNodeIds(id);
        executeDeletion(id, downstreamIds);
      },

      clearFlow: () => {
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
          nodeHydration: {},
          nodeLoading: {}
        });
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
    }),
    {
      name: 'whatsapp-automation-flow',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const {
          skipDeleteConfirmation,
          nameError,
          nodeErrors,
          nodeHydration,
          nodeLoading,
          deleteConfirm,
          pendingConnection,
          ...rest
        } = state;
        return rest;
      }
    }
  )
);