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

    const typeKeyByStepType = {
        trigger: "triggerTypes",
        action: "actionTypes",
        condition: "conditionTypes",
    };
    const typeKey = typeKeyByStepType[step.type];
    const stepName = step.label
        || (typeKey && step.id ? t(`${typeKey}.${step.id}`) : null)
        || step.id
        || "";

    if (step.hasCustom && ConfigComponent) {
            
        return (
            <ConfigComponent
                isOpen={isOpen}
                value={config}
                onChange={setConfig}
                context={{ step, mode }}
                mode={mode}
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
            <DialogContent className={`${className} w-full h-[90vh] md:h-auto md:max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-950`}>
                <DialogHeader className="px-4 md:px-6 py-4 border-b border-border bg-card shrink-0">
                    <DialogTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                            {step.icon ? <step.icon size={20} /> : <Settings2 size={20} />}
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="truncate">{stepName}</span>
                            <DialogDescription className="text-xs text-muted-foreground font-normal">
                                {mode === "create" ? t('config.modalTitle.create') : t('config.modalTitle.edit')}
                            </DialogDescription>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-card">
                    {ConfigComponent ? (
                        <ConfigComponent
                            value={config}
                            onChange={setConfig}
                            context={{ step, mode }}
                            mode={mode}
                            errors={errors}
                            onClose={(config) => onClose(config || null)}
                            setErrors={setErrors}
                            setDisabled={setDisabled}
                            flowData={{ nodes, edges }}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-xl">
                            <AlertCircle size={32} className="text-muted-foreground mb-4" />
                            <p className="text-sm text-muted-foreground font-medium">{t('config.noSettings')}</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-card shrink-0">
                    <div className="flex items-center justify-end gap-3 w-full">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onClose(null)}
                            className="rounded-xl px-6"
                        >
                            {tCommon('cancel')}
                        </Button>
                        <Button
                            type="button"
                            disabled={disabled}
                            onClick={handleSave}
                            className="rounded-xl px-8"
                        >
                            {mode === "create" ? t('config.addStep') : t('config.saveChanges')}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
