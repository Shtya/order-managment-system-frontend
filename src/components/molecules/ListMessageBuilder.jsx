"use client";

import React from "react";
import { PlusCircle, Trash2, Smile, List, Info, GripVertical, Plus } from "lucide-react";
import { cn } from "@/utils/cn";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import WhatsAppMessageBodyBuilder from "./WhatsAppMessageBodyBuilder";
import MediaUpload from "@/app/[locale]/whatsapp/atoms/MediaUpload";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableRow({
  id,
  sIdx,
  rIdx,
  row,
  tc,
  handleRowChange,
  handleRemoveRow
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    transition: {
      duration: 120,
      easing: "ease-out",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    zIndex: isDragging ? 999 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex gap-3 items-start bg-white dark:bg-slate-950 p-3 rounded-lg border group shadow-sm",
        isDragging
          ? "border-primary shadow-lg ring-2 ring-primary/20 opacity-90"
          : "border-slate-100 dark:border-slate-800"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="pt-2 text-slate-300 hover:text-primary cursor-grab active:cursor-grabbing shrink-0"
      >
        <GripVertical size={16} />
      </div>
      <div className="flex-1 space-y-3">
        <div className="space-y-1">
          <Input
            placeholder={tc("rowTitle")}
            maxLength={24}
            value={row.title}
            onChange={(e) => handleRowChange(sIdx, rIdx, "title", e.target.value)}
            className="h-9 border-none shadow-none focus-visible:ring-0 px-0 font-bold"
          />
          <div className="h-px bg-slate-50 dark:bg-slate-800" />
        </div>
        <textarea
          placeholder={tc("rowDescription")}
          maxLength={72}
          rows={1}
          value={row.description}
          onChange={(e) => handleRowChange(sIdx, rIdx, "description", e.target.value)}
          className="w-full bg-transparent focus:ring-0 resize-none text-[13px] text-slate-600 dark:text-slate-400 p-0 outline-none leading-relaxed border border-slate-100 dark:border-slate-800 focus-visible:outline-none! rounded-md p-2"
        />
      </div>
      <button
        type="button"
        onClick={() => handleRemoveRow(sIdx, rIdx)}
        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-all"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

export default function ListMessageBuilder({
  value,
  onChange,
  errors = {},
  setHeaderMediaFile,
  config = {
    maxRows: 10,
    maxSections: 10,
    headerTypes: ["NONE", "TEXT"],
    allowVariables: false
  }
}) {
  const tc = useTranslations("chats");
  const t = useTranslations("upsells.builder");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const {
    headerType = "NONE",
    headerText = "",
    headerUrl = "",
    bodyText = "",
    footerText = "",
    menuLabel = "",
    sections = [{ title: "", rows: [] }]
  } = value || {};
  const totalRows = sections.reduce((acc, s) => acc + (s.rows?.length || 0), 0);

  const handleUpdate = (updates) => {
    onChange({ ...value, ...updates });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setHeaderMediaFile?.(file);
      const url = URL.createObjectURL(file);
      handleUpdate({ headerUrl: url });
    }
    e.target.value = "";
  };

  const handleAddSection = () => {
    if (sections.length >= config.maxSections) return;
    const next = [...sections, { title: "", rows: [] }];
    handleUpdate({ sections: next });
  };

  const handleRemoveSection = (sIdx) => {
    if (sections.length <= 1) return;
    const next = [...sections];
    next.splice(sIdx, 1);
    handleUpdate({ sections: next });
  };

  const handleAddRow = (sIdx) => {
    if (totalRows >= config.maxRows) return;
    const next = [...sections];
    const rowId = `row_${Math.random().toString(36).substr(2, 9)}`;
    next[sIdx].rows = [...(next[sIdx].rows || []), { id: rowId, title: "", description: "" }];
    handleUpdate({ sections: next });
  };

  const handleRemoveRow = (sIdx, rIdx) => {
    const next = [...sections];
    next[sIdx].rows.splice(rIdx, 1);
    handleUpdate({ sections: next });
  };

  const handleRowChange = (sIdx, rIdx, field, val) => {
    const next = [...sections];
    next[sIdx].rows[rIdx] = { ...next[sIdx].rows[rIdx], [field]: val };
    handleUpdate({ sections: next });
  };

  const handleSectionTitleChange = (sIdx, val) => {
    const next = [...sections];
    next[sIdx].title = val;
    handleUpdate({ sections: next });
  };

  const handleDragEnd = (event, sIdx) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const next = [...sections];
      const oldIndex = next[sIdx].rows.findIndex(r => r.id === active.id);
      const newIndex = next[sIdx].rows.findIndex(r => r.id === over.id);
      next[sIdx].rows = arrayMove(next[sIdx].rows, oldIndex, newIndex);
      handleUpdate({ sections: next });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Settings */}
      <div className="space-y-4">
        <Label className="text-base font-bold flex items-center gap-2">
          {t("header")}
          <span className="text-slate-400 text-sm font-normal">({t("optional")})</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {config.headerTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setHeaderMediaFile?.(null);
                handleUpdate({ headerType: type, headerText: "", headerUrl: "" });
              }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                headerType === type
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                  : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              {t(`headerTypes.${type}`)}
            </button>
          ))}
        </div>

        {headerType === "TEXT" && (
          <div className="pt-2 space-y-2">
            <Input
              placeholder={t("headerPlaceholder")}
              maxLength={60}
              value={headerText}
              onChange={(e) => handleUpdate({ headerText: e.target.value })}
            />
          </div>
        )}

        {["IMAGE", "VIDEO", "DOCUMENT"].includes(headerType) && (
          <div className="space-y-2">
            <MediaUpload
              type={headerType}
              url={headerUrl}
              onUrlChange={(url) => handleUpdate({ headerUrl: url })}
              onFileChange={(file) => handleFileChange(file)}
            />
          </div>
        )}
      </div>

      {/* Body Settings */}
      <WhatsAppMessageBodyBuilder
        value={bodyText}
        onChange={(val) => handleUpdate({ bodyText: val })}
        label={t("body")}
        placeholder={t("bodyPlaceholder")}
        allowVariables={config.allowVariables}
      />

      {/* Footer Settings */}
      <div className="space-y-3">
        <Label className="text-base font-bold">{t("footer")} <span className="text-slate-400 text-sm font-normal">({t("optional")})</span></Label>
        <Input
          placeholder={t("footerPlaceholder")}
          maxLength={60}
          value={footerText}
          onChange={(e) => handleUpdate({ footerText: e.target.value })}
        />
      </div>

      <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />

      {/* List Config */}
      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="text-base font-bold">{tc("menuLabel")}</Label>
          <Input
            placeholder={t("menuLabelPlaceholder")}
            maxLength={200}
            value={menuLabel}
            onChange={(e) => handleUpdate({ menuLabel: e.target.value })}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-base font-bold">{tc("listSections")} <span className="text-red-500">*</span></Label>
            <div className="flex items-center gap-4">
              <span className={cn(
                "text-xs font-bold px-2 py-1 rounded-full",
                totalRows >= config.maxRows ? "bg-red-50 text-red-500" : "bg-primary/5 text-primary"
              )}>
                {totalRows} / {config.maxRows} Rows
              </span>
              {sections.length < config.maxSections && (
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="text-xs font-bold flex items-center gap-1 text-primary hover:text-primary/80"
                >
                  <Plus size={14} />
                  Add Section
                </button>
              )}
            </div>
          </div>

          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-white/5 relative group/section">
              {sections.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSection(sIdx)}
                  className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-all opacity-0 group-hover/section:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {tc("sectionTitle")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder={t("sectionTitlePlaceholder")}
                  maxLength={24}
                  value={section.title}
                  onChange={(e) => handleSectionTitleChange(sIdx, e.target.value)}
                  className="h-9 bg-white dark:bg-slate-950"
                  required
                />
              </div>

              <div className="space-y-3">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleDragEnd(e, sIdx)}
                >
                  <SortableContext
                    items={section.rows?.map(r => r.id) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {section.rows?.map((row, rIdx) => (
                        <SortableRow
                          key={row.id}
                          id={row.id}
                          sIdx={sIdx}
                          rIdx={rIdx}
                          row={row}
                          tc={tc}
                          handleRowChange={handleRowChange}
                          handleRemoveRow={handleRemoveRow}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {totalRows < config.maxRows && (
                  <button
                    type="button"
                    onClick={() => handleAddRow(sIdx)}
                    className="w-full py-2.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-400 hover:border-primary hover:text-primary hover:bg-white dark:hover:bg-slate-950 transition-all flex items-center justify-center gap-2 text-xs font-bold"
                  >
                    <PlusCircle size={14} />
                    {tc("addRow")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
