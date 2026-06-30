import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import {
  WHITE,
  BORDER,
  DANGER_BG,
  DANGER_BORDER,
  DANGER_TEXT,
  PRIMARY,
  SKELETON_BG,
  TEXT_DARK,
  TEXT_MUTED,
  SECONDARY,
  SUCCESS,
} from "@/utils/colors";
import { DEFAULT_FONT_FAMILY } from "@/utils/healpers";

const SUCCESS_COLOR = SUCCESS;
const DANGER_COLOR = DANGER_TEXT;

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: WHITE,
    fontFamily: DEFAULT_FONT_FAMILY,
  },
  headerBar: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: WHITE,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
  },
  infoGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  infoCard: {
    width: "48%",
    padding: 15,
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    backgroundColor: SKELETON_BG,
  },
  infoLabel: {
    fontSize: 10,
    color: TEXT_MUTED,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: 600,
    color: TEXT_DARK,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: TEXT_DARK,
    marginBottom: 10,
  },
});

const GenericOpPDF = ({ op, order, labels, formatCurrency, locale }) => {
  const isArabic = locale === "ar";
  const flexRowDir = isArabic ? "row-reverse" : "row";
  const textAlign = isArabic ? "right" : "left";
  const resultColor = op.result === "SUCCESS" ? SUCCESS_COLOR : DANGER_COLOR;
  const now = new Date().toLocaleString("en-US");

  return (
    <Document>
      <Page 
        size="A4" 
        style={[
          styles.page, 
          { 
            direction: isArabic ? "rtl" : "ltr", 
            textAlign 
          }
        ]}
      >
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>
            {labels.title} — {labels.opTypeLabel}
          </Text>
          <View style={{ display: "flex", flexDirection: isArabic ? "row-reverse" : "row", gap: 4 }}>
            <Text style={styles.headerSubtitle}>
              {labels.printedAt}
            </Text>
            <Text style={styles.headerSubtitle}>:</Text>
            <Text style={[styles.headerSubtitle, { fontFamily: DEFAULT_FONT_FAMILY }]}>
              {now}
            </Text>
          </View>
          <View style={{ display: "flex", flexDirection: isArabic ? "row-reverse" : "row", gap: 4 }}>
            <Text style={styles.headerSubtitle}>
              {labels.opNumber}
            </Text>
            <Text style={styles.headerSubtitle}>:</Text>
            <Text style={[styles.headerSubtitle, { fontFamily: DEFAULT_FONT_FAMILY }]}>
              {op.id}
            </Text>
          </View>
        </View>

        {/* Info Grid */}
        <View style={[styles.infoGrid, { flexDirection: flexRowDir }]}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{labels.opNumber}</Text>
            <Text style={[styles.infoValue, { fontFamily: DEFAULT_FONT_FAMILY }]}>{op.id}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{labels.opType}</Text>
            <Text style={styles.infoValue}>{labels.opTypeLabel}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{labels.orderNumber}</Text>
            <Text style={[styles.infoValue, { fontFamily: DEFAULT_FONT_FAMILY }]}>{op.orderNumber || op.order?.orderNumber || "—"}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{labels.carrier}</Text>
            <Text style={styles.infoValue}>{op.carrier || "—"}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{labels.employee}</Text>
            <Text style={styles.infoValue}>{op.employee || "—"}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{labels.result}</Text>
            <Text style={[styles.infoValue, { color: resultColor }]}>
              {op.result === "SUCCESS" ? labels.success : labels.failed}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{labels.datetime}</Text>
            <Text style={[styles.infoValue, { fontFamily: DEFAULT_FONT_FAMILY, fontSize: 12 }]}>
              {op.createdAt || "—"}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{labels.details}</Text>
            <Text style={styles.infoValue}>{op.details || "—"}</Text>
          </View>
        </View>

        {/* Order Info (if available) */}
        {order && (
          <>
            <Text style={styles.sectionTitle}>{labels.orderInfo}</Text>
            <View style={[styles.infoGrid, { flexDirection: flexRowDir }]}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>{labels.customer}</Text>
                <Text style={styles.infoValue}>{order.customer || "—"}</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>{labels.city}</Text>
                <Text style={styles.infoValue}>{order.city || "—"}</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>{labels.total}</Text>
                <Text style={styles.infoValue}>
                  {order.finalTotal ? formatCurrency(order.finalTotal) : "—"}
                </Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>{labels.status}</Text>
                <Text style={styles.infoValue}>{order.status || order.status?.name || "—"}</Text>
              </View>
            </View>
          </>
        )}
      </Page>
    </Document>
  );
};

export default GenericOpPDF;
