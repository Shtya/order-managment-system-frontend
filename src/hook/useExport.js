import { useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import api from "@/utils/api";

/**
 * Reusable hook for exporting data as Excel (Blob) from the server.
 * Handles loading state, toast notifications, and file download.
 */
export function useExport() {
	const t = useTranslations("export");
	const [exportLoading, setExportLoading] = useState(false);

	const handleExport = async ({ endpoint, params = {}, filename = `export_${Date.now()}.xlsx` }) => {
		let toastId;
		try {
			setExportLoading(true);
			toastId = toast.loading(t("started") || "Export started...");

			const response = await api.get(endpoint, {
				params,
				responseType: "blob",
			});

			// Extract filename from Content-Disposition if available
			const contentDisposition = response.headers["content-disposition"];
			let finalFilename = filename;
			if (contentDisposition) {
				const match = contentDisposition.match(/filename="?([^";]+)"?/);
				if (match && match[1]) {
					finalFilename = match[1];
				}
			}

			// Create download link
			const url = window.URL.createObjectURL(
				new Blob([response.data], {
					type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				})
			);

			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", finalFilename);
			document.body.appendChild(link);
			link.click();

			// Cleanup
			link.remove();
			window.URL.revokeObjectURL(url);

			toast.dismiss(toastId);
			toast.success(t("success") || "Export successful");
		} catch (error) {
			console.error("Export failed:", error);
			toast.dismiss(toastId);
			const errorMsg = error.response?.data?.message || t("failed") || "Export failed";
			toast.error(errorMsg);
		} finally {
			setExportLoading(false);
		}
	};

	return { handleExport, exportLoading };
}
