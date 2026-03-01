/* 
	- Custom employee type box with input INSIDE box
	- Role Select using shadcn Select
	- Validation using react-hook-form + yup
	- Notifications using react-hot-toast
	- After create: open WhatsApp dialog to send credentials (same logic as users page)
*/

"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, X, User, Mail, Phone, Send, Eye, EyeOff, Copy, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import Button_ from "@/components/atoms/Button";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/utils/cn";
import { Package } from "lucide-react";

import { useLocale, useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import toast, { Toaster } from "react-hot-toast";

// api (axios instance)
import api from "@/utils/api";
import { COUNTRIES } from "../../dashboard/users/page";



function digitsOnly(v) {
	return (v || "").replace(/\D/g, "");
}

function validatePhone(rawDigits, country) {
	const value = digitsOnly(rawDigits);
	if (!value) return "يرجى إدخال رقم جوال صحيح";

	if (value.length < country.phone.min || value.length > country.phone.max) {
		if (country.phone.min === country.phone.max) return `رقم الجوال يجب أن يكون ${country.phone.min} رقمًا`;
		return `رقم الجوال يجب أن يكون بين ${country.phone.min} و ${country.phone.max} رقمًا`;
	}

	if (value.length === country.phone.max && country.phone.regex && !country.phone.regex.test(value)) {
		return "يرجى إدخال رقم جوال صحيح حسب الدولة المختارة";
	}

	return "";
}

function copyToClipboard(text) {
	try {
		navigator.clipboard.writeText(text);
		toast.success("Copied");
	} catch {
		toast.error("Copy failed");
	}
}

function getApiMsg(err, fallback = "Request failed") {
	const msg =
		err?.response?.data?.message ||
		err?.response?.data?.error ||
		err?.message ||
		fallback;
	return Array.isArray(msg) ? msg.join(", ") : msg;
}


export default function AddEmployeePage() {
	const navigate = useRouter();
	const locale = useLocale();
	const isRTL = locale === "ar";
	const t = useTranslations("addEmployee");

	// avatar state: preview + file
	const [profileImage, setProfileImage] = useState(null);
	const [avatarFile, setAvatarFile] = useState(null);

	// post-create credentials + whatsapp dialog state
	const [waOpen, setWaOpen] = useState(false);
	const [createdUser, setCreatedUser] = useState(null);
	const [credentials, setCredentials] = useState(null); // {email,password}

	// Yup schema (messages from i18n keys you added)
	const schema = useMemo(() => {
		return yup.object({
			name: yup.string().trim().required(t("validation.nameRequired")),
			email: yup.string().trim().required(t("validation.emailRequired")).email(t("validation.emailInvalid")),
			phoneCountry: yup.string().required(),
			phoneNumber: yup
				.string()
				.required(t("validation.phoneRequired"))
				.test("valid-phone", t("validation.phoneInvalid"), function (value) {
					const { phoneCountry } = this.parent;
					const country = COUNTRIES.find((c) => c.key === phoneCountry) || COUNTRIES[0];
					return !validatePhone(value, country); // validatePhone يرجّع "" لو valid
				}),

			roleId: yup
				.number()
				.typeError(t("validation.roleRequired"))
				.required(t("validation.roleRequired")),
			password: yup
				.string()
				.required(t("validation.passwordRequired"))
				.min(6, t("validation.passwordMin")),
			employeeType: yup.string().required(t("validation.employeeTypeRequired")),
			customType: yup.string().when("employeeType", {
				is: "custom",
				then: (s) => s.trim().required(t("validation.customTypeRequired")),
				otherwise: (s) => s.optional(),
			}),
		});
	}, [t]);

	const {
		register,
		handleSubmit,
		watch,
		control,
		setValue,
		reset,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			name: "",
			email: "",
			phoneCountry: "EG",
			phoneNumber: "",

			roleId: undefined,
			password: "",
			employeeType: "",
			customType: "",
		},
	});

	const employeeType = watch("employeeType");
	const customType = watch("customType");

	// employee types boxes
	const employeeTypes = useMemo(
		() => [
			{ id: "data_entry", label: t("roles.dataEntry"), icon: User },
			{ id: "warehouse", label: t("roles.warehouse"), icon: Package },
			{ id: "customer_service", label: t("roles.customerService"), icon: Phone },
			{ id: "custom", label: t("roles.custom"), icon: User },
		],
		[t]
	);


	const [rolesLoading, setRolesLoading] = useState(false);
	const [roles, setRoles] = useState([]);

	async function fetchRoles() {
		setRolesLoading(true);
		try {
			const res = await api.get("/lookups/roles");
			const raw = res?.data || [];
			const normalized = raw
				.map((r) => ({
					id: r?.id ?? r?.value ?? r?._id,
					label: r?.name ?? r?.label ?? r?.title ?? String(r?.id ?? ""),
				}))
				.filter((r) => r.id != null);

			setRoles(normalized);
		} catch (e) {
			console.warn("Failed to load roles", e);
		} finally {
			setRolesLoading(false);
		}
	}

	useEffect(() => {
		fetchRoles()
	}, [])


	const handleImageUpload = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setAvatarFile(file);
		const url = URL.createObjectURL(file);
		setProfileImage(url);
	};

	const onRemoveAvatar = () => {
		if (profileImage) {
			try {
				URL.revokeObjectURL(profileImage);
			} catch { }
		}
		setProfileImage(null);
		setAvatarFile(null);
	};

	const onSubmit = async (values) => {
		try {
			// build FormData
			const fd = new FormData();
			fd.append("name", values.name.trim());
			fd.append("email", values.email.trim());
			const country = COUNTRIES.find((c) => c.key === values.phoneCountry) || COUNTRIES[0];
			const dial = digitsOnly(country.dialCode);
			const p = digitsOnly(values.phoneNumber);
			const fullPhone = p ? `+${dial}${p}` : "";

			fd.append("phone", fullPhone);

			fd.append("password", values.password);

			// roleId number
			fd.append("roleId", String(values.roleId));

			// employeeType string: if custom -> customType text
			const employeeTypeValue =
				values.employeeType === "custom"
					? (values.customType || "").trim()
					: values.employeeType;

			fd.append("employeeType", employeeTypeValue);

			if (avatarFile) fd.append("avatar", avatarFile);

			const res = await api.post("/users/admin-create-avatar", fd, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			const user = res?.data?.user ?? null;
			const creds = res?.data?.credentials ?? null;

			toast.success(t("toasts.createSuccess"));

			setCreatedUser(user);
			setCredentials(creds);

			// open whatsapp dialog automatically
			setWaOpen(true);

			// reset form (keep avatar cleared)
			reset();
			onRemoveAvatar();
			setValue("phoneCountry", "EG", { shouldValidate: false });
			setValue("phoneNumber", "", { shouldValidate: false });

			setValue("employeeType", "", { shouldValidate: false });
			setValue("customType", "", { shouldValidate: false });
		} catch (e) {
			const msg = getApiMsg(e, t("toasts.createFailed"));

			// limit reached message from backend
			if (String(msg).toLowerCase().includes("users limit")) {
				toast.error(t("toasts.limitReached"));
				return;
			}

			toast.error(msg || t("toasts.createFailed"));
		}
	};

	return (
		<motion.div
 			initial={{ opacity: 0, y: 20, scale: 0.98 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
			className="min-h-screen p-6"
		>
			<Toaster position="top-center" />

			{/* Header */}
			<div className="bg-card mb-6">
				<div className="flex items-center justify-between">
					{/* Breadcrumb */}
					<div className="flex items-center gap-2 text-lg font-semibold">
						<span className="text-gray-400">{t("breadcrumb.home")}</span>
						<ChevronLeft className="text-gray-400" size={18} />
						<button
							onClick={() => navigate.push("/employees")}
							className="text-gray-400 hover:text-primary transition-colors"
						>
							{t("breadcrumb.employees")}
						</button>
						<ChevronLeft className="text-gray-400" size={18} />
						<span className="text-primary">{t("breadcrumb.addEmployee")}</span>
						<span className="mr-3 inline-flex w-3.5 h-3.5 rounded-full bg-primary" />
					</div>

				</div>
			</div>

			{/* Form Content - Two Columns */}
			<div className="flex gap-6">
				<div className="flex-1 space-y-6">
					<motion.div
						className="bg-card"
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.2 }}
					>
						<div className="flex items-center justify-between mb-4 gap-3">
							<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200">
								{t("sections.employeeType")}
							</h3>
						</div>

						<div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
							{employeeTypes.map((type, idx) => {
								const isSelected = employeeType === type.id;
								const isCustom = type.id === "custom";

								return (
									<motion.button
										key={type.id}
										type="button"
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.25 + idx * 0.05 }}
										onClick={() => {
											setValue("employeeType", type.id, { shouldValidate: true });

											if (!isCustom) {
												const matchRole = roles.find((r) => String(r.label) === String(type.label));
												setValue("customType", "");
											} else {
												// leave role selection to dropdown
											}
										}}
										className={cn(
											"relative rounded-xl border-2 transition-all duration-300 text-left",
											"flex flex-col items-center gap-3 group p-4",
											isSelected
												? "border-primary bg-primary/5 shadow-lg shadow-primary/20"
												: "border-gray-200 dark:border-slate-700 hover:border-primary/50 bg-white/50 dark:bg-slate-900/20"
										)}
									>
										<div className="flex flex-col items-center gap-3 w-full">
											<div
												className={cn(
													"w-12 h-12 rounded-xl flex items-center justify-center transition-all",
													isSelected
														? "bg-primary text-white"
														: "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 group-hover:bg-primary/10 group-hover:text-primary"
												)}
											>
												<type.icon size={24} />
											</div>

											<span
												className={cn(
													"text-sm font-medium transition-colors text-center",
													isSelected
														? "text-primary"
														: "text-gray-600 dark:text-slate-300 group-hover:text-primary"
												)}
											>
												{type.label}
											</span>
										</div>

										{/* Input INSIDE custom box */}
										{isCustom && isSelected && (
											<motion.div
												initial={{ opacity: 0, y: 6 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ duration: 0.2 }}
												className="w-full mt-2"
												onClick={(e) => e.stopPropagation()}
												onMouseDown={(e) => e.stopPropagation()}
											>
												<Input
													{...register("customType")}
													value={customType || ""}
													placeholder={t("placeholders.customType")}
													className={cn(
														"rounded-xl h-[42px] text-center",
														"bg-white/70 dark:bg-slate-800/60",
														"border-gray-200 dark:border-slate-700",
														"focus-visible:ring-primary/30"
													)}
												/>
												{errors.customType && (
													<div className="text-xs text-red-500 mt-1 text-center">
														{errors.customType.message}
													</div>
												)}
											</motion.div>
										)}

										{isSelected && (
											<motion.div
												layoutId="roleIndicator"
												className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
												initial={{ scale: 0 }}
												animate={{ scale: 1 }}
												transition={{ type: "spring", stiffness: 500, damping: 30 }}
											>
												<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
													<path
														d="M11.6667 3.5L5.25 9.91667L2.33333 7"
														stroke="white"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
												</svg>
											</motion.div>
										)}
									</motion.button>
								);
							})}
						</div>

						{errors.employeeType && (
							<div className="mt-3 text-xs text-red-500 text-right">
								{errors.employeeType.message}
							</div>
						)}
					</motion.div>

					{/* Employee Information */}
					<motion.div
						className="bg-card"
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.3 }}
					>
						<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
							{t("sections.employeeInfo")}
						</h3>

						<div className=" mb-8 space-y-5 grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-4">
							{/* Name */}
							<div className="space-y-2">
								<Label className="text-sm text-gray-600 dark:text-slate-300 flex items-center gap-2">
									<User size={16} className="text-gray-400" />
									{t("fields.name")}
								</Label>
								<Input
									{...register("name")}
									placeholder={t("placeholders.name")}
									className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
								/>
								{errors.name && <div className="text-xs text-red-500">{errors.name.message}</div>}
							</div>

							{/* Email */}
							<div className="space-y-2">
								<Label className="text-sm text-gray-600 dark:text-slate-300 flex items-center gap-2">
									<Mail size={16} className="text-gray-400" />
									{t("fields.email")}
								</Label>
								<Input
									type="email"
									{...register("email")}
									placeholder={t("placeholders.email")}
									className="rounded-full !font-[Inter] h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 font-en"
								/>
								{errors.email && <div className="text-xs text-red-500">{errors.email.message}</div>}
							</div>

							{/* Phone */}
 							<div className="space-y-2">
								<Label className="text-sm text-gray-600 dark:text-slate-300 flex items-center gap-2">
									<Phone size={16} className="text-gray-400" />
									{t("fields.phone")}
								</Label>

								<div className="flex gap-2">
									<div className="w-[120px]">
										<Controller
											name="phoneCountry"
											control={control}
											render={({ field }) => (
												<Select value={field.value} onValueChange={field.onChange}>
													<SelectTrigger className="!w-full !h-[45px] rounded-full bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 font-bold text-[rgb(var(--primary))]">
														<SelectValue placeholder={t("placeholders.selectCountry") || "اختر الدولة"} />
													</SelectTrigger>
													<SelectContent className="max-h-72">
														{COUNTRIES.map((c) => (
															<SelectItem key={c.key} value={c.key}>
																{c.dialCode} — {c.nameAr}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											)}
										/>
									</div>

									<Input
										placeholder={
											(COUNTRIES.find((c) => c.key === watch("phoneCountry")) || COUNTRIES[0])?.placeholder
										}
 										inputMode="numeric"
										className={cn(
											"flex-1 rounded-full font-en h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 font-en",
											errors.phoneNumber ? "border-red-300 focus-visible:ring-red-300" : ""
										)}
										{...register("phoneNumber", {
											onChange: (e) => {
												// keep digits only like WhatsApp
												e.target.value = digitsOnly(e.target.value);
											},
										})}
									/>
								</div>

								{errors.phoneNumber && (
									<div className="text-xs text-red-600  text-right">
										{errors.phoneNumber.message}
									</div>
								)}
							</div>


							{/* Role Select (shadcn) */}
							<div className="space-y-2">
								<Label className="text-sm text-gray-600 dark:text-slate-300 flex items-center gap-2">
									<User size={16} className="text-gray-400" />
									{t("fields.roleSelect")}
								</Label>

								<Controller
									name="roleId"
									control={control}
									render={({ field }) => (
										<Select
											value={field.value ? String(field.value) : ""}
											onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
										>
											<SelectTrigger
												className={cn(
													"w-full rounded-full !h-[45px] px-4",
													"bg-[#fafafa] dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700"
												)}
											>
												<SelectValue placeholder={t("placeholders.selectRole")} />
											</SelectTrigger>

											<SelectContent position="popper" className="max-h-72">
												{roles.map((r) => (
													<SelectItem key={String(r.id)} value={String(r.id)}>
														{r.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								/>
								{errors.roleId && <div className="text-xs text-red-500">{errors.roleId.message}</div>}
							</div>

							{/* Password */}
							<div className="space-y-2">
								<Label className="text-sm text-gray-600 dark:text-slate-300 flex items-center gap-2">
									<User size={16} className="text-gray-400" />
									{t("fields.password")}
								</Label>
								<Input
									type="password"
									{...register("password")}
									placeholder={t("placeholders.password")}
									className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
								/>
								{errors.password && <div className="text-xs text-red-500">{errors.password.message}</div>}
							</div>
						</div>

						<div className="w-fit mr-auto" >
							<Button_
								onClick={handleSubmit(onSubmit)}
								disabled={isSubmitting}
								size="md"
								label={isSubmitting ? t("actions.saving") || t("actions.save") : t("actions.save")}
								tone="purple"
								className="!px-6"
								variant="solid"
								icon={<Save />}
							/>
						</div>
					</motion.div>
				</div>

				{/* Left Column - Profile Image Upload */}
				<div className="w-full max-w-[400px]">
					<ProfileImageUpload
						t={t}
						image={profileImage}
						onImageChange={handleImageUpload}
						onRemove={onRemoveAvatar}
						isRTL={isRTL}
					/>
				</div>
			</div>

			{/* WhatsApp Dialog after create */}
			<WhatsappDialog
				t={t}
				open={waOpen}
				onOpenChange={setWaOpen}
				user={createdUser}
				credentials={credentials}
			/>
		</motion.div>
	);
}

/** =========================
 * Profile Image Upload (same as your current)
 * ========================= */
function ProfileImageUpload({ image, onImageChange, onRemove, t, isRTL }) {
	const inputRef = React.useRef(null);
	const [isDragging, setIsDragging] = React.useState(false);

	const handleDrop = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);

		const file = e.dataTransfer.files?.[0];
		if (file && file.type.startsWith("image/")) {
			const fakeEvent = { target: { files: [file] } };
			onImageChange(fakeEvent);
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay: 0.2 }}
			className="bg-card rounded-xl p-6"
 		>
			<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4 text-right">
				{t("sections.employeeImage")}
			</h3>

			<div
				onDragEnter={(e) => {
					e.preventDefault();
					e.stopPropagation();
					setIsDragging(true);
				}}
				onDragOver={(e) => {
					e.preventDefault();
					e.stopPropagation();
					setIsDragging(true);
				}}
				onDragLeave={(e) => {
					e.preventDefault();
					e.stopPropagation();
					setIsDragging(false);
				}}
				onDrop={handleDrop}
				className={cn(
					"rounded-xl border-2 border-dashed transition-all duration-300",
					isDragging ? "border-primary bg-primary/5" : "border-primary/60 bg-white/40 dark:bg-slate-900/20"
				)}
			>
				<input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onImageChange} />

				{!image ? (
					<div className="p-8 text-center">
						<div className="flex flex-col items-center gap-4">
							<div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
								<User size={40} className="text-primary" />
							</div>

							<div className="space-y-2">
								<p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("upload.dragHere")}</p>
								<p className="text-sm text-slate-400">{t("upload.clickToChoose")}</p>

								<div className="flex items-center justify-center gap-3 text-sm text-slate-400 pt-2">
									<span className="h-px w-16 bg-slate-200 dark:bg-slate-700" />
									<span>{t("common.or")}</span>
									<span className="h-px w-16 bg-slate-200 dark:bg-slate-700" />
								</div>
							</div>

							<Button
								type="button"
								variant="outline"
								className="rounded-full px-8 border-primary/60 text-primary hover:bg-primary/10"
								onClick={() => inputRef.current?.click()}
							>
								{t("upload.chooseImage")}
							</Button>
						</div>
					</div>
				) : (
					<div className="relative p-4">
						<div className="relative rounded-xl overflow-hidden">
							<img src={image} alt={t("upload.imageAlt")} className="w-full h-64 object-cover" />
							<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
						</div>

						<motion.button
							type="button"
							onClick={onRemove}
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.9 }}
							className="absolute top-6 left-6 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
							aria-label={t("upload.remove")}
						>
							<X size={20} />
						</motion.button>

						<Button
							type="button"
							variant="outline"
							className="w-full mt-4 rounded-full border-primary/60 text-primary hover:bg-primary/10"
							onClick={() => inputRef.current?.click()}
						>
							{t("upload.changeImage")}
						</Button>
					</div>
				)}
			</div>

			<div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
				<p className="text-sm text-blue-800 dark:text-blue-300 text-right">
					<strong>{t("note.title")}</strong> {t("note.text")}
				</p>
			</div>
		</motion.div>
	);
}


function WhatsappDialog({ t, open, onOpenChange, user, credentials }) {
	const [countryKey, setCountryKey] = useState("EG");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [error, setError] = useState("");
	const [includePassword, setIncludePassword] = useState(true);
	const [showPass, setShowPass] = useState(false);

	useEffect(() => {
		if (!open) {
			setCountryKey("EG");
			setPhoneNumber("");
			setError("");
			setIncludePassword(true);
			setShowPass(false);
		}
	}, [open]);

	const selectedCountry = useMemo(() => COUNTRIES.find((c) => c.key === countryKey) || COUNTRIES[0], [countryKey]);

	const email = credentials?.email || user?.email || "";
	const password = credentials?.password || "";

	const message = useMemo(() => {
		const lines = [];
		lines.push("Account details:");
		if (user?.name) lines.push(`Name: ${user.name}`);
		if (email) lines.push(`Email: ${email}`);
		if (includePassword && password) lines.push(`Password: ${password}`);
		lines.push("");
		lines.push("Please login and change your password after first login.");
		return lines.join("\n");
	}, [user, email, password, includePassword]);

	const isValidPhone = useMemo(() => !validatePhone(phoneNumber, selectedCountry), [phoneNumber, selectedCountry]);

	const waLink = useMemo(() => {
		const dial = digitsOnly(selectedCountry.dialCode);
		const p = digitsOnly(phoneNumber);
		const full = `${dial}${p}`;
		const text = encodeURIComponent(message);
		return `https://wa.me/${full}?text=${text}`;
	}, [selectedCountry, phoneNumber, message]);

	const handleCountryChange = (newKey) => {
		setCountryKey(newKey);
		const newCountry = COUNTRIES.find((c) => c.key === newKey) || COUNTRIES[0];
		const msg = validatePhone(phoneNumber, newCountry);
		setError(phoneNumber.length > 0 ? msg : "");
	};

	const handlePhoneChange = (e) => {
		const value = digitsOnly(e.target.value);
		setPhoneNumber(value);
		const msg = validatePhone(value, selectedCountry);
		setError(value.length > 0 ? msg : "");
	};

	console.log(email, isValidPhone, includePassword, password);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl rounded-xl">
				<DialogHeader className="text-right">
					<DialogTitle>{t("whatsapp.title") || "Send via WhatsApp"}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">


					{/* Phone */}
					<div className="space-y-2">
						<Label className="text-xs text-gray-500 dark:text-slate-400">{t("whatsapp.phone") || "Phone"}</Label>

						<div className="flex gap-2">
							<div className="w-44">
								<Select value={countryKey} onValueChange={handleCountryChange}>
									<SelectTrigger className="!w-full !h-[42px] rounded-full bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 font-bold text-[rgb(var(--primary))]">
										<SelectValue placeholder="اختر الدولة" />
									</SelectTrigger>
									<SelectContent className="max-h-72">
										{COUNTRIES.map((c) => (
											<SelectItem key={c.key} value={c.key}>
												{c.dialCode} — {c.nameAr}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<Input
								placeholder={selectedCountry.placeholder}
 								value={phoneNumber}
								onChange={handlePhoneChange}
								className={cn(
									"flex-1 !font-[Inter] rounded-full h-[42px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 font-en",
									error ? "border-red-300 focus-visible:ring-red-300" : ""
								)}
								inputMode="numeric"
							/>
						</div>

						{error && (
							<div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2 text-right">
								{error}
							</div>
						)}
					</div>

					{/* Include password toggle */}
					<div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/40 p-4">
						<div className="text-sm text-gray-700 dark:text-slate-200 text-right">
							{t("whatsapp.includePassword") || "Include password in message"}
						</div>
						<button
							onClick={() => setIncludePassword((v) => !v)}
							className={cn(
								"w-12 h-7 rounded-full transition-all relative",
								includePassword ? "bg-emerald-500" : "bg-gray-300 dark:bg-slate-700"
							)}
							title="toggle"
						>
							<span
								className={cn(
									"absolute top-1 w-5 h-5 rounded-full bg-white transition-all",
									includePassword ? "right-1" : "right-6"
								)}
							/>
						</button>
					</div>

					{/* Message preview */}
					<div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
						<div className="text-xs text-gray-500 dark:text-slate-400 mb-2">
							{t("whatsapp.preview") || "Message preview"}
						</div>
						<pre className="text-sm whitespace-pre-wrap !font-[Inter] text-gray-800 dark:text-slate-100 font-en" dir="ltr">
							{message}
						</pre>
					</div>

					{/* Actions */}
					<div className="flex items-center justify-end gap-2">
						<Button
							className="rounded-full btn-primary1"
							onClick={() => window.open(waLink, "_blank", "noopener,noreferrer")}
							disabled={!email || !isValidPhone || (includePassword && !password)}
						>
							<span className="flex items-center gap-2">
								<Send size={18} />
								{t("actions.openWhatsapp") || "Open WhatsApp"}
							</span>
						</Button>
					</div>

					<div className="text-[11px] text-gray-500 dark:text-slate-400 text-right">
						{t("whatsapp.note") ||
							"Tip: password is available only at creation/reset. If you closed this screen, you can't read it again."}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
