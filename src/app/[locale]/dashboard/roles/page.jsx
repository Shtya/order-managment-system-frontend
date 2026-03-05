"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	ChevronLeft,
	Filter,
	RefreshCw,
	Edit,
	Trash2,
	Shield,
	Users,
	Lock,
	Plus,
	X,
	Sparkles,
	Eye,
} from "lucide-react";
import { useTranslations } from "next-intl";

import InfoCard from "@/components/atoms/InfoCard";
import DataTable from "@/components/atoms/DataTable";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Button_ from "@/components/atoms/Button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import api from "@/utils/api";
import toast from "react-hot-toast";
import PermissionsSelector from "@/components/atoms/PermissionsSelector";
import { getUser } from "@/hook/getUser";
import PageHeader from "@/components/atoms/Pageheader";
import Table, { FilterField } from "@/components/atoms/Table";

export function useRolesApi() {
	const [loading, setLoading] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const [roles, setRoles] = useState([]);
	const [permissions, setPermissions] = useState([]);

	// ✅ Fetch all roles - FIXED: Set isLoading properly
	const fetchRoles = useCallback(async () => {
		setIsLoading(true); // Start loading
		try {
			setLoading(true);
			const { data } = await api.get('/roles');
			setRoles(data);
			return data;
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to fetch roles');
			throw error;
		} finally {
			setLoading(false);
			// ⚠️ IMPORTANT FIX: Add a small delay to ensure skeleton shows properly
			setTimeout(() => {
				setIsLoading(false);
			}, 100);
		}
	}, []);

	// ✅ Fetch all permissions
	const fetchPermissions = useCallback(async () => {
		try {
			const { data } = await api.get('/roles/permissions');
			setPermissions(data);
			return data;
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to fetch permissions');
			throw error;
		}
	}, []);


	const createRole = useCallback(async (roleData, adminId) => {
		try {
			setLoading(true);
			const { data } = await api.post('/roles', {
				...roleData,
				global: true,
			});
			toast.success('Role created successfully');
			return data;
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to create role');
			throw error;
		} finally {
			setLoading(false);
		}
	}, []);


	const updateRole = useCallback(async (id, roleData) => {
		try {
			setLoading(true);
			const { data } = await api.patch(`/roles/${id}`, roleData);
			toast.success('Role updated successfully');
			return data;
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to update role');
			throw error;
		} finally {
			setLoading(false);
		}
	}, []);

	// ✅ Delete role
	const deleteRole = useCallback(async (id) => {
		try {
			setLoading(true);
			await api.delete(`/roles/${id}`);
			toast.success('Role deleted successfully');
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to delete role');
			throw error;
		} finally {
			setLoading(false);
		}
	}, []);

	return {
		isLoading,
		loading,
		roles,
		permissions,
		fetchRoles,
		fetchPermissions,
		createRole,
		updateRole,
		deleteRole,
	};
}


function RoleFormDialog({ t, open, onClose, role, permissions, onSubmit, loading }) {
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		permissionNames: [],
	});

	useEffect(() => {
		if (role) {
			setFormData({
				name: role.name || "",
				description: role.description || "",
				permissionNames: role.permissionNames || [],
			});
		} else {
			setFormData({
				name: "",
				description: "",
				permissionNames: [],
			});
		}
	}, [role, open]);

	const handleSubmit = (e) => {
		e.preventDefault();
		onSubmit(formData);
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{role ? t("dialog.editRole") : t("dialog.addRole")}</DialogTitle>
 				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="grid grid-cols-2 gap-4 " >
						<div className="space-y-2" >
							<Label>{t("dialog.roleName")}</Label>
							<Input
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								placeholder={t("dialog.roleNamePlaceholder")}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label>{t("dialog.roleDescription")}</Label>
							<Textarea
								value={formData.description}
								onChange={(e) => setFormData({ ...formData, description: e.target.value })}
								placeholder={t("dialog.roleDescriptionPlaceholder")}
								rows={1}
							/>
						</div>
					</div>

					{/* ✅ NEW: Enhanced Permissions Selector */}
					<div>
						<PermissionsSelector
							permissions={permissions}
							selected={formData.permissionNames}
							onChange={(newPermissions) =>
								setFormData({ ...formData, permissionNames: newPermissions })
							}
						/>
					</div>

					<div className="flex justify-end gap-2 pt-4">
						<Button_
							type="submit"
							loading={loading}
 							variant="solid"
							label={t("dialog.save")}
						/>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}


function RolePreviewDialog({ t, open, onClose, role }) {
	if (!role) return null;

	const perms = role.permissionNames || [];
	const all = perms.includes("*");


	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						{t("preview.title")}
					</DialogTitle>
					<DialogDescription>{t("preview.description")}</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* ✅ Hero Header (same style as PermissionsSelector) */}
					<div className="relative overflow-hidden rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 backdrop-blur-sm">
						{/* shimmer */}
						<div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" />

						<div className="relative p-5">
							<div className="flex items-center justify-between gap-4 flex-wrap">
								<div className="flex items-center gap-3">
									<div className="relative">
										<div className="absolute inset-0 bg-primary blur-xl opacity-30 animate-pulse" />
										<div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
											<Shield className="text-white" size={24} />
										</div>
									</div>

									<div>
										<h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
											{role.name}
											<Sparkles className="text-primary" size={18} />
										</h3>

										{role.description ? (
											<p className="text-sm text-gray-600 dark:text-slate-400 mt-0.5">
												{role.description}
											</p>
										) : (
											<p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
												{t("preview.noDescription")}
											</p>
										)}
									</div>
								</div>

								<div className="flex items-center gap-4">


									{/* ✅ Badges */}
									<div className="text-right">
										<div className="flex items-center justify-end gap-2 mb-2">
											<Badge
												className={cn(
													"rounded-xl",
													role.isGlobal
														? "bg-[#FFF9F0] text-[#F59E0B] hover:bg-[#FFF9F0] dark:bg-orange-950/30 dark:text-orange-400"
														: "bg-[#F0F9FF] text-[#0EA5E9] hover:bg-[#F0F9FF] dark:bg-cyan-950/30 dark:text-cyan-400"
												)}
											>
												{role.isGlobal ? t("table.global") : t("table.custom")}
											</Badge>

										</div>

										<div className="flex items-baseline justify-end gap-1.5">
											<span className="text-3xl font-black bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
												{all ? "∞" : perms.length}
											</span>
											<span className="text-lg text-gray-400 dark:text-slate-500 font-medium">
												{all ? "" : ` ${t("table.permissionsCount")}`}
											</span>
										</div>

									</div>

								</div>
							</div>

						</div>
					</div>

					{/* ✅ Permissions List Card (same pattern blocks style) */}
					<div className="relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/30">
						<div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

						<div className="relative p-5">
							<div className="flex items-center justify-between mb-3">
								<div className="font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
									{t("preview.permissions")}
									{all && (
										<Badge className="bg-primary/10 text-primary border border-primary/20">
											{t("table.allPermissions")}
										</Badge>
									)}
								</div>

								{!all && (
									<Badge variant="outline" className="rounded-xl border-primary/20">
										{perms.length} {t("table.permissionsCount")}
									</Badge>
								)}
							</div>

							{!perms.length ? (
								<div className="text-sm text-gray-500 dark:text-slate-400">
									{t("preview.noPermissions")}
								</div>
							) : (
								<div className="flex flex-wrap gap-2">
									{(all ? ["*"] : perms).map((p) => (
										<span
											key={p}
											className={cn(
												"px-3 py-1 rounded-full text-xs font-bold border transition-all",
												"bg-gray-50 dark:bg-slate-800",
												"border-gray-200 dark:border-slate-700",
												"text-gray-700 dark:text-slate-200",
												"hover:border-primary/40 hover:bg-primary/5"
											)}
										>
											{p}
										</span>
									))}
								</div>
							)}

							<div className="flex justify-end pt-5">
								<Button
									onClick={onClose}
									className="bg-primary1 text-white hover:opacity-95 rounded-xl px-6"
								>
									{t("preview.close")}
								</Button>
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}



/** ✅ Main Page Component */
export default function RolesPermissionsPage() {
	const t = useTranslations("roles-client");
	const [search, setSearch] = useState("");
	const [filters, setFilters] = useState({ name: "", type: "" });
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedRole, setSelectedRole] = useState(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [roleToDelete, setRoleToDelete] = useState(null);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [previewRole, setPreviewRole] = useState(null);

	// ✅ FIX #2: Add pagination state for proper per_page tracking
	const [currentPage, setCurrentPage] = useState(1);
	const [perPage, setPerPage] = useState(6);

	const handlePreviewRole = (role) => {
		setPreviewRole(role);
		setPreviewOpen(true);
	};

	const { isLoading, roles, permissions, loading, fetchRoles, fetchPermissions, createRole, updateRole, deleteRole } = useRolesApi();
	const user = getUser()

	useEffect(() => {
		fetchRoles();
		fetchPermissions();
	}, [fetchRoles, fetchPermissions]);
	const stats = useMemo(
		() => [
			{
				name: t("stats.totalRoles"),
				value: roles.length.toString(),
				icon: Shield,
				color: "#6B7CFF", // blue
				sortOrder: 0,
			},
			{
				name: t("stats.globalRoles"),
				value: roles.filter((r) => r.isGlobal).length.toString(),
				icon: Lock,
				color: "#F59E0B", // amber
				sortOrder: 1,
			},
			{
				name: t("stats.customRoles"),
				value: roles.filter((r) => !r.isGlobal).length.toString(),
				icon: Users,
				color: "#0EA5E9", // sky
				sortOrder: 2,
			},
		],
		[t, roles]
	);

	const filteredRoles = useMemo(() => {
		return roles.filter((role) => {
			const matchSearch = role.name.toLowerCase().includes(search.toLowerCase()) ||
				role.description?.toLowerCase().includes(search.toLowerCase());
			const matchName = !filters.name || role.name.toLowerCase().includes(filters.name.toLowerCase());
			const matchType = !filters.type ||
				(filters.type === "global" && role.isGlobal) ||
				(filters.type === "custom" && !role.isGlobal);
			return matchSearch && matchName && matchType;
		});
	}, [roles, search, filters]);

	// ✅ FIX #3: Add pagination logic for filtered data
	const paginatedRoles = useMemo(() => {
		const start = (currentPage - 1) * perPage;
		const end = start + perPage;
		return filteredRoles.slice(start, end);
	}, [filteredRoles, currentPage, perPage]);

	const handleAddRole = () => {
		setSelectedRole(null);
		setDialogOpen(true);
	};

	const handleEditRole = (role) => {
		setSelectedRole(role);
		setDialogOpen(true);
	};

	const handleDeleteClick = (role) => {
		setRoleToDelete(role);
		setDeleteDialogOpen(true);
	};

	const handleSubmitRole = async (data) => {
		try {
			if (selectedRole) {
				await updateRole(selectedRole.id, data);
			} else {
				await createRole(data, user?.id);
			}
			setDialogOpen(false);
			fetchRoles();
		} catch (error) {
			console.error(error);
		}
	};

	const handleConfirmDelete = async () => {
		if (!roleToDelete) return;
		try {
			await deleteRole(roleToDelete.id);
			setDeleteDialogOpen(false);
			fetchRoles();
		} catch (error) {
			console.error(error);
		}
	};

	// ✅ FIX #4: Add page change handler
	const handlePageChange = ({ page, per_page }) => {
		setCurrentPage(page);
		setPerPage(per_page);
	};

	const columns = useMemo(() => {
		return [
			{
				key: "name",
				header: t("table.roleName"),
				className: "text-gray-700 dark:text-slate-200 font-semibold",
			},
			{
				key: "description",
				header: t("table.description"),
				className: "text-gray-600 dark:text-slate-200",
				cell: (row) => (
					<div >
						{row.description ? row.description : "---"}
					</div>
				),
			},
			{
				key: "type",
				header: t("table.type"),
				cell: (row) => (
					<Badge className={cn(
						"rounded-xl",
						row.isGlobal
							? "bg-[#FFF9F0] text-[#F59E0B] hover:bg-[#FFF9F0] dark:bg-orange-950/30 dark:text-orange-400"
							: "bg-[#F0F9FF] text-[#0EA5E9] hover:bg-[#F0F9FF] dark:bg-cyan-950/30 dark:text-cyan-400"
					)}>
						{row.isGlobal ? t("table.global") : t("table.custom")}
					</Badge>
				),
			},
			{
				key: "permissions",
				header: t("table.permissions"),
				cell: (row) => (
					<div className="flex items-center gap-2">
						<Badge variant="outline" className="rounded-xl">
							{row.permissionNames.includes('*') ? t("table.allPermissions") : `${row.permissionNames.length} ${t("table.permissionsCount")}`}
						</Badge>
					</div>
				),
			},
			{
				key: "options",
				header: t("table.options"),
				cell: (row) => (
					<div className="flex items-center gap-2">
						{/* ✅ Show Edit button only if NOT global */}
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.95 }}
										onClick={() => handleEditRole(row)}
										className="w-9 h-9 rounded-full border border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center dark:bg-purple-950/30 dark:hover:bg-purple-600"
									>
										<Edit size={16} />
									</motion.button>
								</TooltipTrigger>
								<TooltipContent>{t("actions.edit")}</TooltipContent>
							</Tooltip>
						</TooltipProvider>

						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.95 }}
										onClick={() => handleDeleteClick(row)}
										className="w-9 h-9 rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center dark:bg-red-950/30 dark:hover:bg-red-600"
									>
										<Trash2 size={16} />
									</motion.button>
								</TooltipTrigger>
								<TooltipContent>{t("actions.delete")}</TooltipContent>
							</Tooltip>
						</TooltipProvider>


						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.95 }}
										onClick={() => handlePreviewRole(row)}
										className="w-9 h-9 rounded-full border border-primary/20 bg-primary/10 text-primary  hover:bg-primary hover:text-white transition-all flex items-center justify-center dark:bg-primary/15"
									>
										<Eye size={16} />
									</motion.button>
								</TooltipTrigger>
								<TooltipContent>{t("actions.preview")}</TooltipContent>
							</Tooltip>
						</TooltipProvider>

					</div>
				),
			},
		];
	}, [t]);

	return (
		<div className="min-h-screen p-5">

			<PageHeader
				breadcrumbs={[
					{ name: t("breadcrumb.home"), href: "/dashboard" },
					{ name: t("breadcrumb.roles") },
				]}
				buttons={
					<>
						<Button_
							onClick={handleAddRole}
							size="sm"
							label={t("toolbar.addRole")}
 							variant="solid"
							icon={<Plus size={18} />}
						/>
					</>
				}
				stats={stats}
			/>


			<Table
				// search
				searchValue={search}
				onSearchChange={(v) => {
					setSearch(v);
					setCurrentPage(1);
				}}
				onSearch={() => setCurrentPage(1)}
 

				// optional filters (you already have filters state)
				filters={
					<>
						<FilterField label={t("filters.name") ?? "Name"}>
							<Input
								value={filters.name || ""}
								onChange={(e) => {
									setFilters((p) => ({ ...p, name: e.target.value }));
									setCurrentPage(1);
								}}
								className="!h-[42px]"
								placeholder={t("filters.namePlaceholder") ?? "Role name"}
							/>
						</FilterField>

						<FilterField label={t("filters.type") ?? "Type"}>
							<Input
								value={filters.type || ""}
								onChange={(e) => {
									setFilters((p) => ({ ...p, type: e.target.value }));
									setCurrentPage(1);
								}}
								className="!h-[42px]"
								placeholder={t("filters.typePlaceholder") ?? "global / custom"}
							/>
						</FilterField>
					</>
				}
				hasActiveFilters={!!filters.name || !!filters.type}
				onApplyFilters={() => setCurrentPage(1)}

				// labels
				labels={{
					searchPlaceholder: t("toolbar.searchPlaceholder"),
					filter: t("toolbar.filter") ?? "Filters",
					apply: t("filters.apply") ?? "Apply",
					emptyTitle: t("empty"),
				}}

				// table
				columns={columns}
				data={paginatedRoles}
				isLoading={isLoading}
				hoverable
				striped

				// pagination (still using your local pagination)
				pagination={{
					total_records: filteredRoles.length,
					current_page: currentPage,
					per_page: perPage,
				}}
				onPageChange={({ page, per_page }) => {
					setCurrentPage(page);
					setPerPage(per_page);
				}}
			/>

			<RoleFormDialog
				t={t}
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				role={selectedRole}
				permissions={permissions}
				onSubmit={handleSubmitRole}
				loading={loading}
			/>

			<RolePreviewDialog
				t={t}
				open={previewOpen}
				onClose={() => setPreviewOpen(false)}
				role={previewRole}
			/>


			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
						<AlertDialogDescription>{t("deleteDialog.description")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("deleteDialog.cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
							{t("deleteDialog.confirm")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}