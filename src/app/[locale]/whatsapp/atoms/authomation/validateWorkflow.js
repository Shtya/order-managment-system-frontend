// utils/flowValidation.ts
import { Node, Edge } from '@xyflow/react';

export const validateWorkflow = (nodes, edges) => {
    const errors = {};

    nodes.forEach(node => {
        const nodeErrors = [];

        // 1. Check for disconnected inputs (unless it's a trigger)
        if (node.type !== 'trigger') {
            const hasInput = edges.some(edge => edge.target === node.id);
            if (!hasInput) nodeErrors.push("Node is not connected to a trigger.");
        }

        // 2. Check for required data fields
        if (node.type === 'whatsapp' && !node.data.templateId) {
            nodeErrors.push("No WhatsApp template selected.");
        }

        if (nodeErrors.length > 0) {
            errors[node.id] = nodeErrors;
        }
    });

    return errors;
};