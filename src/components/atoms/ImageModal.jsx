"use client";

import React, { memo, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Download, X, Image as ImageIcon } from "lucide-react";
import { AccentBar } from "./AccentBar";

const P_12 = "color-mix(in oklab, var(--primary) 12%, transparent)";
const P_20 = "color-mix(in oklab, var(--primary) 20%, transparent)";

export const ImageModal = memo(function ImageModal({ src, alt, open, onClose, labels = {} }) {
  const [zoomed, setZoomed] = useState(false);
  useEffect(() => {
    if (!open) setZoomed(false);
  }, [open]);

  const download = useCallback(() => {
    const a = Object.assign(document.createElement("a"), {
      href: src,
      target: "_blank",
      download: alt || "image",
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [src, alt]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-4xl !p-0 overflow-hidden rounded-2xl border border-border/60 shadow-2xl"
      >
        {/* Header */}
        <div className="relative flex items-center justify-between gap-4 px-5 py-4 border-b border-border/40 overflow-hidden">
          <AccentBar className="absolute inset-x-0 top-0" />

          <div className="relative flex items-center gap-3 mt-0.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: P_12, border: `1px solid ${P_20}` }}
            >
              <ImageIcon size={15} style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-tight">
                {labels.preview ?? "Image Preview"}
              </p>
              {alt && (
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                  {alt}
                </p>
              )}
            </div>
          </div>

          <div className="relative flex items-center gap-1.5 mt-0.5">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={download}
              className="flex items-center justify-center btn btn-solid btn-sm !w-8 !h-8 !px-0"
            >
              <Download size={13} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08, rotate: 90 }}
              whileTap={{ scale: 0.92 }}
              onClick={onClose}
              className="flex items-center justify-center btn btn-ghost btn-sm btn-rose !w-8 !h-8 !px-0"
            >
              <X size={13} />
            </motion.button>
          </div>
        </div>

        {/* Image area */}
        <div className="p-8 flex items-center justify-center min-h-[380px] bg-muted/40">
          <motion.img
            src={src}
            alt={alt}
            animate={{ scale: zoomed ? 1.65 : 1 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            onClick={() => setZoomed((z) => !z)}
            className="max-w-full max-h-[65vh] object-contain rounded-2xl shadow-2xl cursor-zoom-in"
            style={{ border: "3px solid var(--card)" }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
});
