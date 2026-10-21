let pendingUploads = 0;

export function beginEmailMediaUpload() {
  pendingUploads += 1;
}

export function endEmailMediaUpload() {
  pendingUploads = Math.max(0, pendingUploads - 1);
}

export function hasPendingEmailMediaUploads() {
  return pendingUploads > 0;
}

export function findIncompleteEmailMedia(document) {
  const validRemoteUrl = (value) => {
    try {
      const url = new URL(String(value || "").trim());
      return url.protocol === "https:" && Boolean(url.hostname);
    } catch {
      return false;
    }
  };
  const visit = (nodes = []) => {
    for (const node of nodes) {
      if (["image", "video", "document"].includes(node?.type)) {
        const complete = node.sourceType === "remote"
          ? validRemoteUrl(node.sourceUrl)
          : Boolean(node.assetId);
        if (!complete) return node;
      }
      const child = visit(node?.children);
      if (child) return child;
    }
    return null;
  };
  return visit(document?.blocks);
}
