"use client";

import React from "react";
import { motion } from "framer-motion";

export default function SwitcherTabs({
  items,
  activeId,
  onChange,
  className = "",
  itemClassName = "",
  activeClassName = "",
  inactiveClassName = "",
  underlineClassName = "",
}) {
  return (
    <div className={["w-full", className].join(" ")}>
      {/* Tabs container with bottom border */}
      <div className="relative  border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-6 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeId;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange?.(item.id)}
                className={[
                  "relative pb-3 pt-3 select-none",
                  "text-sm font-semibold transition-colors duration-300",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-md",
                  itemClassName,
                  isActive
                    ? ["text-[#ff8b00] dark:text-[#5b4bff]", activeClassName].join(" ")
                    : [
                        "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200",
                        inactiveClassName,
                      ].join(" "),
                ].join(" ")}
              >
                <div className="flex items-center gap-2">
                  {Icon ? (
                    <Icon
                      size={18}
                      className={
                        isActive
                          ? "text-[#ff8b00] dark:text-[#5b4bff]"
                          : "text-gray-400 dark:text-slate-500"
                      }
                    />
                  ) : null}

                  <span>{item.label}</span>
                </div>

                {/* Active underline */}
                {isActive ? (
                  <motion.div
                    layoutId="pretty-switcher-underline"
                    className={[
                      "absolute bottom-0 left-0 right-0 h-[3px] rounded-full",
                      "bg-gradient-to-r from-[#ff8b00] via-[#ffb703] to-[#ff5c2b]",
                      "dark:from-[#5b4bff] dark:via-[#8b7cff] dark:to-[#3be7ff]",
                      underlineClassName,
                    ].join(" ")}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
