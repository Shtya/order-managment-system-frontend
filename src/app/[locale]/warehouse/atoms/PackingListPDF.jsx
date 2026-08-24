"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { DEFAULT_FONT_FAMILY } from "@/utils/healpers";
import { BORDER, PRIMARY, SKELETON_BG, TEXT_DARK, TEXT_MUTED, WHITE } from "@/utils/colors";
import "@/utils/pdfFonts";
import { formatPrintDate } from "./buildPackingListData";
import { avatarSrc } from "@/components/atoms/UserSelect";

const pdfStyles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: WHITE,
    fontFamily: DEFAULT_FONT_FAMILY,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: `2px solid ${BORDER}`,
  },
  headerQR: {
    width: 52,
    height: 52,
    backgroundColor: WHITE,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 20,
    color: TEXT_DARK,
    fontWeight: 700,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 10,
    color: PRIMARY,
    fontWeight: 700,
    marginTop: 3,
    letterSpacing: 1,
    textAlign: "center",
  },
  headerLogo: {
    width: 80,
    height: 40,
    objectFit: "contain",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  statBox: {
    width: "31%",
    padding: 7,
    border: `1px solid ${BORDER}`,
    borderRadius: 6,
    backgroundColor: SKELETON_BG,
  },
  statLabel: {
    fontSize: 8,
    color: TEXT_MUTED,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 10,
    color: TEXT_DARK,
    fontWeight: 700,
  },
  includedWrap: {
    marginBottom: 12,
  },
  includedTitle: {
    fontSize: 9,
    color: TEXT_MUTED,
    marginBottom: 4,
    fontWeight: 700,
  },
  includedList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  orderChip: {
    fontSize: 8,
    color: PRIMARY,
    fontWeight: 700,
    paddingHorizontal: 5,
    paddingVertical: 2,
    border: `1px solid ${BORDER}`,
    borderRadius: 4,
  },
  orderInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  orderInfoBox: {
    width: "31%",
    padding: 7,
    border: `1px solid ${BORDER}`,
    borderRadius: 6,
    backgroundColor: SKELETON_BG,
  },
  locationBand: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SKELETON_BG,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 8,
    marginBottom: 0,
    borderRadius: 4,
  },
  locationText: {
    fontSize: 10,
    color: PRIMARY,
    fontWeight: 700,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SKELETON_BG,
    borderBottom: `1px solid ${BORDER}`,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottom: `1px solid ${BORDER}`,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  th: {
    fontSize: 7,
    color: PRIMARY,
    fontWeight: 700,
  },
  td: {
    fontSize: 8,
    color: TEXT_DARK,
  },
  colCheck: { width: "7%", alignItems: "center" },
  colImage: { width: "16%", alignItems: "center" },
  colName: { width: "24%" },
  colSku: { width: "14%" },
  colLocation: { width: "17%" },
  colQty: { width: "11%", alignItems: "center" },
  colOrders: { width: "11%", alignItems: "center" },
  orderSeparator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 10,
    gap: 8,
  },
  orderSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER,
  },
  orderSeparatorTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: PRIMARY,
    // fontFamily: "Helvetica",
  },
  orderSection: {
    marginBottom: 4,
  },
  checkbox: {
    width: 10,
    height: 10,
    border: `1.2px solid ${TEXT_MUTED}`,
    borderRadius: 2,
  },
  productQr: {
    width: 32,
    height: 32,
  },
  footer: {
    marginTop: 16,
    paddingTop: 10,
    borderTop: `1px solid ${BORDER}`,
  },
  notesBox: {
    border: `1px solid ${BORDER}`,
    borderRadius: 6,
    padding: 8,
    backgroundColor: SKELETON_BG,
    marginBottom: 14,
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: TEXT_DARK,
    marginBottom: 3,
  },
  notesText: {
    fontSize: 8,
    color: TEXT_MUTED,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  signatureBlock: {
    width: 180,
  },
  signatureLabel: {
    fontSize: 9,
    color: TEXT_MUTED,
    marginBottom: 16,
  },
  signatureLine: {
    borderBottom: `1px solid ${TEXT_DARK}`,
    height: 1,
  },
});

function StatBox({ label, value, align }) {
  return (
    <View style={pdfStyles.statBox}>
      <Text style={[pdfStyles.statLabel, { textAlign: align }]}>{label}</Text>
      <Text style={[pdfStyles.statValue, { textAlign: align }]}>{value}</Text>
    </View>
  );
}

function ProductTable({ groups, t, isArabic, qrByImageUrl }) {
  const rowDir = isArabic ? "row-reverse" : "row";
  const align = isArabic ? "right" : "left";

  return (
    <View>
      {(groups || []).map((group) => {
        const warehouseLabel = group.warehouseName || t("packingList.unassignedWarehouse");
        return (
          <View key={group.warehouseId}>
            <View style={[pdfStyles.locationBand, { flexDirection: rowDir }]}>
              <Text style={pdfStyles.locationText}>
                {t("packingList.warehouse")}: {warehouseLabel}
              </Text>
            </View>
            <View style={[pdfStyles.tableHeader, { flexDirection: rowDir }]}>
              <View style={pdfStyles.colCheck}><Text style={[pdfStyles.th, { textAlign: "center" }]}>{t("packingList.select")}</Text></View>
              <View style={pdfStyles.colImage}><Text style={[pdfStyles.th, { textAlign: "center" }]}>{t("packingList.image")}</Text></View>
              <View style={pdfStyles.colName}><Text style={[pdfStyles.th, { textAlign: align }]}>{t("packingList.productName")}</Text></View>
              <View style={pdfStyles.colSku}><Text style={[pdfStyles.th, { textAlign: align }]}>{t("packingList.sku")}</Text></View>
              <View style={pdfStyles.colLocation}><Text style={[pdfStyles.th, { textAlign: align }]}>{t("packingList.storageLocation")}</Text></View>
              <View style={pdfStyles.colQty}><Text style={[pdfStyles.th, { textAlign: "center" }]}>{t("packingList.quantity")}</Text></View>
              <View style={pdfStyles.colOrders}><Text style={[pdfStyles.th, { textAlign: "center" }]}>{t("packingList.inOrders")}</Text></View>
            </View>
            {(group.rows || []).map((row) => {
              const imageUrl = row.image ? avatarSrc(row.image) : "";
              const qr = imageUrl ? qrByImageUrl?.[imageUrl] : "";
              return (
                <View key={row.key} style={[pdfStyles.tableRow, { flexDirection: rowDir }]} wrap={false}>
                  <View style={pdfStyles.colCheck}><View style={pdfStyles.checkbox} /></View>
                  <View style={pdfStyles.colImage}>
                    {qr ? <Image src={qr} style={pdfStyles.productQr} /> : <View style={pdfStyles.productQr} />}
                  </View>
                  <View style={pdfStyles.colName}><Text style={[pdfStyles.td, { textAlign: align }]}>{row.name}</Text></View>
                  <View style={pdfStyles.colSku}><Text style={[pdfStyles.td, { textAlign: align }]}>{row.sku}</Text></View>
                  <View style={pdfStyles.colLocation}><Text style={[pdfStyles.td, { textAlign: align }]}>{row.locationName || t("packingList.unassignedLocation")}</Text></View>
                  <View style={pdfStyles.colQty}><Text style={[pdfStyles.td, { textAlign: "center" }]}>{row.quantity}</Text></View>
                  <View style={pdfStyles.colOrders}><Text style={[pdfStyles.td, { textAlign: "center" }]}>{row.orderCount}</Text></View>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

function DocumentHeader({ headerQrUrl, title, subtitle }) {
  return (
    <View style={pdfStyles.header}>
      {headerQrUrl ? <Image src={headerQrUrl} style={pdfStyles.headerQR} /> : <View style={pdfStyles.headerQR} />}
      <View style={pdfStyles.headerTitleWrap}>
        <Text style={pdfStyles.headerTitle}>{title}</Text>
        {/* <Text style={pdfStyles.headerSubtitle}>{subtitle}</Text> */}
      </View>
      <Image src="/logo.png" style={pdfStyles.headerLogo} />
    </View>
  );
}

function SummaryStats({ t, summary, printNumber, printedAt, locale, isArabic, showOrderCount = true }) {
  const align = isArabic ? "right" : "left";
  return (
    <View style={[pdfStyles.statsRow, { flexDirection: isArabic ? "row-reverse" : "row" }]}>
      {printedAt ? <StatBox align={align} label={t("packingList.printDate")} value={formatPrintDate(printedAt, locale)} /> : null}
      <StatBox align={align} label={t("packingList.productsCount")} value={String(summary.productCount ?? 0)} />
      <StatBox align={align} label={t("packingList.totalQuantity")} value={String(summary.totalQuantity ?? 0)} />
      <StatBox align={align} label={t("packingList.itemsCount")} value={String(summary.itemCount ?? 0)} />
      {showOrderCount ? <StatBox align={align} label={t("packingList.ordersCount")} value={String(summary.orderCount ?? 0)} /> : null}
      {printNumber ? <StatBox align={align} label={t("packingList.printNumber")} value={printNumber} /> : null}
    </View>
  );
}

function OrderSeparator({ orderNumber, t }) {
  return (
    <View style={pdfStyles.orderSeparator} wrap={false}>
      <View style={pdfStyles.orderSeparatorLine} />
      <Text style={pdfStyles.orderSeparatorTitle}>
        {t("packingList.orderTitle", { orderNumber: orderNumber || "—" })}
      </Text>
      <View style={pdfStyles.orderSeparatorLine} />
    </View>
  );
}

function OrderInfoBlock({ t, order, isArabic }) {
  return (
    <View style={[pdfStyles.orderInfoGrid, { flexDirection: isArabic ? "row-reverse" : "row" }]}>
      <View style={pdfStyles.orderInfoBox}>
        <Text style={[pdfStyles.statLabel, { textAlign: isArabic ? "right" : "left" }]}>{t("fields.orderCode")}</Text>
        <Text style={[pdfStyles.statValue, { textAlign: isArabic ? "right" : "left" }]}>
          {order?.orderNumber}
        </Text>
      </View>
      <View style={pdfStyles.orderInfoBox}>
        <Text style={[pdfStyles.statLabel, { textAlign: isArabic ? "right" : "left" }]}>{t("fields.customer")}</Text>
        <Text style={[pdfStyles.statValue, { textAlign: isArabic ? "right" : "left" }]}>
          {order?.customerName || "—"}
        </Text>
      </View>
      <View style={pdfStyles.orderInfoBox}>
        <Text style={[pdfStyles.statLabel, { textAlign: isArabic ? "right" : "left" }]}>{t("fields.phone")}</Text>
        <Text style={[pdfStyles.statValue, { textAlign: isArabic ? "right" : "left" }]}>
          {order?.phoneNumber || "—"}
        </Text>
      </View>
    </View>
  );
}

function IncludedOrders({ t, orderNumbers, isArabic }) {
  if (!orderNumbers?.length) return null;
  return (
    <View style={pdfStyles.includedWrap}>
      <Text style={[pdfStyles.includedTitle, { textAlign: isArabic ? "right" : "left" }]}>
        {t("packingList.includedOrders")}
      </Text>
      <View style={[pdfStyles.includedList, { flexDirection: isArabic ? "row-reverse" : "row" }]}>
        {orderNumbers.map((n) => (
          <Text key={n} style={pdfStyles.orderChip}>{n}</Text>
        ))}
      </View>
    </View>
  );
}

function FooterBlock({ t, isArabic }) {
  const align = isArabic ? "right" : "left";
  return (
    <View style={pdfStyles.footer}>
      <View style={pdfStyles.notesBox}>
        <Text style={[pdfStyles.notesTitle, { textAlign: align }]}>{t("packingList.warehouseNotes")}</Text>
        <Text style={[pdfStyles.notesText, { textAlign: align }]}>{t("packingList.notesText")}</Text>
      </View>
      <View style={[pdfStyles.signatureRow, { flexDirection: isArabic ? "row" : "row-reverse" }]}>
        <View style={pdfStyles.signatureBlock}>
          <Text style={[pdfStyles.signatureLabel, { textAlign: align }]}>{t("packingList.preparerSignature")}</Text>
          <View style={pdfStyles.signatureLine} />
        </View>
      </View>
    </View>
  );
}

export function PackingListPages({
  t,
  locale,
  mode = "combined",
  data,
  headerQrUrl,
  qrByImageUrl = {},
}) {
  const isArabic = locale === "ar";
  const title = t("packingList.title");
  const subtitle = isArabic ? t("packingList.subtitle") : t("packingList.titleAr");
  const pageStyle = [
    pdfStyles.page,
    {
      fontFamily: DEFAULT_FONT_FAMILY,
      direction: isArabic ? "rtl" : "ltr",
      textAlign: isArabic ? "right" : "left",
    },
  ];

  const body = mode === "perOrder" ? (
    <>
      <DocumentHeader headerQrUrl={headerQrUrl} title={title} subtitle={subtitle} />
      <SummaryStats
        t={t}
        summary={data.summary}
        printNumber={data.printNumber}
        printedAt={data.printedAt}
        locale={locale}
        isArabic={isArabic}
        showOrderCount
      />
      <IncludedOrders t={t} orderNumbers={data.orderNumbers} isArabic={isArabic} />
      {(data.perOrder || []).map((block) => (
        <View key={block.order?.orderNumber || block.order?.id} style={pdfStyles.orderSection}>
          <OrderSeparator orderNumber={block.order?.orderNumber} t={t} />
          <OrderInfoBlock t={t} order={block.order} isArabic={isArabic} />
          <SummaryStats
            t={t}
            summary={block.summary}
            locale={locale}
            isArabic={isArabic}
            showOrderCount={false}
          />
            <ProductTable groups={block.groups} t={t} isArabic={isArabic} qrByImageUrl={qrByImageUrl} />
        </View>
      ))}
      <FooterBlock t={t} isArabic={isArabic} />
    </>
  ) : (
    <>
      <DocumentHeader headerQrUrl={headerQrUrl} title={title} subtitle={subtitle} />
      <SummaryStats
        t={t}
        summary={data.summary}
        printNumber={data.printNumber}
        printedAt={data.printedAt}
        locale={locale}
        isArabic={isArabic}
      />
      <IncludedOrders t={t} orderNumbers={data.orderNumbers} isArabic={isArabic} />
      <ProductTable groups={data.groups} t={t} isArabic={isArabic} qrByImageUrl={qrByImageUrl} />
      <FooterBlock t={t} isArabic={isArabic} />
    </>
  );

  return (
    <Page size="A4" style={pageStyle} wrap>
      {body}
    </Page>
  );
}

const PackingListPDF = (props) => (
  <Document>
    <PackingListPages {...props} />
  </Document>
);

export default PackingListPDF;
