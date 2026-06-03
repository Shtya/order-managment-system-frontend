import React, { useState, useEffect, useRef, useMemo } from "react";
import { FilterField } from "./Table";
import api from "@/utils/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "next-intl";

/**
 * @param {string} value — selected admin id or "all"
 * @param {function} onChange
 * @param {string} [label] — FilterField label
 * @param {string} [title] — trigger placeholder
 * @param {boolean} [showAllOption=true] — show "All admins" option
 */
export default function AdminFilter({
	value,
	onChange,
	label,
	title,
	showAllOption = true,
}) {
	const t = useTranslations("common");
	const fieldLabel = label ?? t("admin");
	const [open, setOpen] = useState(false);
	const [admins, setAdmins] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedTerm, setDebouncedTerm] = useState("");
	const [loading, setLoading] = useState(false);
	const [selectedAdmin, setSelectedAdmin] = useState(null);
	const inputRef = useRef(null);

	// Fetch the specific admin if it's selected but not in the search results
	useEffect(() => {
		if (value && value !== "all") {
			const alreadyInList = admins.find((a) => String(a.id) === String(value));
			if (!alreadyInList) {
				const fetchSelected = async () => {
					try {
						const res = await api.get(`/users/${value}`);
						setSelectedAdmin(res.data);
					} catch (err) {
						console.error("Error fetching selected admin details", err);
					}
				};
				fetchSelected();
			} else {
				setSelectedAdmin(alreadyInList);
			}
		} else {
			setSelectedAdmin(null);
		}
	}, [value, admins]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedTerm(searchTerm);
		}, 500);
		return () => clearTimeout(timer);
	}, [searchTerm]);

	const renderAdmins = useMemo(() => {
		const combined = loading ? [] : [...admins];
		if (selectedAdmin && !combined.some((a) => String(a.id) === String(selectedAdmin.id))) {
			combined.unshift(selectedAdmin);
		}
		return combined;
	}, [admins, selectedAdmin, loading]);

	useEffect(() => {
		if (open) {
			const timer = setTimeout(() => {
				inputRef.current?.focus();
			}, 0);
			return () => clearTimeout(timer);
		}
		setSearchTerm("");
	}, [open]);

	useEffect(() => {
		const fetchAdmins = async () => {
			setLoading(true);
			try {
				const res = await api.get("/users/super-admin/list", {
					params: {
						role: "admin",
						search: debouncedTerm || undefined,
						limit: 10,
					},
				});
				const data = res.data?.records || [];
				setAdmins(data);
			} catch (err) {
				console.error("Admin Lookup Error", err);
			} finally {
				setLoading(false);
			}
		};
		fetchAdmins();
	}, [debouncedTerm]);

	const triggerPlaceholderSingle = title ?? t("all");

	return (
		<FilterField label={fieldLabel}>
			<Select value={value} onValueChange={onChange} open={open} onOpenChange={setOpen}>
				<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm focus:border-[var(--primary)] transition-all">
					<SelectValue placeholder={triggerPlaceholderSingle} />
				</SelectTrigger>

				<SelectContent>
					<div className="px-2 py-2 sticky top-0 bg-background z-10 border-b border-border">
						<input
							type="text"
							ref={inputRef}
							placeholder={t("searchPlaceholder") || "Search..."}
							className="w-full rounded-md border border-input bg-transparent px-3 py-1 rtl:text-end text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							onKeyDown={(e) => e.stopPropagation()}
						/>
					</div>

					{showAllOption && <SelectItem value="all">{t("all")}</SelectItem>}

					{renderAdmins.map((a) => (
						<SelectItem key={a.id} value={String(a.id)}>
							<div className="flex flex-col">
								<span className="text-sm font-medium">{a.name}</span>
								<span className="text-[10px] text-muted-foreground">{a.email}</span>
							</div>
						</SelectItem>
					))}
					{loading && (
						<div className="py-4 text-center text-sm text-muted-foreground">{t("loading") || "Loading..."}</div>
					)}
					{!loading && admins.length === 0 && (
						<div className="py-4 text-center text-sm text-muted-foreground">{t("noResults") || "No results found"}</div>
					)}
				</SelectContent>
			</Select>
		</FilterField>
	);
}
