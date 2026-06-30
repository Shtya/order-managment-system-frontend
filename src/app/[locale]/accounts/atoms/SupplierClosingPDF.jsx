import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { WHITE,BORDER,DANGER_BG,DANGER_BORDER,DANGER_TEXT,PRIMARY,SKELETON_BG,TEXT_DARK,TEXT_MUTED,SECONDARY } from "@/utils/colors";
import {  DEFAULT_FONT_FAMILY } from "@/utils/healpers";


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
    marginBottom: 4,
  },
  summaryGrid: {
    display: "flex",
    gap: 15,
    marginBottom: 30,
  },
  summaryBox: {
    flex: 1,
    padding: 15,
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    backgroundColor: SKELETON_BG,
    alignItems: "center",
  },
  summaryBoxFinal: {
    border: `1px solid ${DANGER_BORDER}`,
    backgroundColor: DANGER_BG,
  },
  summaryTitle: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 700,
    color: TEXT_DARK,
  },
  summaryValueFinal: {
    color: DANGER_TEXT,
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
  // Table Styles
  table: {
    width: "100%",
  },
  tableRow: {
    display: "flex",
    borderBottom: `1px solid ${BORDER}`,
  },
  tableHeader: {
    backgroundColor: SKELETON_BG,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableCellBase: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  col1: { flex: 2 }, // Invoice Ref
  col2: { flex: 2 }, // Date
  col3: { flex: 2 }, // Amount
  tableHeaderText: {
    fontSize: 12,
    fontWeight: 700,
    color: TEXT_DARK,
  },
  tableCellText: {
    fontSize: 12,
    color: TEXT_DARK,
  },
  emptyText: {
    fontSize: 12,
    color: TEXT_MUTED,
    textAlign: "center",
    padding: 15,
  }
});

const SupplierClosingPDF = ({ closingRow, supplier, purchases, returns, t, tCommon, locale }) => {
  const isArabic = locale === "ar";
  
  // Helper for dynamic flex directions
  const flexRowDir = isArabic ? "row-reverse" : "row";
  const textAlign = isArabic ? "right" : "left";

  return (
    <Document>
      <Page 
        size="A4" 
        style={[
          styles.page, 
          { direction: isArabic ? "rtl" : "ltr", textAlign }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t("supplierAccounts.history.title")} - {supplier?.name}
          </Text>
          <Text style={styles.headerSubtitle}>
            {t("supplierAccounts.history.period")}: {new Date(closingRow.startDate).toLocaleDateString()} {tCommon("to")} {new Date(closingRow.endDate).toLocaleDateString()}
          </Text>
          <Text style={styles.headerSubtitle}>
            {t("supplierAccounts.history.closedAt")}: {new Date(closingRow.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Summary Grid */}
        <View style={[styles.summaryGrid, { flexDirection: flexRowDir }]}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>{t("supplierAccounts.close.totalPurchases")}</Text>
            <Text style={styles.summaryValue}>{Number(closingRow.totalPurchases).toLocaleString()}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>{t("supplierAccounts.close.totalReturns")}</Text>
            <Text style={styles.summaryValue}>{Number(closingRow.totalReturns * -1).toLocaleString()}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>{t("supplierAccounts.close.totalPayments")}</Text>
            <Text style={styles.summaryValue}>{Number(closingRow.totalPaid * -1).toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryBox, styles.summaryBoxFinal]}>
            <Text style={styles.summaryTitle}>{t("supplierAccounts.history.balance")}</Text>
            <Text style={[styles.summaryValue, styles.summaryValueFinal]}>
              {Number(closingRow.finalBalance).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Purchases Table */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign }]}>
            {t("supplierAccounts.statement.detailedPurchases")}
          </Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader, { flexDirection: flexRowDir }]}>
              <View style={styles.col1}>
                <Text style={[styles.tableHeaderText, { textAlign }]}>{t("supplierAccounts.statement.invoiceRef")}</Text>
              </View>
              <View style={styles.col2}>
                <Text style={[styles.tableHeaderText, { textAlign }]}>{t("supplierAccounts.statement.date")}</Text>
              </View>
              <View style={styles.col3}>
                <Text style={[styles.tableHeaderText, { textAlign }]}>{t("supplierAccounts.statement.amount")}</Text>
              </View>
            </View>
            
            {/* Table Body */}
            {purchases.length > 0 ? (
              purchases.map((inv, idx) => (
                <View key={idx} style={[styles.tableRow, styles.tableCellBase, { flexDirection: flexRowDir }]}>
                  <View style={styles.col1}>
                    <Text style={[styles.tableCellText, { textAlign }]}>{inv.receiptNumber || inv.invoiceNumber || '-'}</Text>
                  </View>
                  <View style={styles.col2}>
                    <Text style={[styles.tableCellText, { textAlign }]}>{new Date(inv.statusUpdateDate || inv.created_at).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.col3}>
                    <Text style={[styles.tableCellText, { fontWeight: 700, textAlign }]}>{Number(inv.total).toLocaleString()}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>{t("supplierAccounts.noPurchases")}</Text>
            )}
          </View>
        </View>

        {/* Returns Table */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign }]}>
            {t("supplierAccounts.statement.detailedReturns")}
          </Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader, { flexDirection: flexRowDir }]}>
              <View style={styles.col1}>
                <Text style={[styles.tableHeaderText, { textAlign }]}>{t("supplierAccounts.statement.invoiceRef")}</Text>
              </View>
              <View style={styles.col2}>
                <Text style={[styles.tableHeaderText, { textAlign }]}>{t("supplierAccounts.statement.date")}</Text>
              </View>
              <View style={styles.col3}>
                <Text style={[styles.tableHeaderText, { textAlign }]}>{t("supplierAccounts.statement.amount")}</Text>
              </View>
            </View>
            
            {/* Table Body */}
            {returns.length > 0 ? (
              returns.map((inv, idx) => (
                <View key={idx} style={[styles.tableRow, styles.tableCellBase, { flexDirection: flexRowDir }]}>
                  <View style={styles.col1}>
                    <Text style={[styles.tableCellText, { textAlign }]}>{inv.returnNumber || '-'}</Text>
                  </View>
                  <View style={styles.col2}>
                    <Text style={[styles.tableCellText, { textAlign }]}>{new Date(inv.statusUpdateDate || inv.created_at).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.col3}>
                    <Text style={[styles.tableCellText, { fontWeight: 700, color: DANGER_TEXT, textAlign }]}>
                      {Number(inv.totalReturn).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>{t("supplierAccounts.noReturns")}</Text>
            )}
          </View>
        </View>

      </Page>
    </Document>
  );
};

export default SupplierClosingPDF;