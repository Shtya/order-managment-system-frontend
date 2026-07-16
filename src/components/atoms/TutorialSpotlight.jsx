"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTutorial } from "@/context/TutorialContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";


export function TutorialSpotlight({
  children,
  title,
  description,
  example,
  disabled = false,
  style,
  className,
  card = "none",
  overview = false,
}) {
  const { isTutorialMode } = useTutorial();
  const t = useTranslations("tutorial");
  const [hovered, setHovered] = useState(false);
  if (disabled || !isTutorialMode || !title || !description) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={className}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              position: "relative",
              zIndex: 60,
              pointerEvents: "auto",
              // width: "100%",
              height: overview ? "fit-content" : "100%",
              display: "block",
              borderRadius: overview ? " var(--radius-lg)" : "0px", // Base radius
              backgroundColor: "var(--card)",
              ...(card && card !== "none" && {
                borderRadius: "12px",
                padding: card === "xs" 
                  ? "0.25rem" 
                  : card === "sm" 
                    ? "0.5rem" 
                    : card === "lg" 
                      ? "1rem" 
                      : "0.75rem", // default md
              }),
              ...style // This cleanly overrides the 0px with var(--radius)
            }}
          >
            {/* 1. Your Content */}
            <div style={{ pointerEvents: "none", width: "100%", height: overview ? "fit-content" : "100%" }}>
              {children}
            </div>

            {/* 2. The Border Overlay (Sits ON TOP of children) */}
            <div
              style={{
                position: "absolute",
                inset: 0, // Stretches to cover the parent exactly
                pointerEvents: "none", // Ensures it doesn't block clicks
                borderRadius: "inherit", // Automatically matches the parent's var(--radius)
                transition: "box-shadow 0.2s ease",
                boxShadow: hovered
                  ? "inset 0 0 0 3px var(--primary), 0 0 0 4px color-mix(in oklab, var(--primary) 20%, transparent), 0 8px 30px color-mix(in oklab, var(--primary) 15%, transparent)"
                  : "inset 0 0 0 2px color-mix(in oklab, var(--primary) 30%, transparent)",
              }}
            />
          </motion.div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          sideOffset={12}
          avoidCollisions
          collisionPadding={16}
          style={{
            width: 320,
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "16px 18px",
            boxShadow: "0 20px 60px rgba(0,0,0,.25)",
            zIndex: 10000,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 8,
              color: "var(--primary)",
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              color: "var(--muted-foreground)",
              marginBottom: 12,
            }}
          >
            {description}
          </div>

          {example && (
            <div
              style={{
                background: "color-mix(in oklab, var(--primary) 10%, var(--muted))",
                borderRadius: 10,
                padding: "10px 12px",
                border: "1px dashed color-mix(in oklab, var(--primary) 40%, transparent)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--primary)",
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {t("example")}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--muted-foreground)",
                }}
              >
                {example}
              </div>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
