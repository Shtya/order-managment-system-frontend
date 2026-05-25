"use client";

import React, { useState, useMemo } from "react";
import {
  Image as ImageIcon,
  Video,
  MapPin,
  File as FileIcon,
  Reply,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useLocale } from "next-intl";
import { avatarSrc } from "@/components/atoms/UserSelect";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";

export default function InteractiveMessagePreview({ 
  headerType = "IMAGE",
  headerUrl = "",
  headerText = "",
  bodyText = "",
  footerText = "",
  buttons = [],
  language = "ar",
  upsellPrice = 0,
  productName = ""
}) {
  const locale = useLocale();
  const { formatCurrency } = usePlatformSettings();
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const renderHeader = () => {
    const mediaClass = "aspect-video w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-t-lg overflow-hidden border-b border-slate-100 dark:border-slate-800";

    switch (headerType) {
      case "IMAGE":
        return (
          <div className={mediaClass}>
            {headerUrl ? (
              <img src={avatarSrc(headerUrl)} alt="Header" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon size={48} className="text-slate-300" />
            )}
          </div>
        );
      case "VIDEO":
        return (
          <div className={mediaClass}>
            {headerUrl ? (
              <video src={avatarSrc(headerUrl)} className="w-full h-full object-cover" />
            ) : (
              <Video size={48} className="text-slate-300" />
            )}
          </div>
        );
      case "DOCUMENT":
        return (
          <div className={mediaClass}>
            <div className="flex flex-col items-center gap-2">
              <FileIcon size={40} className="text-slate-300" />
              {headerUrl && <span className="text-[10px] text-slate-400 px-2 truncate max-w-full">{headerUrl.split('/').pop()}</span>}
            </div>
          </div>
        );
      case "TEXT":
        if (!headerText) return null;
        return (
          <div className="p-3 pb-2 font-bold text-[#111b21] dark:text-white leading-tight break-all border-b border-slate-100 dark:border-slate-800">
            {headerText}
          </div>
        );
      default:
        return null;
    }
  };

  const processedBody = useMemo(() => {
    let text = bodyText || "";
    // Basic formatting like TemplatePreview
    return text.split("\n").map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < text.split("\n").length - 1 && <br />}
      </React.Fragment>
    ));
  }, [bodyText]);

  return (
    <div className="w-full max-w-[320px] mx-auto overflow-hidden flex flex-col" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* WhatsApp Chat Background */}
      <div
        className="relative flex-1 p-4 min-h-[400px]"
        style={{
          backgroundColor: "#efeae2",
          backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
          backgroundSize: "400px",
          backgroundRepeat: "repeat"
        }}
      >
        <div className={cn(
          "relative group tempalte-message max-w-[90%]",
          locale === "ar" && "tempalte-message-ar"
        )}>
          {/* Bubble Container */}
          <div className={cn(
            "bg-white dark:bg-[#1f2c33] rounded-lg shadow-sm relative overflow-hidden",
            language === "ar" ? "rounded-tr-none" : "rounded-tl-none"
          )}
            style={{
              fontFamily: 'Segoe UI Historic, Segoe UI, Helvetica, Arial, sans-serif'
            }}>

            {/* Header Section */}
            {renderHeader()}

            {/* Content Section */}
            <div className="p-3">
              {/* Body Section */}
              <div className="text-[13.5px] leading-[1.4] break-words whitespace-pre-wrap text-[#111b21] dark:text-[#d1d7db]">
                {processedBody}
              </div>

              {footerText && (
                <div className="text-[11.5px] font-light text-[#00000073] dark:text-[#8696a0] mt-2.5 leading-tight">
                  {footerText}
                </div>
              )}

              {/* Time Stamp */}
              <div className="flex justify-end mt-1 -mb-0.5 font-light">
                <span className="text-[10px] text-[#00000073] dark:text-[#8696a0]">
                  {currentTime}
                </span>
              </div>
            </div>

            {/* Buttons Section */}
            {buttons.length > 0 && (
              <div className="border-t border-slate-100 dark:border-slate-800 overflow-hidden">
                {buttons.map((btn, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "py-2.5 px-3 flex items-center justify-center gap-2 text-[#00a884] dark:text-[#00a884] font-medium text-[13px] hover:bg-slate-50 dark:hover:bg-white/5 cursor-default transition-colors",
                      idx > 0 && "border-t border-slate-100 dark:border-slate-800"
                    )}
                  >
                    <Reply size={14} className={cn(language === "ar" ? "scale-x-[-1]" : "")} />
                    {btn.text || "زر رد سريع..."}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
