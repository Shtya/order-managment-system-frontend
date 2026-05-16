import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Node, Edge, addEdge, applyNodeChanges, applyEdgeChanges, Connection } from '@xyflow/react';

export const useFlowStore = create(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      pendingConnection: null, // { nodeId, type }
      deleteConfirm: null, // { type: 'node' | 'edge' | 'clear', id, downstreamCount }
      skipDeleteConfirmation: typeof window !== 'undefined' ? localStorage.getItem('skip_delete') === 'true' : false,

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
      setPendingConnection: (conn) => set({ pendingConnection: conn }),
      setDeleteConfirm: (confirm) => set({ deleteConfirm: confirm }),
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
          console.log("sourceNode: ", sourceNode)
          if (sourceNode) {
            let offsetX = 0;
            const offsetY = 250; // Vertical spacing

            // Smart X-positioning based on branches
            if (sourceNode.type === 'condition') {
              // Conditions usually have 2 branches: true/false
              offsetX = pendingConnection.handleId === 'true' ? -180 : 180;
            } else if (sourceNode.type === 'action') {
              const branches = sourceNode.data?.config?.branches || [];
              if (branches.length === 2) {
                // If exactly 2 branches, spread them left and right
                const branchIndex = branches.findIndex(b => b.id === pendingConnection.handleId);
                offsetX = branchIndex === 0 ? -180 : 180;
              } else {
                const branchIndex = branches.findIndex(
                  b => b.id === pendingConnection.handleId
                );

                const spacing = 280;

                // Center all branches around 0
                offsetX = (branchIndex - (branches.length - 1) / 2) * spacing;
              }
            }

            newNode.position = {
              x: sourceNode.position.x + offsetX,
              y: sourceNode.position.y + offsetY
            };
          }

          console.log(pendingConnection, newNode)
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

      addEdge: (edge) => {
        set({
          edges: [...get().edges, { ...edge, animated: true, type: 'custom' }],
          pendingConnection: null
        });
      },

      updateNodeData: (id, data) => {
        const { nodes, edges } = get();
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
      },

      disconnectEdge: (edgeId) => {
        set({
          edges: get().edges.filter(e => e.id !== edgeId)
        });
      },

      deleteNode: (id) => {
        const { nodes, edges, setDeleteConfirm, skipDeleteConfirmation, executeDeletion } = get();

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
        const { nodes, edges } = get();
        const allIdsToDelete = [id, ...downstreamIds];

        set({
          nodes: nodes.filter((node) => !allIdsToDelete.includes(node.id)),
          edges: edges.filter((edge) => !allIdsToDelete.includes(edge.source) && !allIdsToDelete.includes(edge.target)),
          selectedNodeId: allIdsToDelete.includes(get().selectedNodeId) ? null : get().selectedNodeId,
          pendingConnection: allIdsToDelete.includes(get().pendingConnection?.nodeId) ? null : get().pendingConnection,
          deleteConfirm: null
        });
      },

      confirmDelete: () => {
        const { nodes, edges, deleteConfirm, executeDeletion } = get();
        if (!deleteConfirm) return;

        if (deleteConfirm.type === 'clear') {
          set({ nodes: [], edges: [], selectedNodeId: null, pendingConnection: null, deleteConfirm: null });
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

      clearFlow: () => set({ nodes: [], edges: [], selectedNodeId: null, pendingConnection: null }),

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
        const { skipDeleteConfirmation, ...rest } = state;
        return rest;
      }
    }
  )
);