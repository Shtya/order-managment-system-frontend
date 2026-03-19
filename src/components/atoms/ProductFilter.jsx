import React, { useState, useEffect, useRef, useMemo } from "react";
import { FilterField } from "./Table";
import api from "@/utils/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "next-intl"; // Or whichever library you use

export default function ProductFilter({ value, onChange }) {
    // Initialize translations
    const t = useTranslations("products.common");
    const [open, setOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedTerm, setDebouncedTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const inputRef = useRef(null);

    // Fetch the specific product if it's selected but not in the search results
    useEffect(() => {
        if (value && value !== "all") {
            const alreadyInList = products.find(p => String(p.id) === String(value));
            if (!alreadyInList) {
                const fetchSelected = async () => {
                    try {
                        const res = await api.get(`/products/${value}`);
                        setSelectedProduct(res.data);
                    } catch (err) {
                        console.error("Error fetching selected product details", err);
                    }
                };
                fetchSelected();
            } else {
                setSelectedProduct(alreadyInList);
            }
        } else {
            setSelectedProduct(null);
        }
    }, [value, products]);

    // 1. Debounce the search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTerm(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // 3. Combined product list for rendering
    const renderProducts = useMemo(() => {
        const combined = loading ? [] : [...products];
        // If there's a selected product and it's not in the current search results, prepend it
        if (selectedProduct && !combined.some(p => String(p.id) === String(selectedProduct.id))) {
            combined.unshift(selectedProduct);
        }

        return combined;
    }, [products, selectedProduct, loading]);

    // 4. Focus search input on open
    useEffect(() => {
        if (open) {
            // A timeout of 0ms ensures the focus happens after Radix finishes its opening logic
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
            return () => clearTimeout(timer);
        } else {
            // Clear search when closing (optional, but usually better UX)
            setSearchTerm("");
        }
    }, [open]);

    // 5. Fetch products on search term change
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const res = await api.get('/products', {
                    params: {
                        search: debouncedTerm || undefined,
                        limit: 5
                    }
                });

                const data = Array.isArray(res.data) ? res.data : (res.data?.records || []);
                setProducts(data);
            } catch (err) {
                console.error("Product Lookup Error", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [debouncedTerm]);

    return (
        <FilterField label={t("productName")}>
            <Select value={value} onValueChange={onChange} open={open} onOpenChange={setOpen}>
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm focus:border-[var(--primary)] transition-all">
                    <SelectValue placeholder={t("allProducts")} />
                </SelectTrigger>

                <SelectContent>
                    {/* Search Input */}
                    <div className="px-2 py-2 sticky top-0 bg-background z-10 border-b border-border">
                        <input
                            type="text"
                            ref={inputRef}
                            placeholder={t("searchProducts")}
                            className="w-full rounded-md border border-input bg-transparent px-3 py-1 rtl:text-end text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                        />
                    </div>

                    <SelectItem value="all">{t("allProducts")}</SelectItem>




                    {/* Product List */}
                    {renderProducts.map((p) => {
                        const name = p.name?.trim() || "";
                        const slug = p.slug?.trim() ? `(${p.slug.trim()})` : "";

                        return (
                            <SelectItem key={p.id} value={String(p.id)}>
                                <div className="flex items-center gap-2">
                                    {slug && (
                                        <span className="text-xs text-muted-foreground font-mono">
                                            {slug}
                                        </span>
                                    )}
                                    <span>{name}</span>
                                </div>
                            </SelectItem>
                        );
                    })}
                    {loading && (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                            {t("loading")}
                        </div>
                    )}
                    {/* Localized Empty State */}
                    {!loading && products.length === 0 && (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                            {t("noProductsFound")}
                        </div>
                    )}
                </SelectContent>
            </Select>
        </FilterField>
    );
}