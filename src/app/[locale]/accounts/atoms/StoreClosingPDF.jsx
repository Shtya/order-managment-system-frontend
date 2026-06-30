import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { WHITE,BORDER,DANGER_BG,DANGER_BORDER,DANGER_TEXT,PRIMARY,SKELETON_BG,TEXT_DARK,TEXT_MUTED,SECONDARY } from "@/utils/colors";
import { DEFAULT_FONT_FAMILY } from "@/utils/healpers";
// Register Cairo font (same as order analysis)


const BG_LIGHT = "#f9fafb";
const TEXT_BOLD = "#4b5563";

// Specific colors from your HTML
const POSITIVE_TEXT = "#059669";
const NEGATIVE_TEXT = "#dc2626";

const FINAL_BG = "#f0fdf4";
const FINAL_BORDER = "#86efac";
const FINAL_TEXT = "#166534";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: WHITE,
    fontFamily: DEFAULT_FONT_FAMILY,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    borderBottom: `2px solid ${BORDER}`,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    color: TEXT_DARK,
    fontWeight: 700,
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginBottom: 4,
  },
  // Grid emulation using flexbox
  gridRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  summaryBox: {
    width: "48%", // Emulates 2 columns with a gap
    padding: 15,
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    backgroundColor: BG_LIGHT,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryTitle: {
    fontSize: 14,
    color: TEXT_BOLD,
    fontWeight: 700,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 900, // Black weight
    color: TEXT_DARK,
  },
  valuePositive: {
    color: POSITIVE_TEXT,
  },
  valueNegative: {
    color: NEGATIVE_TEXT,
  },
  finalBox: {
    width: "100%",
    padding: 20,
    border: `1px solid ${FINAL_BORDER}`,
    borderRadius: 8,
    backgroundColor: FINAL_BG,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 5,
  },
  finalTitle: {
    fontSize: 16,
    color: FINAL_TEXT,
    fontWeight: 700,
  },
  finalValue: {
    fontSize: 32,
    color: FINAL_TEXT,
    fontWeight: 900,
  },
});

const StoreClosingPDF = ({ closing, formatCurrency, t, tCommon, locale }) => {
  const isArabic = locale === "ar";
  
  // RTL handling helpers
  const flexRowDir = isArabic ? "row-reverse" : "row";
  const textAlign = isArabic ? "right" : "left";
    
  return (
    <Document>
      <Page 
        size="A4" 
        style={[styles.page, { direction: isArabic ? "rtl" : "ltr", textAlign }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t("details.title")} {closing.month} / {closing.year}
          </Text>
          <Text style={styles.headerSubtitle}>
            {t("columns.period")}: {closing.month} / {closing.year}
          </Text>
          <Text style={styles.headerSubtitle}>
            {t("columns.closedAt")}: {new Date(closing.createdAt || new Date()).toLocaleDateString()}
          </Text>
        </View>

        {/* Summary Grid (Row 1) */}
        <View style={[styles.gridRow, { flexDirection: flexRowDir }]}>
          <View style={[styles.summaryBox, { flexDirection: flexRowDir }]}>
            <Text style={styles.summaryTitle}>{t("columns.totalSelling")}</Text>
            <Text style={[styles.summaryValue, closing.revenue >= 0 ? styles.valuePositive : styles.valueNegative]}>
              {formatCurrency(closing.revenue || undefined)}
            </Text>
          </View>
          <View style={[styles.summaryBox, { flexDirection: flexRowDir }]}>
            <Text style={styles.summaryTitle}>{t("columns.productCost")}</Text>
            <Text style={[styles.summaryValue, styles.valueNegative]}>
              {formatCurrency(closing.productCost || undefined)}
            </Text>
          </View>
        </View>

        {/* Summary Grid (Row 2) */}
        <View style={[styles.gridRow, { flexDirection: flexRowDir }]}>
          <View style={[styles.summaryBox, { flexDirection: flexRowDir }]}>
            <Text style={styles.summaryTitle}>{t("columns.operationalExpenses")}</Text>
            <Text style={[styles.summaryValue, styles.valueNegative]}>
              {formatCurrency(closing.operationalExpenses || undefined)}
            </Text>
          </View>
          <View style={[styles.summaryBox, { flexDirection: flexRowDir }]}>
            <Text style={styles.summaryTitle}>{t("columns.totalReturn")}</Text>
            <Text style={[styles.summaryValue, styles.valueNegative]}>
              {formatCurrency(closing.returnsCost || undefined)}
            </Text>
          </View>
        </View>

        {/* Final Balance (Spans full width) */}
        <View style={styles.finalBox}>
          <Text style={styles.finalTitle}>{t("columns.finalBalance")}</Text>
          <Text style={styles.finalValue}>
            {formatCurrency(closing.netProfit || undefined)}
          </Text>
        </View>

      </Page>
    </Document>
  );
};

export default StoreClosingPDF;