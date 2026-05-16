import React from 'react';
import {
    Save,
    Play,
    Rocket,
    ChevronRight,
    Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

import { useFlowStore } from '@/hook/useFlowStore';

export function TopToolbar() {
    const router = useRouter();
    const nodes = useFlowStore((s) => s.nodes);
    const setDeleteConfirm = useFlowStore((s) => s.setDeleteConfirm);

    const handleSave = () => {
        toast.success("تم حفظ سير عمل الأتمتة بنجاح!");
    };

    const handleClear = () => {
        if (nodes.length === 0) return;
        setDeleteConfirm({ type: 'clear' });
    };

    const handlePublish = () => {
        if (nodes.length === 0) {
            toast.error("لا يمكن نشر سير عمل فارغ.");
            return;
        }
        toast.success("تم نشر سير العمل وهو الآن قيد التشغيل!");
    };

    return (
        <div className="absolute top-[15px] end-[15px] z-50 flex items-center gap-2 pointer-events-none">
            <div className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/40 pointer-events-auto">
                <ToolbarButton
                    icon={<Play size={18} />}
                    label="معاينة المسار"
                    onClick={() => { }}
                />

                {/* <ToolbarButton
                    icon={<Save size={18} />}
                    label="حفظ التغييرات"
                    onClick={handleSave}
                /> */}

                <ToolbarButton
                    icon={<Trash2 size={18} />}
                    label="مسح الكل"
                    onClick={handleClear}
                    danger
                />

                <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

                <ToolbarButton
                    icon={<Rocket size={18} />}
                    label="نشر الأتمتة"
                    onClick={handlePublish}
                    primary
                />
            </div>
        </div>
    );
}

function ToolbarButton({ icon, label, onClick, className, primary, danger }) {
    return (
        <div className="group relative flex flex-col items-center">
            <button
                onClick={onClick}
                className={cn(
                    "h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-300",
                    primary
                        ? "bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90"
                        : danger
                            ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-primary",
                    className
                )}
            >
                {icon}
            </button>

            {/* Tooltip */}
            <div className="absolute top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60]">
                {/* Arrow */}
                <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mb-1 relative top-[2px]" />

                <div className="bg-slate-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap">
                    {label}
                </div>
            </div>
        </div>
    );
}