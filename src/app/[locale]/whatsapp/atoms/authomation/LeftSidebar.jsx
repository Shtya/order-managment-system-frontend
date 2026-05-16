import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown, Play,
    GitBranch, Zap, Search, Info, Plus
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { AUTOMATION_CONFIG } from './automation-config';
import { useFlowStore } from '@/hook/useFlowStore';


export function LeftSidebar({ onSelectStep }) {
    const [search, setSearch] = useState('');
    const nodes = useFlowStore((s) => s.nodes);
    const pendingConnection = useFlowStore((s) => s.pendingConnection);
    const hasTrigger = nodes.some(n => n.type === 'trigger');

    const isRTL =
        typeof document !== 'undefined' &&
        document.documentElement.dir === 'rtl';

    const hiddenSidebar = hasTrigger && !pendingConnection;

    const filteredConfig = useMemo(() => {
        const sections = !hasTrigger
            ? { TRIGGERS: AUTOMATION_CONFIG.TRIGGERS }
            : { ACTIONS: AUTOMATION_CONFIG.ACTIONS, CONDITIONS: AUTOMATION_CONFIG.CONDITIONS };

        if (!search) return sections;

        const result = {};
        Object.entries(sections).forEach(([key, section]) => {
            const filteredCategories = section.categories.map(cat => ({
                ...cat,
                items: cat.items.filter(item =>
                    item.label.toLowerCase().includes(search.toLowerCase())
                )
            })).filter(cat => cat.items.length > 0);

            if (filteredCategories.length > 0) {
                result[key] = { ...section, categories: filteredCategories };
            }
        });
        return result;
    }, [hasTrigger, search]);

    return (
        <aside
            className={cn(
                "border-r z-10 flex flex-col h-full bg-white dark:bg-slate-950 dark:border-slate-800 overflow-hidden",
                "transition-all duration-300 ease-out",
                hiddenSidebar
                    ? cn(
                        "w-0 opacity-0 pointer-events-none",
                        isRTL ? "translate-x-full" : "-translate-x-full"
                    )
                    : "w-[340px] translate-x-0 opacity-100"
            )}
        >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    بناء المسارات
                </h2>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    اسحب العناصر لبناء مسار عملك
                </p>

                <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                    <input
                        type="text"
                        placeholder="بحث عن عناصر..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-9 pl-8 pr-4 rounded-lg bg-slate-50 border border-slate-200 text-[11px] focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 transition-all text-right rtl font-bold"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar relative">
                {hasTrigger && !pendingConnection && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center p-8 text-center">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 max-w-[240px]">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                                <Plus size={24} />
                            </div>
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                                اضغط على علامة <span className="text-primary">+</span> الموجودة أسفل الخطوة لإضافة خطوة جديدة تليها
                            </p>
                        </div>
                    </div>
                )}

                {Object.entries(filteredConfig).map(([key, section]) => (
                    <div key={key} className="space-y-4">
                        <div className="px-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                {section.label}
                            </h3>
                        </div>

                        <div className="space-y-6">
                            {section.categories.map((cat) => (
                                <CategoryGroup
                                    key={cat.id}
                                    category={cat}
                                    onSelectStep={onSelectStep}
                                    disabled={hasTrigger && !pendingConnection}
                                />
                            ))}
                        </div>
                    </div>
                ))}

                {Object.keys(filteredConfig).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800">
                            <Search size={24} className="text-slate-200" />
                        </div>
                        <p className="text-xs text-slate-400 font-bold">لم يتم العثور على نتائج</p>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                <div className="flex items-center gap-3 p-4 rounded-[20px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Info size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">مساعدة</p>
                        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight mt-0.5">
                            {!hasTrigger
                                ? "ابدأ بإضافة محفز للمسار أولاً"
                                : !pendingConnection
                                    ? "اضغط على + أسفل الخطوة لإضافة إجراء"
                                    : "اختر الإجراء الذي تريد إضافته"}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}

function CategoryGroup({ category, onSelectStep, disabled }) {
    return (
        <div className={cn("space-y-2 transition-opacity duration-300", disabled && "opacity-50 pointer-events-none")}>
            <div className="px-2 flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-400/80 uppercase tracking-wider">{category.label}</span>
                <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800 ml-3" />
            </div>

            <div className="space-y-2">
                {category.items.map((item, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSelectStep(item)}
                        disabled={disabled}
                        className={cn(
                            "group flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 transition-all text-right rtl",
                            "hover:border-primary/30 hover:shadow-md hover:shadow-slate-200/50 active:scale-[0.98]",
                            "dark:bg-slate-900 dark:border-slate-800 dark:hover:border-primary/30 dark:hover:shadow-none",
                            disabled && "cursor-not-allowed"
                        )}
                    >
                        <div className="h-8 w-8 rounded-md border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-600 shrink-0 group-hover:bg-primary/5 group-hover:text-primary transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                            <item.icon size={16} strokeWidth={1.5} />
                        </div>

                        <div className="flex-1 min-w-0 text-right">
                            <div className="flex items-center gap-1.5">
                                <h4 className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate">{item.label}</h4>
                                {/* <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 font-bold shrink-0">
                                    متصل
                                </span> */}
                            </div>
                            <p className="text-[9px] text-slate-400 font-medium mt-0.5 truncate">
                                {item.type === 'trigger' ? 'بدء المسار تلقائياً' : item.type === 'action' ? 'تنفيذ مهمة محددة' : 'التحقق من صحة البيانات'}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}