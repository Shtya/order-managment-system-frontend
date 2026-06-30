import React from "react";
import { Document, Page, Text, View, StyleSheet, Svg, Path, Polyline } from "@react-pdf/renderer";
import { DEFAULT_FONT_FAMILY } from "@/utils/healpers";
import {
  PRIMARY,
  SECONDARY,
  SKELETON_BG,
  BORDER,
  TEXT_DARK,
  TEXT_MUTED,
  WHITE,
  DANGER_BG,
  DANGER_TEXT,
} from "@/utils/colors";

const styles = StyleSheet.create({
  page: {
    padding: 24,
    backgroundColor: WHITE,
    fontFamily: DEFAULT_FONT_FAMILY,
    fontSize: 10,
    color: TEXT_DARK,
  },
  // Header
  headerBand: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottom: `1px solid ${BORDER}`,
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerBrand: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  brandIconBox: {
    width: 32,
    height: 32,
    backgroundColor: SKELETON_BG,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  docTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: TEXT_DARK,
  },
  docSubtitle: {
    fontSize: 10,
    fontWeight: 600,
    color: TEXT_MUTED,
    textTransform: "uppercase",
  },
  headerRef: {
    alignItems: "flex-end",
  },
  refBadge: {
    backgroundColor: PRIMARY,
    color: WHITE,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    fontFamily: DEFAULT_FONT_FAMILY,
    marginBottom: 4,
  },
  refDate: {
    fontSize: 9,
    color: TEXT_MUTED,
  },
  refEmployee: {
    fontSize: 9,
    color: TEXT_MUTED,
    fontWeight: 600,
  },
  // Meta Strip
  metaStrip: {
    display: "flex",
    backgroundColor: SKELETON_BG,
    borderRadius: 8,
    padding: 12,
    justifyContent: "space-between",
  },
  metaCell: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 9,
    color: TEXT_MUTED,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: 700,
  },
  monoText: {
    fontFamily: DEFAULT_FONT_FAMILY,
  },
  // Orders Wrap
  sectionLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: PRIMARY,
    marginBottom: 12,
    borderBottom: `2px solid ${SKELETON_BG}`,
    paddingBottom: 4,
  },
  orderCard: {
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
  },
  orderHead: {
    backgroundColor: SKELETON_BG,
    padding: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: `1px solid ${BORDER}`,
  },
  orderHeadSection: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  orderIndexContainer: {
    backgroundColor: PRIMARY,
    color: WHITE,
    width: 20,
    height: 20,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  orderIndexText: {
    color: WHITE,
    fontSize: 10,
    fontFamily: DEFAULT_FONT_FAMILY,
  },
  orderCode: {
    fontSize: 12,
    fontWeight: 700,
    fontFamily: DEFAULT_FONT_FAMILY,
  },
  orderCustomer: {
    fontWeight: 700,
    fontSize: 11,
  },
  orderPhone: {
    fontFamily: DEFAULT_FONT_FAMILY,
    color: TEXT_MUTED,
  },
  trackingBadge: {
    backgroundColor: WHITE,
    border: `1px solid ${BORDER}`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontFamily: DEFAULT_FONT_FAMILY,
  },
  // Table
  tableHeader: {
    display: "flex",
    backgroundColor: WHITE,
    borderBottom: `1px solid ${BORDER}`,
    padding: 8,
  },
  tableRow: {
    display: "flex",
    padding: 8,
    borderBottom: `1px solid ${SKELETON_BG}`,
  },
  th: {
    fontSize: 9,
    color: TEXT_MUTED,
    fontWeight: 700,
  },
  td: {
    fontSize: 10,
    fontWeight: 600,
  },
  colSku: { flex: 2, fontFamily: DEFAULT_FONT_FAMILY },
  colProduct: { flex: 5 },
  colQty: { flex: 1, textAlign: "center", fontFamily: DEFAULT_FONT_FAMILY },
  // Signature Block
  sigWrap: {
    marginTop: 30,
    padding: 16,
    backgroundColor: SKELETON_BG,
    borderRadius: 8,
  },
  sigHead: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 16,
    color: PRIMARY,
  },
  sigFields: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
  },
  sigField: {
    flex: 1,
  },
  sigFieldLabel: {
    fontSize: 10,
    color: TEXT_MUTED,
    marginBottom: 8,
  },
  sigLine: {
    borderBottom: `1px dashed ${BORDER}`,
    height: 16,
  },
  // Footer
  footer: {
    marginTop: 30,
    display: "flex",
    justifyContent: "space-between",
    borderTop: `1px solid ${BORDER}`,
    paddingTop: 12,
  },
  footerText: {
    fontSize: 9,
    color: TEXT_MUTED,
  }
});

const OutgoingPDF = ({ orders, carrier, employee, now, labels, locale }) => {
  const isArabic = locale === "ar";
  const flexDir = isArabic ? "row-reverse" : "row";
  const textAlign = isArabic ? "right" : "left";

  return (
    <Document>
      <Page size="A4" style={[styles.page, { direction: isArabic ? "rtl" : "ltr", textAlign }]}>

        {/* --- HEADER --- */}
        <View style={styles.headerBand}>
          <View style={[styles.headerTop, { flexDirection: flexDir }]}>
            <View style={[styles.headerBrand, { flexDirection: flexDir }]}>
              <View style={styles.brandIconBox}>
                {/* SVG Icon translation */}
                <Svg viewBox="0 0 24 24" width={16} height={16} stroke={PRIMARY} fill="none" strokeWidth={2}>
                  <Path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />
                  <Path d="m7.5 4.27 9 5.15M3.29 7 12 12l8.71-5M12 22V12" />
                  <Path d="M18 15l3 3-3 3M15 18h6" />
                </Svg>
              </View>
              <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
                <Text style={styles.docTitle}>{labels.title}</Text>
                <Text style={styles.docSubtitle}>OUTGOING SHIPMENT · {carrier}</Text>
              </View>
            </View>

            <View style={[styles.headerRef, { alignItems: isArabic ? "flex-start" : "flex-end" }]}>

              <Text style={styles.refDate}>{now}</Text>
              <Text style={styles.refEmployee}>{employee}</Text>
            </View>
          </View>

          {/* --- META STRIP --- */}
          <View style={[styles.metaStrip, { flexDirection: flexDir }]}>
            <View style={[styles.metaCell, { alignItems: isArabic ? "flex-end" : "flex-start" }]}>
              <Text style={styles.metaLabel}>{labels.carrier}</Text>
              <Text style={styles.metaValue}>{carrier}</Text>
            </View>
            <View style={[styles.metaCell, { alignItems: isArabic ? "flex-end" : "flex-start" }]}>
              <Text style={styles.metaLabel}>{labels.shipDate}</Text>
              <Text style={[styles.metaValue, styles.monoText]}>{now}</Text>
            </View>
            <View style={[styles.metaCell, { alignItems: isArabic ? "flex-end" : "flex-start" }]}>
              <Text style={styles.metaLabel}>{labels.employee}</Text>
              <Text style={styles.metaValue}>{employee}</Text>
            </View>
            <View style={[styles.metaCell, { alignItems: isArabic ? "flex-end" : "flex-start" }]}>
              <Text style={styles.metaLabel}>{labels.totalOrders}</Text>
              <Text style={[styles.metaValue, { color: PRIMARY }]}>{orders.length} {labels.orderUnit}</Text>
            </View>
          </View>
        </View>

        {/* --- ORDERS LIST --- */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.sectionLabel, { textAlign }]}>{labels.ordersDetail || "تفاصيل الطلبات"}</Text>

          {orders.map((o, idx) => (
            <View key={o.code} style={styles.orderCard} wrap={false}>

              {/* Order Card Header */}
              <View style={[styles.orderHead, { flexDirection: flexDir }]}>
                <View style={[styles.orderHeadSection, { flexDirection: flexDir }]}>

                  <View style={styles.orderIndexContainer}>
                    <Text style={styles.orderIndexText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.orderCode}>{o.code}</Text>
                </View>

                <View style={[styles.orderHeadSection, { flexDirection: flexDir }]}>
                  <Text style={styles.orderCustomer}>{o.customer}</Text>
                  {o.phone && <Text style={styles.orderPhone}> | {o.phone}</Text>}
                  <Text style={styles.orderPhone}> | {o.city}</Text>
                </View>

                <View style={styles.orderHeadSection}>
                  <Text style={styles.trackingBadge}>
                    {o.trackingNumber !== "-" ? `AWB: ${o.trackingNumber}` : "No AWB"}
                  </Text>
                </View>
              </View>

              {/* Order Products Table */}
              <View>
                <View style={[styles.tableHeader, { flexDirection: flexDir }]}>
                  <Text style={[styles.th, styles.colSku, { textAlign }]}>{labels.sku || 'SKU'}</Text>
                  <Text style={[styles.th, styles.colProduct, { textAlign }]}>{labels.product || 'Product'}</Text>
                  <Text style={[styles.th, styles.colQty]}>{labels.qty || 'Qty'}</Text>
                </View>

                {o.products.map((p, pIdx) => (
                  <View key={pIdx} style={[styles.tableRow, { flexDirection: flexDir }]}>
                    <Text style={[styles.td, styles.colSku, { textAlign }]}>{p.sku}</Text>
                    <Text style={[styles.td, styles.colProduct, { textAlign }]}>{p.name}</Text>
                    <Text style={[styles.td, styles.colQty]}>{p.quantity}</Text>
                  </View>
                ))}
              </View>

            </View>
          ))}
        </View>

        {/* --- SIGNATURE BLOCK --- */}
        <View style={styles.sigWrap} wrap={false}>
          <Text style={[styles.sigHead, { textAlign }]}>{labels.receiptConfirmation}</Text>
          <View style={[styles.sigFields, { flexDirection: flexDir }]}>
            <View style={styles.sigField}>
              <Text style={[styles.sigFieldLabel, { textAlign }]}>{labels.courierName}</Text>
              <View style={styles.sigLine} />
            </View>
            <View style={styles.sigField}>
              <Text style={[styles.sigFieldLabel, { textAlign }]}>{labels.signature}</Text>
              <View style={styles.sigLine} />
            </View>
            <View style={styles.sigField}>
              <Text style={[styles.sigFieldLabel, { textAlign }]}>{labels.dateTime}</Text>
              <View style={styles.sigLine} />
            </View>
          </View>
        </View>

        {/* --- FOOTER --- */}
        <View style={[styles.footer, { flexDirection: flexDir }]} fixed>
          <View style={{ display: "flex", flexDirection: flexDir, alignItems: "center", gap: 8 }}>
            <Svg viewBox="0 0 10 10" width={10} height={10} stroke={TEXT_MUTED} fill="none">
              <Polyline points="2,5 4,7 8,3" />
            </Svg>
            <Text style={styles.footerText}>{labels.title}</Text>
            <Text style={styles.footerText}>|</Text>
            <Text style={styles.footerText}>{labels.system || "نظام إدارة المستودعات"}</Text>
          </View>
          <Text style={styles.footerText}>{now}</Text>
        </View>

      </Page>
    </Document>
  );
};

export default OutgoingPDF;