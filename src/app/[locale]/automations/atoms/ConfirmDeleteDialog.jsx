import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from 'lucide-react';
import { useFlowStore } from '@/hook/useFlowStore';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import toast from 'react-hot-toast';

export function ConfirmDeleteDialog() {
    const tCommon = useTranslations("common");
    const t = useTranslations("whatsApp.automations.builder");
    const deleteConfirm = useFlowStore((s) => s.deleteConfirm);
    const setDeleteConfirm = useFlowStore((s) => s.setDeleteConfirm);
    const confirmDelete = useFlowStore((s) => s.confirmDelete);
    const setSkipDeleteConfirmation = useFlowStore((s) => s.setSkipDeleteConfirmation);
    const [dontAskAgain, setDontAskAgain] = useState(false);

    if (!deleteConfirm) return null;

    const { type, downstreamCount } = deleteConfirm;

    const handleConfirm = () => {
        if (dontAskAgain) {
            setSkipDeleteConfirmation(true);
        }
        confirmDelete();
        toast.success(
            type === 'clear' ? t('dialogs.delete.successClear') : t('dialogs.delete.successDelete'),
        );
    };

    return (
        <AlertDialog
            open={!!deleteConfirm}
            onOpenChange={(open) => {
                if (!open) {
                    setDeleteConfirm(null);
                    setDontAskAgain(false);
                }
            }}
        >
            <AlertDialogContent className="rounded-xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {type === 'clear'
                            ? t('dialogs.delete.title.clear')
                            : downstreamCount > 0
                                ? t('dialogs.delete.title.stepWithDownstream')
                                : t('dialogs.delete.title.step')}
                    </AlertDialogTitle>

                    <AlertDialogDescription>
                        {type === 'clear' ? (
                            <>
                                <div className="mt-2 text-sm">
                                    {t('dialogs.delete.description.clear')}
                                </div>
                            </>
                        ) : downstreamCount > 0 ? (
                            <>
                                <div className="mt-2 text-sm">
                                    {t.rich('dialogs.delete.description.stepWithDownstream', {
                                        count: (chunks) => <span className="text-rose-500 font-bold">{downstreamCount}</span>
                                    })}
                                </div>
                                <div className="mt-2 text-sm">{t('dialogs.delete.description.confirm')}</div>
                            </>
                        ) : (
                            <div className="mt-2 text-sm">
                                {t('dialogs.delete.description.step')}
                            </div>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {type !== 'clear' && (
                    <div className="mt-4 flex items-center gap-2 px-1">
                        <Checkbox
                            id="dont-ask-again"
                            checked={dontAskAgain}
                            onCheckedChange={setDontAskAgain}
                        />
                        <Label
                            htmlFor="dont-ask-again"
                            className="text-xs font-medium text-slate-500 cursor-pointer select-none"
                        >
                            {t('dialogs.delete.dontAskAgain')}
                        </Label>
                    </div>
                )}

                <div className="mt-6 flex items-center justify-end gap-2">
                    <AlertDialogCancel
                        className="rounded-full"
                        onClick={() => {
                            setDeleteConfirm(null);
                            setDontAskAgain(false);
                        }}
                    >
                        {tCommon('cancel')}
                    </AlertDialogCancel>

                    <AlertDialogAction
                        className="rounded-full bg-red-600 hover:bg-red-700 text-white"
                        onClick={handleConfirm}
                    >
                        <span className="flex items-center gap-2">
                            <Trash2 size={18} />
                            {tCommon('confirm')}
                        </span>
                    </AlertDialogAction>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}