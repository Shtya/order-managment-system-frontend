import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown, Play,
    GitBranch, Zap, Search, Info
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { AUTOMATION_CONFIG } from './automation-config';
import { useFlowStore } from '@/hook/useFlowStore';

export function LeftSidebar({ onSelectStep }) {
    const [search, setSearch] = useState('');
    const [openSections, setOpenSections] = useState({
        TRIGGERS: true,
        ACTIONS: true,
        CONDITIONS: true
    });
    const nodes = useFlowStore((s) => s.nodes);
    const hasTrigger = nodes.some(n => n.type === 'trigger');

    const toggleSection = (key) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

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
        <aside className="w-80 flex-shrink-0 border-r border-slate-200 bg-white z-10 flex flex-col h-full dark:bg-slate-950 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">بناء المسارات</h2>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">اسحب العناصر لبناء مسار عملك</p>

                <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                        type="text"
                        placeholder="بحث عن عناصر..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-50 border-none text-xs focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:text-slate-300 transition-all text-right rtl font-bold"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {Object.entries(filteredConfig).map(([key, section]) => {
                    const isOpen = openSections[key];
                    return (
                        <div key={key} className="space-y-3">
                            <button
                                onClick={() => toggleSection(key)}
                                className={cn(
                                    "w-full px-4 py-3 rounded-2xl flex items-center justify-between transition-all duration-300 border border-slate-100 dark:border-slate-800",
                                    isOpen ? "bg-slate-50 dark:bg-slate-900/50 shadow-sm" : "bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900/30"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-8 h-8 rounded-xl flex items-center justify-center shadow-sm border",
                                        key === 'TRIGGERS' ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20" :
                                            key === 'ACTIONS' ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20" :
                                                "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:border-purple-500/20"
                                    )}>
                                        {key === 'TRIGGERS' ? <Play size={14} fill="currentColor" className="mr-0.5" /> :
                                            key === 'ACTIONS' ? <Zap size={14} fill="currentColor" /> :
                                                <GitBranch size={14} />}
                                    </div>
                                    <div className="text-right">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                                            {section.label}
                                        </h3>
                                        <p className="text-[9px] font-bold text-slate-400">
                                            {key === 'TRIGGERS' ? 'بداية المسار' : key === 'ACTIONS' ? 'تنفيذ مهام' : 'منطق التحقق'}
                                        </p>
                                    </div>
                                </div>
                                <ChevronDown size={14} className={cn("text-slate-400 transition-transform duration-300", isOpen ? "" : "-rotate-90")} />
                            </button>

                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden space-y-4 px-1"
                                    >
                                        {section.categories.map((cat) => (
                                            <CategoryGroup
                                                key={cat.id}
                                                category={cat}
                                                sectionKey={key}
                                                onSelectStep={onSelectStep}
                                            />
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}

                {Object.keys(filteredConfig).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800">
                            <Search size={24} className="text-slate-200" />
                        </div>
                        <p className="text-xs text-slate-400 font-bold">لم يتم العثور على نتائج</p>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3 p-4 rounded-[20px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                        <Info size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">مساعدة</p>
                        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight mt-0.5">
                            {!hasTrigger ? "ابدأ بإضافة محفز للمسار أولاً لتتمكن من إضافة الإجراءات" : "أضف إجراءات وشروط لتكمل المسار"}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}

function CategoryGroup({ category, sectionKey, onSelectStep }) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="space-y-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors bg-slate-50/50 dark:bg-slate-900/50 rounded-lg"
            >
                <span>{category.label}</span>
                <ChevronDown size={10} className={cn("transition-transform", isOpen ? "" : "-rotate-90")} />
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-1 px-0.5"
                    >
                        {category.items.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => onSelectStep(item)}
                                className={cn(
                                    "group flex w-full items-center gap-2.5 rounded-lg border px-2 py-1.5 transition-all text-right rtl",
                                    "hover:shadow-sm active:scale-[0.98]",
                                    sectionKey === 'TRIGGERS'
                                        ? "bg-emerald-50/10 border-emerald-50/50 dark:bg-emerald-500/5 dark:border-emerald-500/5 hover:border-emerald-200 hover:bg-emerald-50/30"
                                        : sectionKey === 'ACTIONS'
                                            ? "bg-blue-50/10 border-blue-50/50 dark:bg-blue-500/5 dark:border-blue-500/5 hover:border-blue-200 hover:bg-blue-50/30"
                                            : "bg-purple-50/10 border-purple-50/50 dark:bg-purple-500/5 dark:border-purple-500/5 hover:border-purple-200 hover:bg-purple-50/30"
                                )}
                            >
                                <div className={cn(
                                    "h-6 w-6 rounded-md flex items-center justify-center transition-all shadow-sm shrink-0",
                                    sectionKey === 'TRIGGERS' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20" :
                                        sectionKey === 'ACTIONS' ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20" :
                                            "bg-purple-100 text-purple-600 dark:bg-purple-500/20"
                                )}>
                                    <item.icon size={13} strokeWidth={2.5} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 truncate">{item.label}</h4>
                                </div>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}