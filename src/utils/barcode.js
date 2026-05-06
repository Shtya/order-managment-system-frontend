import JsBarcode from "jsbarcode";

/**
 * Standard configuration for barcodes across the system
 */
export const BARCODE_CONFIG = {
    format: "CODE128",
    width: 2,
    height: 40,
    displayValue: false,
    margin: 0,
    background: "transparent",
    lineColor: "currentColor"
};

/**
 * Utility to generate a barcode on a given element with standard settings
 * @param {HTMLElement|SVGElement} element - The target element to render the barcode into
 * @param {string} value - The value to encode
 * @param {Object} overrides - Any specific overrides for this instance
 */
export const renderBarcode = (element, value, overrides = {}) => {
    if (!element || !value) return;
    
    JsBarcode(element, value, {
        ...BARCODE_CONFIG,
        ...overrides
    });
};
