import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { WHITE,BORDER,DANGER_BG,DANGER_BORDER,DANGER_TEXT,PRIMARY,SKELETON_BG,TEXT_DARK,TEXT_MUTED,SECONDARY } from "@/utils/colors";
import {  DEFAULT_FONT_FAMILY } from "@/utils/healpers";

// Specific colors from your HTML
const PURPLE_BG = "#faf5ff";
const PURPLE_BORDER = "#e9d5ff";
const PURPLE_TEXT = "#7c3aed";

const EMERALD_BG = "#f0fdf4";
const EMERALD_BORDER = "#d1fae5";
const EMERALD_TEXT = "#059669";

const RED_BG = "#fef2f2";
const RED_BORDER = "#fecaca";
const RED_TEXT = "#dc2626";

const ORANGE_TEXT = "#ea580c";

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
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
  },
  summaryGrid: {
    display: "flex",
    gap: 10,
    marginBottom: 30,
  },
  summaryBox: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: 8,
    alignItems: "center",
  },
  summaryTitle: {
    fontSize: 10,
    textTransform: "uppercase",
    marginBottom: 6,
    fontWeight: 700,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 700,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: TEXT_DARK,
    borderBottom: `1px solid ${BORDER}`,
    paddingBottom: 5,
    marginBottom: 10,
  },
  table: {
    width: "100%",
  },
  tableRow: {
    display: "flex",
    borderBottom: `1px solid ${BORDER}`,
  },
  tableHeader: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableCellBase: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  col: { flex: 1 },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 700,
    color: TEXT_DARK,
  },
  tableCellText: {
    fontSize: 10,
    color: TEXT_DARK,
  },
  emptyText: {
    fontSize: 12,
    color: TEXT_MUTED,
    textAlign: "center",
    padding: 15,
  },
});

const SupplierStatementPDF = ({ data, supplier, filters, t, tCommon, locale }) => {
  const isArabic = locale === "ar";
  
  // RTL handling helpers
  const flexRowDir = isArabic ? "row-reverse" : "row";
  const textAlign = isArabic ? "right" : "left";

  const finalBalance = data?.summary?.finalBalance || 0;
  const isFinalBalancePositive = finalBalance > 0;
  
  // Dynamic final balance styles
  const finalBgColor = isFinalBalancePositive ? RED_BG : EMERALD_BG;
  const finalBorderColor = isFinalBalancePositive ? RED_BORDER : EMERALD_BORDER;
  const finalTextColor = isFinalBalancePositive ? RED_TEXT : EMERALD_TEXT;

  return (
    <Document>
      <Page 
        size="A4" 
        style={[styles.page, { direction: isArabic ? "rtl" : "ltr", textAlign }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t("supplierAccounts.statement.title")} - {supplier?.name}
          </Text>
          <Text style={styles.headerSubtitle}>
            {t("filters.dateRange")}: {filters.startDate ? new Date(filters.startDate).toLocaleDateString() : ''} {tCommon("to")} {filters.endDate ? new Date(filters.endDate).toLocaleDateString() : ''}
          </Text>
        </View>

        {/* Summary Grid */}
        <View style={[styles.summaryGrid, { flexDirection: flexRowDir }]}>
          {/* Total Purchases */}
          <View style={[styles.summaryBox, { backgroundColor: PURPLE_BG, borderColor: PURPLE_BORDER }]}>
            <Text style={[styles.summaryTitle, { color: PURPLE_TEXT }]}>{t("supplierAccounts.statement.totalPurchases")}</Text>
            <Text style={[styles.summaryValue, { color: PURPLE_TEXT }]}>{data?.summary?.totalPurchases?.toLocaleString() || 0}</Text>
          </View>
          
          {/* Total Paid */}
          <View style={[styles.summaryBox, { backgroundColor: EMERALD_BG, borderColor: EMERALD_BORDER }]}>
            <Text style={[styles.summaryTitle, { color: EMERALD_TEXT }]}>{t("supplierAccounts.statement.totalPaid")}</Text>
            <Text style={[styles.summaryValue, { color: EMERALD_TEXT }]}>{data?.summary?.totalPaid?.toLocaleString() || 0}</Text>
          </View>
          
          {/* Total Returns */}
          <View style={[styles.summaryBox, { backgroundColor: PURPLE_BG, borderColor: PURPLE_BORDER }]}>
            <Text style={[styles.summaryTitle, { color: PURPLE_TEXT }]}>{t("supplierAccounts.statement.totalReturns")}</Text>
            <Text style={[styles.summaryValue, { color: PURPLE_TEXT }]}>{data?.summary?.totalReturns?.toLocaleString() || 0}</Text>
          </View>
          
          {/* Total Taken */}
          <View style={[styles.summaryBox, { backgroundColor: RED_BG, borderColor: RED_BORDER }]}>
            <Text style={[styles.summaryTitle, { color: RED_TEXT }]}>{t("supplierAccounts.statement.totalTaken")}</Text>
            <Text style={[styles.summaryValue, { color: RED_TEXT }]}>{data?.summary?.totalTaken?.toLocaleString() || 0}</Text>
          </View>
          
          {/* Net Balance */}
          <View style={[styles.summaryBox, { backgroundColor: finalBgColor, borderColor: finalBorderColor }]}>
            <Text style={[styles.summaryTitle, { color: finalTextColor }]}>{t("supplierAccounts.statement.netBalance")}</Text>
            <Text style={[styles.summaryValue, { color: finalTextColor, fontSize: 18 }]}>{finalBalance.toLocaleString()}</Text>
          </View>
        </View>

        {/* Purchases Table */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign }]}>{t("supplierAccounts.statement.detailedPurchases")}</Text>
          <View style={styles.table}>
            {/* Header */}
            <View style={[styles.tableRow, styles.tableHeader, { flexDirection: flexRowDir }]}>
              <View style={styles.col}><Text style={[styles.tableHeaderText, { textAlign }]}>{t("supplierAccounts.statement.invoiceRef")}</Text></View>
              <View style={styles.col}><Text style={[styles.tableHeaderText, { textAlign }]}>{t("supplierAccounts.statement.date")}</Text></View>
              <View style={styles.col}><Text style={[styles.tableHeaderText, { textAlign }]}>{t("table.subtotal")}</Text></View>
              <View style={styles.col}><Text style={[styles.tableHeaderText, { textAlign }]}>{t("table.paidAmount")}</Text></View>
              <View style={styles.col}><Text style={[styles.tableHeaderText, { textAlign }]}>{t("table.remainingAmount")}</Text></View>
            </View>
            
            {/* Body */}
            {data?.purchaseInvoices?.length > 0 ? (
              data.purchaseInvoices.map((inv, idx) => (
                <View key={idx} style={[styles.tableRow, styles.tableCellBase, { flexDirection: flexRowDir }]}>
                  <View style={styles.col}><Text style={[styles.tableCellText, { textAlign }]}>{inv.ref || '-'}</Text></View>
                  <View style={styles.col}><Text style={[styles.tableCellText, { textAlign }]}>{inv.date}</Text></View>
                  <View style={styles.col}><Text style={[styles.tableCellText, { textAlign }]}>{Number(inv.subtotal || 0).toLocaleString()}</Text></View>
                  <View style={styles.col}><Text style={[styles.tableCellText, { color: EMERALD_TEXT, fontWeight: 700, textAlign }]}>{Number(inv.paidAmount || 0).toLocaleString()}</Text></View>
                  <View style={styles.col}>
                    <Text style={[styles.tableCellText, { fontWeight: 700, textAlign, color: inv.remainingAmount > 0 ? ORANGE_TEXT : TEXT_MUTED }]}>
                      {Number(inv.remainingAmount || 0).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>{t("supplierAccounts.noPurchasesPeriod")}</Text>
            )}
          </View>
        </View>

        {/* Returns Table */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign }]}>{t("supplierAccounts.statement.detailedReturns")}</Text>
          <View style={styles.table}>
            {/* Header */}
            <View style={[styles.tableRow, styles.tableHeader, { flexDirection: flexRowDir }]}>
              <View style={styles.col}><Text style={[styles.tableHeaderText, { textAlign }]}>{t("supplierAccounts.statement.invoiceRef")}</Text></View>
              <View style={styles.col}><Text style={[styles.tableHeaderText, { textAlign }]}>{t("supplierAccounts.statement.date")}</Text></View>
              <View style={styles.col}><Text style={[styles.tableHeaderText, { textAlign }]}>{t("table.subtotal")}</Text></View>
              <View style={styles.col}><Text style={[styles.tableHeaderText, { textAlign }]}>{t("table.tax")}</Text></View>
              <View style={styles.col}><Text style={[styles.tableHeaderText, { textAlign }]}>{t("table.totalReturn")}</Text></View>
              <View style={styles.col}><Text style={[styles.tableHeaderText, { textAlign }]}>{t("table.takanAmount")}</Text></View>
              <View style={styles.col}><Text style={[styles.tableHeaderText, { textAlign }]}>{t("table.remainingAmount")}</Text></View>
            </View>
            
            {/* Body */}
            {data?.returnInvoices?.length > 0 ? (
              data.returnInvoices.map((inv, idx) => {
                const remaining = Number(inv.totalReturn || 0) - Number(inv.paidAmount || 0);
                return (
                  <View key={idx} style={[styles.tableRow, styles.tableCellBase, { flexDirection: flexRowDir }]}>
                    <View style={styles.col}><Text style={[styles.tableCellText, { textAlign }]}>{inv.ref || '-'}</Text></View>
                    <View style={styles.col}><Text style={[styles.tableCellText, { textAlign }]}>{inv.date}</Text></View>
                    <View style={styles.col}><Text style={[styles.tableCellText, { textAlign }]}>{Number(inv.subtotal || 0).toLocaleString()}</Text></View>
                    <View style={styles.col}><Text style={[styles.tableCellText, { textAlign }]}>{Number(inv.taxTotal || 0).toLocaleString()}</Text></View>
                    <View style={styles.col}><Text style={[styles.tableCellText, { color: RED_TEXT, fontWeight: 700, textAlign }]}>{Number(inv.totalReturn || 0).toLocaleString()}</Text></View>
                    <View style={styles.col}><Text style={[styles.tableCellText, { color: EMERALD_TEXT, fontWeight: 700, textAlign }]}>{Number(inv.paidAmount || 0).toLocaleString()}</Text></View>
                    <View style={styles.col}>
                      <Text style={[styles.tableCellText, { fontWeight: 700, textAlign, color: remaining > 0 ? ORANGE_TEXT : TEXT_MUTED }]}>
                        {remaining.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>{t("supplierAccounts.noReturnsPeriod")}</Text>
            )}
          </View>
        </View>

      </Page>
    </Document>
  );
};

export default SupplierStatementPDF;