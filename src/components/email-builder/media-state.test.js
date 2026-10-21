import { afterEach, describe, expect, it } from "vitest";
import {
  beginEmailMediaUpload,
  endEmailMediaUpload,
  findIncompleteEmailMedia,
  hasPendingEmailMediaUploads,
  youtubeEmbedUrl,
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
    expect(findIncompleteEmailMedia(document)?.id).toBe("video");
    document.blocks[0].children[0].children[0].sourceUrl = "https://cdn.example.com/video.mp4";
    expect(findIncompleteEmailMedia(document)).toBeNull();
  });

  it("accepts an uploaded asset id and rejects a missing one", () => {
    const media = { id: "document", type: "document", sourceType: "upload", assetId: "" };
    const document = { blocks: [{ children: [{ children: [media] }] }] };
    expect(findIncompleteEmailMedia(document)?.id).toBe("document");
    media.assetId = "asset-id";
    expect(findIncompleteEmailMedia(document)).toBeNull();
  });

  it("converts common YouTube links to privacy-enhanced embed links", () => {
    expect(youtubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ"))
      .toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(youtubeEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"))
      .toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(youtubeEmbedUrl("https://example.com/video.mp4")).toBeNull();
  });
});
