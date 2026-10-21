import { afterEach, describe, expect, it } from "vitest";
import {
  beginEmailMediaUpload,
  endEmailMediaUpload,
  findIncompleteEmailMedia,
  hasPendingEmailMediaUploads,
  youtubeThumbnailUrl,
} from "./media-state";

afterEach(() => {
  while (hasPendingEmailMediaUploads()) endEmailMediaUpload();
});

describe("email media completion", () => {
  it("tracks pending uploads", () => {
    beginEmailMediaUpload();
    expect(hasPendingEmailMediaUploads()).toBe(true);
    endEmailMediaUpload();
    expect(hasPendingEmailMediaUploads()).toBe(false);
  });

  it("finds nested media without a valid source", () => {
    const document = {
      blocks: [{ children: [{ children: [{ id: "video", type: "video", sourceType: "remote", sourceUrl: "https://" }] }] }],
    };
    expect(findIncompleteEmailMedia(document)).toMatchObject({ id: "video", incompleteReason: "source" });
    document.blocks[0].children[0].children[0].sourceUrl = "https://cdn.example.com/video.mp4";
    expect(findIncompleteEmailMedia(document)).toMatchObject({ id: "video", incompleteReason: "thumbnail" });
    document.blocks[0].children[0].children[0].thumbnailSourceType = "remote";
    document.blocks[0].children[0].children[0].thumbnailUrl = "https://cdn.example.com/poster.jpg";
    expect(findIncompleteEmailMedia(document)).toBeNull();
  });

  it("accepts an uploaded asset id and rejects a missing one", () => {
    const media = { id: "document", type: "document", sourceType: "upload", assetId: "" };
    const document = { blocks: [{ children: [{ children: [media] }] }] };
    expect(findIncompleteEmailMedia(document)).toMatchObject({ id: "document", incompleteReason: "source" });
    media.assetId = "asset-id";
    expect(findIncompleteEmailMedia(document)).toBeNull();
  });

  it("requires a selected custom video thumbnail source", () => {
    const video = { id: "video", type: "video", sourceType: "upload", assetId: "video-id", thumbnailSourceType: "upload", thumbnailAssetId: "" };
    const document = { blocks: [{ children: [{ children: [video] }] }] };
    expect(findIncompleteEmailMedia(document)).toMatchObject({ id: "video", incompleteReason: "thumbnail" });
    video.thumbnailAssetId = "thumbnail-id";
    expect(findIncompleteEmailMedia(document)).toBeNull();
    video.thumbnailSourceType = "remote";
    video.thumbnailUrl = "https://";
    expect(findIncompleteEmailMedia(document)).toMatchObject({ id: "video", incompleteReason: "thumbnail" });
    video.thumbnailUrl = "https://cdn.example.com/poster.jpg";
    expect(findIncompleteEmailMedia(document)).toBeNull();
  });

  it("accepts generated uploaded-video and YouTube automatic thumbnails", () => {
    const video = {
      id: "video",
      type: "video",
      sourceType: "upload",
      assetId: "video-id",
      thumbnailSourceType: "auto",
      thumbnailUrl: "https://api.example.com/uploads/video-thumbnail.jpg",
    };
    const document = { blocks: [{ children: [{ children: [video] }] }] };
    expect(findIncompleteEmailMedia(document)).toBeNull();
    video.sourceType = "remote";
    video.assetId = "";
    video.sourceUrl = "https://youtu.be/dQw4w9WgXcQ";
    video.thumbnailUrl = "";
    expect(findIncompleteEmailMedia(document)).toBeNull();
  });

  it("converts common YouTube links to thumbnail links", () => {
    expect(youtubeThumbnailUrl("https://youtu.be/dQw4w9WgXcQ"))
      .toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(youtubeThumbnailUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"))
      .toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(youtubeThumbnailUrl("https://example.com/video.mp4")).toBeNull();
  });
});
