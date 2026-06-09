"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Edit2,
	Loader2,
	Trash2,
	MapPin,
	CheckCircle2,
	AlertCircle,
	FileDown,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import api from "@/utils/api";
import toast from "react-hot-toast";
import PageHeader from "@/components/atoms/Pageheader";
import Table, { FilterField } from "@/components/atoms/Table";
import { ActionButtons } from "@/components/atoms/Actions";
import { Badge } from "@/components/ui/badge";
import DateRangePicker from "@/components/atoms/DateRangePicker";

function normalizeAxiosError(err) {
	const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? "Unexpected error";
	return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

const cityConfigSchema = (t) =>
	yup.object({
		minShippingDays: yup
			.number()
			.typeError(t("validation.number"))
			.min(1, t("validation.minValue", { value: 1 }))
			.nullable(),

		maxShippingDays: yup
			.number()
			.typeError(t("validation.number"))
			.min(1, t("validation.minValue", { value: 1 }))
			.nullable()
			.test(
				"max-gte-min",
				t("validation.maxShippingDaysMustBeGreaterThanMin"),
				function (value) {
					const { minShippingDays } = this.parent;

					if (
						value == null ||
						minShippingDays == null
					) {
						return true;
					}

					return value >= minShippingDays;
				}
			),
	});

function CityConfigFormDialog({ open, onOpenChange, city, onSuccess }) {
	const t = useTranslations("shippingCities");
	const schema = useMemo(() => cityConfigSchema(t), [t]);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm({
		defaultValues: { minShippingDays: 0, maxShippingDays: 0 },
		resolver: yupResolver(schema),
		mode: "onTouched",
	});

	useEffect(() => {
		if (city) {
			const config = city.tenantConfigs?.[0];
			reset({
				minShippingDays: config?.minShippingDays ?? 0,
				maxShippingDays: config?.maxShippingDays ?? 0,
			});
		} else {
			reset({ minShippingDays: 0, maxShippingDays: 0 });
		}
	}, [city, reset, open]);

	const onSubmit = async (values) => {
		try {
			await api.post(`/cities/${city.id}/config`, values);
			toast.success(t("toast.saved"));
			onSuccess();
			onOpenChange(false);
		} catch (e) {
			toast.error(normalizeAxiosError(e));
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader className="border-b pb-4">
					<DialogTitle className="text-xl font-bold flex items-center gap-2">
						<MapPin className="w-6 h-6 text-primary" />
						{city?.nameAr} / {city?.nameEn}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
					<div className="grid grid-cols-1 gap-4">
						<div className="space-y-2">
							<Label className="text-sm font-semibold">{t("form.minDays")}</Label>
							<Input
								type="number"
								{...register("minShippingDays")}
								placeholder="0"
								className="rounded-xl h-[50px]"
							/>
							{errors.minShippingDays && <p className="text-xs text-red-600">{errors.minShippingDays.message}</p>}
						</div>
						<div className="space-y-2">
							<Label className="text-sm font-semibold">{t("form.maxDays")}</Label>
							<Input
								type="number"
								{...register("maxShippingDays")}
								placeholder="0"
								className="rounded-xl h-[50px]"
							/>
							{errors.maxShippingDays && <p className="text-xs text-red-600">{errors.maxShippingDays.message}</p>}
						</div>
					</div>

					<div className="flex items-center justify-end gap-3 pt-4 border-t">
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
							{t("form.cancel")}
						</Button>
						<Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
							{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : t("form.save")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export default function CitiesConfigPage() {
	const t = useTranslations("shippingCities");
	const [loading, setLoading] = useState(false);
	const [pager, setPager] = useState({
		total_records: 0,
		current_page: 1,
		per_page: 12,
		records: [],
	});

	const [formOpen, setFormOpen] = useState(false);
	const [selectedCity, setSelectedCity] = useState(null);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [filters, setFilters] = useState({
		minDays: "",
		maxDays: "",
		isConfigured: "all",
	});
	const searchTimer = useRef(null);

	useEffect(() => {
		clearTimeout(searchTimer.current);
		searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
		return () => clearTimeout(searchTimer.current);
	}, [search]);

	const fetchCities = useCallback(async ({ page = 1, per_page = 12 } = {}) => {
		setLoading(true);
		try {
			const params = {
				page,
				limit: per_page,
				search: debouncedSearch,
			};

			if (filters.minDays !== "" && filters.minDays != null) {
				params.minDays = filters.minDays;
			}
			if (filters.maxDays !== "" && filters.maxDays != null) {
				params.maxDays = filters.maxDays;
			}
			if (filters.isConfigured !== "all") {
				params.isConfigured = filters.isConfigured;
			}

			const res = await api.get(`/cities/my-config`, { params });
			setPager({
				total_records: res.data?.total_records ?? 0,
				current_page: res.data?.current_page ?? page,
				per_page: res.data?.per_page ?? per_page,
				records: res.data?.records ?? [],
			});
		} catch (e) {
			toast.error(normalizeAxiosError(e));
		} finally {
			setLoading(false);
		}
	}, [debouncedSearch, filters]);

	useEffect(() => {
		fetchCities({ page: 1, per_page: pager.per_page });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedSearch]);

	const handlePageChange = ({ page, per_page }) => {
		fetchCities({ page, per_page });
	};

	const openEdit = (city) => {
		setSelectedCity(city);
		setFormOpen(true);
	};

	const handleDeleteConfig = async (city) => {
		try {
			await api.delete(`/cities/${city.id}/config`);
			toast.success(t("toast.deleted"));
			fetchCities({ page: pager.current_page, per_page: pager.per_page });
		} catch (e) {
			toast.error(normalizeAxiosError(e));
		}
	};

	const applyFilters = () => fetchCities({ page: 1, per_page: pager.per_page });

	const hasActiveFilters = useMemo(() => {
		return Boolean(filters.minDays) || Boolean(filters.maxDays) || filters.isConfigured !== "all";
	}, [filters]);

	const handleExport = async () => {
		try {
			const params = {
				search: debouncedSearch,
			};

			if (filters.minDays !== "" && filters.minDays != null) {
				params.minDays = filters.minDays;
			}
			if (filters.maxDays !== "" && filters.maxDays != null) {
				params.maxDays = filters.maxDays;
			}
			if (filters.isConfigured !== "all") {
				params.isConfigured = filters.isConfigured;
			}

			const res = await api.get("/cities/export", {
				params,
				responseType: "blob",
			});
			const url = window.URL.createObjectURL(new Blob([res.data]));
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", `Cities_Config_${Date.now()}.xlsx`);
			document.body.appendChild(link);
			link.click();
			link.remove();
		} catch (e) {
			toast.error(t("messages.exportFailed"));
		}
	};

	const columns = useMemo(
		() => [
			{
				key: "nameAr",
				header: t("table.nameAr"),
				className: "min-w-[150px] font-semibold",
			},
			{
				key: "nameEn",
				header: t("table.nameEn"),
				className: "min-w-[150px]",
			},
			{
				key: "minDays",
				header: t("table.minDays"),
				cell: (row) => row.tenantConfigs?.[0]?.minShippingDays ?? "—",
			},
			{
				key: "maxDays",
				header: t("table.maxDays"),
				cell: (row) => row.tenantConfigs?.[0]?.maxShippingDays ?? "—",
			},
			{
				key: "status",
				header: t("table.status"),
				cell: (row) => {
					const isConfigured = row.tenantConfigs?.length > 0;
					return (
						<Badge variant={isConfigured ? "success" : "secondary"} className="gap-1">
							{isConfigured ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
							{isConfigured ? t("status.configured") : t("status.notConfigured")}
						</Badge>
					);
				},
			},
			{
				key: "options",
				header: t("table.options"),
				className: "w-[120px]",
				cell: (row) => (
					<ActionButtons
						row={row}
						actions={[
							{
								icon: <Edit2 size={16} />,
								tooltip: t("actions.edit"),
								onClick: (r) => openEdit(r),
								variant: "primary",
								permission: "city.update",
							},
							{
								icon: <Trash2 size={16} />,
								tooltip: t("actions.delete"),
								onClick: (r) => handleDeleteConfig(r),
								variant: "red",
								permission: "city.update",
								disabled: !row.tenantConfigs?.length,
							},
						]}
					/>
				),
			},
		],
		[t]
	);

	return (
		<div className="min-h-screen p-5">
			<PageHeader
				breadcrumbs={[
					{ name: t("breadcrumb.home"), href: "/dashboard" },
					{ name: t("breadcrumb.cities") },
				]}
			/>

			<Table
				columns={columns}
				data={pager.records}
				isLoading={loading}
				searchValue={search}
				onSearchChange={setSearch}
				onSearch={() => fetchCities({ page: 1, per_page: pager.per_page })}
				labels={{
					searchPlaceholder: t("toolbar.searchPlaceholder"),
					filter: t("toolbar.filter"),
					apply: t("filters.apply"),
					total: t("common.total"),
					limit: t("common.limit"),
					emptyTitle: t("empty"),
				}}
				actions={[
					{
						key: "export",
						label: t("toolbar.export"),
						icon: <FileDown size={14} />,
						color: "primary",
						onClick: handleExport,
						permission: "city.read",
					},
				]}
				onApplyFilters={applyFilters}
				filters={
					<>
						<FilterField label={t("filters.minDays")}>
							<Input
								type="number"
								min={1}
								value={filters.minDays}
								onChange={(e) => setFilters((f) => ({ ...f, minDays: e.target.value }))}
								placeholder={t("filters.minDaysPlaceholder")}
								className="h-10 rounded-xl border-border bg-background text-sm"
							/>
						</FilterField>

						<FilterField label={t("filters.maxDays")}>
							<Input
								type="number"
								min={1}
								value={filters.maxDays}
								onChange={(e) => setFilters((f) => ({ ...f, maxDays: e.target.value }))}
								placeholder={t("filters.maxDaysPlaceholder")}
								className="h-10 rounded-xl border-border bg-background text-sm"
							/>
						</FilterField>

						<FilterField label={t("table.status")}>
							<Select
								value={filters.isConfigured}
								onValueChange={(v) => setFilters((f) => ({ ...f, isConfigured: v }))}
							>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
									<SelectValue placeholder={t("table.status")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("filters.all")}</SelectItem>
									<SelectItem value="true">{t("status.configured")}</SelectItem>
									<SelectItem value="false">{t("status.notConfigured")}</SelectItem>
								</SelectContent>
							</Select>
						</FilterField>
					</>
				}
				pagination={{
					total_records: pager.total_records,
					current_page: pager.current_page,
					per_page: pager.per_page,
				}}
				onPageChange={handlePageChange}
				emptyState={t("empty")}
			/>

			<CityConfigFormDialog
				open={formOpen}
				onOpenChange={setFormOpen}
				city={selectedCity}
				onSuccess={() => fetchCities({ page: pager.current_page, per_page: pager.per_page })}
			/>
		</div>
	);
}
