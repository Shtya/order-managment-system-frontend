"use client";

import React, { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { useTranslations } from "next-intl";
import { Package } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";

/**
 * Sub-component to handle rendering inside the Dialog.
 * This ensures the SVG ref is available before JsBarcode runs.
 */
const LargeBarcodeDisplay = ({ value }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current && value) {
            JsBarcode(ref.current, value, {
                format: "CODE128",
                width: 2,
                height: 100,
                displayValue: true,
                fontSize: 16,
                background: "transparent",
                lineColor: "currentColor" // Adapts to Light/Dark mode
            });
        }
    }, [value]);

    return <svg ref={ref} className="max-w-full" />;
};

const BarcodeCell = ({ value }) => {
    const t = useTranslations("barcode");
    const [isOpen, setIsOpen] = useState(false);
    const smallSvgRef = useRef(null);

    // Render small barcode for table row
    useEffect(() => {
        if (smallSvgRef.current && value) {
            JsBarcode(smallSvgRef.current, value, {
                format: "CODE128",
                width: 1,
                height: 30,
                displayValue: false,
                margin: 0
            });
        }
    }, [value]);

    return (
        <>
            {/* Clickable Small Barcode in Table */}
            <button
                onClick={() => setIsOpen(true)}
                className="hover:opacity-70 transition-opacity cursor-zoom-in"
                title={t("viewBarcode")}
            >
                <svg ref={smallSvgRef} />
            </button>

            {/* Popup Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 text-right"> {/* Supports RTL */}
                                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                    {t("barcodePopup.title")}
                                </DialogTitle>
                                <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {t("barcodePopup.subtitle")} {value}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Centered Large Barcode Container */}
                    <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700 mt-4 text-slate-900 dark:text-white">
                        {/* Passing the value prop here is critical. 
                           The component only mounts when isOpen is true.
                        */}
                        {isOpen && <LargeBarcodeDisplay value={value} />}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default BarcodeCell;