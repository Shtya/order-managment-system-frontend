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
      deleteConfirm: null, // { type: 'node' | 'edge', id, downstreamCount }

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
      setPendingConnection: (conn) => set({ pendingConnection: conn }),
      setDeleteConfirm: (confirm) => set({ deleteConfirm: confirm }),

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
        set({
          nodes: get().nodes.map((node) =>
            node.id === id ? { ...node, data: { ...node.data, ...data } } : node
          )
        });
      },

      deleteNode: (id) => {
        const { nodes, edges, setDeleteConfirm } = get();

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

      confirmDelete: () => {
        const { nodes, edges, deleteConfirm, setDeleteConfirm } = get();
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
        const allIdsToDelete = [id, ...downstreamIds];

        set({
          nodes: nodes.filter((node) => !allIdsToDelete.includes(node.id)),
          edges: edges.filter((edge) => !allIdsToDelete.includes(edge.source) && !allIdsToDelete.includes(edge.target)),
          selectedNodeId: allIdsToDelete.includes(get().selectedNodeId) ? null : get().selectedNodeId,
          pendingConnection: allIdsToDelete.includes(get().pendingConnection?.nodeId) ? null : get().pendingConnection,
          deleteConfirm: null
        });
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
    }
  )
);