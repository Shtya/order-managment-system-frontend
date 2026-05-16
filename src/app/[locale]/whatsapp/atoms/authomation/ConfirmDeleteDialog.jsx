import React from 'react';
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
import toast from 'react-hot-toast';

export function ConfirmDeleteDialog() {
    const deleteConfirm = useFlowStore((s) => s.deleteConfirm);
    const setDeleteConfirm = useFlowStore((s) => s.setDeleteConfirm);
    const confirmDelete = useFlowStore((s) => s.confirmDelete);

    if (!deleteConfirm) return null;

    const { type, downstreamCount } = deleteConfirm;

    const handleConfirm = () => {
        confirmDelete();
        toast.success(
            type === 'clear' ? "تم مسح مسار العمل بنجاح" : "تم حذف الخطوات بنجاح",
        );
    };

    return (
        <AlertDialog
            open={!!deleteConfirm}
            onOpenChange={(open) => !open && setDeleteConfirm(null)}
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

                <div className="mt-4 flex items-center justify-end gap-2">
                    <AlertDialogCancel
                        className="rounded-full"
                        onClick={() => setDeleteConfirm(null)}
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