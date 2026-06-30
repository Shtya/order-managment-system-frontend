"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, Font, Svg, Rect } from "@react-pdf/renderer";

// Register Cairo font (same as order analysis)
Font.register({
  family: "Cairo",
  fonts: [
    { src: "/fonts/Cairo-ExtraLight.ttf", fontWeight: 200 },
    { src: "/fonts/Cairo-Light.ttf", fontWeight: 300 },
    { src: "/fonts/Cairo-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Cairo-Medium.ttf", fontWeight: 500 },
    { src: "/fonts/Cairo-SemiBold.ttf", fontWeight: 600 },
    { src: "/fonts/Cairo-Bold.ttf", fontWeight: 700 },
    { src: "/fonts/Cairo-ExtraBold.ttf", fontWeight: 800 },
    { src: "/fonts/Cairo-Black.ttf", fontWeight: 900 },
  ],
});

// Constants for colors
const PRIMARY = "#6763AF";
const SECONDARY = "#5750a0";
const SKELETON_BG = "#f8fafc";
const BORDER = "#e2e8f0";
const TEXT_DARK = "#1e293b";
const TEXT_MUTED = "#64748b";
const WHITE = "#ffffff";

const pdfStyles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: WHITE,
    fontFamily: "Cairo",
  },
  labelCard: {
    width: "100%",
    backgroundColor: WHITE,
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    overflow: "hidden",
    marginBottom: 30,
  },
  labelHeader: {
    backgroundColor: PRIMARY, // Explicitly using solid background color
    padding: 16,
    width: "100%",
  },
  headerContent: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  orderCodeLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 4,
  },
  orderCode: {
    fontSize: 20,
    fontWeight: 700,
    color: WHITE,
    fontFamily: "Helvetica",
  },
  carrierBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: WHITE,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  labelBody: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  grid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  fieldBox: {
    width: "48%",
    backgroundColor: SKELETON_BG,
    borderRadius: 8,
    padding: 10,
  },
  fieldLabel: {
    fontSize: 10,
    color: TEXT_MUTED,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 12,
    fontWeight: 600,
    color: TEXT_DARK,
  },
  barcodeContainer: {
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  barcodeImage: {
    width: "100%",
    maxHeight: 60,
  },
  barcodeText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: 700,
    color: TEXT_DARK,
    letterSpacing: 2,
    marginTop: 8,
    fontFamily: "Helvetica",
  },
});


const SystemLabelPDF = ({ orders, t, formatCurrency, locale, barcodeUrls }) => {
  const isArabic = locale === "ar";

  return (
    <Document>
      {orders.map((order, index) => (
        <Page
          key={order.orderNumber}
          size="A4"
          style={[
            pdfStyles.page,
            {
              direction: isArabic ? "rtl" : "ltr",
              textAlign: isArabic ? "right" : "left",
            },
          ]}
        >
          <View style={pdfStyles.labelCard}>
            {/* Header Block */}
            <View style={pdfStyles.labelHeader}>
              {/* Forces the row direction to stay standard so layout positions match the HTML preview */}
              <View style={[pdfStyles.headerContent, { flexDirection: isArabic ? "row-reverse" : "row" }]}>
                <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
                  <Text style={[pdfStyles.orderCodeLabel, { textAlign: isArabic ? "right" : "left" }]}>
                    {t("printPreview.orderCode")}
                  </Text>
                  <Text style={[pdfStyles.orderCode, { textAlign: isArabic ? "right" : "left" }]}>
                    {order.orderNumber}
                  </Text>
                </View>
                <Text style={pdfStyles.carrierBadge}>{order.shippingCompany?.name || ""}</Text>
              </View>
            </View>
            <View style={pdfStyles.labelBody}>
              <View style={[pdfStyles.section]}>
                <Text style={pdfStyles.sectionTitle}>{t("printPreview.customerInfo")}</Text>
                <View style={[pdfStyles.grid, { flexDirection: isArabic ? "row" : "row-reverse" }]}>

                  <View style={pdfStyles.fieldBox}>
                    <Text style={pdfStyles.fieldLabel}>{t("labelFields.phone")}</Text>
                    <Text style={[pdfStyles.fieldValue, { fontFamily: "Helvetica" }]}>{order.phoneNumber}</Text>
                  </View>
                  <View style={pdfStyles.fieldBox}>
                    <Text style={pdfStyles.fieldLabel}>{t("labelFields.customer")}</Text>
                    <Text style={pdfStyles.fieldValue}>{order.customerName}</Text>
                  </View>

                  <View style={pdfStyles.fieldBox}>
                    <Text style={pdfStyles.fieldLabel}>{t("labelFields.area")}</Text>
                    <Text style={pdfStyles.fieldValue}>{order.area || "—"}</Text>
                  </View>
                  <View style={pdfStyles.fieldBox}>
                    <Text style={pdfStyles.fieldLabel}>{t("labelFields.city")}</Text>
                    <Text style={pdfStyles.fieldValue}>{order.city}</Text>
                  </View>
                </View>
              </View>

              <View style={[pdfStyles.section]}>
                <Text style={pdfStyles.sectionTitle}>{t("printPreview.shippingInfo")}</Text>
                <View style={[pdfStyles.grid, { flexDirection: isArabic ? "row" : "row-reverse" }]}>

                  <View style={pdfStyles.fieldBox}>
                    <Text style={pdfStyles.fieldLabel}>{t("labelFields.trackingCode")}</Text>
                    <Text style={[pdfStyles.fieldValue, { fontFamily: "Helvetica" }]}>
                      {order.trackingNumber || "—"}
                    </Text>
                  </View>
                  <View style={pdfStyles.fieldBox}>
                    <Text style={pdfStyles.fieldLabel}>{t("labelFields.store")}</Text>
                    <Text style={pdfStyles.fieldValue}>{order.store?.name || ""}</Text>
                  </View>

                  <View style={pdfStyles.fieldBox}>
                    <Text style={pdfStyles.fieldLabel}>{t("labelFields.paymentType")}</Text>
                    <Text style={pdfStyles.fieldValue}>
                      {order.paymentStatus === "paid"
                        ? t("payment.paid")
                        : order.paymentMethod === "cod"
                          ? t("payment.cod")
                          : order.paymentMethod}
                    </Text>
                  </View>
                  <View style={pdfStyles.fieldBox}>
                    <Text style={pdfStyles.fieldLabel}>{t("labelFields.shippingCost")}</Text>
                    <Text style={[pdfStyles.fieldValue, { fontFamily: "Helvetica" }]}>
                      {formatCurrency(order.shippingCost || 0)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={pdfStyles.barcodeContainer}>
                {barcodeUrls && barcodeUrls[order.orderNumber] ? (
                  <Image src={barcodeUrls[order.orderNumber]} style={pdfStyles.barcodeImage} />
                ) : null}
                <Text style={pdfStyles.barcodeText}>{order.orderNumber}</Text>
              </View>
            </View>
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default SystemLabelPDF;
