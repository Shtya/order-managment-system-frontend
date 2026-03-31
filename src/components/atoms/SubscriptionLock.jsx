"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Button_ from "./Button";

/**
 * Reusable Subscription Lock component.
 * Shows a full-screen or relative overlay if the user doesn't have an active subscription.
 */
export default function SubscriptionLock({
    isVisible = true,
    titleKey = "title",
    descriptionKey = "description",
    showSidebarOffset = true
}) {
    const router = useRouter();
    const t = useTranslations("subscription_lock");
    if (!isVisible) return null;
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{
                    opacity: 1,
                    // تحريك الهامش باستخدام framer-motion بدلاً من الـ transition اليدوي
                }}
                exit={{ opacity: 0 }}
                transition={{
                    marginInlineStart: { type: "spring", damping: 25, stiffness: 200 },
                    opacity: { duration: 0.3 }
                }}
                className="absolute inset-0 z-[40] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
            >  <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800"
            >
                    {/* Header */}
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center shrink-0">
                            <Lock className="text-red-500" size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                                {t(titleKey)}
                            </h3>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 p-5">
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-200 leading-relaxed text-center">
                                {t(descriptionKey)}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button_
                                className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20"
                                tone="primary"
                                variant="solid"
                                onClick={() => router.push("/plans")}
                                label={
                                    <div className="flex items-center justify-center gap-2">
                                        <Sparkles size={18} />
                                        <span>{t("subscribe_btn")}</span>
                                    </div>
                                }
                            />

                            {/* <button
                            onClick={() => router.back()}
                            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-2 font-medium"
                        >
                            <ArrowRight size={16} className="rtl:rotate-180" />
                            <span>{t("go_back")}</span>
                        </button> */}
                        </div>
                    </div>

                    {/* Footer Decor */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-primary via-third to-primary opacity-50" />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
