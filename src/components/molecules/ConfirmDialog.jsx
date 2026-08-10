"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText,
    cancelText,
    onConfirm,
    loading = false,
    disabled = false,
}) {
    const tc = useTranslations("common");
    const confirmLabel = confirmText || tc("delete");
    const cancelLabel = cancelText || tc("cancel");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-md rounded-xl">
                <div className="space-y-4">
                    <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                        {title}
                    </DialogTitle>
                    {description && (
                        <p className="text-sm text-gray-500 dark:text-slate-400">{description}</p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={onConfirm}
                            disabled={loading || disabled}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmLabel}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
