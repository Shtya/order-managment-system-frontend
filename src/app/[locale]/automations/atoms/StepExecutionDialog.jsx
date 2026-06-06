import React, { useState, useEffect, useMemo } from "react";
import { 
  Info, 
  Search, 
  Minimize2, 
  Maximize2, 
  Code, 
  Network, 
  Box, 
  Type as TypeIcon, 
  Hash, 
  ToggleLeft, 
  ListOrdered,
  RefreshCcw,
  Ban,
  Check
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; // Adjust based on your path
import { cn } from "@/utils/cn";
import { FloatingSearchInput } from "@/components/atoms/Table";
// If you have a custom Button component, you can replace the above import
// import Button from "@/components/atoms/Button";

// --- Type Configuration & Icons ---
const TYPE_CONFIG = {
  object:  { label: "object", icon: Box,         className: "bg-purple-50 text-purple-600 border border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20" },
  array:   { label: "array",  icon: ListOrdered, className: "bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" },
  string:  { label: "string", icon: TypeIcon,    className: "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" },
  number:  { label: "number", icon: Hash,        className: "bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20" },
  boolean: { label: "bool",   icon: ToggleLeft,  className: "bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20" },
  null:    { label: "null",   icon: Info,        className: "bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
};

function TypeBadge({ type }) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.null;
  return (
    <span className={`ml-4 shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md font-sans tracking-wide w-16 text-center ${config.className}`}>
      {config.label}
    </span>
  );
}

// --- Toggle Chevron ---
function ToggleIcon({ expanded }) {
  return expanded ? (
    <svg width="12" height="12" viewBox="0 0 10 10" className="text-slate-400" fill="none">
      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) : (
    <svg width="12" height="12" viewBox="0 0 10 10" className="text-slate-400" fill="none">
      <path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// --- Recursive Node ---
const JsonNode = ({ label, value, isLast, depth = 0, toggleId, forceExpand, t }) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2 || forceExpand);

  // Listen for global expand/collapse
  useEffect(() => {
    if (toggleId > 0) setIsExpanded(forceExpand);
  }, [toggleId, forceExpand]);

  const isObject = value !== null && typeof value === "object";
  const isArray  = Array.isArray(value);
  const type = value === null ? "null" : isArray ? "array" : typeof value;
  const TypeIconCmp = TYPE_CONFIG[type]?.icon || Info;

  // Render Primitive Value
  if (!isObject) {
    const valueColor =
      type === "string"  ? "text-emerald-600 font-semibold dark:text-emerald-400" :
      type === "number"  ? "text-orange-500 font-bold dark:text-orange-400" :
      type === "boolean" ? "text-indigo-500 font-bold dark:text-indigo-400" :
      "text-slate-400";

    return (
      <div className="flex items-start justify-between font-mono text-[12px] leading-relaxed group hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-md px-1.5 py-1 transition-colors">
        <div className="flex items-start gap-2 overflow-hidden">
          <span className="w-4 shrink-0 flex justify-center mt-0.5">
            <TypeIconCmp size={12} className="text-slate-400" />
          </span>
          {label != null && (
            <span className="text-slate-600 dark:text-slate-300 mr-1 whitespace-nowrap font-medium">
              {label}
            </span>
          )}
          <span className={`break-all ${valueColor}`}>
            {type === "string" ? `"${value}"` : String(value)}
          </span>
          {!isLast && <span className="text-slate-400">,</span>}
        </div>
        <TypeBadge type={type} />
      </div>
    );
  }

  // Render Object / Array
  const keys     = Object.keys(value);
  const isEmpty  = keys.length === 0;

  return (
    <div className="font-mono text-[12px] leading-relaxed">
      {/* Header Row */}
      <div
        className="flex items-center justify-between rounded-md px-1.5 py-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer select-none group"
        onClick={() => !isEmpty && setIsExpanded(v => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="w-4 shrink-0 flex justify-center">
            {!isEmpty ? (
              <span className="bg-slate-100 dark:bg-slate-800 rounded p-0.5">
                <ToggleIcon expanded={isExpanded} />
              </span>
            ) : (
              <TypeIconCmp size={12} className="text-slate-400" />
            )}
          </span>
          
          {label != null && (
            <span className="text-slate-700 font-bold dark:text-slate-200 whitespace-nowrap">
              {label}
            </span>
          )}
          
          {!isExpanded && !isEmpty && (
            <span className="ml-2 text-[10px] text-slate-400 italic font-sans bg-slate-100 dark:bg-slate-800 px-1.5 rounded">
              {isArray ? t('itemsCount', { count: keys.length }) : t('keysCount', { count: keys.length })}
            </span>
          )}
        </div>
        <TypeBadge type={type} />
      </div>

      {/* Children Container (with left border line) */}
      {isExpanded && !isEmpty && (
        <div className="ml-[9px] pl-3 border-l border-slate-200 dark:border-slate-700 mt-1 mb-1 flex flex-col gap-0.5">
          {keys.map((key, index) => (
            <JsonNode
              key={key}
              label={isArray ? null : key}
              value={value[key]}
              isLast={index === keys.length - 1}
              depth={depth + 1}
              toggleId={toggleId}
              forceExpand={forceExpand}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Search Filter Logic ---
// Recursively filters a JSON object based on a search term
const filterJsonData = (data, term) => {
  if (!term) return data;
  const lowerTerm = term.toLowerCase();

  if (typeof data !== 'object' || data === null) {
    return String(data).toLowerCase().includes(lowerTerm) ? data : undefined;
  }

  if (Array.isArray(data)) {
    const filtered = data.map(item => filterJsonData(item, term)).filter(item => item !== undefined);
    return filtered.length > 0 ? filtered : undefined;
  }

  const filteredObj = {};
  let hasMatch = false;
  
  for (const [key, value] of Object.entries(data)) {
    // If key matches, keep the whole sub-tree
    if (key.toLowerCase().includes(lowerTerm)) {
      filteredObj[key] = value;
      hasMatch = true;
    } else {
      // Otherwise, check children
      const filteredValue = filterJsonData(value, term);
      if (filteredValue !== undefined) {
         filteredObj[key] = filteredValue;
         hasMatch = true;
      }
    }
  }
  return hasMatch ? filteredObj : undefined;
};

// --- Main Tree Wrapper ---
const JsonViewer = ({ data, searchTerm, toggleId, forceExpand, t }) => {
  const filteredData = useMemo(() => filterJsonData(data, searchTerm), [data, searchTerm]);

  if (data === undefined || data === null) {
    return <div className="p-4 text-[12px] text-slate-400 font-mono text-center">{t('noData')}</div>;
  }

  if (searchTerm && filteredData === undefined) {
    return <div className="p-8 text-[12px] text-slate-500 text-center font-semibold bg-slate-50 dark:bg-slate-800/50 rounded-xl">{t('noResults', { term: searchTerm })}</div>;
  }

  return (
    <div className="text-left w-full h-full" dir="ltr">
      <JsonNode 
        label={searchTerm ? t('searchResults') : t('root')} 
        value={filteredData} 
        isLast={true} 
        toggleId={toggleId}
        forceExpand={searchTerm ? true : forceExpand} // Auto-expand when searching
        t={t}
      />
    </div>
  );
};

// --- Data Card Container ---
function DataCard({ title, data, icon: TitleIcon, searchTerm, toggleId, forceExpand, viewMode }) {
  return (
    <div className="flex flex-col gap-3 min-w-0 h-[60vh] md:h-[65vh]">
      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5 rounded-lg border border-slate-100 dark:border-slate-800 w-max">
        <TitleIcon size={14} className="text-primary" />
        <h4 className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
          {title}
        </h4>
      </div>
      
      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-auto custom-scrollbar p-4 shadow-sm">
        {viewMode === "raw" ? (
          <pre dir="ltr" className="text-[11px] font-mono leading-relaxed text-left text-slate-600 dark:text-slate-300">
             {data ? JSON.stringify(data, null, 2) : t('noData')}
          </pre>
        ) : (
          <JsonViewer 
             data={data} 
             searchTerm={searchTerm} 
             toggleId={toggleId} 
             forceExpand={forceExpand} 
          />
        )}
      </div>
    </div>
  );
}

// --- Main Dialog Component ---
export default function StepExecutionDialog({ stepInfo, onClose }) {
  const tCommon = useTranslations("common");
  const t = useTranslations("whatsApp.automations.builder.stepInfo");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("tree"); // "tree" | "raw"
  
  // Toggles for Expand/Collapse All
  const [toggleId, setToggleId] = useState(0);
  const [forceExpand, setForceExpand] = useState(true);

  const handleExpandAll = () => {
    setForceExpand(true);
    setToggleId(prev => prev + 1);
  };

  const handleCollapseAll = () => {
    setForceExpand(false);
    setToggleId(prev => prev + 1);
  };

  // Sync button logic visibility
  const isTrigger = stepInfo?.nodeType === "trigger";
  const execType = stepInfo?.executionState?.type;
  // const showSyncButton = isTrigger && (execType === "order_updated" || execType === "order_created");
  const showSyncButton = false;

  return (
    <Dialog open={!!stepInfo} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl! rounded-3xl w-[98vw] h-[95vh] flex flex-col p-6 overflow-hidden">
        
        {/* Header Section */}
        <DialogHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0 space-y-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Info className="text-primary" />
            {t('title')}
          </DialogTitle>
          
          {/* Top Control Bar */}
        </DialogHeader>
          <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap mt-4">
            <FloatingSearchInput 
              searchValue={searchTerm}
              disabled={ viewMode === 'raw'}
              onSearchChange={setSearchTerm}
              searchPlaceholder={tCommon('search')}
            />

            <div className="flex items-center gap-3 ml-auto">
              <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button 
                  onClick={() => setViewMode("tree")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                    viewMode === "tree" 
                      ? "bg-white dark:bg-slate-700 shadow-sm text-primary" 
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  <Network size={14} />
                  <span>{t('treeView')}</span>
                </button>
                <button 
                  onClick={() => setViewMode("raw")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                    viewMode === "raw" 
                      ? "bg-white dark:bg-slate-700 shadow-sm text-primary" 
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  <Code size={14} />
                  <span>{t('rawJson')}</span>
                </button>
              </div>

              {viewMode === "tree" && (
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={handleCollapseAll}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all"
                    title={t('collapseAll')}
                  >
                    <Minimize2 size={14}/>
                    <span className="sr-only">{t('collapseAll')}</span>
                  </button>
                  <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />
                  <button
                    onClick={handleExpandAll}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all"
                    title={t('expandAll')}
                  >
                    <Maximize2 size={14}/>
                    <span className="sr-only">{t('expandAll')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        {/* Error State */}
        {stepInfo?.executionState?.error && (
          <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl shrink-0">
            <h4 className="text-[12px] font-black text-rose-600 mb-1">{t('errorMessage')}</h4>
            <p className="text-[12px] font-bold text-rose-500">{stepInfo.executionState.error}</p>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            <DataCard 
               title={t('output')}
               icon={Code} // Or ArrowDownRight
               data={stepInfo?.executionState?.output} 
               searchTerm={searchTerm}
               toggleId={toggleId}
               forceExpand={forceExpand}
               viewMode={viewMode}
            />
            <DataCard 
               title={t('input')}
               icon={Box} // Or ArrowUpRight
               data={stepInfo?.executionState?.input} 
               searchTerm={searchTerm}
               toggleId={toggleId}
               forceExpand={forceExpand}
               viewMode={viewMode}
            />
          </div>
        </div>

        {/* Conditional Footer matches user provided theme format */}
        <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 sm:gap-0">
            <div className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 order-2 sm:order-1">
              {/* Optional: Add some info here if needed, like step type or status */}
              {/* <span className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="font-semibold">جاهز للمراجعة</span>
              </span> */}
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto order-1 sm:order-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 sm:px-8 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold border-2"
              >
                {tCommon('close')}
              </Button>
              
              {showSyncButton && (
                <Button
                  type="button"
                  onClick={() => {
                    // Add your actual sync logic here
                    console.log("Sync requested!");
                  }}
                  className={cn(
                    "flex-1 sm:flex-none px-4 sm:px-10 py-2 sm:py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-bold shadow-lg shadow-primary/30 transition-all transform hover:scale-105 active:scale-95"
                  )}
                >
                  <RefreshCcw size={16} className="ltr:mr-2 rtl:ml-2" />
                  {t('syncWithOrder')}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}