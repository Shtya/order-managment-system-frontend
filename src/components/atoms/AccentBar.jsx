"use client";

import React from "react";
import { cn } from "@/utils/cn";

export function AccentBar({ className }) {
    return (
        <div
            aria-hidden
            className={cn(
                "h-[2.5px] bg-gradient-to-r from-[var(--primary)] via-[var(--secondary,#ffb703)] to-[var(--third,#ff5c2b)]",
                className
            )}
        />
    );
}
