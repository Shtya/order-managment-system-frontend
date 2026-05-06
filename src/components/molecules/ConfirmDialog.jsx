import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "../ui/button";
import {
    Loader2
} from "lucide-react";
export default function ConfirmDialog({ open, onOpenChange, title, description, confirmText, cancelText, onConfirm, loading = false }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-md rounded-xl">
                <div className="space-y-4 ">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
                    {description && <p className="text-sm text-gray-500 dark:text-slate-400">{description}</p>}

                    <div className="flex items-center justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            {cancelText}
                        </Button>
                        <Button variant="destructive" onClick={onConfirm} disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}