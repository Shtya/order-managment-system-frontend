"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Settings, Truck, ShieldCheck, Boxes, Leaf, Users } from "lucide-react";

const ease = [0.22, 1, 0.36, 1];

/* Card icon tinted backgrounds (order matches the preview); icons all use the primary color */
const CARD_ICONS = [
  { Icon: Settings, color: "#6f8fca", bg: "#f5f7fc", border: "#e7ebf4" },
  { Icon: Truck, color: "#c49362", bg: "#fcf8f3", border: "#f1e7da" },
  { Icon: ShieldCheck, color: "#8978c4", bg: "#f7f5fc", border: "#ebe7f5" },
  { Icon: Boxes, color: "#c78398", bg: "#fcf6f8", border: "#f2e5e9" },
  { Icon: Leaf, color: "#70a88d", bg: "#f4f9f6", border: "#e4eee8" },
  { Icon: Users, color: "#8978c4", bg: "#f7f5fc", border: "#ebe7f5" },
];

function PainCard({ item, index, inView }) {
  const { Icon, bg, border,   color } = CARD_ICONS[index % CARD_ICONS.length];

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.5, delay: 0.05 + index * 0.06, ease }}
      className="group rounded-[18px] bg-[rgba(255,255,255,0.95)] border border-primary/30 p-[30px] min-h-[275px] max-[650px]:min-h-auto shadow-[0_8px_30px_rgba(40,30,90,0.04)] hover:border-[#dcd2fa] hover:shadow-[0_18px_45px_rgba(40,30,90,0.09)] transition-[box-shadow,border-color] duration-300"
    >
      {/* top: title + icon */}
      <div className="flex items-center justify-between gap-5 mb-6">
        <h3 className="text-[21px] font-extrabold text-[#172033] leading-snug">
          {item.tag}
        </h3>
        <div
          className="flex items-center justify-center rounded-[15px] w-[62px] h-[62px] min-w-[62px] border shrink-0"
          style={{ background: bg, borderColor: border }}
        >
          <Icon size={27} strokeWidth={2} className="" style={{color}} />
        </div>
      </div>

      {/* description (pain) */}
      <p className="text-[#697387] text-[15px] leading-[1.95] mb-[25px]">
        {item.pain}
      </p>

      <div className="h-px bg-[#eeeeF5] mb-5" />

      {/* benefit (solution) */}
      <div className="flex items-start gap-3 text-[#596276] text-sm leading-[1.9]">
        <span
          className="w-5 h-5 min-w-[20px] rounded-full flex items-center justify-center text-xs font-extrabold mt-[3px] shrink-0"
          style={{ background: "#f1eaff", color: "#7047df" }}
        >
          ✓
        </span>
        <span>{item.solution}</span>
      </div>
    </motion.article>
  );
}

export default function PainPointsSection() {
  const t = useTranslations("painPointsSection");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const router = useRouter();

  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const cards = t.raw("cards");

  return (
    <section
      ref={ref}
      dir={isRtl ? "rtl" : "ltr"}
      className="px-4 md:px-6 py-[70px] md:py-[100px]"
      style={{
        background:
          "radial-gradient(circle at 50% 0%, rgba(111, 70, 220, 0.07), transparent 40%), #fbfaff",
      }}
    >
      <div className="max-w-[1360px] mx-auto">
        {/* cards grid */}
        <div className="grid grid-cols-1 min-[650px]:grid-cols-2 min-[1000px]:grid-cols-3 gap-5">
          {cards.map((card, i) => (
            <PainCard key={i} item={card} index={i} inView={inView} />
          ))}
        </div>

      </div>
    </section>
  );
}
