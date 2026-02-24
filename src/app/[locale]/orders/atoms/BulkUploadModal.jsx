import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileSpreadsheet, RefreshCw, CheckCircle2, FileCheck2 } from "lucide-react";
import {
	Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
 
import { cn } from "@/utils/cn";
import api from "@/utils/api";
import toast from "react-hot-toast";

/* ─── Step indicator dot ─────────────────────────────────────────────────── */
function StepBadge({ number, active, done }) {
	return (
		<div
			className={cn(
				"w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300",
				done
					? "bg-gradient-to-br from-[var(--primary)] to-[var(--third,#ff5c2b)] dark:from-[#5b4bff] dark:to-[#3be7ff]"
					: active
						? "bg-gradient-to-br from-[var(--primary)] to-[var(--third,#ff5c2b)] dark:from-[#5b4bff] dark:to-[#3be7ff] shadow-[0_4px_12px_var(--primary-shadow,rgba(255,139,0,0.35))]"
						: "bg-muted border border-border"
			)}
		>
			{done ? (
				<CheckCircle2 size={15} className="text-white" />
			) : (
				<span className={cn(
					"text-xs font-black",
					active ? "text-white" : "text-muted-foreground"
				)}>
					{number}
				</span>
			)}
		</div>
	);
}

export default function BulkUploadModal({ isOpen, onClose, onSuccess }) {
	const t = useTranslations("orders");
	const [file, setFile] = useState(null);
	const [uploading, setUploading] = useState(false);
	const [downloadLoading, setDownloadLoading] = useState(false);
	const [dragOver, setDragOver] = useState(false);

	const handleDownloadTemplate = async () => {
		setDownloadLoading(true);
		try {
			const res = await api.get("/orders/bulk/template", { responseType: "blob" });
			const blob = new Blob([res.data], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			});
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = "orders_bulk_template.xlsx";
			link.click();
			URL.revokeObjectURL(url);
			toast.success(t("bulkUpload.templateDownloaded"));
		} catch (err) {
			toast.error(err.response?.data?.message || t("bulkUpload.templateDownloadFailed"));
		} finally {
			setDownloadLoading(false);
		}
	};

	const validateAndSetFile = (f) => {
		if (!f) return;
		const isXlsx =
			f.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
			f.name.endsWith(".xlsx");
		if (isXlsx) setFile(f);
		else toast.error(t("bulkUpload.invalidFileType"));
	};

	const handleFileChange = (e) => validateAndSetFile(e.target.files[0]);

	const handleDrop = (e) => {
		e.preventDefault();
		setDragOver(false);
		validateAndSetFile(e.dataTransfer.files[0]);
	};

	const handleUpload = async () => {
		if (!file) { toast.error(t("bulkUpload.noFileSelected")); return; }
		setUploading(true);
		try {
			const formData = new FormData();
			formData.append("file", file);
			const res = await api.post("/orders/bulk", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			const data = res.data || {};
			const created = data.created ?? 0;
			const failed = data.failed ?? 0;
			const errors = data.errors ?? [];

			if (created > 0) {
				toast.success(t("bulkUpload.uploadSuccessCount", { count: created }));
				onSuccess?.();
				setFile(null);
				onClose();
			}
			if (failed > 0 && errors.length > 0) {
				errors.slice(0, 5).forEach((e) => toast.error(`${e.orderRef}: ${e.message}`));
				if (errors.length > 5) toast.error(t("bulkUpload.moreErrors", { count: errors.length - 5 }));
			}
			if (created === 0 && failed > 0) toast.error(t("bulkUpload.uploadNoCreated"));
		} catch (err) {
			toast.error(err.response?.data?.message || t("bulkUpload.uploadFailed"));
		} finally {
			setUploading(false);
		}
	};

	const steps = [
		{
			title: t("bulkUpload.step1Title"),
			desc: t("bulkUpload.step1Description"),
			done: true, /* always done once modal opens */
			action: (
				<Button
					onClick={handleDownloadTemplate}
					disabled={downloadLoading}
					variant="outline"
					className="h-9 rounded-xl border-border text-sm font-bold gap-2
						hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5
						dark:hover:border-[#5b4bff] dark:hover:text-[#8b7cff] dark:hover:bg-[#5b4bff]/8
						transition-all duration-200"
				>
					{downloadLoading
						? <RefreshCw size={14} className="animate-spin" />
						: <FileSpreadsheet size={14} />}
					{t("bulkUpload.downloadTemplate")}
				</Button>
			),
		},
		{
			title: t("bulkUpload.step2Title"),
			desc: t("bulkUpload.step2Description"),
			done: false,
		},
		{
			title: t("bulkUpload.step3Title"),
			desc: t("bulkUpload.step3Description"),
			done: !!file,
			action: null, /* dropzone rendered separately below */
		},
	];

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-lg p-0 gap-0 rounded-2xl border border-border overflow-hidden flex flex-col max-h-[92vh]">

				{/* ── Header ─────────────────────────────────────────────── */}
				<div className="relative overflow-hidden flex-shrink-0">
					<div className="absolute inset-0  " />
					<div className="relative flex items-center gap-4 px-6 py-5 border-b border-border">
						<div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0
							bg-gradient-to-br from-[var(--primary)] to-[var(--third,#ff5c2b)]
							dark:from-[#5b4bff] dark:to-[#3be7ff]
							shadow-[0_4px_16px_var(--primary-shadow,rgba(255,139,0,0.4))]">
							<Upload className="text-white" size={19} />
						</div>
						<div>
							<DialogTitle className="text-lg font-black tracking-tight text-foreground leading-none">
								{t("bulkUpload.title")}
							</DialogTitle>
							<DialogDescription className="text-xs !max-w-sm w-full text-muted-foreground mt-0.5">
								{t("bulkUpload.description")}
							</DialogDescription>
						</div>
					</div>
				</div>

				{/* ── Body ───────────────────────────────────────────────── */}
				<div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">

					{/* Steps 1 & 2 */}
					{steps.slice(0, 2).map((step, i) => (
						<div
							key={i}
							className="flex items-start gap-3.5 p-4 rounded-2xl border border-border bg-muted/30 transition-all duration-200"
						>
							<StepBadge number={i + 1} done={step.done} active={false} />
							<div className="flex-1 min-w-0">
								<p className="text-sm font-bold text-foreground mb-0.5">{step.title}</p>
								<p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
								{step.action && <div className="mt-3">{step.action}</div>}
							</div>
						</div>
					))}

					{/* Step 3: Upload — expanded with dropzone */}
					<div className="rounded-2xl border border-border bg-muted/30 overflow-hidden">
						<div className="flex items-start gap-3.5 p-4">
							<StepBadge number={3} done={!!file} active={!file} />
							<div className="flex-1 min-w-0">
								<p className="text-sm font-bold text-foreground mb-0.5">{steps[2].title}</p>
								<p className="text-xs text-muted-foreground leading-relaxed">{steps[2].desc}</p>
							</div>
						</div>

						{/* Dropzone */}
						<div className="px-4 pb-4">
							<input
								type="file"
								id="file-upload"
								accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
								onChange={handleFileChange}
								className="hidden"
							/>
							<label
								htmlFor="file-upload"
								onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
								onDragLeave={() => setDragOver(false)}
								onDrop={handleDrop}
								className={cn(
									"group relative flex flex-col items-center justify-center gap-3",
									"min-h-[160px] rounded-2xl border-2 border-dashed cursor-pointer",
									"transition-all duration-300",
									dragOver || file
										? "border-[var(--primary)] dark:border-[#5b4bff] bg-[var(--primary)]/6 dark:bg-[#5b4bff]/10"
										: "border-border hover:border-[var(--primary)] dark:hover:border-[#5b4bff] hover:bg-[var(--primary)]/5 dark:hover:bg-[#5b4bff]/8"
								)}
							>
								{/* bg glow on drag */}
								<AnimatePresence>
									{(dragOver) && (
										<motion.div
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											className="absolute inset-0 rounded-2xl pointer-events-none"
											style={{
												background: "radial-gradient(ellipse at 50% 50%, rgba(255,139,0,0.12) 0%, transparent 70%)",
											}}
										/>
									)}
								</AnimatePresence>

								{file ? (
									/* File chosen state */
									<motion.div
										initial={{ opacity: 0, scale: 0.9 }}
										animate={{ opacity: 1, scale: 1 }}
										className="flex flex-col items-center gap-2 relative"
									>
										<div className="w-12 h-12 rounded-2xl flex items-center justify-center
											bg-gradient-to-br from-[var(--primary)] to-[var(--third,#ff5c2b)]
											dark:from-[#5b4bff] dark:to-[#3be7ff]
											shadow-[0_4px_16px_var(--primary-shadow,rgba(255,139,0,.3))]">
											<FileCheck2 size={22} className="text-white" />
										</div>
										<p className="text-sm font-bold text-foreground text-center px-4 break-all">{file.name}</p>
										<p className="text-xs text-muted-foreground">
											{(file.size / 1024).toFixed(1)} KB
										</p>
										<span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] dark:text-[#8b7cff]">
											Click to change file
										</span>
									</motion.div>
								) : (
									/* Empty state */
									<div className="flex flex-col items-center gap-2 relative">
										<div className="w-12 h-12 rounded-2xl flex items-center justify-center
											bg-muted border border-border
											group-hover:border-[var(--primary)]/30
											group-hover:bg-[var(--primary)]/8 dark:group-hover:bg-[#5b4bff]/12
											transition-all duration-300">
											<Upload size={20} className="text-muted-foreground group-hover:text-[var(--primary)] dark:group-hover:text-[#8b7cff] transition-colors" />
										</div>
										<div className="text-center">
											<p className="text-sm font-bold text-foreground">
												{t("bulkUpload.dragDrop")}
											</p>
											<p className="text-xs text-muted-foreground mt-0.5">
												{t("bulkUpload.supportedFormats")}
											</p>
										</div>
									</div>
								)}
							</label>
						</div>
					</div>
				</div>

				{/* ── Footer ─────────────────────────────────────────────── */}
				<div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20">
					<Button
						variant="outline"
						onClick={onClose}
						className="h-10 px-5 rounded-xl text-sm font-bold"
					>
						{t("common.cancel")}
					</Button>
					<Button
						onClick={handleUpload}
						disabled={!file || uploading}
						className="h-10 px-6 rounded-xl text-sm font-bold text-white gap-2
							bg-gradient-to-r from-[var(--primary)] to-[var(--third,#ff5c2b)]
							dark:from-[#5b4bff] dark:to-[#3be7ff]
							shadow-[0_4px_16px_var(--primary-shadow,rgba(255,139,0,.35))]
							hover:shadow-[0_6px_24px_var(--primary-shadow,rgba(255,139,0,.5))]
							hover:brightness-110
							disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
							transition-all duration-200"
					>
						{uploading ? (
							<><RefreshCw size={14} className="animate-spin" />{t("bulkUpload.uploading")}</>
						) : (
							<><Upload size={14} />{t("bulkUpload.upload")}</>
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}