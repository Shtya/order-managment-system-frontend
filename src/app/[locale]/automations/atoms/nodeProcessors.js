// nodeProcessors.js

import { checkIfMediaUploadNeeded, handleMediaUpload } from "@/utils/whatsapp-healper";

export const nodeProcessors = {
    send_whatsapp_message: async (node) => {
        const message = node.data?.config?.messageData;
        const accountId = node.data?.config?.accountId;
        const mediaInfo = checkIfMediaUploadNeeded(message);
        const needsMediaUpload = !!mediaInfo;
        if (needsMediaUpload) {
            await handleMediaUpload(mediaInfo, accountId, message);
            
            if(message.file) {
                delete message.file;
            }
            if(message?.[message?.type]?.url) {
                delete message[message?.type].url;
            }
            if(message?.[message?.type]?.name) {
                delete message[message?.type].name;
            }
        }
        return {
            ...node.data
        };
    },

};

/**
 * Executes pre-save processors for all nodes using Promise.allSettled
 * @returns {Promise<{ success: boolean, processedNodes: Array, errors: Array }>}
 */
// nodeProcessors.js

export async function processNodesBeforeSave(nodes, onHasProcessor) {
    
    const processedNodes = await Promise.all(
        nodes.map(async (node) => {
            
            const processor = nodeProcessors[node?.data?.type];
            
            if (!processor) return node;

            try {
                const updatedData = await processor(node);
                return {
                    ...node,
                    data: updatedData
                };
            } catch (error) {
                // Enhance the error with node context before letting it bubble up
                const errorMessage = error.response?.data?.message || error.message || `Failed to process ${node.type} node`;
                const enhancedError = new Error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
                enhancedError.nodeType = node.type;
                enhancedError.nodeId = node.id;
                throw enhancedError;
            }
        })
    );

    return processedNodes;
}