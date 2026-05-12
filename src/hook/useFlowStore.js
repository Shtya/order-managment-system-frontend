import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Node, Edge, addEdge, applyNodeChanges, applyEdgeChanges, Connection } from '@xyflow/react';

export const useFlowStore = create(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      selectedNodeId: null,

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),

      onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) });
      },
      onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges) });
      },
      onConnect: (connection) => {
        set({ edges: addEdge({ ...connection, animated: true, type: 'custom' }, get().edges) });
      },
      setSelectedNode: (id) => set({ selectedNodeId: id }),
      
      addNode: (node) => {
        set({ nodes: [...get().nodes, node] });
      },

      addEdge: (edge) => {
        set({ edges: [...get().edges, { ...edge, animated: true, type: 'custom' }] });
      },

      updateNodeData: (id, data) => {
        set({
          nodes: get().nodes.map((node) =>
            node.id === id ? { ...node, data: { ...node.data, ...data } } : node
          )
        });
      },

      deleteNode: (id) => {
        const children = get().edges.filter((edge) => edge.source === id);
        if (children.length > 0) {
          if (!confirm(`حذف هذه الخطوة سيؤدي إلى فصل ${children.length} خطوات تالية. هل أنت متأكد؟`)) {
            return;
          }
        }

        set({
          nodes: get().nodes.filter((node) => node.id !== id),
          edges: get().edges.filter((edge) => edge.source !== id && edge.target !== id),
          selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId
        });
      },

      clearFlow: () => set({ nodes: [], edges: [], selectedNodeId: null }),

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