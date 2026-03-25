"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Edit, Trash2, Shield, Users, Lock, Plus, X,
	Eye, Search, Check, ChevronRight,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Button_ from "@/components/atoms/Button";
import {
	Dialog, DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	AlertDialog, AlertDialogAction, AlertDialogCancel,
	AlertDialogContent, AlertDialogDescription,
	AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

import api from "@/utils/api";
import toast from "react-hot-toast";

import PageHeader from "@/components/atoms/Pageheader";
import Table from "@/components/atoms/Table";
import { useAuth } from "@/context/AuthContext";

/* ═══════════════════════════════════════════════════════════════
	 DATA HOOK — unchanged logic, same API
═══════════════════════════════════════════════════════════════ */
export function useRolesApi() {
	const [loading, setLoading] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [roles, setRoles] = useState([]);
	const [permissions, setPermissions] = useState([]);

	const fetchRoles = useCallback(async () => {
		setIsLoading(true);
		try {
			setLoading(true);
			const { data } = await api.get("/roles");
			setRoles(data);
			return data;
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to fetch roles");
			throw err;
		} finally {
			setLoading(false);
			setTimeout(() => setIsLoading(false), 100);
		}
	}, []);

	const fetchPermissions = useCallback(async () => {
		try {
			const { data } = await api.get("/roles/permissions");
			setPermissions(data.map(p => p.name));
			return data;
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to fetch permissions");
			throw err;
		}
	}, []);

	const createRole = useCallback(async (roleData, adminId) => {
		try {
			setLoading(true);
			const { data } = await api.post("/roles", { ...roleData, adminId, global: false });
			toast.success("Role created successfully");
			return data;
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to create role");
			throw err;
		} finally { setLoading(false); }
	}, []);

	const updateRole = useCallback(async (id, roleData) => {
		try {
			setLoading(true);
			const { data } = await api.patch(`/roles/${id}`, roleData);
			toast.success("Role updated successfully");
			return data;
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to update role");
			throw err;
		} finally { setLoading(false); }
	}, []);

	const deleteRole = useCallback(async (id) => {
		try {
			setLoading(true);
			await api.delete(`/roles/${id}`);
			toast.success("Role deleted successfully");
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to delete role");
			throw err;
		} finally { setLoading(false); }
	}, []);

	return { isLoading, loading, roles, permissions, fetchRoles, fetchPermissions, createRole, updateRole, deleteRole };
}

/* ═══════════════════════════════════════════════════════════════
	 INTERNAL DESIGN ATOMS
═══════════════════════════════════════════════════════════════ */

/** Thin gradient top-bar — shared dialog signature */
function DialogAccentBar() {
	return (
		<div
			className="h-[3px] w-full rounded-t-2xl shrink-0"
			style={{ background: "linear-gradient(90deg, var(--primary), var(--secondary, #ffb703))" }}
		/>
	);
}

/** Muted uppercase section label */
function SectionLabel({ children }) {
	return (
		<p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
			{children}
		</p>
	);
}



/** Type badge — Global (amber) / Custom (sky) */
function TypeBadge({ isGlobal, t }) {
	return (
		<span
			className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10.5px] font-black uppercase tracking-[0.1em] border"
			style={isGlobal
				? { background: "color-mix(in oklab,#f59e0b 10%,var(--card))", borderColor: "color-mix(in oklab,#f59e0b 25%,transparent)", color: "#b45309" }
				: { background: "color-mix(in oklab,#0ea5e9 10%,var(--card))", borderColor: "color-mix(in oklab,#0ea5e9 25%,transparent)", color: "#0369a1" }
			}
		>
			{isGlobal ? t("table.global") : t("table.custom")}
		</span>
	);
}

/** Permission count badge */
function PermCountBadge({ permissionNames, t }) {
	const isAll = permissionNames.includes("*");
	return (
		<span
			className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border"
			style={{
				background: "color-mix(in oklab, var(--primary) 7%, var(--card))",
				borderColor: "color-mix(in oklab, var(--primary) 20%, transparent)",
				color: "var(--primary)",
			}}
		>
			{isAll ? t("table.allPermissions") : `${permissionNames.length} ${t("table.permissionsCount")}`}
		</span>
	);
}

/** Row action button — icon only, consistent sizing */
function ActionBtn({ onClick, disabled, locked, icon: Icon, color, tooltip, permission }) {
	const { hasPermission } = useAuth();
	const COLORS = {
		primary: {
			base: "color-mix(in oklab, var(--primary) 9%, var(--card))",
			bdr: "color-mix(in oklab, var(--primary) 22%, transparent)",
			text: "var(--primary)",
			hover: "var(--primary)",
		},
		destructive: {
			base: "color-mix(in oklab, var(--destructive) 9%, var(--card))",
			bdr: "color-mix(in oklab, var(--destructive) 22%, transparent)",
			text: "var(--destructive)",
			hover: "var(--destructive)",
		},
		muted: {
			base: "var(--muted)",
			bdr: "var(--border)",
			text: "var(--muted-foreground)",
			hover: null,
		},
	};

	if (permission && !hasPermission(permission)) {
		return null;
	}

	const c = COLORS[color] ?? COLORS.primary;

	const btn = locked ? (
		<div
			className="w-8 h-8 rounded-lg flex items-center justify-center border cursor-not-allowed"
			style={{ background: c.base, borderColor: c.bdr, color: c.text, opacity: 0.5 }}
		>
			<Icon size={14} />
		</div>
	) : (
		<motion.button
			type="button"
			onClick={onClick}
			disabled={disabled}
			whileHover={{ scale: 1.07, y: -1 }}
			whileTap={{ scale: 0.94 }}
			className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-150"
			style={{ background: c.base, borderColor: c.bdr, color: c.text }}
			onMouseEnter={e => {
				if (!c.hover) return;
				e.currentTarget.style.background = c.hover;
				e.currentTarget.style.color = "#fff";
				e.currentTarget.style.borderColor = c.hover;
			}}
			onMouseLeave={e => {
				e.currentTarget.style.background = c.base;
				e.currentTarget.style.color = c.text;
				e.currentTarget.style.borderColor = c.bdr;
			}}
		>
			<Icon size={14} />
		</motion.button>
	);

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>{btn}</TooltipTrigger>
				<TooltipContent className="text-[11px]">{tooltip}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

/* ═══════════════════════════════════════════════════════════════
	 PERMISSIONS SELECTOR
	 Groups by prefix, collapsible, search, select-all per group
═══════════════════════════════════════════════════════════════ */
function PermissionsSelector({ permissions = [], selected = [], onChange, disabled }) {
	const [search, setSearch] = useState("");
	const [collapsed, setCollapsed] = useState({});

	const t = useTranslations("roles-client")

	const groups = useMemo(() => {
		const map = {};
		permissions.forEach((p) => {
			console.log(p);
			const key = p?.split(/[._]/)[0] || "general";
			if (!map[key]) map[key] = [];
			map[key].push(p);
		});
		return map;
	}, [permissions]);

	const filtered = useMemo(() => {
		if (!search.trim()) return groups;
		const q = search.toLowerCase();
		const out = {};
		Object.entries(groups).forEach(([grp, ps]) => {
			const hits = ps.filter(p => p.toLowerCase().includes(q));
			if (hits.length) out[grp] = hits;
		});
		return out;
	}, [groups, search]);

	const togglePerm = (p) => { if (disabled) return; onChange(selected.includes(p) ? selected.filter(x => x !== p) : [...selected, p]); };
	const toggleGroup = (grp, ps) => { if (disabled) return; const allOn = ps.every(p => selected.includes(p)); onChange(allOn ? selected.filter(p => !ps.includes(p)) : [...new Set([...selected, ...ps])]); };
	const toggleCol = (grp) => setCollapsed(c => ({ ...c, [grp]: !c[grp] }));

	const total = permissions.length;
	const checked = selected.length;

	return (
		<div className="space-y-3">
			{/* Header */}
			<div className="flex items-center justify-between gap-3 flex-wrap">
				<div>
					<SectionLabel>{t("permissions.title")}</SectionLabel>
					<div className="flex items-center gap-1.5">
						<span className="text-[11px] font-bold tabular-nums" style={{ color: "var(--primary)" }}>{checked}</span>
						<span className="text-[11px] text-muted-foreground">{t("permissions.selectedOutOf", { checked, total })}</span>
						<div className="w-20 h-1 rounded-full bg-border overflow-hidden ms-1">
							<motion.div
								className="h-full rounded-full"
								style={{ background: "var(--primary)" }}
								animate={{ width: total ? `${(checked / total) * 100}%` : "0%" }}
								transition={{ duration: 0.4, ease: "easeOut" }}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Groups */}
			<div className="space-y-2 max-h-[300px] overflow-y-auto pe-1">
				{Object.entries(filtered).map(([grp, ps]) => {
					const allOn = ps.every(p => selected.includes(p));
					const someOn = !allOn && ps.some(p => selected.includes(p));
					const open = !collapsed[grp];

					return (
						<div key={grp} className="rounded-lg border border-border overflow-hidden" style={{ background: "var(--card)" }}>
							{/* Group header */}
							<button
								type="button"
								onClick={() => toggleCol(grp)}
								className="w-full flex items-center gap-3 px-4 py-2.5 text-start
                  hover:bg-[color-mix(in_oklab,var(--muted)_60%,transparent)] transition-colors duration-150"
							>
								{/* select-all micro checkbox */}
								<button
									type="button"
									onClick={e => { e.stopPropagation(); toggleGroup(grp, ps); }}
									disabled={disabled}
									className="w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all duration-150"
									style={{
										borderColor: allOn ? "var(--primary)" : someOn ? "color-mix(in oklab,var(--primary) 60%,transparent)" : "var(--border)",
										background: allOn ? "var(--primary)" : someOn ? "color-mix(in oklab,var(--primary) 28%,transparent)" : "transparent",
									}}
								>
									{allOn && <Check size={9} strokeWidth={3.5} className="text-white" />}
									{someOn && <div className="w-1.5 h-0.5 rounded-full" style={{ background: "var(--primary)" }} />}
								</button>

								<span className="flex-1 text-[12px] font-bold capitalize text-foreground/80">{grp}</span>
								<span className="text-[10px] text-muted-foreground tabular-nums me-1">
									{ps.filter(p => selected.includes(p)).length}/{ps.length}
								</span>
								<motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.18 }} className="text-muted-foreground">
									<ChevronRight size={13} />
								</motion.span>
							</button>

							{/* Chips */}
							<AnimatePresence initial={false}>
								{open && (
									<motion.div
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										transition={{ duration: 0.2, ease: "easeInOut" }}
										className="overflow-hidden"
									>
										<div
											className="px-4 py-3 flex flex-wrap gap-1.5 border-t border-border"
											style={{ background: "color-mix(in oklab,var(--muted) 45%,var(--card))" }}
										>
											{ps.map(perm => {
												const active = selected.includes(perm);
												return (
													<motion.button
														key={perm}
														type="button"
														onClick={() => togglePerm(perm)}
														disabled={disabled}
														whileHover={!disabled ? { scale: 1.03 } : {}}
														whileTap={!disabled ? { scale: 0.96 } : {}}
														className={cn(
															"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg",
															"border text-[11px] font-mono font-semibold select-none",
															"transition-all duration-150",
															disabled && "opacity-40 cursor-not-allowed pointer-events-none",
														)}
														style={{
															background: active ? "color-mix(in oklab,var(--primary) 8%,var(--card))" : "var(--card)",
															borderColor: active ? "color-mix(in oklab,var(--primary) 35%,transparent)" : "var(--border)",
															color: active ? "var(--primary)" : "var(--muted-foreground)",
														}}
													>
														{active && <Check size={9} strokeWidth={3} style={{ color: "var(--primary)" }} />}
														{perm}
													</motion.button>
												);
											})}
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					);
				})}
				{!Object.keys(filtered).length && (
					<p className="py-8 text-center text-[13px] text-muted-foreground">{t("permissions.noMatch")}</p>
				)}
			</div>
		</div>
	);
}

/* ═══════════════════════════════════════════════════════════════
	 ROLE FORM DIALOG
═══════════════════════════════════════════════════════════════ */
function RoleFormDialog({ t, open, onClose, role, permissions, onSubmit, loading }) {
	const [formData, setFormData] = useState({ name: "", description: "", permissionNames: [] });

	useEffect(() => {
		setFormData(role
			? { name: role.name || "", description: role.description || "", permissionNames: role.permissionNames || [] }
			: { name: "", description: "", permissionNames: [] }
		);
	}, [role, open]);

	const isGlobal = role?.isGlobal;

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="!max-w-3xl max-h-[92vh] overflow-y-auto ">
				<DialogHeader>
					<DialogTitle> {role ? t("dialog.editRole") : t("dialog.addRole")} </DialogTitle>
					<DialogDescription> {t("dialog.roleDescription")}</DialogDescription>
				</DialogHeader>

				{/* Form */}
				<form onSubmit={e => { e.preventDefault(); onSubmit(formData); }} className=" pt-4 space-y-5">

					{/* Global notice */}
					{isGlobal && (
						<div
							className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-[12px] font-medium"
							style={{
								background: "color-mix(in oklab,#f59e0b 8%,var(--card))",
								borderColor: "color-mix(in oklab,#f59e0b 25%,transparent)",
								color: "#b45309",
							}}
						>
							<Lock size={13} className="shrink-0" style={{ color: "#f59e0b" }} />
							{t("dialog.globalRoleNotice")}
						</div>
					)}

					{/* Name + Description */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<SectionLabel>{t("dialog.roleName")}</SectionLabel>
							<Input
								value={formData.name}
								onChange={e => setFormData({ ...formData, name: e.target.value })}
								placeholder={t("dialog.roleNamePlaceholder")}
								required
								disabled={isGlobal}
								className="h-10 rounded-lg border-border bg-background text-sm
                  focus:border-[var(--primary)]/50 focus:ring-1 focus:ring-[var(--primary)]/12"
							/>
						</div>
						<div className="space-y-1.5">
							<SectionLabel>{t("dialog.roleDescriptionLabel") || t("dialog.roleDescription")}</SectionLabel>
							<Textarea
								value={formData.description}
								onChange={e => setFormData({ ...formData, description: e.target.value })}
								placeholder={t("dialog.roleDescriptionPlaceholder")}
								rows={2}
								disabled={isGlobal}
								className="rounded-lg border-border bg-background text-sm resize-none
                  focus:border-[var(--primary)]/50 focus:ring-1 focus:ring-[var(--primary)]/12"
							/>
						</div>
					</div>


					{/* Permissions */}
					<PermissionsSelector
						permissions={permissions}
						selected={formData.permissionNames}
						onChange={v => setFormData({ ...formData, permissionNames: v })}
						disabled={loading || isGlobal}
					/>

					{/* Footer */}
					<div className="flex items-center justify-between gap-3 pt-1 pb-1">
						<button
							type="button"
							onClick={onClose}
							className="btn btn-sm btn-default btn-ghost"
						>
							{t("common.cancel") || "Cancel"}
						</button>
						<Button_
							type="submit"
							loading={loading}
							tone="primary"
							variant="solid"
							label={t("dialog.save")}
						/>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

/* ═══════════════════════════════════════════════════════════════
	 ROLE PREVIEW DIALOG
═══════════════════════════════════════════════════════════════ */
function RolePreviewDialog({ t, open, onClose, role }) {
	if (!role) return null;
	const perms = role.permissionNames || [];
	const isAll = perms.includes("*");

	const groups = useMemo(() => {
		if (isAll) return { "*": ["*"] };
		const map = {};
		perms.forEach(p => {
			const key = p?.split(/[._]/)[0] || "general";
			if (!map[key]) map[key] = [];
			map[key].push(p);
		});
		return map;
	}, [perms, isAll]);

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="!max-w-3xl max-h-[92vh] overflow-x-hidden overflow-y-auto p-0 gap-0 rounded-lg border border-border bg-card shadow-[0_24px_64px_rgba(0,0,0,0.14)]">


				<DialogHeader>
					<DialogTitle> {role.name}</DialogTitle>
					<DialogDescription> {role.description || t("preview.noDescription")}</DialogDescription>
				</DialogHeader>


				{/* Header */}
				<div className="flex items-start justify-between gap-4 px-7 pt-6 pb-5">


					<div className="flex items-center gap-3 shrink-0">
						<TypeBadge isGlobal={role.isGlobal} t={t} /> 
						<div className="text-end">
							<div
								className="leading-none tabular-nums"
								style={{ fontFamily: "'Instrument Serif',serif", fontWeight: 400, fontSize: 28, color: "var(--primary)" }}
							>
								{isAll ? "∞" : perms.length}
							</div>
							<div className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground mt-0.5">
								{t("table.permissionsCount")}
							</div>
						</div>

					</div>
				</div>

				{/* Permissions body */}
				<div className=" pt-4 space-y-3">
					<SectionLabel>{t("preview.permissions")}</SectionLabel>

					{!perms.length ? (
						<div
							className="py-8 text-center rounded-lg border border-border text-[13px] text-muted-foreground"
							style={{ background: "var(--muted)" }}
						>
							{t("preview.noPermissions")}
						</div>
					) : (
						<div className="space-y-2">
							{Object.entries(groups).map(([grp, ps]) => (
								<div key={grp} className="rounded-lg border border-border overflow-hidden">
									<div
										className="px-4 py-2 flex items-center justify-between"
										style={{ background: "color-mix(in oklab,var(--muted) 55%,var(--card))" }}
									>
										<span className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground capitalize">{grp}</span>
										<span className="text-[10px] text-muted-foreground tabular-nums">{ps.length}</span>
									</div>
									<div className="px-4 py-3 flex flex-wrap gap-1.5">
										{ps.map(p => (
											<span
												key={p}
												className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border border-border bg-card text-foreground/70"
											>
												{p}
											</span>
										))}
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="px-7 pb-6 pt-2 flex justify-end">
					<button
						onClick={onClose}
						className="btn btn-sm btn-default btn-outline"
					>
						{t("preview.close")}
					</button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

/* ═══════════════════════════════════════════════════════════════
	 DELETE CONFIRM DIALOG  — refined AlertDialog
═══════════════════════════════════════════════════════════════ */
function DeleteDialog({ t, open, onOpenChange, roleName, onConfirm, loading }) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="rounded-lg border border-border bg-card !p-0 gap-0 max-w-md overflow-hidden shadow-[0_20px_56px_rgba(0,0,0,0.14)]">


				<div className="p-6 space-y-4">
					{/* Icon + title */}
					<div className="flex items-start gap-3">
						<div
							className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
							style={{
								background: "color-mix(in oklab,var(--destructive) 10%,var(--card))",
								border: "1px solid color-mix(in oklab,var(--destructive) 20%,transparent)",
							}}
						>
							<Trash2 size={17} style={{ color: "var(--destructive)" }} />
						</div>
						<div>
							<h3
								className="leading-tight"
								style={{ fontFamily: "'Instrument Serif',serif", fontWeight: 400, fontSize: 19, color: "var(--card-foreground)" }}
							>
								{t("deleteDialog.title")}
							</h3>
							<p className="text-[12.5px] text-muted-foreground mt-1 leading-relaxed">
								{t("deleteDialog.description")}
								{roleName && (
									<strong className="font-bold text-foreground"> "{roleName}"</strong>
								)}
							</p>
						</div>
					</div>

					{/* Actions */}
					<div className="flex items-center justify-end gap-2.5 pt-1">
						<AlertDialogCancel
							className="btn btn-sm btn-default btn-ghost h-9 px-4 text-[12.5px]"
							style={{ border: "1px solid var(--border)" }}
						>
							{t("deleteDialog.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={onConfirm}
							disabled={loading}
							className="btn btn-sm btn-solid btn-rose h-9 px-5 text-[12.5px] text-white"
							style={{
								background: "linear-gradient(135deg,var(--destructive),color-mix(in oklab,var(--destructive) 80%,#b91c1c))",
								border: "none",
								boxShadow: "0 3px 12px -3px color-mix(in oklab,var(--destructive) 50%,transparent)",
							}}
						>
							{t("deleteDialog.confirm")}
						</AlertDialogAction>
					</div>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
}

/* ═══════════════════════════════════════════════════════════════
	 MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function RolesPermissionsPage() {
	const t = useTranslations("roles-client");
	const { user } = useAuth();

	const [search, setSearch] = useState("");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedRole, setSelectedRole] = useState(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [roleToDelete, setRoleToDelete] = useState(null);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [previewRole, setPreviewRole] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [perPage, setPerPage] = useState(6);

	const {
		isLoading, loading, roles, permissions,
		fetchRoles, fetchPermissions,
		createRole, updateRole, deleteRole,
	} = useRolesApi();

	useEffect(() => {
		fetchRoles();
		fetchPermissions();
	}, [fetchRoles, fetchPermissions]);

	/* ── Stats ── */
	const stats = useMemo(() => [
		{ name: t("stats.totalRoles"), value: roles.length.toString(), icon: Shield, color: "#6B7CFF", sortOrder: 0 },
		{ name: t("stats.globalRoles"), value: roles.filter(r => r.isGlobal).length.toString(), icon: Lock, color: "#F59E0B", sortOrder: 1 },
		{ name: t("stats.customRoles"), value: roles.filter(r => !r.isGlobal).length.toString(), icon: Users, color: "#0EA5E9", sortOrder: 2 },
	], [t, roles]);

	/* ── Filter + paginate ── */
	const filteredRoles = useMemo(() =>
		roles.filter(r =>
			r.name.toLowerCase().includes(search.toLowerCase()) ||
			r.description?.toLowerCase().includes(search.toLowerCase())
		),
		[roles, search]
	);

	const paginatedRoles = useMemo(() => {
		const start = (currentPage - 1) * perPage;
		return filteredRoles.slice(start, start + perPage);
	}, [filteredRoles, currentPage, perPage]);

	/* ── Handlers ── */
	const handleAddRole = () => { setSelectedRole(null); setDialogOpen(true); };
	const handleEditRole = (role) => { setSelectedRole(role); setDialogOpen(true); };
	const handleDeleteClick = (role) => { setRoleToDelete(role); setDeleteDialogOpen(true); };
	const handlePreview = (role) => { setPreviewRole(role); setPreviewOpen(true); };

	const handleSubmitRole = async (data) => {
		try {
			selectedRole ? await updateRole(selectedRole.id, data) : await createRole(data, user?.id);
			setDialogOpen(false);
			fetchRoles();
		} catch { }
	};

	const handleConfirmDelete = async () => {
		if (!roleToDelete) return;
		try { await deleteRole(roleToDelete.id); setDeleteDialogOpen(false); fetchRoles(); } catch { }
	};

	const handlePageChange = ({ page, per_page }) => { setCurrentPage(page); setPerPage(per_page); };

	/* ── Columns ── */
	const columns = useMemo(() => [
		{
			key: "name",
			header: t("table.roleName"),
			cell: (row) => (
				<span className="text-[13.5px] font-semibold text-foreground">{row.name}</span>
			),
		},
		{
			key: "description",
			header: t("table.description"),
			cell: (row) => (
				<span className="text-[13px] text-muted-foreground">
					{row.description || <span className="opacity-30 font-mono text-[12px]">—</span>}
				</span>
			),
		},
		{
			key: "type",
			header: t("table.type"),
			cell: (row) => <TypeBadge isGlobal={row.isGlobal} t={t} />,
		},
		{
			key: "permissions",
			header: t("table.permissions"),
			cell: (row) => <PermCountBadge permissionNames={row.permissionNames} t={t} />,
		},
		{
			key: "options",
			header: t("table.options"),
			cell: (row) => (
				<div className="flex items-center gap-1.5">
					{/* Edit */}
					<ActionBtn
						onClick={() => handleEditRole(row)}
						locked={row.isGlobal}
						icon={row.isGlobal ? Lock : Edit}
						color={row.isGlobal ? "muted" : "primary"}
						tooltip={row.isGlobal ? t("actions.locked") : t("actions.edit")}
						permission="roles.update"
					/>
					{/* Delete */}
					<ActionBtn
						onClick={() => handleDeleteClick(row)}
						locked={row.isGlobal}
						icon={row.isGlobal ? Shield : Trash2}
						color={row.isGlobal ? "muted" : "destructive"}
						tooltip={row.isGlobal ? t("actions.protected") : t("actions.delete")}
						permission="roles.delete"
					/>
					{/* Preview */}
					<ActionBtn
						onClick={() => handlePreview(row)}
						icon={Eye}
						color="primary"
						tooltip={t("actions.preview")}
						permission="roles.read"
					/>
				</div>
			),
		},
	], [t]);

	/* ── Render ── */
	return (
		<div className="min-h-screen p-5">

			{/* Page header */}
			<PageHeader
				breadcrumbs={[
					{ name: t("breadcrumb.home"), href: "/" },
					{ name: t("breadcrumb.roles") },
				]}
				buttons={
					<Button_
						onClick={handleAddRole}
						size="sm"
						label={t("toolbar.addRole")}
						variant="solid"
						icon={<Plus size={15} />}
						permission="roles.create"
					/>
				}
				stats={stats}
			/>

			{/* Table */}
			<Table
				searchValue={search}
				onSearchChange={setSearch}
				columns={columns}
				data={paginatedRoles}
				isLoading={isLoading}
				hoverable
				striped
				labels={{
					searchPlaceholder: t("toolbar.searchPlaceholder"),
					emptyTitle: t("empty"),
					emptySubtitle: t("emptySubtitle") || "",
				}}
				pagination={{
					total_records: filteredRoles.length,
					current_page: currentPage,
					per_page: perPage,
				}}
				onPageChange={handlePageChange}
				emptyState={t("empty")}
			/>

			{/* Form dialog */}
			<RoleFormDialog
				t={t}
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				role={selectedRole}
				permissions={permissions}
				onSubmit={handleSubmitRole}
				loading={loading}
			/>

			{/* Preview dialog */}
			<RolePreviewDialog
				t={t}
				open={previewOpen}
				onClose={() => setPreviewOpen(false)}
				role={previewRole}
			/>

			{/* Delete confirm */}
			<DeleteDialog
				t={t}
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				roleName={roleToDelete?.name}
				onConfirm={handleConfirmDelete}
				loading={loading}
			/>

		</div>
	);
}