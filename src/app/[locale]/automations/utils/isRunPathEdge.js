function getEdgeSourceHandle(edge) {
    return edge?.sourceHandle ?? edge?.sourceHandleId ?? "";
}

function getTriggerId(currentRun) {
    return currentRun?.executionState?.trigger?.nodeId || null;
}

function getStepForNode(nodeId, currentRun, triggerId) {
    if (triggerId && nodeId === triggerId) {
        return currentRun.executionState?.trigger;
    }
    return currentRun.executionState?.steps?.[nodeId];
}

function isNodeReached(nodeId, currentRun, triggerId) {
    if (!nodeId || !currentRun) return false;
    if (currentRun.currentNodeId === nodeId) return true;
    if (currentRun.completedNodeIds?.includes(nodeId)) return true;
    if (triggerId && triggerId === nodeId && currentRun.executionState?.trigger) {
        return true;
    }
    return Boolean(currentRun.executionState?.steps?.[nodeId]);
}

/**
 * Walk trigger → chosenBranch (or the outgoing edge whose target already ran).
 * React Flow custom edges receive `sourceHandleId`, not `sourceHandle`.
 */
export function getRunPathEdgeIds(currentRun, edges) {
    const ids = new Set();
    if (!currentRun?.executionState || !Array.isArray(edges) || edges.length === 0) {
        return ids;
    }

    const triggerId = getTriggerId(currentRun);
    const startId = triggerId || edges.find((edge) => isNodeReached(edge.source, currentRun, triggerId))?.source;
    if (!startId || !isNodeReached(startId, currentRun, triggerId)) {
        return ids;
    }

    let nodeId = startId;
    const visited = new Set();

    while (nodeId && !visited.has(nodeId)) {
        visited.add(nodeId);
        const outgoing = edges.filter((edge) => edge.source === nodeId);
        if (outgoing.length === 0) break;

        const chosenBranch = getStepForNode(nodeId, currentRun, triggerId)?.chosenBranch;
        const nextEdge = chosenBranch
            ? outgoing.find((edge) => getEdgeSourceHandle(edge) === chosenBranch)
            : outgoing.find((edge) => isNodeReached(edge.target, currentRun, triggerId));

        if (!nextEdge || !isNodeReached(nextEdge.target, currentRun, triggerId)) {
            break;
        }

        ids.add(nextEdge.id);
        nodeId = nextEdge.target;
    }

    return ids;
}

export function isRunPathEdge(edge, currentRun) {
    if (!edge?.id || !currentRun) return false;
    return getRunPathEdgeIds(currentRun, [edge]).has(edge.id);
}
