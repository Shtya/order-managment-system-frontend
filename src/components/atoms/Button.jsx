"use client";

import { Loader2 } from "lucide-react";
import React from "react";

/**
 * Button_
 *
 * variant → "solid" | "outline" | "ghost"
 * size    → "sm" | "md" | "lg"
 * tone    → "emerald" | "blue" | "purple" | "rose" | "amber" | "default"
 *           (leave empty to use the global --primary color)
 *
 * No span children needed — shine + glow are pure CSS ::before / ::after.
 */
export default function Button_({
  href,
  size = "md",
  label,
  tone = "",
  variant = "solid",
  icon,
  onClick,
  disabled,
  className = "",
  type = "button",
}) {
  const isLink = !!href;
  const Tag = isLink ? "a" : "button";
  const extra = isLink ? { href } : { onClick, disabled, type };

  const classes = [
    "btn",
    `btn-${variant}`,
    `btn-${size}`,
    tone && `btn-${tone}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag {...extra} className={classes}>
      {icon && icon}
      {label}
    </Tag>
  );
}

/**
 * PrimaryBtn — raw children pattern, same btn classes.
 */
export function PrimaryBtn({
  children,
  onClick,
  disabled,
  loading,
  className = "",
  ...props
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
      className={`btn btn-solid btn-md ${className}`.trim()}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

export function GhostBtn({ children, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl py-2 px-4 text-sm font-medium border border-[var(--border)] text-[var(--foreground)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all ${className}`}
    >
      {children}
    </button>
  );
}