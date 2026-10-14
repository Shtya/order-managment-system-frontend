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


/**
 * @param {number} [maxAspectRatio] - If set, the bars are made taller when needed so the image
 *   width/height never exceeds this ratio. A long code then still fills a fixed-height box
 *   with objectFit "contain" instead of shrinking vertically.
 */
export const getBarcodeDataUrl = (value, overrides = {}, maxAspectRatio) => {
    if (!value) return "";

    // 1. Create an off-screen canvas
    const canvas = document.createElement("canvas");

    try {
        const options = {
            ...BARCODE_CONFIG, // Ensure this constant is imported
            ...overrides,
            // Ensure width/height are appropriate for printing
            width: 2,
            height: 40,
            displayValue: false // Set to true if you want the text under the bars
        };

        // 2. Render barcode to the canvas
        JsBarcode(canvas, value, options);

        if (maxAspectRatio && canvas.width / canvas.height > maxAspectRatio) {
            JsBarcode(canvas, value, {
                ...options,
                height: Math.ceil(canvas.width / maxAspectRatio),
            });
        }

        // 3. Return as a Base64 string
        return canvas.toDataURL("image/png");
    } catch (error) {
        console.error("Barcode generation failed:", error);
        return "";
    }
};