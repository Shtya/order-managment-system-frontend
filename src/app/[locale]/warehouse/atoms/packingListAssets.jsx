"use client";

import React from "react";
import { createRoot } from "react-dom/client";
import QRCode from "react-qr-code";
import { avatarSrc } from "@/components/atoms/UserSelect";

export function getQRCodeDataUrl(value, size = 128) {
  if (!value) return Promise.resolve("");

  return new Promise((resolve) => {
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;left:-9999px;top:0;background:#fff;";
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(<QRCode value={String(value)} size={size} />);

    setTimeout(() => {
      const svg = host.querySelector("svg");
      if (!svg) {
        root.unmount();
        document.body.removeChild(host);
        resolve("");
        return;
      }

      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svg);
      const url = URL.createObjectURL(new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" }));
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        const dataUrl = canvas.toDataURL("image/png");
        URL.revokeObjectURL(url);
        root.unmount();
        document.body.removeChild(host);
        resolve(dataUrl);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        root.unmount();
        document.body.removeChild(host);
        resolve("");
      };
      img.src = url;
    }, 60);
  });
}

export async function imageToDataUrl(url) {
  if (!url) return "";
  if (String(url).startsWith("data:")) return url;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return "";
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result || "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

export async function preparePackingListAssets(data, mode) {
  const groups = mode === "perOrder"
    ? (data.perOrder || []).flatMap((po) => po.groups || [])
    : (data.groups || []);

  const images = new Set();
  for (const g of groups) {
    for (const row of g.rows || []) {
      if (row.image) images.add(avatarSrc(row.image));
    }
  }

  const headerQrUrl = await getQRCodeDataUrl(data.printNumber || "PACKING-LIST", 160);
  const qrByImageUrl = {};
  await Promise.all(Array.from(images).map(async (src) => {
    qrByImageUrl[src] = await getQRCodeDataUrl(src, 96);
  }));

  return { headerQrUrl, qrByImageUrl };
}
