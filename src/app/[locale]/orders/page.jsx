"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
	ChevronLeft,
	Filter,
	Download,
	Eye,
	Edit,
	Trash2,
	Package,
	Clock,
	CheckCircle,
	XCircle,
	TrendingUp,
	MapPin,
	Phone,
	AlertCircle,
	RefreshCw,
	Copy,
	Truck,
	Plus,
	Settings,
	ShoppingCart,
	RefreshCcw,
	ArrowLeftRight,
} from "lucide-react";

import toast from "react-hot-toast";
import api from "@/utils/api";

import { BreadcrumbBar } from "@/components/atoms/Breadcrumb";
import Button_ from "@/components/atoms/Button";


import OrdersTab from "./tabs/OrderTab";
import ReplacementTab from "./tabs/ReplacementTab";
import FailedOrdersTab from "./tabs/Failedorderstab";
// import ReturnsTab from "./ReturnsTab";

export default function Orders() {
	const [stats, setStats] = useState([]);
	const [statsLoading, setStatsLoading] = useState(true);

	const [retrySettingsOpen, setRetrySettingsOpen] = useState(false);

	const t = useTranslations("orders");
	const searchParams = useSearchParams();

	const items = useMemo(
		() => [
			{ id: "orders", label: t("tabs.orders"), icon: ShoppingCart },
			{ id: "replacement", label: t("tabs.replacement"), icon: ArrowLeftRight },
			{ id: "failedOrders", label: t("tabs.failedOrders"), icon: XCircle },
			{ id: "returns", label: t("tabs.returns"), icon: RefreshCcw },
		],
		[t]
	);

	const allowedTabs = useMemo(() => new Set(items.map((x) => x.id)), [items]);
	const [activeTab, setActiveTab] = useState("orders");

	useEffect(() => {
		const tabFromUrl = searchParams.get("tab") || "orders";
		const safeTab = allowedTabs.has(tabFromUrl) ? tabFromUrl : "orders";
		setActiveTab(safeTab);
	}, [searchParams, allowedTabs]);

	useEffect(() => {
		fetchStats();
	}, []);

	const fetchStats = async () => {
		try {
			setStatsLoading(true);
			const response = await api.get("/orders/stats");
			setStats(response.data || []);
		} catch (error) {
			console.error("Error fetching stats:", error);
			toast.error(t("messages.errorFetchingStats"));
		} finally {
			setStatsLoading(false);
		}
	};

	return (
		<div className="min-h-screen p-4 md:p-6 ">

			<AnimatePresence mode="wait">
				<motion.div
					key={activeTab}
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -10 }}
					transition={{ duration: 0.18 }}
				>
					{activeTab === "orders" && (
						<OrdersTab
							stats={stats}
							fetchStats={fetchStats}
							statsLoading={statsLoading}
							retrySettingsOpen={retrySettingsOpen}
							setRetrySettingsOpen={setRetrySettingsOpen}
						/>
					)}

					{/* {activeTab === "returns" && <ReturnsTab />} */}

					{activeTab === "replacement" && <ReplacementTab statuses={stats} />}
					{activeTab === "failedOrders" && <FailedOrdersTab statuses={stats} />}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}





export const getIconForStatus = (code) => {
	const iconMap = {
		new: Package,
		confirmed: CheckCircle,
		pending_confirmation: AlertCircle,
		wrong_number: Phone,
		duplicate: Copy,
		postponed: Clock,
		delivered: CheckCircle,
		in_shipping: Truck,
		waiting_stock: Package,
		no_answer_shipping: AlertCircle,
		cancelled_shipping: XCircle,
		under_review: Clock,
		preparing: Package,
		ready: CheckCircle,
		shipped: Truck,
		cancelled: XCircle,
		returned: RefreshCw,
		no_answer: AlertCircle,
		out_of_area: MapPin,
	};
	return iconMap[code] || Package;
};


export const generateBgColors = (hex) => {
	const hexToRgb = (h) => {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : null;
	};

	const rgb = hexToRgb(hex);
	if (!rgb) return { light: "#f5f5f5", dark: "#1a1a1a" };

	return {
		light: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
		dark: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`,
	};
};