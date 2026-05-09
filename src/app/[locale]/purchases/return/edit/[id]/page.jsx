"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/utils/api";
import { PurchaseReturnForm } from "../../new/page";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export default function EditPurchaseReturnPage() {
	const params = useParams();
	const id = params.id;
	const [purchaseReturn, setPurchaseReturn] = useState(null);
	const [loading, setLoading] = useState(true);
	const t = useTranslations("returnInvoice");

	useEffect(() => {
		if (id) {
			api.get(`/purchases-return/${id}`)
				.then((res) => {
					setPurchaseReturn(res.data);
					setLoading(false);
				})
				.catch((err) => {
					console.error(err);
					toast.error(t("messages.fetchDetailsFailed") || "Failed to load data");
					setLoading(false);
				});
		}
	}, [id, t]);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
			</div>
		);
	}

	if (!purchaseReturn) {
		return (
			<div className="flex items-center justify-center min-h-screen text-gray-500">
				{t("messages.loadDataFailed") || "Data not found"}
			</div>
		);
	}

	return <PurchaseReturnForm editedReturn={purchaseReturn} />;
}
