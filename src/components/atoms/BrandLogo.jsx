"use client";

import React from "react";
import { motion } from "framer-motion";
import { useLocale } from "next-intl";
import { cn } from "@/utils/cn";

export default function BrandLogo({ className = "", size = "h-8" }) {
    const locale = useLocale();
    const isAr = locale === "ar";


    const logoSrc = isAr ? "/Logo-imgAr.png" : "/Logo-imEn.png";

    return (
        <motion.div
            initial={{ opacity: 0, x: isAr ? 12 : -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12, duration: 0.35 }}
            className={cn("flex items-center gap-2", className)}
        >
            <div className="relative flex items-center justify-center">
                {/* The Logo Image */}
                <img
                    src={logoSrc}
                    alt="Logo"
                    className={cn(size, "w-auto object-contain")}
                />

                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
                    animate={{ x: ["-150%", "250%"] }}
                    transition={{
                        duration: 3.5,
                        repeat: Infinity,
                        repeatDelay: 2.5,
                        ease: "easeInOut",
                    }}
                />
            </div>
        </motion.div>
    );
}