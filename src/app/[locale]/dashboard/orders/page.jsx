'use client'
import OrdersTab from "../../orders/tabs/OrderTab";
import { useEffect, useState } from "react";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export default function Orders() {
    const [stats, setStats] = useState([]);
    const [statsLoading, setStatsLoading] = useState(true);
    const [adminId, setAdminId] = useState("all");
    const t = useTranslations("orders");

    useEffect(() => {
        fetchStats();
    }, [adminId]);

    const fetchStats = async (silent = false) => {
        try {
            if (!silent) setStatsLoading(true);
            const params = {};
            if (adminId && adminId !== "all") params.adminId = adminId;
            const response = await api.get("/orders/stats", { params });
            setStats(response.data || []);
        } catch (error) {
            console.error("Error fetching stats:", error);
            toast.error(t("messages.errorFetchingStats"));
        } finally {
            if (!silent) setStatsLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-6 ">
            <OrdersTab
                stats={stats}
                fetchStats={fetchStats}
                statsLoading={statsLoading}
                readOnlyStatus={true}
                showTopActions={false}
                showBulkUpload={false}
                readOnlyShipmentStatus={true}
                adminId={adminId}
                setAdminId={setAdminId}
            />
        </div>
    );
}
