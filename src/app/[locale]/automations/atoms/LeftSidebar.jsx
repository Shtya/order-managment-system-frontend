import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
    ChevronDown, Play,
    GitBranch, Zap, Search, Info, Plus,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { AUTOMATION_CONFIG } from './automation-config';
import { useFlowStore } from '@/hook/useFlowStore';
import { useRouter } from '@/i18n/navigation';


export function LeftSidebar({ onSelectStep }) {
    const t = useTranslations("whatsApp.automations.builder");
    const router = useRouter();
    const [search, setSearch] = useState('');
    const nodes = useFlowStore((s) => s.nodes);
    const pendingConnection = useFlowStore((s) => s.pendingConnection);
    const hasTrigger = nodes.some(n => n.type === 'trigger');
    const name = useFlowStore((s) => s.name);
    const setName = useFlowStore((s) => s.setName);
    const nameError = useFlowStore((s) => s.nameError);
    const mode = useFlowStore((s) => s.mode);
    const isEditMode = mode === 'edit';

    const isRTL =
        typeof document !== 'undefined' &&
        document.documentElement.dir === 'rtl';


    const hiddenSidebar = hasTrigger && !pendingConnection;

    const getTranslatedLabel = (item) => {
        if (item.type === 'trigger') return t(`triggerTypes.${item.id}`);
        if (item.type === 'action') return t(`actionTypes.${item.id}`);
        if (item.type === 'condition') return t(`conditionTypes.${item.id}`);
        return item.label;
    };

    const getCategoryLabel = (catId) => {
        if (catId === 'INTERNAL') return t('sidebar.internalSystem');
        if (catId === 'LOGIC') return t('sidebar.logic');
        return catId;
    };

    const filteredConfig = useMemo(() => {
        const sections = !hasTrigger
            ? { TRIGGERS: AUTOMATION_CONFIG.TRIGGERS }
            : { ACTIONS: AUTOMATION_CONFIG.ACTIONS, CONDITIONS: AUTOMATION_CONFIG.CONDITIONS };

        const result = {};
        Object.entries(sections).forEach(([key, section]) => {
            const filteredCategories = section.categories.map(cat => ({
                ...cat,
                label: getCategoryLabel(cat.id),
                items: cat.items.map(item => ({
                    ...item,
                    label: getTranslatedLabel(item)
                })).filter(item =>
                    !search || item.label.toLowerCase().includes(search.toLowerCase())
                )
            })).filter(cat => cat.items.length > 0);

            if (filteredCategories.length > 0) {
                result[key] = { 
                    ...section, 
                    label: t(`sidebar.${key.toLowerCase()}`),
                    categories: filteredCategories 
                };
            }
        });
        return result;
    }, [hasTrigger, search, t]);

    return (
        <aside
            className={cn(
                "border-r z-10 flex flex-col h-full bg-white dark:bg-slate-950 dark:border-slate-800 overflow-hidden",
                "transition-all duration-300 ease-out",
                "w-[300px] translate-x-0 opacity-100"
            )}
        >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-[16px] font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        {t('sidebar.title')}
                    </h2>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                    {t('sidebar.subtitle')}
                </p>
            </div>

            {/* Name Input Area */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                <div className={cn(
                    "flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border transition-all duration-300",
                    nameError
                        ? "border-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.1)] bg-rose-50/50"
                        : "border-slate-200 dark:border-slate-800"
                )}>
                    <button
                        onClick={() => router.back()}
                        className="h-6 w-6 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                    >
                        {isRTL ? <ChevronRight size={14} /> : <ChevronRight size={14} className="rotate-180" />}
                    </button>
                    <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800" />
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isEditMode}
                        maxLength={300}
                        placeholder={t('sidebar.namePlaceholder')}
                        className={cn(
                            "text-xs bg-transparent border-none outline-none font-bold px-1.5 min-w-[200px] focus:outline-none focus:ring-0 focus-visible:outline-none! focus-visible:ring-0",
                            isEditMode ? "text-slate-400 cursor-not-allowed" : "text-slate-700 dark:text-slate-200"
                        )}
                    />
                </div>
                {nameError && (
                    <p className="text-[9px] font-black text-rose-500 px-2 mt-1 animate-in fade-in slide-in-from-top-1">
                        {nameError}
                    </p>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar relative">
                {hasTrigger && !pendingConnection && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center p-6 text-center bg-white/50 dark:bg-slate-950/50 backdrop-blur-[1px]">
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] shadow-xl border border-slate-100 dark:border-slate-800 max-w-[220px]">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-3">
                                <Plus size={20} />
                            </div>
                            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                                {t.rich('sidebar.addStepTip', {
                                    plus: (chunks) => <span className="text-primary">+</span>
                                })}
                            </p>
                        </div>
                    </div>
                )}

                {Object.entries(filteredConfig).map(([key, section]) => (
                    <div key={key} className="space-y-4">
                        <div className="px-1">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-900 pb-1">
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
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-3 border border-slate-100 dark:border-slate-800">
                            <Search size={20} className="text-slate-200" />
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold">{t('sidebar.noResults')}</p>
                    </div>
                )}
            </div>

            {/* Footer Help */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Info size={16} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('sidebar.help')}</p>
                        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight mt-0.5">
                            {!hasTrigger
                                ? t('sidebar.addFirst')
                                : !pendingConnection
                                    ? t('sidebar.clickPlus')
                                    : t('sidebar.chooseAction')}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}

function CategoryGroup({ category, onSelectStep, disabled }) {
    return (
        <div className={cn("space-y-3 transition-opacity duration-300", disabled && "opacity-50 pointer-events-none")}>


            <div className="grid grid-cols-2 gap-2">
                {category.items.map((item, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSelectStep(item)}
                        disabled={disabled}
                        className={cn(
                            "group relative flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 transition-all text-center",
                            "hover:border-primary/30 hover:shadow-sm active:scale-[0.96]",
                            "dark:bg-slate-900 dark:border-slate-800 dark:hover:border-primary/30",
                            disabled && "cursor-not-allowed"
                        )}
                    >
                        <div className={cn(
                            "h-9 w-9 rounded-xl border flex items-center justify-center transition-colors shrink-0",
                            item.id.includes('whatsapp')
                                ? "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-500"
                                : "bg-slate-50 border-slate-100 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400",
                            "group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/10"
                        )}>
                            <item.icon size={18} strokeWidth={1.5} />
                        </div>

                        <div className="min-w-0">
                            <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight">
                                {item.label}
                            </h4>
                            {/* <p className="text-[9px] text-slate-400 font-medium mt-1">
                                {item.type === 'trigger' ? 'بدء تلقائي' : item.type === 'action' ? 'مهمة' : 'فحص'}
                            </p> */}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}