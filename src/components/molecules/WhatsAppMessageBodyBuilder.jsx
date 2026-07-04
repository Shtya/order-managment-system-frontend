"use client";

import React, { useRef } from "react";
import { Smile, Bold, Italic, Strikethrough, Code, PlusCircle, Info, Phone, User, Mail, Hash, PackageSearch, Truck, BadgeDollarSign, DollarSign, Package, CalendarDays, Building2, MapPin, MapPinned, Store, Clock3 } from "lucide-react";
import { cn } from "@/utils/cn";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useTranslations } from "next-intl";
import { VariableInput } from "../ui/VariableInput";

export default function WhatsAppMessageBodyBuilder({
  ref,
  value = "",
  language,
  onChange,
  label,
  placeholder,
  maxLength = 1024,
  allowVariables = false,
  onInsertVariable,
  error,
  className,
  variableProps = {}
}) {
  const t = useTranslations("whatsApp.templates.form");
  const textareaRef = useRef(null);
  const dir = !!language ? language === "ar" ? "rtl" : "ltr" : undefined;
  const displayLabel = label || t("body");
  const displayPlaceholder = placeholder || t("bodyPlaceholder");

  const insertText = (type) => {

    if (!textareaRef.current) return;

    let wrapped = "";
    switch (type) {
      case "bold": textareaRef.current.wrapSelection("*"); break;
      case "italic": textareaRef.current.wrapSelection("_"); break;
      case "strike": textareaRef.current.wrapSelection("~"); break;
      case "mono": textareaRef.current.wrapSelection("```"); break;
      case "variable":
        if (onInsertVariable) {
          const variable = onInsertVariable(value);
          textareaRef.current?.insertRaw(variable);
          return;
        }
        wrapped = "{{1}}";
        textareaRef.current?.insertRaw(wrapped);
        break;
      default:
    }

    textareaRef.current.focus();
  };

  const addEmoji = (emoji) => {
    textareaRef.current?.insertRaw(emoji.native);
  };
  
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex justify-between items-center">
        <Label className="text-base font-bold">{displayLabel} <span className="text-red-500">*</span></Label>
        <div className="flex items-center gap-3">
          {allowVariables && <span className="text-xs text-slate-400">{t("addVariable")} like {'{{1}}'}</span>}
          <span className={cn(
            "text-xs font-mono px-2 py-0.5 rounded-full",
            value.length > maxLength * 0.9 ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-500"
          )}>
            {value.length} / {maxLength}
          </span>
        </div>
      </div>
      <VariableInput
        value={value}
        multiline={true}
        dir={dir}
        rows={6}
        maxLength={maxLength}
        placeholder={displayPlaceholder}
        onChange={(value) => onChange(value)}
        ref={(el) => {
          if (textareaRef) textareaRef.current = el;
          if (ref) ref.current = el;
        }}
        disableHydrate={true}
        {...variableProps}
      />

      <div className="flex items-center justify-between px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm">
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-600 transition-colors">
                <Smile size={18} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-none shadow-xl" side="top" align="start">
              <Picker data={data} onEmojiSelect={addEmoji} />
            </PopoverContent>
          </Popover>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

          <button type="button" onClick={() => insertText("bold")} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-600"><Bold size={16} /></button>
          <button type="button" onClick={() => insertText("italic")} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-600"><Italic size={16} /></button>
          <button type="button" onClick={() => insertText("strike")} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-600"><Strikethrough size={16} /></button>
          <button type="button" onClick={() => insertText("mono")} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-600"><Code size={16} /></button>

          {allowVariables && (
            <>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
              <button
                type="button"
                onClick={() => insertText("variable")}
                className="flex items-center gap-1.5 px-2 py-1 hover:bg-primary/10 text-primary rounded-md transition-colors text-xs font-bold"
              >
                <PlusCircle size={16} />
                {t("addVariable")}
              </button>
            </>
          )}
        </div>
        <div className="text-slate-400"><Info size={14} /></div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
