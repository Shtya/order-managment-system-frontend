"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronDown, ScanLine, Truck, XCircle } from "lucide-react";
import { cn } from "@/utils/cn";

const CARRIER_META = {
  ARAMEX: "bg-red-50 text-red-700 border-red-200",
  SMSA: "bg-blue-50 text-blue-700 border-blue-200",
  DHL: "bg-yellow-50 text-yellow-700 border-yellow-200",
  BOSTA: "bg-orange-50 text-orange-700 border-orange-200",
};

function CarrierSelect({ carriers, ordersForCarrier, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const getCount = (carrier) => (ordersForCarrier || []).filter((order) => order.carrier === carrier).length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition-colors",
          value ? CARRIER_META[value] || "bg-muted text-foreground border-border" : "border-border bg-background text-muted-foreground",
          open && "ring-2 ring-primary/15"
        )}
      >
        <Truck size={14} />
        <span>{value || "شركة الشحن"}</span>
        {value ? (
          <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-black text-foreground/70">
            {getCount(value)}
          </span>
        ) : null}
        <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute start-0 top-[calc(100%+8px)] z-30 min-w-[220px] rounded-2xl border border-border bg-popover p-2 shadow-xl"
          >
            {carriers.map((carrier) => {
              const count = getCount(carrier);
              const selected = carrier === value;

              return (
                <button
                  key={carrier}
                  type="button"
                  onClick={() => {
                    onChange(carrier);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                    selected ? "bg-primary/8 text-primary" : "text-foreground hover:bg-muted"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Truck size={13} />
                    {carrier}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-black text-muted-foreground">
                    {count}
                  </span>
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function ScanBar({
  carriers = [],
  ordersForCarrier = [],
  showCarrier = true,
  selectedCarrier,
  onCarrierChange,
  scanInput,
  onScanChange,
  onScan,
  lastScanMsg,
  scanRef,
  className,
  label,
  placeholder,
  disabled = false,
}) {
  const isSuccess = lastScanMsg?.success === true;
  const isError = lastScanMsg?.success === false;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        <ScanLine size={14} className="text-primary" />
        <span>{label || "مسح الباركود"}</span>
      </div>

      <div
        className={cn(
          "flex min-h-[56px] items-center gap-2 rounded-2xl border bg-background px-2 py-2 transition-all",
          disabled ? "opacity-60" : "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10",
          isSuccess && "border-emerald-300 bg-emerald-50/40",
          isError && "border-red-300 bg-red-50/40"
        )}
      >
        {showCarrier ? (
          <CarrierSelect
            carriers={carriers}
            ordersForCarrier={ordersForCarrier}
            value={selectedCarrier}
            onChange={onCarrierChange}
          />
        ) : null}

        {showCarrier ? <div className="h-8 w-px bg-border" /> : null}

        <div className="flex flex-1 items-center gap-2 rounded-xl px-2">
          <ScanLine size={16} className={cn(isSuccess ? "text-emerald-600" : isError ? "text-red-600" : "text-muted-foreground")} />
          <input
            ref={scanRef}
            value={scanInput}
            onChange={(event) => onScanChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onScan();
            }}
            disabled={disabled}
            placeholder={placeholder || "امسح الباركود أو أدخل الكود"}
            className="h-10 flex-1 border-0 bg-transparent px-1 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
        </div>

        <motion.button
          type="button"
          whileHover={!disabled ? { scale: 1.02 } : undefined}
          whileTap={!disabled ? { scale: 0.98 } : undefined}
          onClick={onScan}
          disabled={disabled}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ScanLine size={13} />
          <span>مسح</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {lastScanMsg ? (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className={cn(
              "overflow-hidden rounded-xl border px-3 py-2 text-xs font-semibold",
              isSuccess ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
            )}
          >
            <span className="flex items-center gap-2">
              {isSuccess ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
              {lastScanMsg.message}
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
