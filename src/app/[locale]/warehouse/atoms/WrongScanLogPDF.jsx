import React from "react";
import { Document, Page, Text, View, StyleSheet, Svg, Path, Line } from "@react-pdf/renderer";
import { DEFAULT_FONT_FAMILY } from "@/utils/healpers";
import {
  PRIMARY,
  ERR,
  ERR_MID,
  ERR_SOFT,
  ERR_RULE,
  CREAM,
  CREAM_WARM,
  CREAM_DEEP,
  CHARCOAL,
  CHARCOAL_SOFT,
  CHARCOAL_MID,
  CHARCOAL_MUTED,
  CHARCOAL_FAINT,
  WHITE,
  RULE,
  RULE_SOFT,
} from "@/utils/colors";

const styles = StyleSheet.create({
  page: {
    backgroundColor: WHITE,
    fontFamily: DEFAULT_FONT_FAMILY,
    color: CHARCOAL,
  },
  // --- HEADER ---
  headerBand: {
    backgroundColor: CREAM,
    borderBottom: `2px solid ${CREAM_DEEP}`,
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    borderBottom: `1px solid ${RULE}`,
  },
  headerBrand: {
    padding: "24px 32px",
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  brandIcon: {
    width: 42,
    height: 42,
    backgroundColor: ERR,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  docTitle: {
    fontSize: 19,
    fontWeight: 700,
    color: CHARCOAL,
  },
  docSubtitle: {
    fontFamily: DEFAULT_FONT_FAMILY,
    fontSize: 11,
    color: CHARCOAL_SOFT,
    marginTop: 3,
  },
  headerRef: {
    padding: "24px 32px",
    display: "flex",
    justifyContent: "center",
    gap: 5,
  },
  refBadge: {
    fontFamily: DEFAULT_FONT_FAMILY,
    fontSize: 10,
    fontWeight: 700,
    color: ERR_MID,
    backgroundColor: ERR_SOFT,
    padding: "4px 8px",
    borderRadius: 4,
    border: `1px solid ${ERR_RULE}`,
  },
  refDate: {
    fontFamily: DEFAULT_FONT_FAMILY,
    fontSize: 11,
    color: CHARCOAL_MUTED,
  },
  
  // --- ORDER INFO (CONDITIONAL) ---
  orderHeader: {
    padding: "20px 32px",
    borderBottom: `1px solid ${RULE}`,
    backgroundColor: CREAM_WARM,
  },
  orderHeaderTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  orderHeaderTitle: {
    fontSize: 16,
    color: CHARCOAL,
    fontWeight: 700,
  },
  orderHeaderNumber: {
    fontFamily: DEFAULT_FONT_FAMILY,
    fontWeight: 700,
    color: PRIMARY,
    fontSize: 14,
  },
  orderHeaderGrid: {
    display: "flex",
    gap: 20,
  },
  orderGridItem: {
    flex: 1,
  },
  orderGridLabel: {
    fontSize: 10,
    color: CHARCOAL_MUTED,
    marginBottom: 4,
  },
  orderGridValue: {
    fontWeight: 600,
    fontSize: 13,
  },

  // --- META STRIP ---
  metaStrip: {
    display: "flex",
    backgroundColor: CREAM_WARM,
  },
  metaCell: {
    flex: 1,
    padding: "16px 20px",
  },
  metaLabel: {
    fontFamily: DEFAULT_FONT_FAMILY,
    fontSize: 9,
    fontWeight: 700,
    color: CHARCOAL_FAINT,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 15,
    fontWeight: 700,
    color: CHARCOAL,
  },
  metaValueMono: {
    fontFamily: DEFAULT_FONT_FAMILY,
    fontSize: 13,
  },
  metaValueErr: {
    color: ERR,
  },

  // --- TABLE ---
  tableWrap: {
    padding: "24px 32px 32px",
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: CHARCOAL_FAINT,
    marginBottom: 16,
  },
  tableCard: {
    border: `1px solid ${RULE}`,
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeaderRow: {
    display: "flex",
    backgroundColor: CREAM_WARM,
    borderBottom: `1px solid ${RULE}`,
  },
  tableRow: {
    display: "flex",
    borderBottom: `1px solid ${RULE_SOFT}`,
    backgroundColor: WHITE,
  },
  th: {
    fontFamily: DEFAULT_FONT_FAMILY,
    fontSize: 9,
    fontWeight: 700,
    color: CHARCOAL_MUTED,
    padding: "10px 16px",
    textTransform: "uppercase",
  },
  td: {
    fontSize: 11,
    color: CHARCOAL_MID,
    padding: "11px 16px",
    justifyContent: "center",
  },
  tdCenter: {
    textAlign: "center",
    alignItems: "center",
  },
  colIdx: { flex: 0.5, fontFamily: DEFAULT_FONT_FAMILY, color: CHARCOAL_FAINT },
  colCode: { flex: 2, fontFamily: DEFAULT_FONT_FAMILY, fontWeight: 700, color: ERR },
  colUser: { flex: 2 },
  colReason: { flex: 2.5 },
  colTime: { flex: 2, },
  
  badgeError: {
    backgroundColor: ERR_SOFT,
    color: ERR_MID,
    border: `1px solid ${ERR_RULE}`,
    padding: "4px 8px",
    borderRadius: 12,
    fontSize: 10,
    fontWeight: 700,
  },
  timeBadgeContainer: {
    backgroundColor: CREAM_WARM,
    border: `1px solid ${RULE}`,
    padding: "6px 10px",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  timeBadgeText: {
    textWrap: "nowrap",
    fontSize: 10,
    fontWeight: 700,
    color: CHARCOAL,
    fontFamily: DEFAULT_FONT_FAMILY,
    textAlign: "center",
  },

  // --- FOOTER ---
  footer: {
    backgroundColor: CREAM,
    borderTop: `1px solid ${RULE}`,
    padding: "12px 32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerMark: {
    width: 16,
    height: 16,
    backgroundColor: ERR,
    borderRadius: 3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    fontFamily: DEFAULT_FONT_FAMILY,
    fontSize: 9,
    color: CHARCOAL_MUTED,
  },
});

const WrongScanLogPDF = ({ logs, carrier, now, labels, orderInfo, locale }) => {
  const isArabic = locale === "ar";
  const flexDir = isArabic ? "row-reverse" : "row";
  const textAlign = isArabic ? "right" : "left";
  const borderSide = isArabic ? "borderRight" : "borderLeft";

  return (
    <Document>
      <Page size="A4" style={[styles.page, { direction: isArabic ? "rtl" : "ltr", textAlign }]}>
        
        {/* HEADER */}
        <View style={styles.headerBand}>
          <View style={[styles.headerTop, { flexDirection: flexDir }]}>
            
            <View style={[styles.headerBrand, { flexDirection: flexDir, [borderSide]: `1px solid ${RULE}` }]}>
              <View style={styles.brandIcon}>
                <Svg viewBox="0 0 24 24" width={22} height={22} stroke="#fdf5f4" fill="none" strokeWidth={2}>
                  <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <Line x1="12" y1="9" x2="12" y2="13"/>
                  <Line x1="12" y1="17" x2="12.01" y2="17"/>
                </Svg>
              </View>
              <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
                <Text style={styles.docTitle}>{labels.title}</Text>
                <Text style={styles.docSubtitle}>WRONG SCAN LOG · {carrier}</Text>
              </View>
            </View>

            <View style={[styles.headerRef, { alignItems: isArabic ? "flex-start" : "flex-end" }]}>
              
              <Text style={styles.refDate}>{now}</Text>
            </View>
          </View>

          {/* OPTIONAL ORDER INFO */}
          {orderInfo && (
            <View style={styles.orderHeader}>
              <View style={[styles.orderHeaderTop, { flexDirection: flexDir }]}>
                <Text style={styles.orderHeaderTitle}>{labels.orderInfo}</Text>
                <Text style={styles.orderHeaderNumber}>{orderInfo.orderNumber}</Text>
              </View>
              <View style={[styles.orderHeaderGrid, { flexDirection: flexDir }]}>
                <View style={[styles.orderGridItem, { alignItems: isArabic ? "flex-end" : "flex-start" }]}>
                  <Text style={styles.orderGridLabel}>{labels.customer}</Text>
                  <Text style={styles.orderGridValue}>{orderInfo.customerName}</Text>
                </View>
                <View style={[styles.orderGridItem, { alignItems: isArabic ? "flex-end" : "flex-start" }]}>
                  <Text style={styles.orderGridLabel}>{labels.city}</Text>
                  <Text style={styles.orderGridValue}>{orderInfo.city}</Text>
                </View>
                <View style={[styles.orderGridItem, { alignItems: isArabic ? "flex-end" : "flex-start" }]}>
                  <Text style={styles.orderGridLabel}>{labels.phone}</Text>
                  <Text style={[styles.orderGridValue, { fontFamily: DEFAULT_FONT_FAMILY }]}>{orderInfo.phoneNumber}</Text>
                </View>
              </View>
            </View>
          )}

          {/* META STRIP */}
          <View style={[styles.metaStrip, { flexDirection: flexDir }]}>
            <View style={[styles.metaCell, { alignItems: isArabic ? "flex-end" : "flex-start" }]}>
              <Text style={styles.metaLabel}>{labels.carrier}</Text>
              <Text style={styles.metaValue}>{carrier}</Text>
            </View>
            <View style={[styles.metaCell, { [borderSide]: `1px solid ${RULE}`, alignItems: isArabic ? "flex-end" : "flex-start" }]}>
              <Text style={styles.metaLabel}>{labels.date}</Text>
              <Text style={[styles.metaValue, styles.metaValueMono]}>{now}</Text>
            </View>
            <View style={[styles.metaCell, { [borderSide]: `3px solid ${ERR}`, alignItems: isArabic ? "flex-end" : "flex-start" }]}>
              <Text style={styles.metaLabel}>{labels.totalFailedAttempts}</Text>
              <Text style={[styles.metaValue, styles.metaValueErr]}>{logs.length} {labels.attemptUnit}</Text>
            </View>
          </View>
        </View>

        {/* TABLE */}
        <View style={styles.tableWrap}>
          <Text style={[styles.sectionLabel, { textAlign }]}>{labels.totalAttempts}: {logs.length}</Text>
          
          <View style={styles.tableCard}>
            <View style={[styles.tableHeaderRow, { flexDirection: flexDir }]}>
              <Text style={[styles.th, styles.colIdx, styles.tdCenter]}>#</Text>
              <Text style={[styles.th, styles.colCode, { textAlign }]}>{labels.orderNumber}</Text>
              <Text style={[styles.th, styles.colCode, { textAlign }]}>{labels.scannedCode}</Text>
              <Text style={[styles.th, styles.colUser, { textAlign }]}>{labels.userName}</Text>
              <Text style={[styles.th, styles.colReason, { textAlign }]}>{labels.failReason}</Text>
              <Text style={[styles.th, styles.colTime, { textAlign }]}>{labels.time}</Text>
            </View>

            {logs.map((l, i) => (
              <View key={i} style={[styles.tableRow, { flexDirection: flexDir }]} wrap={false}>
                <View style={[styles.td, styles.colIdx, styles.tdCenter]}>
                  <Text>{i + 1}</Text>
                </View>
                <View style={[styles.td, styles.colCode, { alignItems: isArabic ? "flex-end" : "flex-start" }]}>
                  <Text>{l.orderNumber}</Text>
                </View>
                <View style={[styles.td, styles.colCode, { alignItems: isArabic ? "flex-end" : "flex-start" }]}>
                  <Text>{l.sku}</Text>
                </View>
                <View style={[styles.td, styles.colUser, { alignItems: isArabic ? "flex-end" : "flex-start" }]}>
                  <Text>{l.userName}</Text>
                </View>
                <View style={[styles.td, styles.colReason, { alignItems: isArabic ? "flex-end" : "flex-start" }]}>
                  <Text style={styles.badgeError}>{labels.reasons?.[l.reason] || l.reason}</Text>
                </View>
                <View style={[styles.td, styles.colTime, { alignItems: isArabic ? "flex-end" : "flex-start" }]}>
                  <View style={styles.timeBadgeContainer}>
                    <Text style={styles.timeBadgeText}>{l.time}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* FOOTER */}
        <View style={[styles.footer, { flexDirection: flexDir }]} fixed>
          <View style={{ display: "flex", flexDirection: flexDir, alignItems: "center", gap: 8 }}>
            <View style={styles.footerMark}>
              <Svg viewBox="0 0 10 10" width={9} height={9} stroke={CREAM} fill="none" strokeWidth={2.2}>
                <Line x1="3" y1="3" x2="7" y2="7"/>
                <Line x1="7" y1="3" x2="3" y2="7"/>
              </Svg>
            </View>
            <Text style={styles.footerText}>{labels.title}</Text>
            <Text style={styles.footerText}>|</Text>
            <Text style={styles.footerText}>{labels.system}</Text>
          </View>
          <Text style={styles.footerText}>{now}</Text>
        </View>

      </Page>
    </Document>
  );
};

export default WrongScanLogPDF;