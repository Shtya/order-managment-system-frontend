import React, { useState } from 'react';
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
            type === 'clear' ? "تم مسح مسار العمل بنجاح" : "تم حذف الخطوات بنجاح",
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
                            ? 'مسح مسار العمل'
                            : downstreamCount > 0
                                ? 'حذف الخطوة والفروع التابعة'
                                : 'حذف الخطوة'}
                    </AlertDialogTitle>

                    <AlertDialogDescription>
                        {type === 'clear' ? (
                            <>
                                <div className="mt-2 text-sm">
                                    هل أنت متأكد من مسح جميع الخطوات؟ لا يمكن التراجع عن هذا الإجراء.
                                </div>
                            </>
                        ) : downstreamCount > 0 ? (
                            <>
                                <div className="mt-2 text-sm">
                                    سيؤدي هذا الإجراء إلى حذف هذه الخطوة و{' '}
                                    <span className="text-rose-500 font-bold">{downstreamCount}</span>{' '}
                                    خطوة تالية مرتبطة بها.
                                </div>
                                <div className="mt-2 text-sm">هل أنت متأكد؟</div>
                            </>
                        ) : (
                            <div className="mt-2 text-sm">
                                هل أنت متأكد من حذف هذه الخطوة؟
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
                            لا تسألني مرة أخرى عند الحذف
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
                        إلغاء
                    </AlertDialogCancel>

                    <AlertDialogAction
                        className="rounded-full bg-red-600 hover:bg-red-700 text-white"
                        onClick={handleConfirm}
                    >
                        <span className="flex items-center gap-2">
                            <Trash2 size={18} />
                            تأكيد الحذف
                        </span>
                    </AlertDialogAction>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}