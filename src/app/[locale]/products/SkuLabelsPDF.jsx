import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { DEFAULT_FONT_FAMILY } from "@/utils/healpers";
import { TEXT_DARK, TEXT_MUTED } from "@/utils/colors";


const MM_TO_PT = 72 / 25.4;

const LABEL_WIDTH_MM = 50;
const LABEL_HEIGHT_MM = 30;

const LABEL_PAGE_SIZE = [
  LABEL_WIDTH_MM * MM_TO_PT,
  LABEL_HEIGHT_MM * MM_TO_PT,
];

const PAGE_PADDING = 2;
const BARCODE_HEIGHT = 17;
const BARCODE_WIDTH_RATIO = 0.9;

export const BARCODE_ASPECT_RATIO =
  ((LABEL_PAGE_SIZE[0] - PAGE_PADDING * 2) * BARCODE_WIDTH_RATIO) / BARCODE_HEIGHT;

const getNameFontSize = (value) => {
  const length = Array.from(String(value ?? "").trim()).length;

  if (length > 110) return 3.5;
  if (length > 95) return 4;
  if (length > 80) return 4.5;
  if (length > 65) return 5;
  if (length > 52) return 5.5;
  if (length > 42) return 6;
  if (length > 34) return 6.5;
  if (length > 27) return 7.5;
  if (length > 20) return 8.5;

  return 9;
};

const getSkuFontSize = (value) => {
  const length = Array.from(String(value ?? "").trim()).length;

  if (length > 120) return 3;
  if (length > 100) return 3.5;
  if (length > 85) return 4;
  if (length > 70) return 4.5;
  if (length > 58) return 5;
  if (length > 46) return 5.5;
  if (length > 36) return 6;
  if (length > 28) return 6.5;

  return 7;
};

const getAttributesFontSize = (value) => {
  const length = Array.from(String(value ?? "").trim()).length;

  if (length > 100) return 3.5;
  if (length > 80) return 4;
  if (length > 65) return 4.5;
  if (length > 52) return 5;
  if (length > 42) return 5.5;
  if (length > 33) return 6;
  if (length > 25) return 6.5;

  return 7;
};


const getMatchedAttributesFontSize = (name, attributes) =>
  Math.min(getAttributesFontSize(attributes), getNameFontSize(name));

const getNameMaxLines = (value) => {
  const length = Array.from(String(value ?? "").trim()).length;
  return length > 28 ? 3 : 2;
};

const getSkuMaxLines = (value) => {
  const length = Array.from(String(value ?? "").trim()).length;
  return length > 28 ? 3 : 2;
};


const styles = StyleSheet.create({
  page: {
    padding: PAGE_PADDING,
    backgroundColor: "#ffffff",
    fontFamily: DEFAULT_FONT_FAMILY,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  labelItem: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  nameText: {
    width: "100%",
    fontWeight: 700,
    color: TEXT_DARK,
    marginBottom: 2,
    textAlign: "center",
  },

  attrText: {
    width: "100%",
    color: TEXT_MUTED,
    marginBottom: 3,
    textAlign: "center",
  },

  barcodeContainer: {
    width: "100%",
    height: BARCODE_HEIGHT,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  barcodeImage: {
    width: `${BARCODE_WIDTH_RATIO * 100}%`,
    height: "100%",
    objectFit: "contain",
  },

  skuText: {
    fontFamily: DEFAULT_FONT_FAMILY,
    fontWeight: 600,
    marginTop: 2,
    textAlign: "center",
  },
});

const SkuLabelsPDF = ({ labelsData }) => {
  return (
    <Document>
      {labelsData.map((label, index) => (
        <Page
          key={`${label.sku}-${index}`}
          size={LABEL_PAGE_SIZE}
          style={styles.page}
        >
          <View style={styles.labelItem} wrap={false}>
            <Text
              style={[
                styles.nameText,
                { fontSize: getNameFontSize(label.name) },
              ]}
              maxLines={getNameMaxLines(label.name)}
              textOverflow="ellipsis"
            >
              {label.name}
            </Text>

            <Text
              style={[
                styles.attrText,
                {
                  fontSize: getMatchedAttributesFontSize(
                    label.name,
                    label.attributes
                  ),
                },
              ]}
              maxLines={2}
              textOverflow="ellipsis"
            >
              {label.attributes}
            </Text>

            <View style={styles.barcodeContainer}>
              {label.barcodeDataUrl ? (
                <Image
                  src={label.barcodeDataUrl}
                  style={styles.barcodeImage}
                />
              ) : null}
            </View>

            <Text
              style={[
                styles.skuText,
                { fontSize: getSkuFontSize(label.sku) },
              ]}
              maxLines={getSkuMaxLines(label.sku)}
              textOverflow="ellipsis"
            >
              {label.sku}
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default SkuLabelsPDF;