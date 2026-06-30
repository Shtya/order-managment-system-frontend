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
import { Info } from "lucide-react";

export function TutorialSpotlight({
  children,
  title,
  description,
  example,
  disabled = false,
}) {
  const { isTutorialMode } = useTutorial();
  const [hovered, setHovered] = useState(false);

  if (disabled) {
    return <>{children}</>;
  }

  if (!isTutorialMode) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              position: "relative",
              zIndex: 60,
              borderRadius: 16,
              outline: hovered
                ? "3px solid var(--primary)"
                : "2px solid color-mix(in oklab, var(--primary) 30%, transparent)",
              outlineOffset: 4,
              transition: "outline 0.2s ease",
              boxShadow: hovered
                ? "0 0 0 4px color-mix(in oklab, var(--primary) 20%, transparent), 0 8px 30px color-mix(in oklab, var(--primary) 15%, transparent)"
                : "none",
            }}
          >
            {children}
           
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
                المثال
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
