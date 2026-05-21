import React from 'react';
import { Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function DataCard({ title, data }) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{title}</h4>
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 max-h-[300px] overflow-auto">
        <pre
          dir="ltr"
          className="text-[10px] font-mono leading-relaxed text-left overflow-auto"
        >
          {data ? JSON.stringify(data, null, 2) : "لا توجد بيانات"}
        </pre>
      </div>
    </div>
  );
}

export default function StepExecutionDialog({ stepInfo, onClose }) {
  console.log(stepInfo);
  return (
    <Dialog open={!!stepInfo} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="text-primary" />
            تفاصيل تنفيذ الخطوة
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <DataCard title="بيانات المدخلات (Input)" data={stepInfo?.executionState?.input} />
            <DataCard title="بيانات المخرجات (Output)" data={stepInfo?.executionState?.output} />
          </div>
          {stepInfo?.executionState?.error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl">
              <h4 className="text-[11px] font-black text-rose-600 mb-2">رسالة الخطأ</h4>
              <p className="text-[11px] font-bold text-rose-500">{stepInfo.executionState.error}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
