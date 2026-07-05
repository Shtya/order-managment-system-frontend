// nodeProcessors.js

import { checkIfAssetUploadNeeded, handleAssetUpload } from "@/utils/whatsapp-healper";

export const nodeProcessors = {
    send_whatsapp_message: async (node) => {
        const message = node.data?.config?.messageData;
        const accountId = node.data?.config?.accountId;
        const mediaInfo = checkIfAssetUploadNeeded(message);
        const needsMediaUpload = !!mediaInfo;
        let newLinksIds = [];
        if (needsMediaUpload) {
            let uploadedAssetInfo = await handleAssetUpload(mediaInfo, accountId, message);
            
            if (message.file) {
                delete message.file;
            }
            if (message?.[message?.type]?.url) {
                delete message[message?.type].url;
            }
            if (message?.[message?.type]?.name) {
                delete message[message?.type].name;
            }

            if (uploadedAssetInfo?.id) {
                newLinksIds.push(uploadedAssetInfo.id);
            }
        }

        return {
            data: {
                ...node.data
            },
            newLinksIds
        };
    },

};

/**
 * Executes pre-save processors for all nodes using Promise.all
 * @returns {Promise<{ processedNodes: Array, allNewLinksIds: Array }>}
 */
export async function processNodesBeforeSave(nodes) {
    
    const processingResults = await Promise.all(
        nodes.map(async (node) => {
            
            const processor = nodeProcessors[node?.data?.type];
            
            if (!processor) {
                return {
                    node,
                    newLinksIds: []
                };
            }

            try {
                const result = await processor(node);
                return {
                    node: {
                        ...node,
                        data: result.data,
                        newLinksIds: result.newLinksIds || []
                    },
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

    const processedNodes = processingResults.map(r => r.node);
    const allNewLinksIds = [...new Set(processedNodes.flatMap(r => r.newLinksIds))];

    return {
        processedNodes,
        allNewLinksIds
    };
}