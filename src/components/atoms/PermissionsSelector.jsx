"use client";

import React, { useMemo, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Minus, Shield, Sparkles, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/cn";
import { useTranslations } from "next-intl";

export default function PermissionsSelector({
	permissions = [],
	selected = [],
	onChange,
	className,
	disabled = false,
}) {
	const t = useTranslations("permissions");
	const updateInProgress = useRef(false);

	// ✅ Group permissions by module
	const groupedPermissions = useMemo(() => {
		const groups = {};
		permissions.forEach((perm) => {
			const parts = perm.name.split(".");
			const moduleName = parts.length > 1 ? parts[0] : "general";
			if (!groups[moduleName]) {
				groups[moduleName] = [];
			}
			groups[moduleName].push(perm);
		});
		return groups;
	}, [permissions]);


	// ✅ Toggle single permission
	const togglePermission = useCallback((permName) => {
		if (disabled || updateInProgress.current) return;
		updateInProgress.current = true;
		try {
			const newSelected = selected.includes(permName)
				? selected.filter((p) => p !== permName)
				: [...selected, permName];
			onChange?.(newSelected);
		} finally {
			setTimeout(() => {
				updateInProgress.current = false;
			}, 50);
		}
	}, [selected, onChange, disabled]);

	// ✅ Select/Unselect all in module
	const toggleModuleAll = useCallback((module, e) => {
		if (e) {
			e.stopPropagation();
			e.preventDefault();
		}
		if (disabled || updateInProgress.current) return;
		updateInProgress.current = true;
		try {
			const modulePerms = groupedPermissions[module].map((p) => p.name);
			const allSelected = modulePerms.every((p) => selected.includes(p));
			let newSelected;
			if (allSelected) {
				newSelected = selected.filter((p) => !modulePerms.includes(p));
			} else {
				newSelected = [...new Set([...selected, ...modulePerms])];
			}
			onChange?.(newSelected);
		} finally {
			setTimeout(() => {
				updateInProgress.current = false;
			}, 50);
		}
	}, [selected, onChange, disabled, groupedPermissions]);

	// ✅ Handle global select all
	const handleSelectAll = useCallback((e) => {
		if (e) {
			e.stopPropagation();
			e.preventDefault();
		}
		if (disabled || updateInProgress.current) return;
		updateInProgress.current = true;
		try {
			if (selected.length === permissions.length) {
				onChange?.([]);
			} else {
				onChange?.(permissions.map((p) => p.name));
			}
		} finally {
			setTimeout(() => {
				updateInProgress.current = false;
			}, 50);
		}
	}, [selected, permissions, onChange, disabled]);

	// ✅ Check module selection status
	const getModuleStatus = useCallback((module) => {
		const modulePerms = groupedPermissions[module].map((p) => p.name);
		const selectedCount = modulePerms.filter((p) => selected.includes(p)).length;
		if (selectedCount === 0) return "none";
		if (selectedCount === modulePerms.length) return "all";
		return "partial";
	}, [selected, groupedPermissions]);

	// ✅ Get module icon based on name
	const getModuleIcon = useCallback((moduleName) => {
		const icons = {
			users: "👥",
			roles: "🛡️",
			permissions: "🔐",
			orders: "📦",
			products: "🏷️",
			settings: "⚙️",
			reports: "📊",
			general: "📋",
		};
		return icons[moduleName.toLowerCase()] || "📁";
	}, []);

	// ✅ Extract action from permission name
	const getPermissionAction = useCallback((permName) => {
		const parts = permName.split(".");
		return parts.length > 1 ? parts[parts.length - 1] : permName;
	}, []);

	// ✅ Calculate selection percentage
	const selectionPercentage = useMemo(() => {
		return permissions.length > 0 ? Math.round((selected.length / permissions.length) * 100) : 0;
	}, [selected.length, permissions.length]);

	return (
		<div className={cn("space-y-4", className)} onClick={(e) => e.stopPropagation()}>
			{/* ✅ Enhanced Header with Stats */}
			<div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 backdrop-blur-sm">
				{/* Animated background effect */}
				<div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" />

				<div className="relative p-5">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-3">
							<div className="relative">
								<div className="absolute inset-0 bg-primary blur-xl opacity-30 animate-pulse" />
								<div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
									<Shield className="text-white" size={24} />
								</div>
							</div>
							<div>
								<h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
									{t("modules.permissions")}
									<Sparkles className="text-primary" size={18} />
								</h3>
								<p className="text-sm text-gray-600 dark:text-slate-400">
									{t("permissionsCount")}: {permissions.length}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-4">
							{/* Progress Circle */}
							<div className="relative w-16 h-16">
								<svg className="transform -rotate-90 w-16 h-16">
									<circle
										cx="32"
										cy="32"
										r="28"
										stroke="currentColor"
										strokeWidth="4"
										fill="none"
										className="text-gray-200 dark:text-slate-700"
									/>
									<circle
										cx="32"
										cy="32"
										r="28"
										stroke="rgb(var(--primary))"
										strokeWidth="4"
										fill="none"
										strokeDasharray={`${2 * Math.PI * 28}`}
										strokeDashoffset={`${2 * Math.PI * 28 * (1 - selectionPercentage / 100)}`}
										className="transition-all duration-500 drop-shadow-lg"
									/>
								</svg>
								<div className="absolute inset-0 flex items-center justify-center">
									<span className="text-sm font-bold text-primary">
										{selectionPercentage}%
									</span>
								</div>
							</div>

							{/* Stats */}
							<div className="text-right">
								<div className="flex items-baseline gap-1.5">
									<span className="text-3xl font-black bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
										{selected.length}
									</span>
									<span className="text-lg text-gray-400 dark:text-slate-500 font-medium">
										/ {permissions.length}
									</span>
								</div>
								<p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
									{selected.length === 0 && t("unselectAll")}
									{selected.length > 0 && selected.length < permissions.length && "محدد جزئياً"}
									{selected.length === permissions.length && "محدد بالكامل"}
								</p>
							</div>

							{/* Action Button */}
							<button
								type="button"
								onClick={handleSelectAll}
								disabled={disabled}
								className={cn(
									"relative px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 focus:outline-none overflow-hidden group",
									"shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95",
									selected.length === permissions.length
										? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
										: "bg-gradient-to-r from-primary to-primary/90 text-white hover:from-primary/90 hover:to-primary"
								)}
							>
								<span className="relative z-10 flex items-center gap-2">
									{selected.length === permissions.length ? (
										<>
											<X className="w-4 h-4" />
											{t("unselectAll")}
										</>
									) : (
										<>
											<Check className="w-4 h-4" />
											{t("selectAll")}
										</>
									)}
								</span>
								<div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
							</button>
						</div>
					</div>

					{/* Progress Bar */}
					<div className="relative h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
						<motion.div
							initial={{ width: 0 }}
							animate={{ width: `${selectionPercentage}%` }}
							transition={{ duration: 0.5, ease: "easeOut" }}
							className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary/80 to-primary shadow-lg"
						>
							<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
						</motion.div>
					</div>
				</div>
			</div>

			{/* ✅ Enhanced Modules Grid */}
			<div className="max-h-[500px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
				{Object.keys(groupedPermissions)
					.sort()
					.map((module, moduleIndex) => {
						const status = getModuleStatus(module);
						const modulePerms = groupedPermissions[module];

						return (
							<motion.div
								key={module}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: moduleIndex * 0.05 }}
								className={cn(
									"border-2 rounded-2xl overflow-hidden transition-all duration-300",
									"bg-white dark:bg-slate-800/40 backdrop-blur-sm",
									"border-gray-200 dark:border-slate-700",
									"hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5",
									disabled && "opacity-60 pointer-events-none"
								)}
							>
								{/* Module Header */}
								<div
									className={cn(
										"px-5 py-4 cursor-pointer transition-all duration-300",
										"bg-gradient-to-r from-gray-50/80 to-gray-100/50",
										"dark:from-slate-800/50 dark:to-slate-800/30",
										"hover:from-primary/5 hover:to-primary/10",
										"border-b-2 border-gray-100 dark:border-slate-700"
									)}
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-4">
											{/* Module Icon */}
											<div className="relative group">
												<div className="absolute inset-0 bg-primary blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
												<div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shadow-md border-2 border-gray-200 dark:border-slate-600 group-hover:border-primary/30 transition-all duration-300">
													<span className="text-2xl transform group-hover:scale-110 transition-transform duration-300">
														{getModuleIcon(module)}
													</span>
												</div>
											</div>

											{/* Module Info */}
											<div>
												<h4 className="font-bold text-lg text-gray-900 dark:text-slate-100 capitalize mb-1 flex items-center gap-2">
													{t(`modules.${module}`)}
													{status === "all" && (
														<span className="px-2 py-0.5 text-xs font-bold rounded-full bg-primary/10 text-primary">
															✓ محدد بالكامل
														</span>
													)}
												</h4>
												<div className="flex items-center gap-3">
													<p className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-1">
														<span className="font-semibold">{modulePerms.length}</span>
														{t("permissionsCount")}
													</p>
													<div className="w-1 h-1 rounded-full bg-gray-400" />
													<p className="text-sm font-medium text-primary">
														{modulePerms.filter((p) => selected.includes(p.name)).length} محدد
													</p>
												</div>
											</div>
										</div>

										{/* Select All Module Button */}
										<button
											type="button"
											onClick={(e) => toggleModuleAll(module, e)}
											className={cn(
												"relative w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-300 cursor-pointer group overflow-hidden",
												"shadow-md hover:shadow-lg",
												status === "all" &&
												"bg-gradient-to-br from-primary to-primary/80 border-primary shadow-primary/20",
												status === "partial" &&
												"bg-gradient-to-br from-primary/60 to-primary/40 border-primary/60",
												status === "none" &&
												"bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 hover:border-primary/50 hover:bg-primary/5"
											)}
										>
											<div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
											<div className="relative z-10">
												{status === "all" && <Check size={20} className="text-white" />}
												{status === "partial" && <Minus size={20} className="text-white" />}
												{status === "none" && <div className="w-2 h-2 rounded-full bg-gray-400 group-hover:bg-primary" />}
											</div>
										</button>
									</div>
								</div>

								{/* Permissions Grid */}
								<div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 bg-gradient-to-br from-gray-50/50 to-transparent dark:from-slate-900/20 dark:to-transparent">
									{modulePerms.map((perm, index) => {
										const action = getPermissionAction(perm.name);
										const isSelected = selected.includes(perm.name);

										return (
											<motion.div
												key={perm.id}
												initial={{ opacity: 0, scale: 0.9 }}
												animate={{ opacity: 1, scale: 1 }}
												transition={{ delay: index * 0.02 }}
												className={cn(
													"relative flex items-center gap-3 p-4 rounded-xl transition-all duration-300 cursor-pointer group overflow-hidden",
													"hover:shadow-lg transform hover:-translate-y-0.5",
													"border-2",
													isSelected
														? "border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5 shadow-md shadow-primary/10"
														: "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-primary/30 hover:bg-primary/5"
												)}
												onClick={() => togglePermission(perm.name)}
											>
												{/* Shine effect on hover */}
												<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

												<div className="relative flex-1 z-10">
													<label
														htmlFor={`perm-${perm.id}`}
														className="text-sm font-bold cursor-pointer text-gray-800 dark:text-slate-100 block mb-1"
													>
														{t(`actions.${action}`)}
													</label>
													{perm.description && (
														<p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">
															{perm.description}
														</p>
													)}
												</div>

												{/* Enhanced Indicator */}
												<AnimatePresence mode="wait">
													{isSelected ? (
														<motion.div
															key="selected"
															initial={{ scale: 0, rotate: -180 }}
															animate={{ scale: 1, rotate: 0 }}
															exit={{ scale: 0, rotate: 180 }}
															transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
															className="relative w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30"
														>
															<Check size={16} className="text-white" />
															<div className="absolute inset-0 rounded-full bg-primary blur-md opacity-50 animate-pulse" />
														</motion.div>
													) : (
														<motion.div
															key="unselected"
															initial={{ scale: 0 }}
															animate={{ scale: 1 }}
															exit={{ scale: 0 }}
															transition={{ duration: 0.2 }}
															className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-slate-600 flex items-center justify-center group-hover:border-primary/50 transition-all duration-300 bg-white dark:bg-slate-700"
														>
															<div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-slate-600 group-hover:bg-primary/50 transition-colors duration-300" />
														</motion.div>
													)}
												</AnimatePresence>
											</motion.div>
										);
									})}
								</div>
							</motion.div>
						);
					})}
			</div>
		</div>
	);
}