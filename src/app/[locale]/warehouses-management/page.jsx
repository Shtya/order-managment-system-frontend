"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Warehouse, MapPin, Layers, Blocks, Columns3, Grid3x3
} from "lucide-react";
import { useTranslations } from "next-intl";
import api from "@/utils/api";
import PageHeader from "@/components/atoms/Pageheader";
import WarehousesTab from "./atoms/WarehousesTab";
import StorageLocationsTab from "./atoms/StorageLocationsTab";
import { normalizeAxiosError } from "@/utils/axios";
const TAB_ITEMS = [
    { id: "warehouses", labelKey: "warehousesManagement.tabs.warehouses", icon: Warehouse },
    { id: "storageLocations", labelKey: "warehousesManagement.tabs.storageLocations", icon: MapPin, gettingStartedKey: "warehouse.storage_locations", gettingStartedType: "section_locations" },
];

const WAREHOUSE_STATS_CONFIG = [
    { id: "total", code: "total", nameKey: "warehousesManagement.stats.total", icon: Layers, color: "var(--primary)", sortOrder: 1 },
    { id: "active", code: "active", nameKey: "warehousesManagement.stats.active", icon: Warehouse, color: "#10b981", sortOrder: 2 },
];

const LOCATION_STATS_CONFIG = [
    { id: "zones", code: "zones", nameKey: "warehousesManagement.stats.zones", icon: Columns3, color: "#6366f1", sortOrder: 1 },
    { id: "racks", code: "racks", nameKey: "warehousesManagement.stats.racks", icon: Blocks, color: "#f59e0b", sortOrder: 2 },
    { id: "shelves", code: "shelves", nameKey: "warehousesManagement.stats.shelves", icon: Grid3x3, color: "#10b981", sortOrder: 3 },
    { id: "bins", code: "bins", nameKey: "warehousesManagement.stats.bins", icon: MapPin, color: "#8b5cf6", sortOrder: 4 },
];

export default function WarehousesManagementPage() {
    const t = useTranslations("warehousesManagement");

    const [activeTab, setActiveTab] = useState("warehouses");
    const [whStats, setWhStats] = useState({ total: 0, active: 0 });
    const [locStats, setLocStats] = useState({ zones: 0, racks: 0, shelves: 0, bins: 0 });
    const [statsLoading, setStatsLoading] = useState(false);

    const fetchWhStats = useCallback(async () => {
        try {
            const res = await api.get("/warehouses/stats");
            setWhStats(res.data ?? { total: 0, active: 0 });
        } catch (e) { console.error(e); }
    }, []);

    const fetchLocStats = useCallback(async () => {
        try {
            const res = await api.get("/warehouses/locations/stats");
            setLocStats(res.data ?? { zones: 0, racks: 0, shelves: 0, bins: 0 });
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => {
        setStatsLoading(true);
        Promise.all([fetchWhStats(), fetchLocStats()]).finally(() => setStatsLoading(false));
    }, [fetchWhStats, fetchLocStats]);

    const headerStats = useMemo(() => {
        if (activeTab === "warehouses") {
            return WAREHOUSE_STATS_CONFIG.map(s => ({
                id: s.id,
                name: t(`stats.${s.code}`),
                value: whStats[s.code] ?? 0,
                icon: s.icon,
                color: s.color,
                sortOrder: s.sortOrder,
            }));
        }
        return LOCATION_STATS_CONFIG.map(s => ({
            id: s.id,
            name: t(`stats.${s.code}`),
            value: locStats[s.code] ?? 0,
            icon: s.icon,
            color: s.color,
            sortOrder: s.sortOrder,
        }));
    }, [activeTab, whStats, locStats, t]);

    const items = useMemo(() =>
        TAB_ITEMS.map(tab => ({
            id: tab.id,
            label: t(`tabs.${tab.id === "warehouses" ? "warehouses" : "storageLocations"}`),
            icon: tab.icon,
            gettingStartedKey: tab.gettingStartedKey,
            gettingStartedType: tab.gettingStartedType,
        })),
    [t]);

    return (
        <div className="min-h-screen p-5">
            <PageHeader
                breadcrumbs={[
                    { name: t("breadcrumb.home"), href: "/dashboard" },
                    { name: t("title") },
                ]}
                statsCount={activeTab === "warehouses" ? 2 : 4}
                stats={headerStats}
                statsLoading={statsLoading}
                items={items}
                active={activeTab}
                setActive={setActiveTab}
            />

            {activeTab === "warehouses" ? (
                <WarehousesTab stats={whStats} onStatsChange={fetchWhStats} />
            ) : (
                <StorageLocationsTab stats={locStats} onStatsChange={fetchLocStats} />
            )}
        </div>
    );
}
