"use client";

import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Download,
  TrendingUp,
  MapPin,
  Package,
  CheckCircle,
  XCircle,
  Truck,
  RefreshCw,
  BarChart3,
  Calendar,
  Store,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  PieChart as PieIcon,
  Search,
  Filter,
  PieChart,
  Info,
  FileDown,
  Printer,
} from "lucide-react";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import api from "@/utils/api";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip as ChTooltip,
  Legend,
  Filler,
  BarElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image as PdfImage,
  pdf,
  Svg, // <-- Add this
  Path // <-- Add this
} from "@react-pdf/renderer";
import PageHeader from "@/components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";
import { useTranslations, useLocale } from "next-intl";
import { avatarSrc } from "@/components/atoms/UserSelect";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import StoreFilter from "@/components/atoms/StoreFilter";
import { useTrendLabelFormatter } from "@/hook/useTrendLabelFormatter";
import MultiSelect from "@/components/atoms/MultiSelect";
import ShippingCompanyFilter from "@/components/atoms/ShippingCompanyFilter";
import UserSelect from "@/components/atoms/UserSelect";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { useAuth } from "@/context/AuthContext";
import QRCode from "react-qr-code";
import { TutorialSpotlight } from "@/components/atoms/TutorialSpotlight";
const PDFArrowUp = ({ color = "#059669" }) => (
  <Svg viewBox="0 0 24 24" width={10} height={10}>
    <Path d="M12 4l-8 8h6v8h4v-8h6z" fill={color} />
  </Svg>
);

const PDFArrowDown = ({ color = "#dc2626" }) => (
  <Svg viewBox="0 0 24 24" width={10} height={10}>
    <Path d="M12 20l8-8h-6V4h-4v8H4z" fill={color} />
  </Svg>
);
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  ChTooltip,
  Legend,
  Filler,
  BarElement,
  Title,
  Tooltip,
);


// PDF Styles
const pdfStyles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: "#ffffff",
    fontFamily: "Cairo",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: "2px solid #e5e7eb",
  },
  headerTitle: {
    fontSize: 24,
    color: "#1f2937",
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  headerLogo: {
    width: 80,
    height: 40,
    objectFit: "contain",
  },
  headerQR: {
    width: 50,
    height: 50,
    backgroundColor: "#fff",
  },
  subHeader: {
    // flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingBottom: 15,
    borderBottom: "1px solid #e5e7eb",
  },
  subHeaderItem: {
    flexDirection: "column",
  },
  subHeaderLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 2,
  },
  subHeaderValue: {
    fontSize: 12,
    color: "#1f2937",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 15,
    marginTop: 30,
    paddingBottom: 8,
    borderBottom: "1px solid #e5e7eb",
  },
  statsGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    marginBottom: 30,
  },
  statBox: {
    // Subtract half of the total gap space per row to keep things perfectly centered
    width: "48%",
    padding: 10,
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  statTitle: {
    fontSize: 13,
    color: "#4b5563",
    marginBottom: 2,
    fontWeight: "bold",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  statTrend: {
    fontSize: 12,
    color: "#6b7280",
  },
  statTrendUp: {
    color: "#059669",
  },
  statTrendDown: {
    color: "#dc2626",
  },
  chartContainer: {
    marginBottom: 30,
    textAlign: "center",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 20,
  },
  chartImage: {
    maxWidth: "100%",
    maxHeight: 400,
  },
  tableContainer: {
    width: "100%",
    marginBottom: 20,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 11,
  },
  tableHeader: {
    backgroundColor: "#f3f4f6",
    fontWeight: "bold",
    color: "#374151",
  },
  tableCell: {
    flex: 1,
    padding: 6,
    border: "1px solid #e5e7eb"
    // textAlign: "left",
  },
  pctGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    marginBottom: 30,
  },
  pctChartBox: {
    width: "45%",
    textAlign: "center",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 15,
    backgroundColor: "#fff",
  },
  pctChartImage: {
    width: "100%",
    maxWidth: 350,
  },
});

// PDF Document Component
const OrderAnalysisPDF = ({
  t,
  tOrders,
  locale,
  statsData,
  weeklyTrend,
  weeklyTrendChartUrl,
  statusDonutChartUrl,
  topCitiesStats,
  topProductsStats,
  percentageChartUrls,
  advancedStats,
  user,
  exportDate,
  websiteUrl,
  qrCodeUrl,
}) => {

  const isArabic = locale === "ar";
  const currentFontFamily = "Cairo"

  return (<Document>
    <Page size="A4" style={[
      pdfStyles.page,
      {
        fontFamily: currentFontFamily,
        direction: isArabic ? "rtl" : "ltr", // Reverses Flexbox layouts (like tables)
        textAlign: isArabic ? "right" : "left" // Forces text to the correct side
      }
    ]}>
      {/* Header */}
      <View style={pdfStyles.header}>
        {/* QR Code */}
        {qrCodeUrl && <PdfImage src={qrCodeUrl} style={pdfStyles.headerQR} />}

        {/* Title */}
        <Text style={pdfStyles.headerTitle}>{t("breadcrumb.orderAnalysis")}</Text>

        {/* Logo */}
        <PdfImage src="/logo.png" style={pdfStyles.headerLogo} />
      </View>

      {/* Subheader */}
      <View style={[
        pdfStyles.subHeader,
        { flexDirection: isArabic ? "row" : "row-reverse" },
      ]}>
        <View
          style={[
            pdfStyles.subHeaderItem,
            {
              alignItems: isArabic ? "flex-end" : "flex-start",
            },
          ]}
        >
          <Text style={pdfStyles.subHeaderLabel}>{t("report.userName")}</Text>
          <Text style={pdfStyles.subHeaderValue}>{user?.name || user?.email || ""}</Text>
        </View>
        <View
          style={[
            pdfStyles.subHeaderItem,
            {
              alignItems: isArabic ? "flex-end" : "flex-start",
            },
          ]}
        >
          <Text style={pdfStyles.subHeaderLabel}>{t("report.exportDate")}</Text>
          <Text style={pdfStyles.subHeaderValue}>{exportDate}</Text>
        </View>
      </View>

      {/* Stats Grid */}
      {statsData && statsData.length > 0 && (
        <View >
          <Text style={pdfStyles.sectionTitle}>
            {t("kpi.statistics")}
          </Text>
          <View style={pdfStyles.statsGrid}>
            {statsData.map((stat, index) => (
              <View key={index} style={pdfStyles.statBox}  wrap={false}>
                <Text style={pdfStyles.statTitle}>{stat.name}</Text>
                <Text style={pdfStyles.statValue}>{stat.value}</Text>
                {stat.trend.showArrow && (
                  <View
                    style={{
                      flexDirection: isArabic ? "row-reverse" : "row",
                      alignItems: "center",
                      gap: 4, // Adds spacing between the elements
                      marginTop: 4
                    }}
                  >
                    {/* 1. The Arrow (Using standard Cairo to ensure it renders) */}
                    {stat.trend.isUp ? (
                      <PDFArrowUp color="#059669" /> // Green for up
                    ) : (
                      <PDFArrowDown color="#dc2626" /> // Red for down
                    )}

                    {/* 2. The Value (Forced LTR so the % sign stays on the correct side) */}
                    <Text
                      style={[
                        stat.trend.isUp ? pdfStyles.statTrendUp : pdfStyles.statTrendDown,
                        { fontSize: 12, direction: "ltr" }
                      ]}
                    >
                      {stat.trend.value}
                    </Text>

                    {/* 3. The Label (Arabic/English Text) */}
                    <Text style={{ fontSize: 12, color: "#6b7280" }}>
                      {stat.trend.label}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Weekly Trend Chart */}
      {weeklyTrendChartUrl && (
        <View style={pdfStyles.chartContainer}  wrap={false}>
          <Text style={pdfStyles.chartTitle}>{t("charts.ordersPercent")}</Text>
          <PdfImage src={weeklyTrendChartUrl} style={pdfStyles.chartImage} />
        </View>
      )}

      {/* Status Donut Chart */}
      {statusDonutChartUrl && (
        <View style={pdfStyles.chartContainer}  wrap={false}>
          <Text style={pdfStyles.chartTitle}>{t("charts.perStatus")}</Text>
          <PdfImage src={statusDonutChartUrl} style={pdfStyles.chartImage} />
        </View>
      )}

      {/* Top Cities Table */}
      {topCitiesStats && topCitiesStats.length > 0 && (
        <View>
          <Text style={pdfStyles.sectionTitle}>{t("areas.title")}</Text>
          <View style={pdfStyles.tableContainer}>
            <View style={pdfStyles.table}>
              {/* Table Header */}
              <View style={[{ flexDirection: isArabic ? "row-reverse" : "row" }, pdfStyles.tableHeader]}>
                <Text style={[pdfStyles.tableCell, locale === "ar" && { textAlign: isArabic ? "right" : "left" }]}>
                  {t("areas.columns.cityArea")}
                </Text>
                <Text style={[pdfStyles.tableCell, locale === "ar" && { textAlign: isArabic ? "right" : "left" }]}>
                  {t("areas.columns.totalOrders")}
                </Text>
                <Text style={[pdfStyles.tableCell, locale === "ar" && { textAlign: isArabic ? "right" : "left" }]}>
                  {t("kpi.correctedOrders")}
                </Text>
                <Text style={[pdfStyles.tableCell, locale === "ar" && { textAlign: isArabic ? "right" : "left" }]}>
                  {t("areas.columns.confirmed")}
                </Text>
                <Text style={[pdfStyles.tableCell, locale === "ar" && { textAlign: isArabic ? "right" : "left" }]}>
                  {t("areas.columns.inDelivery")}
                </Text>
                <Text style={[pdfStyles.tableCell, locale === "ar" && { textAlign: isArabic ? "right" : "left" }]}>
                  {t("areas.columns.delivered")}
                </Text>
                <Text style={[pdfStyles.tableCell, locale === "ar" && { textAlign: isArabic ? "right" : "left" }]}>
                  {t("kpi.deliveredFromConfirmed")}
                </Text>
              </View>

              {/* Table Rows */}
              {topCitiesStats.map((row, index) => (
                <View key={index} style={[{ flexDirection: isArabic ? "row-reverse" : "row" }]}>
                  <Text style={[pdfStyles.tableCell, locale === "ar" && { textAlign: isArabic ? "right" : "left" }]}>
                    {locale === "ar" ? row.nameAr : row.nameEn}
                  </Text>
                  <Text style={[pdfStyles.tableCell, locale === "ar" && { textAlign: isArabic ? "right" : "left" }]}>
                    {row.totalOrders}
                  </Text>
                  <View style={[pdfStyles.tableCell, { flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center" }]}>
                    <Text>{row.correctedOrders}</Text>
                    {row.totalOrders > 0 && (
                      <Text style={{
                        fontSize: 9,
                        color: "#6b7280",
                        marginLeft: isArabic ? 0 : 2,
                        marginRight: isArabic ? 2 : 0
                      }}>
                        ({((row.correctedOrders / row.totalOrders) * 100).toFixed(0)}%)
                      </Text>
                    )}
                  </View>
                  <View style={[pdfStyles.tableCell, { flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center" }]}>
                    <Text>{row.confirmedCount}</Text>
                    {row.totalOrders > 0 && (
                      <Text style={{
                        fontSize: 9,
                        color: "#6b7280",
                        marginLeft: isArabic ? 0 : 2,
                        marginRight: isArabic ? 2 : 0
                      }}>
                        ({((row.confirmedCount / row.totalOrders) * 100).toFixed(0)}%)
                      </Text>
                    )}
                  </View>
                  <View style={[pdfStyles.tableCell, { flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center" }]}>
                    <Text>{row.shippedOrders}</Text>
                    {row.totalOrders > 0 && (
                      <Text style={{
                        fontSize: 9,
                        color: "#6b7280",
                        marginLeft: isArabic ? 0 : 2,
                        marginRight: isArabic ? 2 : 0
                      }}>
                        ({((row.shippedOrders / row.totalOrders) * 100).toFixed(0)}%)
                      </Text>
                    )}
                  </View>
                  <View style={[pdfStyles.tableCell, { flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center" }]}>
                    <Text>{row.deliveredTotal}</Text>
                    {row.totalOrders > 0 && (
                      <Text style={{
                        fontSize: 9,
                        color: "#6b7280",
                        marginLeft: isArabic ? 0 : 2,
                        marginRight: isArabic ? 2 : 0
                      }}>
                        ({((row.deliveredTotal / row.totalOrders) * 100).toFixed(0)}%)
                      </Text>
                    )}
                  </View>
                  <View style={[pdfStyles.tableCell, { flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center" }]}>
                    <Text>{row.deliveredFromConfirmed}</Text>
                    {row.confirmedCount > 0 && (
                      <Text style={{
                        fontSize: 9,
                        color: "#6b7280",
                        marginLeft: isArabic ? 0 : 2,
                        marginRight: isArabic ? 2 : 0
                      }}>
                        ({((row.deliveredFromConfirmed / row.confirmedCount) * 100).toFixed(0)}%)
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Top Products Table */}
      {topProductsStats && topProductsStats.length > 0 && (
        <View>
          <Text style={pdfStyles.sectionTitle}>{t("products.title")}</Text>
          <View style={pdfStyles.tableContainer}>
            <View style={pdfStyles.table}>
              {/* Table Header */}
              <View style={[{ flexDirection: isArabic ? "row-reverse" : "row" }, pdfStyles.tableHeader]}>
                <Text style={[pdfStyles.tableCell, locale === "ar" && { textAlign: isArabic ? "right" : "left" }]}>
                  {t("products.columns.name")}
                </Text>
                <Text style={[pdfStyles.tableCell, locale === "ar" && { textAlign: isArabic ? "right" : "left" }]}>
                  {t("products.columns.ordersCount")}
                </Text>
                <Text style={[pdfStyles.tableCell, locale === "ar" && { textAlign: isArabic ? "right" : "left" }]}>
                  {t("kpi.correctedOrders")}
                </Text>
                <Text style={[pdfStyles.tableCell, locale === "ar" && { textAlign: isArabic ? "right" : "left" }]}>
                  {t("products.columns.confirmedOrders")}
                </Text>
                <Text style={[pdfStyles.tableCell, locale === "ar" && { textAlign: isArabic ? "right" : "left" }]}>
                  {t("products.columns.inDelivery")}
                </Text>
                <Text style={[pdfStyles.tableCell, locale === "ar" && { textAlign: isArabic ? "right" : "left" }]}>
                  {t("products.columns.delivered")}
                </Text>
                <Text style={[pdfStyles.tableCell, locale === "ar" && { textAlign: isArabic ? "right" : "left" }]}>
                  {t("kpi.deliveredFromConfirmed")}
                </Text>
              </View>

              {/* Table Rows */}
              {topProductsStats.map((row, index) => (
                <View key={index} style={[{ flexDirection: isArabic ? "row-reverse" : "row" }]}  wrap={false}>
                  <Text style={[pdfStyles.tableCell, locale === "ar" && { textAlign: isArabic ? "right" : "left" }]}>
                    {row.name}
                  </Text>
                  <Text style={[pdfStyles.tableCell, locale === "ar" && { textAlign: isArabic ? "right" : "left" }]}>
                    {row.totalOrders}
                  </Text>
                  <View style={[pdfStyles.tableCell, { flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center" }]}>
                    <Text>{row.correctedOrders}</Text>
                    {row.totalOrders > 0 && (
                      <Text style={{
                        fontSize: 9,
                        color: "#6b7280",
                        marginLeft: isArabic ? 0 : 2,
                        marginRight: isArabic ? 2 : 0
                      }}>
                        ({((row.correctedOrders / row.totalOrders) * 100).toFixed(0)}%)
                      </Text>
                    )}
                  </View>
                  <View style={[pdfStyles.tableCell, { flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center" }]}>
                    <Text>{row.confirmedCount}</Text>
                    {row.totalOrders > 0 && (
                      <Text style={{
                        fontSize: 9,
                        color: "#6b7280",
                        marginLeft: isArabic ? 0 : 2,
                        marginRight: isArabic ? 2 : 0
                      }}>
                        ({((row.confirmedCount / row.totalOrders) * 100).toFixed(0)}%)
                      </Text>
                    )}
                  </View>
                  <View style={[pdfStyles.tableCell, { flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center" }]}>
                    <Text>{row.shippedOrders}</Text>
                    {row.totalOrders > 0 && (
                      <Text style={{
                        fontSize: 9,
                        color: "#6b7280",
                        marginLeft: isArabic ? 0 : 2,
                        marginRight: isArabic ? 2 : 0
                      }}>
                        ({((row.shippedOrders / row.totalOrders) * 100).toFixed(0)}%)
                      </Text>
                    )}
                  </View>
                  <View style={[pdfStyles.tableCell, { flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center" }]}>
                    <Text>{row.deliveredTotal}</Text>
                    {row.totalOrders > 0 && (
                      <Text style={{
                        fontSize: 9,
                        color: "#6b7280",
                        marginLeft: isArabic ? 0 : 2,
                        marginRight: isArabic ? 2 : 0
                      }}>
                        ({((row.deliveredTotal / row.totalOrders) * 100).toFixed(0)}%)
                      </Text>
                    )}
                  </View>
                  <View style={[pdfStyles.tableCell, { flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center" }]}>
                    <Text>{row.deliveredFromConfirmed}</Text>
                    {row.confirmedCount > 0 && (
                      <Text style={{
                        fontSize: 9,
                        color: "#6b7280",
                        marginLeft: isArabic ? 0 : 2,
                        marginRight: isArabic ? 2 : 0
                      }}>
                        ({((row.deliveredFromConfirmed / row.confirmedCount) * 100).toFixed(0)}%)
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Percentage Stats Grid */}
      {percentageChartUrls && percentageChartUrls.length > 0 && (
        <View>
          <View wrap={false} style={{ flexDirection: 'column' }}>
            <Text style={pdfStyles.sectionTitle} wrap={false}>{t("kpi.percentageStatistics")}</Text>
            <View style={[pdfStyles.pctGrid, { flexWrap: 'nowrap' }]}>
              {percentageChartUrls.slice(0, 2).map((chart, index) => (
                <View key={index} style={pdfStyles.pctChartBox} wrap={false}>
                  <Text style={pdfStyles.statTitle}>{chart.title}</Text>
                  <PdfImage src={chart.url} style={pdfStyles.pctChartImage} />
                </View>
              ))}
            </View>
          </View>
          {percentageChartUrls.length > 2 && (
            <View style={pdfStyles.pctGrid}>
              {percentageChartUrls.slice(2).map((chart, index) => (
                <View key={index + 2} style={pdfStyles.pctChartBox} wrap={false}>
                  <Text style={pdfStyles.statTitle}>{chart.title}</Text>
                  <PdfImage src={chart.url} style={pdfStyles.pctChartImage} />
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </Page>
  </Document>)
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const PRIMARY = "#6763AF";
export const SECONDARY = "#5750a0";
export const THIRD = "#7672B9";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export const fmt = (n) => (n == null ? "—" : Number(n));
export const pct = (n) => (n == null ? "—" : `${Number(n).toFixed(1)}%`);
export const hex = (h, a = 0.12) => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
  return r
    ? `rgba(${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)},${a})`
    : "transparent";
};

// ─────────────────────────────────────────────────────────────────────────────
// Card — elevated container with accent left-bar + icon
// ─────────────────────────────────────────────────────────────────────────────

export function Card({
  title,
  icon: Icon,
  color = PRIMARY,
  action,
  children,
  className,
}) {
  return (
    <div
      className={cn(
        "main-card",
        className,
      )}
    >

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: hex(color, 0.1),
              border: `1.5px solid ${hex(color, 0.25)}`,
            }}
          >
            <Icon size={15} style={{ color }} />
          </div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 tracking-tight">
            {title}
          </h3>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* Divider */}
      <div className="h-px mx-5 bg-gradient-to-r from-transparent via-slate-100 dark:via-slate-800 to-transparent" />

      {/* Body */}
      <div className="pt-5">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Export Button
// ─────────────────────────────────────────────────────────────────────────────
export function ExportBtn({ onClick, loading }) {
  const t = useTranslations("dashboard");

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      type="button"
      disabled={loading}
      className={cn(
        "btn btn-solid btn-sm",
        "disabled:opacity-50 disabled:cursor-not-allowed gap-1.5"
      )}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <FileDown size={14} />
      )}
      {t("common.export")}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RangeTabs — pill tabs with gradient active state
// ─────────────────────────────────────────────────────────────────────────────

export function RangeTabs({ value, onChange }) {
  const t = useTranslations("orderAnalysis");

  const QUICK_RANGES = [
    { key: "today", label: t("ranges.today") },
    { key: "yesterday", label: t("ranges.yesterday") },
    { key: "this_week", label: t("ranges.this_week") },
    { key: "last_week", label: t("ranges.last_week") },
    { key: "this_month", label: t("ranges.this_month") },
    { key: "last_month", label: t("ranges.last_month") },
    { key: "this_year", label: t("ranges.this_year") },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-5">
      {QUICK_RANGES.map((r) => {
        const isActive = value === r.key;
        return (
          <motion.button
            key={r.key}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(r.key)}
            className={cn(
              "relative px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-250 whitespace-nowrap overflow-hidden",
              isActive
                ? "text-white shadow-md"
                : "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:text-slate-700 dark:hover:text-slate-200",
            )}
            style={
              isActive
                ? {
                  background: `linear-gradient(135deg, rgb(var(--primary-from)), rgb(var(--primary-to)))`,
                  boxShadow: `0 4px 14px rgb(var(--primary-shadow))`,
                }
                : {}
            }
          >
            {isActive && (
              <motion.span
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
              />
            )}
            <span className="relative z-10">{r.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatusDonut — doughnut chart with custom image legend
// ─────────────────────────────────────────────────────────────────────────────

export function StatusDonut({
  data,
  loading,
  label,
  showLabels = true,
  config = {
    key: "count",
    imageKey: "image",
    label: "label",
    hasPercentage: false,
    centerValue: null,
    centerLabel: null,
  },
  allowImage = false,
}) {
  const t = useTranslations("dashboard");
  const displayLabel = label || t("common.orderLabel");
  const BRAND_COLORS = [PRIMARY, "#3b82f6", "#89D8F0", "#4682D4", "#FDD512"];
  const hasData = data && data.length > 0;
  const total = hasData
    ? data.reduce((s, d) => s + (Number(d[config.key]) ?? 0), 0)
    : 0;
  const centerValue = !!config.centerValue ? config.centerValue : total;
  const centerLabel = !!config.centerLabel ? config.centerLabel : t("common.totalLabel");

  if (loading)
    return (
      <div className="flex flex-col items-center gap-6 animate-pulse w-full">
        <div className="w-44 h-44 rounded-full border-[18px] border-slate-100 dark:border-slate-800" />
        <div className="w-full space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                <div className="h-2 w-1/3 bg-slate-50 dark:bg-slate-900 rounded-lg" />
              </div>
              <div className="h-4 w-10 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );

  if (!hasData || total === 0)
    return (
      <div className="flex flex-col items-center justify-center h-60 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
          <PieChart size={22} className="text-slate-400" />
        </div>
        <p className="text-xs font-semibold text-slate-400">
          {t("common.noData")}
        </p>
      </div>
    );

  const chartData = {
    labels: data.map((d) => d[config.label]),
    datasets: [
      {
        data: data.map((d) => d[config.key]),
        backgroundColor: data.map((d, i) =>
          hex(d.color || BRAND_COLORS[i % BRAND_COLORS.length], 0.88),
        ),
        borderColor: data.map(
          (d, i) => d.color || BRAND_COLORS[i % BRAND_COLORS.length],
        ),
        borderWidth: 2.5,
        hoverOffset: 14,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "76%",
    plugins: {
      legend: { display: false },
      tooltip: {
        rtl: true,
        backgroundColor: "#fff",
        titleColor: "#64748b",
        bodyColor: "#1e293b",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        callbacks: {
          label: (ctx) =>
            ` ${ctx.label}: ${ctx.raw} (${((ctx.raw / total) * 100).toFixed(1)}%)`,
        },
      },
    },
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Chart */}
      <div className="relative h-48 w-full">
        <Doughnut data={chartData} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">
            {centerValue}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">
            {centerLabel}
          </span>
        </div>
      </div>

      {/* Legend */}
      {showLabels && <div className="w-full space-y-1.5">
        {data.map((item, i) => {
          const color = item.color || BRAND_COLORS[i % BRAND_COLORS.length];
          const value = Number(item?.[config.key] ?? 0);

          const percentage = config.hasPercentage ? item.percentage : ((value / Number(total, 0)) * 100).toFixed(0);

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-default group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {allowImage && item[config.imageKey] ? (
                  <img
                    src={avatarSrc(item[config.imageKey])}
                    className="w-8 h-8 rounded-full object-cover border-2 shadow-sm shrink-0"
                    style={{ borderColor: hex(color, 0.4) }}
                    alt={item[config.label]}
                  />
                ) : (
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{
                      background: color,
                      boxShadow: `0 0 0 3px ${hex(color, 0.2)}`,
                    }}
                  />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[130px]">
                    {item[config.label]}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {item[config.key]} {displayLabel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Mini bar */}
                <div className="w-16 h-1 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden hidden sm:block">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${percentage}%`, background: color }}
                  />
                </div>
                <span
                  className="text-xs font-bold w-8 text-right"
                  style={{ color }}
                >
                  {percentage}%
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MiniDonut — small donut for single percentage
// ─────────────────────────────────────────────────────────────────────────────

export function MiniDonut({ value, total, label, color, loading, money = false, formatCurrencyFn, centerValue, centerLabel }) {
  const t = useTranslations("dashboard");
  const hasData = !loading && total !== undefined && total !== null;
  const percentage = hasData && total > 0 ? (value / total) * 100 : 0;
  const locale = useLocale();
  const isArabic = locale === "ar";
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 animate-pulse w-full">
        <div className="w-24 h-24 rounded-full border-[10px] border-slate-100 dark:border-slate-800" />
        <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded-lg" />
        <div className="h-2 w-16 bg-slate-50 dark:bg-slate-900 rounded-lg" />
      </div>
    );
  }

  const chartData = {
    labels: [label, t("common.remaining")],
    datasets: [{
      data: [value, total - value],
      backgroundColor: [hex(color, 0.9), hex("#e2e8f0", 0.5)],
      borderColor: [color, "#e2e8f0"],
      borderWidth: 2,
      hoverOffset: 6,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: { display: false },
      tooltip: {
        rtl: true,
        backgroundColor: "#fff",
        titleColor: "#64748b",
        bodyColor: "#1e293b",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 10,
      },
    },
  };

  const displayCenterValue = centerValue !== undefined ? centerValue : value;
  const displayCenterLabel = centerLabel !== undefined ? centerLabel : label;

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="relative h-24 w-24">
        <Doughnut data={chartData} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-lg font-black text-slate-800 dark:text-white leading-none">
            {displayCenterValue}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">
            {displayCenterLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TrendChart — line chart with improved styling
// ─────────────────────────────────────────────────────────────────────────────

export function TrendChart({ data, loading, configs = [] }) {
  const t = useTranslations("dashboard");
  const hasData = data && data.length > 0;

  if (loading)
    return (
      <div className="w-full h-64 flex flex-col justify-between animate-pulse px-2 py-4">
        <div className="flex-1 flex flex-col justify-between mb-6 gap-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-full h-px bg-slate-100 dark:bg-slate-800 rounded-full"
            />
          ))}
        </div>
        <div className="h-px w-full bg-slate-200 dark:bg-slate-700 rounded-full mb-4" />
        <div className="flex justify-between px-2">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="h-2 w-8 bg-slate-100 dark:bg-slate-800 rounded-full"
            />
          ))}
        </div>
      </div>
    );

  if (!hasData)
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
          <TrendingUp size={22} className="text-slate-400" />
        </div>
        <p className="text-xs font-semibold text-slate-400">
          {t("common.noOperations")}
        </p>
      </div>
    );

  const datasets = configs.map((cfg) => ({
    label: cfg.label,
    data: data.map((d) => d[cfg.key] ?? 0),
    borderColor: cfg.color,
    backgroundColor: hex(cfg.color, cfg.fillOpacity || 0.07),
    fill: cfg.fill ?? true,
    tension: 0.44,
    pointRadius: 3,
    pointBackgroundColor: cfg.color,
    pointBorderColor: "#fff",
    pointBorderWidth: 2,
    yAxisID: cfg.yAxisID || "y",
  }));

  const chartData = {
    labels: data.map((d) => d.label),
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "bottom",
        rtl: true,
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          font: { family: "Cairo, Cairo Fallback" },
          padding: 20,
          font: {
            family: "Cairo, Cairo Fallback",
            size: 11,
            weight: "600"
          },
          color: "#64748b",
        },
      },
      tooltip: {
        rtl: true,
        backgroundColor: "#fff",
        titleColor: "#64748b",
        bodyColor: "#1e293b",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        padding: 12,
        titleFont: {
          family: "Cairo, Cairo Fallback",
          size: 11,
          weight: "700",
        },
        bodyFont: {
          family: "Cairo, Cairo Fallback",
          size: 10,
          weight: "500",
        },
        // Optional: Add Cairo to the items inside the tooltip
        footerFont: {
          family: "Cairo, Cairo Fallback",
        },
        cornerRadius: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(0,0,0,0.03)", drawBorder: false },
        ticks: { font: { family: "Cairo, Cairo Fallback", size: 10 }, color: "#94a3b8", maxRotation: 0 },
        border: { display: false },
      },
      y: {
        grid: { color: "rgba(0,0,0,0.03)", drawBorder: false },
        ticks: { font: { family: "Cairo, Cairo Fallback", size: 10 }, color: "#94a3b8" },
        border: { display: false },
        beginAtZero: true,
      },
      ...(configs.some((c) => c.yAxisID === "y1") && {
        y1: {
          position: "right",
          grid: { display: false },
          ticks: { font: { family: "Cairo, Cairo Fallback", size: 10 }, color: "#94a3b8" },
          border: { display: false },
        },
      }),
    },
  };

  return (
    <div style={{ height: 264 }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

export function BarChart({ data, loading, configs = [] }) {
  const t = useTranslations("dashboard");
  const hasData = data && data.length > 0;

  if (loading)
    return (
      <div className="w-full h-64 flex flex-col justify-between animate-pulse px-2 py-4">
        <div className="flex-1 flex flex-col justify-between mb-6 gap-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-full h-px bg-slate-100 dark:bg-slate-800 rounded-full"
            />
          ))}
        </div>
        <div className="h-px w-full bg-slate-200 dark:bg-slate-700 rounded-full mb-4" />
        <div className="flex justify-between px-2">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="h-2 w-8 bg-slate-100 dark:bg-slate-800 rounded-full"
            />
          ))}
        </div>
      </div>
    );

  if (!hasData)
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
          <BarChart3 size={22} className="text-slate-400" />
        </div>
        <p className="text-xs font-semibold text-slate-400">
          {t("common.noOperations")}
        </p>
      </div>
    );

  const datasets = configs.map((cfg) => ({
    label: cfg.label,
    data: data.map((d) => d[cfg.key] ?? 0),
    backgroundColor: hex(cfg.color, 0.85),
    borderColor: cfg.color,
    borderWidth: 1.5,
    borderRadius: 8,
    maxBarThickness: 40,
  }));

  const chartData = {
    labels: data.map((d) => d.label),
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "bottom",
        rtl: true,
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          font: { family: "Cairo, Cairo Fallback" },
          padding: 20,
          font: {
            family: "Cairo, Cairo Fallback",
            size: 11,
            weight: "600"
          },
          color: "#64748b",
        },
      },
      tooltip: {
        rtl: true,
        backgroundColor: "#fff",
        titleColor: "#64748b",
        bodyColor: "#1e293b",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        padding: 12,
        titleFont: {
          family: "Cairo, Cairo Fallback",
          size: 11,
          weight: "700",
        },
        bodyFont: {
          family: "Cairo, Cairo Fallback",
          size: 10,
          weight: "500",
        },
        footerFont: {
          family: "Cairo, Cairo Fallback",
        },
        cornerRadius: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(0,0,0,0.03)", drawBorder: false },
        ticks: { font: { family: "Cairo, Cairo Fallback", size: 10 }, color: "#94a3b8", maxRotation: 0 },
        border: { display: false },
      },
      y: {
        grid: { color: "rgba(0,0,0,0.03)", drawBorder: false },
        ticks: { font: { family: "Cairo, Cairo Fallback", size: 10 }, color: "#94a3b8" },
        border: { display: false },
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ height: 264 }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PctBar — animated percentage bar
// ─────────────────────────────────────────────────────────────────────────────

export function PctBar({ value, color = PRIMARY }) {
  const v = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="flex items-center gap-2.5 min-w-[100px]">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${v}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>
      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-10 text-left tabular-nums">
        {pct(v)}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MiniTable — refined table with hover states
// ─────────────────────────────────────────────────────────────────────────────

export function MiniTable({ columns, data, loading }) {
  const t = useTranslations("dashboard");

  return (
    <div className="table-container overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">

      {/* Added 'min-w-[500px]' (or any appropriate width) 
          This ensures the table doesn't shrink smaller than this width, 
          which triggers the overflow scroll.
      */}
      <table className="w-full text-sm min-w-[450px] border-collapse">
        <thead className="table-header">   <tr>
          {columns.map((c, idx) => (
            <th
              key={c.key}
              className="table-header-cell"
            >
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.035 }}
              >
                {c.header}
              </motion.span>
            </th>
          ))}
        </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr
                key={i}
                className="table-row"
              >
                {columns.map((c) => (
                  <td key={c.key} className="table-cell">
                    <div className="table-skeleton-bar" />
                  </td>
                ))}
              </tr>
            ))
          ) : !data?.length ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-14 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center">
                    <Package size={18} className="text-muted-foreground/60" />
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground/60">
                    {t("common.noData")}
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.035 }}
                className="table-row"
              >
                {columns.map((c) => (
                  <td key={c.key} className="table-cell">
                    {c.cell ? c.cell(row) : (row[c.key] ?? "—")}
                  </td>
                ))}
              </motion.tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TableFilters — filter panel with polished inputs
// ─────────────────────────────────────────────────────────────────────────────

export const TableFilters = memo(function TableFilters({
  children,
  onApply,
  onRefresh,
  applyLabel,
}) {

  const t = useTranslations("dashboard");

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="main-card !p-0 overflow-hidden"
    >
      {/* Header bar */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="w-6 h-6 rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/30 dark:border-primary/40 flex items-center justify-center">
          <Filter size={12} className="text-primary" />
        </div>
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
          {t("filters.title")}
        </span>
      </div>

      {/* Fields */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4 items-end">
          {children}

          {/* Actions */}
          <div className="flex items-center gap-2.5 justify-end md:justify-start">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={onRefresh}
              className={cn(
                "h-10 px-4 rounded-xl text-xs font-semibold",
                "border border-slate-200 dark:border-slate-700",
                "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300",
                "hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800",
                "transition-all flex items-center gap-1.5 shadow-sm",
              )}
            >
              <RefreshCw size={12} />
              {t("common.refresh")}
            </motion.button>

            {onApply && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onApply}
                type="button"
                className="h-10 px-5 flex items-center gap-2 text-xs font-bold text-white rounded-xl transition-all duration-200 shadow-md"
                style={{
                  background: `linear-gradient(135deg, rgb(var(--primary-from)), rgb(var(--primary-to)))`,
                  boxShadow: `0 4px 14px rgb(var(--primary-shadow))`,
                }}
              >
                <Filter size={12} />
                {applyLabel || t("filters.apply")}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// FilterField wrapper — label + input group
// ─────────────────────────────────────────────────────────────────────────────

function FilterField({ label, icon: FieldIcon, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {FieldIcon && <FieldIcon size={10} className="text-orange-400" />}
        {label}
      </label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function OrdersStatisticsPage() {
  const tTutorial = useTranslations("tutorial.orderAnalysis");
  const tOrders = useTranslations("orders");
  const tDash = useTranslations("dashboard");
  const t = useTranslations("orderAnalysis");
  const locale = useLocale();
  const { formatCurrency } = usePlatformSettings();
  const { user } = useAuth();
  const [quickRange, setQuickRange] = useState("this_month");
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    storeId: "all",
    shippingCompanyId: "all",
    assignedUserId: "all",
    productIds: [],
    cityId: "all",
  });

  const [cities, setCities] = useState([]);
  const [citySearch, setCitySearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPrintingLoading, setIsPrintingLoading] = useState(false);
  const filteredCities = useMemo(() => {
    if (!citySearch) return cities;
    const lowerSearch = citySearch.toLowerCase();
    return cities.filter(city => {
      const nameEn = city.nameEn?.toLowerCase() || "";
      const nameAr = city.nameAr?.toLowerCase() || "";
      return nameEn.includes(lowerSearch) || nameAr.includes(lowerSearch);
    });
  }, [cities, citySearch]);
  const [advancedStats, setAdvancedStats] = useState(null);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [topCitiesStats, setTopCitiesStats] = useState([]);
  const [topProductsStats, setTopProductsStats] = useState([]);
  const [exAreas, setExAreas] = useState(false);
  const [exProducts, setExProducts] = useState(false);
  const { formatTrendLabel } = useTrendLabelFormatter();

  const buildParams = useCallback(() => {
    const p = { range: quickRange };
    if (filters.startDate) p.startDate = filters.startDate;
    if (filters.endDate) p.endDate = filters.endDate;
    if (filters.storeId && filters.storeId !== "all")
      p.storeId = filters.storeId;
    if (filters.shippingCompanyId && filters.shippingCompanyId !== "all")
      p.shippingCompanyId = filters.shippingCompanyId;
    if (filters.assignedUserId && filters.assignedUserId !== "all")
      p.assignedUserId = filters.assignedUserId;
    if (filters.productIds && filters.productIds.length > 0)
      p.productIds = filters.productIds;
    if (filters.cityId && filters.cityId !== "all")
      p.cityId = filters.cityId;
    return p;
  }, [quickRange, filters]);


  const fetchAll = useCallback(async () => {
    const p = buildParams();
    setLoading(true);
    try {
      const [advStats, weekTrend, citiesStats, productsStats] = await Promise.all([
        api
          .get("/dashboard/advanced-stats", { params: p })
          .catch(() => ({ data: null })),
        api
          .get("/dashboard/weekly-trend", { params: p })
          .catch(() => ({ data: [] })),
        api
          .get("/dashboard/top-cities-stats", { params: p })
          .catch(() => ({ data: [] })),
        api
          .get("/dashboard/top-products-stats", { params: p })
          .catch(() => ({ data: [] })),
      ]);
      const getData = (r) =>
        Array.isArray(r.data) ? r.data : (r.data?.records ?? []);

      setAdvancedStats(advStats.data);

      const formattedTrend = (getData(weekTrend)).map((item) => ({
        ...item,
        label: formatTrendLabel(item.date),
      }));

      setWeeklyTrend(formattedTrend);
      setTopCitiesStats(getData(citiesStats));
      setTopProductsStats(getData(productsStats));
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {    // Fetch cities
    api
      .get("/cities")
      .then(({ data }) =>
        setCities(Array.isArray(data) ? data : (data?.records ?? [])),
      )
      .catch((err) => console.error("Failed to fetch cities:", err));
  }, []);

  useEffect(() => {
    fetchAll();
  }, [quickRange]);

  // ── KPI config ────────────────────────────────────────────────────────────

  const pctStatsConfig = useMemo(() => [
    // Order count stats (relative to totalOrders)
    {
      key: "correctedOrders",
      totalKey: "totalOrders",
      title: t("kpi.correctedOrders"),
      totalLabel: t("kpi.totalOrders"),
      color: "#6366f1",
      description: tTutorial("percentageStats.correctedOrders.description"),
      example: tTutorial("percentageStats.correctedOrders.example"),
    },
    {
      key: "confirmedCount",
      totalKey: "totalOrders",
      title: t("kpi.confirmedCount"),
      totalLabel: t("kpi.totalOrders"),
      color: "#3b82f6",
      description: tTutorial("percentageStats.confirmedCount.description"),
      example: tTutorial("percentageStats.confirmedCount.example"),
    },
    {
      key: "deliveredFromTotal",
      totalKey: "totalOrders",
      title: t("kpi.deliveredFromTotal"),
      totalLabel: t("kpi.totalOrders"),
      color: "#10b981",
      description: tTutorial("percentageStats.deliveredFromTotal.description"),
      example: tTutorial("percentageStats.deliveredFromTotal.example"),
    },
    // Statuses (relative to totalOrders)
    {
      key: "new",
      totalKey: "totalOrders",
      title: t("kpi.newOrders"),
      totalLabel: t("kpi.totalOrders"),
      color: "#f59e0b",
      nested: "statuses",
      description: tTutorial("percentageStats.newOrders.description"),
      example: tTutorial("percentageStats.newOrders.example"),
    },
    {
      key: "returned",
      totalKey: "totalOrders",
      title: t("kpi.returnedOrders"),
      totalLabel: t("kpi.totalOrders"),
      color: "#ec4899",
      nested: "statuses",
      description: tTutorial("percentageStats.returnedOrders.description"),
      example: tTutorial("percentageStats.returnedOrders.example"),
    },
    {
      key: "postponed",
      totalKey: "totalOrders",
      title: t("kpi.postponedOrders"),
      totalLabel: t("kpi.totalOrders"),
      color: "#8b5cf6",
      nested: "statuses",
      description: tTutorial("percentageStats.postponedOrders.description"),
      example: tTutorial("percentageStats.postponedOrders.example"),
    },
    {
      key: "outOfDelivery",
      totalKey: "totalOrders",
      title: t("kpi.outOfDeliveryOrders"),
      totalLabel: t("kpi.totalOrders"),
      color: "#14b8a6",
      nested: "statuses",
      description: tTutorial("percentageStats.outOfDeliveryOrders.description"),
      example: tTutorial("percentageStats.outOfDeliveryOrders.example"),
    },
    {
      key: "wrongNumber",
      totalKey: "totalOrders",
      title: t("kpi.wrongNumberOrders"),
      totalLabel: t("kpi.totalOrders"),
      color: "#f97316",
      nested: "statuses",
      description: tTutorial("percentageStats.wrongNumberOrders.description"),
      example: tTutorial("percentageStats.wrongNumberOrders.example"),
    },
    {
      key: "canceled",
      totalKey: "totalOrders",
      title: t("kpi.canceledOrders"),
      totalLabel: t("kpi.totalOrders"),
      color: "#dc2626",
      nested: "statuses",
      description: tTutorial("percentageStats.canceledOrders.description"),
      example: tTutorial("percentageStats.canceledOrders.example"),
    },
    {
      key: "canceledAndUnderReview",
      totalKey: "totalOrders",
      title: t("kpi.canceledAndUnderReview"),
      totalLabel: t("kpi.totalOrders"),
      color: "#ef4444",
      description: tTutorial("percentageStats.canceledAndUnderReview.description"),
      example: tTutorial("percentageStats.canceledAndUnderReview.example"),
    },
    {
      key: "noAnswerFollowUp",
      totalKey: "totalOrders",
      title: t("kpi.noAnswerFollowUp"),
      totalLabel: t("kpi.totalOrders"),
      color: "#ef4444",
      description: tTutorial("percentageStats.noAnswerFollowUp.description"),
      example: tTutorial("percentageStats.noAnswerFollowUp.example"),
    },
    {
      key: "confirmed",
      totalKey: "totalOrders",
      title: t("kpi.confirmedOrders"),
      totalLabel: t("kpi.totalOrders"),
      color: "#2563eb",
      nested: "statuses",
      description: tTutorial("percentageStats.confirmedOrders.description"),
      example: tTutorial("percentageStats.confirmedOrders.example"),
    },
    {
      key: "shipped",
      totalKey: "totalOrders",
      title: t("kpi.shippedOrders"),
      totalLabel: t("kpi.totalOrders"),
      color: "#0ea5e9",
      nested: "statuses",
      description: tTutorial("percentageStats.shippedOrders.description"),
      example: tTutorial("percentageStats.shippedOrders.example"),
    },
    {
      key: "delivered",
      totalKey: "totalOrders",
      title: t("kpi.deliveredOrders"),
      totalLabel: t("kpi.totalOrders"),
      color: "#10b981",
      nested: "statuses",
      description: tTutorial("percentageStats.deliveredOrders.description"),
      example: tTutorial("percentageStats.deliveredOrders.example"),
    },
    // Delivered from confirmed
    {
      key: "deliveredFromConfirmed",
      totalKey: "confirmedCount",
      title: t("kpi.deliveredFromConfirmed"),
      totalLabel: t("kpi.confirmedCount"),
      color: "#22c55e",
      description: tTutorial("percentageStats.deliveredFromConfirmed.description"),
      example: tTutorial("percentageStats.deliveredFromConfirmed.example"),
    }
  ], [t, tTutorial]);

  const KPI = [
    {
      key: "totalOrders",
      title: t("kpi.totalOrders"),
      description: tDash("kpiDescription.totalOrders"),
      example: tTutorial("stats.totalOrders.example"),
      icon: ShoppingCart,
      color: PRIMARY,
    },
    {
      key: "correctedOrders",
      title: t("kpi.correctedOrders") || "Corrected Orders",
      description: tDash("kpiDescription.correctedOrders"),
      example: tTutorial("stats.correctedOrders.example"),
      icon: CheckCircle,
      color: "#6366f1",
    },
    {
      key: "confirmedCount",
      title: t("kpi.confirmedCount") || "Confirmed Count",
      description: tDash("kpiDescription.confirmedCount"),
      example: tTutorial("stats.confirmedCount.example"),
      icon: CheckCircle,
      color: "#3b82f6",
    },
    {
      key: "deliveredFromConfirmed",
      title: t("kpi.deliveredFromConfirmed") || "Delivered from Confirmed",
      description: tDash("kpiDescription.deliveredFromConfirmed"),
      example: tTutorial("stats.deliveredFromConfirmed.example"),
      icon: Truck,
      color: "#22c55e",
    },
    {
      key: "deliveredFromTotal",
      title: t("kpi.deliveredFromTotal") || "Delivered from Total",
      description: tDash("kpiDescription.deliveredFromTotal"),
      example: tTutorial("stats.deliveredFromTotal.example"),
      icon: TrendingUp,
      color: "#10b981",
    },
    {
      key: "totalSales",
      title: t("kpi.totalSales"),
      description: tDash("kpiDescription.totalSales"),
      example: tTutorial("stats.totalSales.example"),
      icon: TrendingUp,
      money: true,
      color: "#10b981",
    },
    {
      key: "deliveredSales",
      title: t("kpi.deliveredSales") || "Delivered Sales",
      description: tDash("kpiDescription.deliveredSales"),
      example: tTutorial("stats.deliveredSales.example"),
      icon: Truck,
      money: true,
      color: "#10b981",
    },
    {
      key: "collectedAmount",
      title: t("kpi.collectedAmount") || "Collected Amount",
      description: tDash("kpiDescription.collectedAmount"),
      example: tTutorial("stats.collectedAmount.example"),
      icon: TrendingUp,
      color: "#f59e0b",
    },
    {
      key: "pendingOrders",
      title: t("kpi.pendingOrders") || "Pending",
      description: tDash("kpiDescription.pendingOrders"),
      example: tTutorial("stats.pendingOrders.example"),
      icon: Package,
      color: "#f59e0b",
    },
    {
      key: "inWarehouseOrders",
      title: t("kpi.inWarehouseOrders") || "In Warehouse Orders",
      description: tDash("kpiDescription.inWarehouseOrders"),
      example: tTutorial("stats.inWarehouseOrders.example"),
      icon: Store,
      color: "#0ea5e9",
    },
    {
      key: "new",
      title: t("kpi.newOrders") || "New Orders",
      description: tDash("kpiDescription.new"),
      example: tTutorial("stats.new.example"),
      icon: Package,
      color: "#f59e0b",
    },
    {
      key: "returned",
      title: t("kpi.returnedOrders") || "Returned Orders",
      description: tDash("kpiDescription.returnedOrders"),
      example: tTutorial("stats.returned.example"),
      icon: XCircle,
      color: "#ec4899",
    },
    {
      key: "postponed",
      title: t("kpi.postponedOrders") || "Postponed Orders",
      description: tDash("kpiDescription.postponed"),
      example: tTutorial("stats.postponed.example"),
      icon: Package,
      color: "#8b5cf6",
    },
    {
      key: "outOfDelivery",
      title: t("kpi.outOfDeliveryOrders") || "Out of Delivery Area Orders",
      description: tDash("kpiDescription.outOfDelivery"),
      example: tTutorial("stats.outOfDelivery.example"),
      icon: MapPin,
      color: "#14b8a6",
    },
    {
      key: "wrongNumber",
      title: t("kpi.wrongNumberOrders") || "Wrong Number Orders",
      description: tDash("kpiDescription.wrongNumber"),
      example: tTutorial("stats.wrongNumber.example"),
      icon: XCircle,
      color: "#f97316",
    },
    {
      key: "canceled",
      title: t("kpi.canceledOrders"),
      description: tDash("kpiDescription.canceled"),
      example: tTutorial("stats.canceled.example"),
      icon: XCircle,
      color: "#dc2626",
    },
    {
      key: "canceledAndUnderReview",
      title: t("kpi.canceledAndUnderReview") || "Canceled & Under Review",
      description: tDash("kpiDescription.canceledAndUnderReview"),
      example: tTutorial("stats.canceledAndUnderReview.example"),
      icon: XCircle,
      color: "#ef4444",
    },
    {
      key: "noAnswerFollowUp",
      title: t("kpi.noAnswerFollowUp") || "Canceled & Under Review",
      description: tDash("kpiDescription.noAnswerFollowUp"),
      example: tTutorial("stats.noAnswerFollowUp.example"),
      icon: XCircle,
      color: "#ef4444",
    },
    {
      key: "confirmed",
      title: t("kpi.confirmedOrders"),
      description: tDash("kpiDescription.confirmed"),
      example: tTutorial("stats.confirmed.example"),
      icon: CheckCircle,
      color: "#2563eb",
    },
    {
      key: "shipped",
      title: t("kpi.shippedOrders"),
      description: tDash("kpiDescription.shipped"),
      example: tTutorial("stats.shipped.example"),
      icon: Truck,
      color: "#0ea5e9",
    },
    {
      key: "delivered",
      title: t("kpi.deliveredOrders"),
      description: tDash("kpiDescription.delivered"),
      example: tTutorial("stats.delivered.example"),
      icon: CheckCircle,
      color: "#10b981",
    },
  ];

  // ── Areas table columns ───────────────────────────────────────────────────

  const areasCols = [
    {
      key: "label",
      header: t("areas.columns.cityArea"),
      cell: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
            <MapPin size={11} className="text-emerald-500" />
          </div>
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">
            {locale === "ar" ? r.nameAr : r.nameEn}
          </span>
        </div>
      ),
    },
    {
      key: "totalOrders",
      header: t("areas.columns.totalOrders"),
      cell: (r) => (
        <span
          className="font-bold tabular-nums text-sm"
          style={{ color: PRIMARY }}
        >
          {fmt(r.totalOrders)}
        </span>
      ),
    },
    {
      key: "correctedOrders",
      header: t("kpi.correctedOrders"),
      cell: (r) => (
        <span className="font-semibold text-purple-500 dark:text-purple-400 tabular-nums text-sm">
          {fmt(r.correctedOrders)}
          <span className="text-xs text-slate-400 ms-1">
            {r.totalOrders > 0 ? `(${((r.correctedOrders / r.totalOrders) * 100).toFixed(0)}%)` : ""}
          </span>
        </span>
      ),
    },
    {
      key: "confirmedCount",
      header: t("areas.columns.confirmed"),
      cell: (r) => (
        <span className="font-semibold text-blue-500 dark:text-blue-400 tabular-nums text-sm">
          {fmt(r.confirmedCount)}
          <span className="text-xs text-slate-400 ms-1">
            {r.totalOrders > 0 ? `(${((r.confirmedCount / r.totalOrders) * 100).toFixed(0)}%)` : ""}
          </span>
        </span>
      ),
    },
    {
      key: "shippedOrders",
      header: t("areas.columns.inDelivery"),
      cell: (r) => (
        <span className="font-semibold text-cyan-500 dark:text-cyan-400 tabular-nums text-sm">
          {fmt(r.shippedOrders)}
          <span className="text-xs text-slate-400 ms-1">
            {r.totalOrders > 0 ? `(${((r.shippedOrders / r.totalOrders) * 100).toFixed(0)}%)` : ""}
          </span>
        </span>
      ),
    },
    {
      key: "deliveredTotal",
      header: t("areas.columns.delivered"),
      cell: (r) => (
        <span className="font-semibold text-emerald-500 dark:text-emerald-400 tabular-nums text-sm">
          {fmt(r.deliveredTotal)}
          <span className="text-xs text-slate-400 ms-1">
            {r.totalOrders > 0 ? `(${((r.deliveredTotal / r.totalOrders) * 100).toFixed(0)}%)` : ""}
          </span>
        </span>
      ),
    },
    {
      key: "deliveredFromConfirmed",
      header: t("kpi.deliveredFromConfirmed"),
      cell: (r) => (
        <span className="font-semibold text-orange-500 dark:text-orange-400 tabular-nums text-sm">
          {fmt(r.deliveredFromConfirmed)}
          <span className="text-xs text-slate-400 ms-1">
            {r.confirmedCount > 0 ? `(${((r.deliveredFromConfirmed / r.confirmedCount) * 100).toFixed(0)}%)` : ""}
          </span>
        </span>
      ),
    },
  ];

  // ── Products table columns ─────────────────────────────────────────────────

  const productsCols = [
    {
      key: "label",
      header: t("products.columns.name"),
      cell: (r) => (
        <div className="flex items-center gap-2">
          {r.image && (
            <img
              src={avatarSrc(r.image)}
              alt=""
              className="w-8 h-8 rounded-lg object-cover shrink-0"
            />
          )}
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate">
            {r.name}
          </span>
        </div>
      ),
    },
    {
      key: "totalOrders",
      header: t("products.columns.ordersCount"),
      cell: (r) => (
        <span
          className="font-bold tabular-nums text-sm"
          style={{ color: PRIMARY }}
        >
          {fmt(r.totalOrders)}
        </span>
      ),
    },
    {
      key: "correctedOrders",
      header: t("kpi.correctedOrders"),
      cell: (r) => (
        <span className="font-semibold text-purple-500 dark:text-purple-400 tabular-nums text-sm">
          {fmt(r.correctedOrders)}
          <span className="text-xs text-slate-400 ms-1">
            {r.totalOrders > 0 ? `(${((r.correctedOrders / r.totalOrders) * 100).toFixed(0)}%)` : ""}
          </span>
        </span>
      ),
    },
    {
      key: "confirmedCount",
      header: t("products.columns.confirmedOrders"),
      cell: (r) => (
        <span className="font-semibold text-blue-500 dark:text-blue-400 tabular-nums text-sm">
          {fmt(r.confirmedCount)}
          <span className="text-xs text-slate-400 ms-1">
            {r.totalOrders > 0 ? `(${((r.confirmedCount / r.totalOrders) * 100).toFixed(0)}%)` : ""}
          </span>
        </span>
      ),
    },
    {
      key: "shippedOrders",
      header: t("products.columns.inDelivery"),
      cell: (r) => (
        <span className="font-semibold text-cyan-500 dark:text-cyan-400 tabular-nums text-sm">
          {fmt(r.shippedOrders)}
          <span className="text-xs text-slate-400 ms-1">
            {r.totalOrders > 0 ? `(${((r.shippedOrders / r.totalOrders) * 100).toFixed(0)}%)` : ""}
          </span>
        </span>
      ),
    },
    {
      key: "deliveredTotal",
      header: t("products.columns.delivered"),
      cell: (r) => (
        <span className="font-semibold text-emerald-500 dark:text-emerald-400 tabular-nums text-sm">
          {fmt(r.deliveredTotal)}
          <span className="text-xs text-slate-400 ms-1">
            {r.totalOrders > 0 ? `(${((r.deliveredTotal / r.totalOrders) * 100).toFixed(0)}%)` : ""}
          </span>
        </span>
      ),
    },
    {
      key: "deliveredFromConfirmed",
      header: t("kpi.deliveredFromConfirmed"),
      cell: (r) => (
        <span className="font-semibold text-orange-500 dark:text-orange-400 tabular-nums text-sm">
          {fmt(r.deliveredFromConfirmed)}
          <span className="text-xs text-slate-400 ms-1">
            {r.confirmedCount > 0 ? `(${((r.deliveredFromConfirmed / r.confirmedCount) * 100).toFixed(0)}%)` : ""}
          </span>
        </span>
      ),
    },
  ];

  // ── Derived stats ─────────────────────────────────────────────────────────

  const statsData = useMemo(
    () => {
      const comparisonLabel = quickRange
        ? tDash(`common.comparison.${quickRange}`)
        : t("dashboard.common.comparison.custom");

      return KPI.map((card, i) => {
        let currentVal;
        let previousVal;

        // Check if the key is in statuses object or directly in advancedStats
        if (card.key in (advancedStats?.statuses || {})) {
          currentVal = advancedStats?.statuses?.[card.key] ?? 0;
          previousVal = advancedStats?.comparison?.statuses?.[card.key];
        } else {
          currentVal = advancedStats?.[card.key] ?? 0;
          previousVal = advancedStats?.comparison?.[card.key];
        }

        let change = null;
        if (previousVal !== undefined && previousVal !== null && previousVal !== 0) {
          change = ((currentVal - previousVal) / previousVal) * 100;
        }

        const hasComparison = change !== null;
        const isPositiveChange = (change ?? 0) > 0;
        const isNegativeChange = (change ?? 0) < 0;
        const isGood = card.isInverse
          ? isNegativeChange
          : isPositiveChange;

        let val = currentVal == null ? "0" : card.pct ? pct(currentVal) : fmt(currentVal);
        if (card.money) {
          val = formatCurrency(val);
        }

        return {
        id: card.key,
        name: card.title,
        description: card.description,
        example: card.example,
        value: val,
        icon: card.icon,
        color: card.color,
        sortOrder: i,
        onClick: () => { },
        trend: {
          label: hasComparison ? comparisonLabel : t("dashboard.common.noComparisonData"),
          value: hasComparison ? `${Math.abs(Math.round(change))}%` : "",
          isUp: isPositiveChange,
          isGood: isGood,
          showArrow: hasComparison && Math.round(change) !== 0,
        },
      };
      });
    },
    [advancedStats, KPI, formatCurrency, quickRange, t],
  );

  const statsCards = useMemo(() => {
    // Using statsData from advanced stats instead of statusData
    return statsData;
  }, [statsData]);

  // ── Export helper ─────────────────────────────────────────────────────────

  const doExport = async (endpoint, setL, name) => {
    setL(true);
    const id = toast.loading(t("export.exporting"));
    try {
      const res = await api.get(endpoint, {
        params: buildParams(),
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = Object.assign(document.createElement("a"), {
        href: url,
        download: `${name}_${Date.now()}.xlsx`,
      });
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(t("export.success"), { id });
    } catch (err) {
      toast.error(t("export.failed"), { id });
    } finally {
      setL(false);
    }
  };

  const orderConfigs = [
    {
      key: "newOrders",
      label: t("chart.newOrders"),
      color: SECONDARY,
      fillOpacity: 0.1,
      tension: 0.44,
    },
    {
      key: "deliveredOrders",
      label: t("chart.deliveredOrders"),
      color: "#10b981",
      fillOpacity: 0.06,
      tension: 0.44,
    },
  ];

  const QUICK_RANGES = [
    { id: "today", label: t("ranges.today") },
    { id: "yesterday", label: t("ranges.yesterday") },
    { id: "this_week", label: t("ranges.this_week") },
    { id: "last_week", label: t("ranges.last_week") },
    { id: "this_month", label: t("ranges.this_month") },
    { id: "last_month", label: t("ranges.last_month") },
    { id: "this_year", label: t("ranges.this_year") },
  ];
  const handlePrint = useCallback(async () => {
    if (!advancedStats) return;
    setIsPrintingLoading(true);

    // Create a temporary div to render charts and QR with fixed dimensions
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '800px';
    document.body.appendChild(tempDiv);

    // Helper function to generate QR code data URL
    const getQRCodeDataUrl = (value) => {
      return new Promise((resolve) => {
        // Create a container div
        const qrContainer = document.createElement('div');
        qrContainer.style.background = 'white';
        qrContainer.style.padding = '8px';
        tempDiv.appendChild(qrContainer);

        // Create and append the QR code SVG
        const qrEl = document.createElement('div');
        qrContainer.appendChild(qrEl);

        // We'll use a simple approach: render a canvas-based QR code
        // Since react-qr-code renders an SVG, we can capture that
        const renderQR = () => {
          // Use canvas to draw QR
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          tempDiv.appendChild(canvas);

          // Or better: use canvas
          const qrValue = value;

          const root = require('react-dom/client').createRoot(qrEl);
          root.render(<QRCode value={qrValue} size={256} />);

          // Wait a moment, then after rendering, we can get the SVG and convert to canvas!
          setTimeout(() => {
            // Get the SVG from qrEl
            const svg = qrEl.querySelector('svg');
            if (svg) {
              // Convert SVG to data URL
              const serializer = new XMLSerializer();
              const svgStr = serializer.serializeToString(svg);
              const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
              const url = URL.createObjectURL(svgBlob);

              // Create an image to load the SVG, then draw to canvas
              const img = new Image();
              img.onload = () => {
                const canvas2 = document.createElement('canvas');
                canvas2.width = 256;
                canvas2.height = 256;
                const ctx = canvas2.getContext('2d');
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, 256, 256);
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas2.toDataURL('image/png');
                URL.revokeObjectURL(url);
                tempDiv.removeChild(qrContainer);
                resolve(dataUrl);
              };
              img.onerror = () => {
                // Fallback
                URL.revokeObjectURL(url);
                tempDiv.removeChild(qrContainer);
                resolve('');
              };
              img.src = url;
            } else {
              tempDiv.removeChild(qrContainer);
              resolve('');
            }
          }, 100);
        };

        renderQR();
      });
    };

    // Function to render a chart synchronously and get a high-quality data URL
    const getChartDataUrl = (config, width = 800, height = 400) => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        tempDiv.appendChild(canvas);

        const ctx = canvas.getContext('2d');

        // Disable animations for instant, complete capture
        const printConfig = {
          ...config,
          options: {
            ...config.options,
            animation: false,
            responsive: false,
            devicePixelRatio: 2, // Boosts resolution
          }
        };

        const chart = new ChartJS(ctx, printConfig);

        // Wait exactly one frame to ensure drawing is complete, then capture
        requestAnimationFrame(() => {
          const dataUrl = canvas.toDataURL('image/png', 1.0);
          chart.destroy();
          tempDiv.removeChild(canvas); // Clean up canvas after capture
          resolve(dataUrl);
        });
      });
    };

    let weeklyTrendChartUrl = '';
    let statusDonutChartUrl = '';
    const percentageChartUrls = [];

    // 1. Render weekly trend chart
    if (weeklyTrend.length > 0) {
      const chartData = {
        labels: weeklyTrend.map(d => d.label),
        datasets: [
          {
            label: t("charts.newOrders"),
            data: weeklyTrend.map(d => d.created),
            backgroundColor: "#6366f1",
            borderColor: "#6366f1",
            borderWidth: 2,
          },
          {
            label: t("charts.deliveredOrders"),
            data: weeklyTrend.map(d => d.delivered),
            backgroundColor: "#10b981",
            borderColor: "#10b981",
            borderWidth: 2,
          },
        ],
      };

      const chartConfig = {
        type: 'bar',
        data: chartData,
        options: {
          plugins: {
            legend: {
              position: 'top',
              labels: { font: { size: 14 } }
            },
          },
          scales: { y: { beginAtZero: true } }
        },
      };
      weeklyTrendChartUrl = await getChartDataUrl(chartConfig);
    }

    // 2. Render status donut chart
    if (advancedStats.statusBreakdown?.length > 0) {
      const colors = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

      // Calculate total to determine percentages
      const totalStatusCount = advancedStats.statusBreakdown.reduce((sum, d) => sum + (d.count || 0), 0);

      const chartData = {
        labels: advancedStats.statusBreakdown.map(d => {
          const name = d.system ? tOrders(`statuses.${d.code}`) : d.name;
          const count = d.count || 0;
          const percentage = totalStatusCount > 0 ? ((count / Number(totalStatusCount)) * 100).toFixed(0) : 0;
          // Add count and percentage to label
          return `${name}: ${count} (${percentage}%)`;
        }),
        datasets: [
          {
            data: advancedStats.statusBreakdown.map(d => d.count),
            backgroundColor: advancedStats.statusBreakdown.map((_, i) => colors[i % colors.length]),
            borderColor: "#ffffff",
            borderWidth: 2,
          },
        ],
      };

      const chartConfig = {
        type: 'doughnut',
        data: chartData,
        options: {
          plugins: {
            legend: {
              position: 'bottom', // Put labels under the circle
              labels: {
                font: { size: 15, weight: 'bold' }, // Larger text
                padding: 15
              }
            },
          },
          layout: { padding: 20 }
        },
      };
      statusDonutChartUrl = await getChartDataUrl(chartConfig, 800, 500); // Taller canvas to fit bottom labels
    }

    // Register the center text plugin first
    ChartJS.register({
      id: 'centerText',
      afterDatasetsDraw: (chart) => {
        const ctx = chart.ctx;
        const { width, height } = chart;
        const fontSizeBold = Math.min(width, height) / 12;
        const fontSizeRegular = fontSizeBold * 0.55;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const centerData = chart.config.options.centerText;
        if (!centerData) return;

        // Draw center value
        ctx.font = `bold ${fontSizeBold}px Arial`;
        ctx.fillStyle = '#1f2937';
        ctx.fillText(centerData.value, width / 2, height / 2 - fontSizeRegular / 2);

        // Draw center label
        ctx.font = `normal ${fontSizeRegular}px Arial`;
        ctx.fillStyle = '#6b7280';
        ctx.fillText(centerData.label, width / 2, height / 2 + fontSizeBold / 2);
      }
    });

    // 3. Render Percentage Stats Donuts
    const generateMiniDonut = async (title, value, total, color, isMoney = false, totalLabel) => {
      const safeVal = value || 0;
      const safeTot = total || 0;
      const remaining = Math.max(0, safeTot - safeVal);

      // Calculate percentages
      const pctVal = safeTot > 0 ? ((safeVal / Number(safeTot)) * 100).toFixed(0) : 0;
      const pctRem = safeTot > 0 ? ((remaining / Number(safeTot)) * 100).toFixed(0) : 0;

      // Format currency if needed
      const displayVal = isMoney && formatCurrency ? formatCurrency(safeVal) : safeVal;
      const displayRem = isMoney && formatCurrency ? formatCurrency(remaining) : remaining;
      const displayTotal = isMoney && formatCurrency ? formatCurrency(safeTot) : safeTot;

      const config = {
        type: 'doughnut',
        data: {
          labels: [
            `${title}: ${displayVal} (${pctVal}%)`,
            `${totalLabel || t("common.remaining") || "Remaining"}: ${displayTotal} (${pctRem}%)`
          ],
          datasets: [{
            data: [safeVal, remaining],
            backgroundColor: [color, "#e2e8f0"],
            borderWidth: 1,
            borderColor: "#ffffff"
          }]
        },
        options: {
          cutout: '65%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { size: 13, weight: 'bold' },
                padding: 15
              }
            }
          },
          layout: { padding: 10 },
          centerText: {
            value: displayVal,
            label: title
          }
        }
      };
      return { title, url: await getChartDataUrl(config, 400, 350) };
    };

    // Add specific money/sales stats first (passing true for isMoney flag)
    percentageChartUrls.push(await generateMiniDonut(
      t("kpi.deliveredSales") || "Delivered Sales",
      advancedStats.deliveredSales,
      advancedStats.totalSales,
      "#10b981",
      true, // Format as currency
      t("kpi.totalSales") || "Total Sales"
    ));
    percentageChartUrls.push(await generateMiniDonut(
      t("kpi.collectedAmount") || "Collected Amount",
      advancedStats.collectedAmount,
      advancedStats.deliveredSales, // Based on UI setup
      "#f59e0b",
      true, // Format as currency
      t("kpi.deliveredSales") || "Delivered Sales"
    ));

    // Add dynamic pctStatsConfig loops
    for (const stat of pctStatsConfig) {
      const val = stat.nested
        ? advancedStats?.[stat.nested]?.[stat.key] || 0
        : advancedStats?.[stat.key] || 0;
      const tot = stat.nested
        ? advancedStats?.[stat.nested]?.[stat.totalKey] || advancedStats?.[stat.totalKey] || 0
        : advancedStats?.[stat.totalKey] || 0;

      percentageChartUrls.push(await generateMiniDonut(
        stat.title,
        val,
        tot,
        stat.color,
        stat.money || false,
        stat.totalLabel
      ));
    }

    // Generate QR code
    const websiteUrl = typeof window !== 'undefined' ? window.location.origin : '';
    let qrCodeUrl = '';
    if (websiteUrl) {
      qrCodeUrl = await getQRCodeDataUrl(websiteUrl);
    }

    // Generate export date
    const exportDate = new Date().toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Clean up temp div
    document.body.removeChild(tempDiv);

    try {
      // Generate PDF using @react-pdf/renderer
      const blob = await pdf(
        <OrderAnalysisPDF
          t={t}
          tOrders={tOrders}
          locale={locale}
          statsData={statsData}
          weeklyTrend={weeklyTrend}
          weeklyTrendChartUrl={weeklyTrendChartUrl}
          statusDonutChartUrl={statusDonutChartUrl}
          topCitiesStats={topCitiesStats}
          topProductsStats={topProductsStats}
          percentageChartUrls={percentageChartUrls}
          advancedStats={advancedStats}
          user={user}
          exportDate={exportDate}
          websiteUrl={websiteUrl}
          qrCodeUrl={qrCodeUrl}
        />
      ).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${t("breadcrumb.orderAnalysis") || "OrderAnalysis"}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsPrintingLoading(false);
    }
  }, [t, tDash, tOrders, locale, statsData, weeklyTrend, advancedStats, topCitiesStats, topProductsStats, quickRange, pctStatsConfig, formatCurrency, user]);
  return (
    <div className="min-h-screen p-5 space-y-5">
      {/* Page header */}
      <PageHeader
        itemsCompact={false}
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.orderAnalysis") },
        ]}
        buttons={
          <>
            <Button_
              size="sm"
              label={t("actions.howToUse")}
              variant="ghost"
              icon={<Info size={18} />}
            />
            <Button_
              size="sm"
              label={isPrintingLoading ? (t("common.preparing") || "Preparing...") : (t("export.print") || "Print")}
              variant="ghost"
              icon={isPrintingLoading ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
              onClick={handlePrint}
              disabled={loading || isPrintingLoading}
            />
          </>
        }
        statsLoading={loading}
        stats={statsCards}
        items={QUICK_RANGES}
        active={quickRange}
        setActive={(v) => {
          setQuickRange(v)
          setFilters(p => ({ ...p, startDate: null, endDate: null }))
        }}
      />

      {/* Filters */}
      <TableFilters
        onApply={fetchAll}
        onRefresh={fetchAll}
        applyLabel={t("filters.apply")}
      >

        <FilterField label={t("filters.dateRange")} icon={Calendar}>
          <DateRangePicker
            value={{
              startDate: filters.startDate,
              endDate: filters.endDate,
            }}
            onChange={(newDates) => {
              setFilters(f => ({ ...f, ...newDates }))
              setQuickRange(null)
            }}
            placeholder={t("filters.dateRangePlaceholder")}
            dataSize="default"
            maxDate="today"
          />
        </FilterField>

        <StoreFilter value={filters.storeId} icon={Store} iconClass={"text-orange-400!"}
          onChange={(v) => setFilters((f) => ({ ...f, storeId: v }))} none={false} autoSelectIfSingle={true} />

        <ShippingCompanyFilter
          value={filters.shippingCompanyId}
          onChange={(v) =>
            setFilters((f) => ({ ...f, shippingCompanyId: v }))
          }
        />


        <FilterField label={t("filters.employee")}>
          <UserSelect
            value={filters.assignedUserId}
            onSelect={(user) =>
              setFilters((f) => ({
                ...f,
                assignedUserId: user ? String(user.id) : "all",
              }))
            }
            placeholder={t("filters.employeePlaceholder")}
            allowAll
            allLabel={t("filters.all")}
            className="h-10 rounded-xl border-border bg-background"
            contentClassName="bg-card-select"
          />
        </FilterField>

        <FilterField label={t("filters.city")}>
          <Select
            value={filters.cityId}
            onValueChange={(v) => {
              setFilters((f) => ({ ...f, cityId: v }));
              setCitySearch("");
            }}
          >
            <SelectTrigger className="h-10 rounded-xl border-border bg-background">
              <SelectValue placeholder={t("filters.all")} />
            </SelectTrigger>
            <SelectContent className="bg-card-select">
              <div className="px-2 py-2 sticky top-0 bg-card-select z-10 border-b border-border">
                <input
                  type="text"
                  placeholder={t("filters.searchCities")}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 rtl:text-end text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
              <SelectItem value="all">{t("filters.all")}</SelectItem>
              {filteredCities.map((city) => (
                <SelectItem key={city.id} value={String(city.id)}>
                  {locale === "ar" ? city.nameAr : city.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label={t("filters.products")}>
          <MultiSelect
            endpoint="/products"
            params={{ isActive: "true", type: "PRODUCT" }}
            value={filters.productIds}
            initialValues={filters.productIds}
            onChange={(newVal) => {
              const ids = newVal.map(v => typeof v === 'string' ? v : v.id);
              setFilters((f) => ({ ...f, productIds: ids }));
            }}
            placeholder={t("filters.products")}
            labelKey="name"
          />
        </FilterField>


      </TableFilters>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2"
        >
          <TutorialSpotlight
            title={t("charts.ordersPercent")}
            description={tTutorial("charts.weeklyTrend.description")}
            example={tTutorial("charts.weeklyTrend.example")}
            overview={true}
          >
            <Card
              title={t("charts.ordersPercent")}
              icon={TrendingUp}
              color={PRIMARY}
            >
              <BarChart
                data={weeklyTrend}
                loading={loading}
                configs={[
                  { key: "created", label: t("charts.newOrders"), color: "#6366f1" },
                  { key: "delivered", label: t("charts.deliveredOrders"), color: "#10b981" },
                ]}
              />
            </Card>
          </TutorialSpotlight>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <TutorialSpotlight
            title={t("charts.perStatus")}
            description={tTutorial("charts.statusDonut.description")}
            example={tTutorial("charts.statusDonut.example")}
            overview={true}
          >
            <Card title={t("charts.perStatus")} icon={PieIcon} color={PRIMARY}>
              <StatusDonut
                showLabels={false}
                data={advancedStats?.statusBreakdown?.map((s, i) => ({
                  ...s,
                  label: s.system ? tOrders(`statuses.${s.code}`) : s.name,
                  count: s.count,
                  color: [PRIMARY, "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"][i % 6],
                }))}
                loading={loading}
                config={{ key: "count", label: "label" }}
              />
            </Card>
          </TutorialSpotlight>
        </motion.div>
      </div>

      {/* Combined Stats Grid */}


      {/* Areas table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <TutorialSpotlight
          title={t("areas.title")}
          description={tTutorial("tables.areas.description")}
          example={tTutorial("tables.areas.example")}
          overview={true}
        >
          <Card
            title={t("areas.title")}
            icon={MapPin}
            color="#10b981"
            action={
              <ExportBtn
                loading={exAreas}
                onClick={() =>
                  doExport(
                    "/dashboard/orders/top-areas/export",
                    setExAreas,
                    "top_areas",
                  )
                }
              />
            }
          >
            <MiniTable columns={areasCols} data={topCitiesStats} loading={loading} />
          </Card>
        </TutorialSpotlight>
      </motion.div>

      {/* Products table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <TutorialSpotlight
          title={t("products.title")}
          description={tTutorial("tables.products.description")}
          example={tTutorial("tables.products.example")}
          overview={true}
        >
          <Card
            title={t("products.title")}
            icon={Package}
            color="#3b82f6"
            action={
              <ExportBtn
                loading={exProducts}
                onClick={() =>
                  doExport(
                    "/dashboard/orders/top-products/export",
                    setExProducts,
                    "top_products",
                  )
                }
              />
            }
          >
            <MiniTable columns={productsCols} data={topProductsStats} loading={loading} />
          </Card>
        </TutorialSpotlight>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {/* Sales Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          <TutorialSpotlight
            title={t("kpi.deliveredSales")}
            description={tTutorial("percentageStats.deliveredSales.description")}
            example={tTutorial("percentageStats.deliveredSales.example")}
            overview={true}
          >
            <Card
              title={t("kpi.deliveredSales")}
              icon={TrendingUp}
              color="#10b981"
            >
              <StatusDonut
                showLabels={true}
                data={[
                  {
                    label: t("kpi.deliveredSales"),
                    count: advancedStats?.deliveredSales || 0,
                    color: "#10b981"
                  },
                  {
                    label: t("kpi.totalSales"),
                    count: advancedStats?.totalSales || 0,
                    color: "#e2e8f0"
                  }
                ]}
                loading={loading}
                config={{
                  key: "count",
                  label: "label",
                  centerValue: advancedStats?.deliveredSales || 0,
                  centerLabel: t("kpi.deliveredSales")
                }}
              />
            </Card>
          </TutorialSpotlight>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.23 }}
        >
          <TutorialSpotlight
            title={t("kpi.collectedAmount")}
            description={tTutorial("percentageStats.collectedAmount.description")}
            example={tTutorial("percentageStats.collectedAmount.example")}
            overview={true}
          >
            <Card
              title={t("kpi.collectedAmount")}
              icon={TrendingUp}
              color="#f59e0b"
            >
              <StatusDonut
                showLabels={true}
                data={[
                  {
                    label: t("kpi.collectedAmount"),
                    count: advancedStats?.collectedAmount || 0,
                    color: "#f59e0b"
                  },
                  {
                    label: t("kpi.deliveredSales"),
                    count: advancedStats?.deliveredSales || 0,
                    color: "#e2e8f0"
                  }
                ]}
                loading={loading}
                config={{
                  key: "count",
                  label: "label",
                  centerValue: advancedStats?.collectedAmount || 0,
                  centerLabel: t("kpi.collectedAmount")
                }}
              />
            </Card>
          </TutorialSpotlight>
        </motion.div>

        {/* Percentage Stats */}
        {pctStatsConfig.map((stat, idx) => {
          const value = stat.nested
            ? advancedStats?.[stat.nested]?.[stat.key] || 0
            : advancedStats?.[stat.key] || 0;
          const total = stat.nested
            ? advancedStats?.[stat.nested]?.[stat.totalKey] || advancedStats?.[stat.totalKey] || 0
            : advancedStats?.[stat.totalKey] || 0;

          return (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 + idx * 0.01 }}
            >
              <Card
                title={stat.title}
                icon={Package}
                color={stat.color}
              >
                <StatusDonut
                  showLabels={true}
                  data={[
                    {
                      label: stat.title,
                      count: value,
                      color: stat.color
                    },
                    {
                      label: stat.totalLabel,
                      count: total,
                      color: "#e2e8f0"
                    }
                  ]}
                  loading={loading}
                  config={{
                    key: "count",
                    label: "label",
                    centerValue: value,
                    centerLabel: stat.title
                  }}
                />
              </Card>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
}
