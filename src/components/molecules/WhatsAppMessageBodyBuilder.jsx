"use client";

import React, { useRef } from "react";
import { Smile, Bold, Italic, Strikethrough, Code, PlusCircle, Info } from "lucide-react";
import { cn } from "@/utils/cn";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

export default function WhatsAppMessageBodyBuilder({
  ref,
  value = "",
  onChange,
  label = "Body",
  placeholder = "Enter message body...",
  maxLength = 1024,
  allowVariables = false,
  onInsertVariable,
  error,
  className,
}) {
  const textareaRef = useRef(null);

  const insertText = (type) => {

    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = textareaRef.current.value;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const selection = text.substring(start, end);

    let wrapped = "";
    switch (type) {
      case "bold": wrapped = `*${selection}*`; break;
      case "italic": wrapped = `_${selection}_`; break;
      case "strike": wrapped = `~${selection}~`; break;
      case "mono": wrapped = `\`\`\`${selection}\`\`\``; break;
      case "variable":

        if (onInsertVariable) {
          onInsertVariable();
          return;
        }
        wrapped = "{{1}}";
        break;
      default: return;
    }

    const nextValue = before + wrapped + after;

    onChange(nextValue);

    // Reset focus and selection
    setTimeout(() => {
      textareaRef.current.focus();
      const newPos = start + wrapped.length;
      textareaRef.current.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const addEmoji = (emoji) => {
    const start = textareaRef.current?.selectionStart || value.length;
    const nextValue = value.slice(0, start) + emoji.native + value.slice(start);
    onChange(nextValue);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex justify-between items-center">
        <Label className="text-base font-bold">{label} <span className="text-red-500">*</span></Label>
        <div className="flex items-center gap-3">
          {allowVariables && <span className="text-xs text-slate-400">Add variables like {'{{1}}'}</span>}
          <span className={cn(
            "text-xs font-mono px-2 py-0.5 rounded-full",
            value.length > maxLength * 0.9 ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-500"
          )}>
            {value.length} / {maxLength}
          </span>
        </div>
      </div>

      <Textarea
        ref={(el) => {
          if (textareaRef) textareaRef.current = el;
          if (ref) ref.current = el;
        }}
        placeholder={placeholder}
        className={cn(
          "min-h-[140px] resize-y bg-white dark:bg-slate-950 border-slate-200 focus:ring-primary/20",
          error && "border-red-500 focus:ring-red-500"
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
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
                Add Variable
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
