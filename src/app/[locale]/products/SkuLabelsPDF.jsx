import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { DEFAULT_FONT_FAMILY } from "@/utils/healpers";
import { TEXT_DARK, TEXT_MUTED } from "@/utils/colors";

const styles = StyleSheet.create({
  page: {
    padding: 12,
    backgroundColor: "#ffffff",
    fontFamily: DEFAULT_FONT_FAMILY,
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10, // Match your old grid gap
  },
  labelItem: {
    width: 141.73,  // 50mm in points (50 * 2.8346)
    minHeight: 85.04,  // Minimum height, will expand if needed
    border: "1px dashed #cccccc", // Kept dashed border for cutting guides
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    overflow: "hidden",
    justifyContent: "flex-start", // Align items to top to fit longer content
    padding: 5,
  },
  nameText: {
    fontSize: 10,
    fontWeight: 700,
    color: TEXT_DARK,
    marginBottom: 2,
    textAlign: "center",
    width: "100%",
  },
  attrText: {
    fontSize: 8,
    color: TEXT_MUTED,
    marginBottom: 4,
    textAlign: "center",
    width: "100%",
  },
  barcodeContainer: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  barcodeImage: {
    width: "90%",
    maxHeight: 30, // Restrict height so it fits within the 30mm label
    objectFit: "contain",
  },
  skuText: {
    fontSize: 7,
    fontFamily: DEFAULT_FONT_FAMILY,
    fontWeight: 600,
    marginTop: 4,
    textAlign: "center",
    textWrap: "wrap",
  }
});
  
const SkuLabelsPDF = ({ labelsData }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {labelsData.map((label, index) => (
          <View key={index} style={styles.labelItem} wrap={false}>
            <Text style={styles.nameText}>
              {label.name}
            </Text>
            
            <Text style={styles.attrText}>
              {label.attributes}
            </Text>

            <View style={styles.barcodeContainer}>
              {label.barcodeDataUrl ? (
                <Image src={label.barcodeDataUrl} style={styles.barcodeImage} />
              ) : null}
            </View>

            <Text style={styles.skuText}>
              {label.sku}
            </Text>
          </View>
        ))}
      </Page>
    </Document>
  );
};

export default SkuLabelsPDF;