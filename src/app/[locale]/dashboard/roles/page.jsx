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

/** ✅ Toolbar Component */
function RolesTableToolbar({ t, searchValue, onSearchChange, onAddRole }) {
	return (
		<div className="flex items-center justify-between gap-4 flex-wrap">
			<div className="relative w-[300px] focus-within:w-[350px] transition-all duration-300">
				<svg
					className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
					width="18"
					height="18"
					viewBox="0 0 18 18"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path d="M15 4.3125H10.5C10.1925 4.3125 9.9375 4.0575 9.9375 3.75C9.9375 3.4425 10.1925 3.1875 10.5 3.1875H15C15.3075 3.1875 15.5625 3.4425 15.5625 3.75C15.5625 4.0575 15.3075 4.3125 15 4.3125Z" fill="#A6ACBD" />
					<path d="M12.75 6.5625H10.5C10.1925 6.5625 9.9375 6.3075 9.9375 6C9.9375 5.6925 10.1925 5.4375 10.5 5.4375H12.75C13.0575 5.4375 13.3125 5.6925 13.3125 6C13.3125 6.3075 13.0575 6.5625 12.75 6.5625Z" fill="#A6ACBD" />
					<path d="M8.625 16.3125C4.3875 16.3125 0.9375 12.8625 0.9375 8.625C0.9375 4.3875 4.3875 0.9375 8.625 0.9375C8.9325 0.9375 9.1875 1.1925 9.1875 1.5C9.1875 1.8075 8.9325 2.0625 8.625 2.0625C5.0025 2.0625 2.0625 5.01 2.0625 8.625C2.0625 12.24 5.0025 15.1875 8.625 15.1875C12.2475 15.1875 15.1875 12.24 15.1875 8.625C15.1875 8.3175 15.4425 8.0625 15.75 8.0625C16.0575 8.0625 16.3125 8.3175 16.3125 8.625C16.3125 12.8625 12.8625 16.3125 8.625 16.3125Z" fill="#A6ACBD" />
					<path d="M16.5001 17.0626C16.3576 17.0626 16.2151 17.0101 16.1026 16.8976L14.6026 15.3976C14.3851 15.1801 14.3851 14.8201 14.6026 14.6026C14.8201 14.3851 15.1801 14.3851 15.3976 14.6026L16.8976 16.1026C17.1151 16.3201 17.1151 16.6801 16.8976 16.8976C16.7851 17.0101 16.6426 17.0626 16.5001 17.0626Z" fill="#A6ACBD" />
				</svg>

				<Input
					value={searchValue}
					onChange={(e) => onSearchChange?.(e.target.value)}
					placeholder={t("toolbar.searchPlaceholder")}
					className="rtl:pr-10 h-[40px] ltr:pl-10 rounded-full bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 placeholder:text-gray-400 dark:placeholder:text-slate-400 text-gray-700 dark:text-slate-100"
				/>
			</div>

			<div className="flex items-center gap-2">
				<Button_
					onClick={onAddRole}
					size="sm"
					label={t("toolbar.addRole")}
					tone="purple"
					variant="solid"
					icon={<Plus size={18} />}
				/>
			</div>
		</div>
	);
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
					<DialogDescription>{t("dialog.roleDescription")}</DialogDescription>
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
								rows={2}
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
							tone="purple"
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

	const percentage = all ? 100 : perms.length ? 100 : 0; // preview: either all or just show full

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
													"rounded-md",
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
									<Badge variant="outline" className="rounded-md border-primary/20">
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
				title: t("stats.totalRoles"),
				value: roles.length.toString(),
				icon: Shield,
				bg: "bg-[#F3F6FF] dark:bg-[#0B1220]",
				iconColor: "text-[#6B7CFF] dark:text-[#8A96FF]",
				iconBorder: "border-[#6B7CFF] dark:border-[#8A96FF]",
			},
			{
				title: t("stats.globalRoles"),
				value: roles.filter((r) => r.isGlobal).length.toString(),
				icon: Lock,
				bg: "bg-[#FFF9F0] dark:bg-[#1A1208]",
				iconColor: "text-[#F59E0B] dark:text-[#FBBF24]",
				iconBorder: "border-[#F59E0B] dark:border-[#FBBF24]",
			},
			{
				title: t("stats.customRoles"),
				value: roles.filter((r) => !r.isGlobal).length.toString(),
				icon: Users,
				bg: "bg-[#F0F9FF] dark:bg-[#082030]",
				iconColor: "text-[#0EA5E9] dark:text-[#38BDF8]",
				iconBorder: "border-[#0EA5E9] dark:border-[#38BDF8]",
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
						"rounded-md",
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
						<Badge variant="outline" className="rounded-md">
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
		<div className="min-h-screen p-6">
			<div className="bg-card !pb-0 flex flex-col gap-2 mb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-lg font-semibold">
						<span className="text-gray-400">{t("breadcrumb.home")}</span>
						<ChevronLeft className="text-gray-400" size={18} />
						<span className="text-primary">{t("breadcrumb.roles")}</span>
						<span className="ml-3 inline-flex w-3.5 h-3.5 rounded-full bg-primary" />
					</div>
				</div>

				<div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-6">
					{stats.map((stat, index) => (
						<motion.div
							key={stat.title}
							initial={{ opacity: 0, y: 18 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.06 }}
						>
							<InfoCard
								title={stat.title}
								value={stat.value}
								icon={stat.icon}
								bg={stat.bg}
								iconColor={stat.iconColor}
								iconBorder={stat.iconBorder}
							/>
						</motion.div>
					))}
				</div>
			</div>

			<div className="bg-card rounded-sm">
				<RolesTableToolbar
					t={t}
					searchValue={search}
					onSearchChange={setSearch}
					onAddRole={handleAddRole}
				/>

				<div className="mt-4">
					<DataTable
						columns={columns}
						data={paginatedRoles} // ✅ Use paginated data
						isLoading={isLoading}
						hoverable
						striped
						pagination={{
							total_records: filteredRoles.length,
							current_page: currentPage,
							per_page: perPage, // ✅ This will now show correctly
						}}
						onPageChange={handlePageChange} // ✅ Add handler
						emptyState={t("empty")}
					/>
				</div>
			</div>

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