export function isSourceHandleOccupied(edges, source, sourceHandle, ignoreEdgeId) {
    return edges.some(
        (edge) =>
            edge.id !== ignoreEdgeId &&
            edge.source === source &&
            (edge.sourceHandle || "") === (sourceHandle || ""),
    );
}

export function isValidFlowConnection(connection, edges, ignoreEdgeId) {
    const { source, target, sourceHandle } = connection;
    if (!source || !target || source === target) {
        return false;
    }

    if (isSourceHandleOccupied(edges, source, sourceHandle, ignoreEdgeId)) {
        return false;
    }

    return true;
}
