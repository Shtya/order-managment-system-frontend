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

export function youtubeVideoId(value) {
  try {
    const url = new URL(String(value || "").trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let videoId = "";
    if (host === "youtu.be") videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    if (["youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)) {
      if (url.pathname === "/watch") videoId = url.searchParams.get("v") || "";
      else if (/^\/(embed|shorts)\//.test(url.pathname)) videoId = url.pathname.split("/")[2] || "";
    }
    return /^[A-Za-z0-9_-]{6,20}$/.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
}

export function youtubeThumbnailUrl(value) {
  const id = youtubeVideoId(value);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
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
        if (!complete) return { ...node, incompleteReason: "source" };
        if (node.type === "video") {
          const thumbnailSource = node.thumbnailSourceType || "auto";
          const automaticThumbnail = node.sourceType === "remote"
            ? youtubeThumbnailUrl(node.sourceUrl)
            : validRemoteUrl(node.thumbnailUrl);
          if (thumbnailSource === "auto" && !automaticThumbnail)
            return { ...node, incompleteReason: "thumbnail" };
          if (thumbnailSource === "upload" && !node.thumbnailAssetId)
            return { ...node, incompleteReason: "thumbnail" };
          if (thumbnailSource === "remote" && !validRemoteUrl(node.thumbnailUrl))
            return { ...node, incompleteReason: "thumbnail" };
        }
      }
      const child = visit(node?.children);
      if (child) return child;
    }
    return null;
  };
  return visit(document?.blocks);
}
