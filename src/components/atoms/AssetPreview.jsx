"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FileText, Maximize2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { ImageModal } from "./ImageModal";
import { baseImg } from "@/utils/axios";

const isImagePath = (p) => !!p && /\.(png|jpg|jpeg|webp|gif)$/i.test(p);
const isPdfPath = (p) => !!p && /\.pdf$/i.test(p);

export default function AssetPreview({ src, alt, className, labels = {} }) {
  const [imgModal, setImgModal] = useState({ open: false, src: "", alt: "" });

  const fullSrc = src ? (src.startsWith("http") ? src : baseImg + src) : "";

  const openImage = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setImgModal({ open: true, src: fullSrc, alt: alt || "" });
    },
    [fullSrc, alt]
  );

  const closeImage = useCallback(
    () => setImgModal({ open: false, src: "", alt: "" }),
    []
  );

  if (!src) {
    return (
      <span className="text-xs text-gray-400 text-center block">—</span>
    );
  }

  if (isImagePath(src)) {
    return (
      <>
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={openImage}
          className={cn(
            "group/img relative w-10 h-10 rounded-xl overflow-hidden block border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800",
            className
          )}
        >
          <img
            src={fullSrc}
            alt={alt}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors flex items-center justify-center">
            <Maximize2
              size={11}
              className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow"
            />
          </div>
        </motion.button>

        <ImageModal
          open={imgModal.open}
          src={imgModal.src}
          alt={imgModal.alt}
          onClose={closeImage}
          labels={labels}
        />
      </>
    );
  }

  if (isPdfPath(src)) {
    return (
      <a
        href={fullSrc}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "inline-flex justify-center w-full items-center gap-2 text-primary hover:scale-110 transition-transform",
          className
        )}
      >
        <FileText size={18} />
      </a>
    );
  }

  return (
    <a
      href={fullSrc}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex justify-center w-full items-center gap-2 text-primary hover:scale-110 transition-transform",
        className
      )}
    >
      <FileText size={18} />
    </a>
  );
}
