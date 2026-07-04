"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings2, AlertCircle } from "lucide-react";
import * as Configs from "./step-configs";
import { useFlowStore } from "@/hook/useFlowStore";

export function StepConfigModal({ isOpen, onClose, step, mode = "create", initialData = null }) {
    
    const tCommon = useTranslations("common");
    const t = useTranslations("whatsApp.automations.builder");
    const [config, setConfig] = useState(initialData || {});
    const [errors, setErrors] = useState({});
    const { nodes, edges } = useFlowStore();
    
    const [disabled, setDisabled] = useState(true);
    useEffect(() => {
        if (isOpen) {
            setConfig(initialData || {});
            setErrors({});
        }
    }, [isOpen, initialData]);

    if (!step) return null;

    const ConfigComponent = Configs[step.configComponent];

    if (step.hasCustom && ConfigComponent) {
            
        return (
            <ConfigComponent
                isOpen={isOpen}
                value={config}
                onChange={setConfig}
                context={{ step, mode }}
                errors={errors}
                onClose={(config) => onClose(config || null)}
                setErrors={setErrors}
                setDisabled={setDisabled}
                flowData={{ nodes, edges }}
            />
        );
    }

    const className = step.className || "max-w-7xl!";
    const handleSave = () => {
        // Basic validation could be here or inside the config component
        if (Object.keys(errors).length > 0) return;

        onClose(config);
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => onClose(null)}>
            <DialogContent className={`${className} p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-slate-900`}>
                <DialogHeader className="p-6 border-b dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            {step.icon ? <step.icon size={24} /> : <Settings2 size={24} />}
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">{step.label}</DialogTitle>
                            <DialogDescription className="text-xs text-slate-400 mt-1">
                                {mode === "create" ? t('config.modalTitle.create') : t('config.modalTitle.edit')}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {ConfigComponent ? (
                        <ConfigComponent
                            value={config}
                            onChange={setConfig}
                            context={{ step, mode }}
                            errors={errors}
                            onClose={(config) => onClose(config || null)}
                            setErrors={setErrors}
                            setDisabled={setDisabled}
                            flowData={{ nodes, edges }}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                            <AlertCircle size={32} className="text-slate-300 mb-4" />
                            <p className="text-sm text-slate-500 font-medium">{t('config.noSettings')}</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t dark:border-slate-800">
                    <div className="flex w-full justify-between items-center">
                        <Button variant="ghost" onClick={() => onClose(null)} className="rounded-xl px-6">
                            {tCommon('cancel')}
                        </Button>
                        <Button disabled={disabled} onClick={handleSave} className="rounded-xl px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                            {mode === "create" ? t('config.addStep') : t('config.saveChanges')}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
