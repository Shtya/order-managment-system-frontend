'use client';

import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";



import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
	Eye,
	EyeOff,
	Mail,
	Lock,
	ArrowRight,
	CheckCircle2,
	Shield,
	KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import OtpInput from "react-otp-input";

import {
	FaFacebookF,
	FaInstagram,
	FaXTwitter,
	FaTelegram,
	FaWhatsapp,
} from 'react-icons/fa6';
import { FcGoogle } from 'react-icons/fc';
import { cn } from "@/utils/cn";

/** =========================
 * Axios instance (inline)
 * ========================= */
const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_BASE_URL,
	headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
	if (typeof window !== 'undefined') {
		const token = localStorage.getItem('accessToken');
		if (token) config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

/** =========================
 * Validation Schemas
 * ========================= */
const loginSchema = yup.object({
	email: yup.string().email('validation.emailInvalid').required('validation.emailRequired'),
	password: yup.string().min(6, 'validation.passwordMin').required('validation.passwordRequired'),
});

const forgotPasswordSchema = yup.object({
	email: yup.string().email('validation.emailInvalid').required('validation.emailRequired'),
});

const resetPasswordSchema = yup.object({
	password: yup
		.string()
		.min(8, 'validation.passwordMinLength')
		.matches(/[A-Z]/, 'validation.passwordUppercase')
		.matches(/[a-z]/, 'validation.passwordLowercase')
		.matches(/[0-9]/, 'validation.passwordNumber')
		.required('validation.passwordRequired'),
	confirmPassword: yup
		.string()
		.oneOf([yup.ref('password')], 'validation.passwordsMustMatch')
		.required('validation.confirmPasswordRequired'),
});

const SOCIAL_ICONS = {
	facebook: FaFacebookF,
	instagram: FaInstagram,
	twitter: FaXTwitter,
	telegram: FaTelegram,
	whatsapp: FaWhatsapp,
};

const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseAuth() {
	const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
	return getAuth(app);
}
const decodeJwtPayload = (token) => {
	try {
		const payload = token.split(".")[1];
		const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
		const json = decodeURIComponent(
			atob(base64)
				.split("")
				.map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
				.join("")
		);
		return JSON.parse(json);
	} catch {
		return null;
	}
};


export default function AuthPage() {
	const t = useTranslations('auth');
	const router = useRouter();

	// 1: Login, 2: Forgot, 3: OTP, 4: Reset, 5: Success
	const [currentStep, setCurrentStep] = useState(1);
	const [email, setEmail] = useState('');

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const [isLoading, setIsLoading] = useState(false);

	// Global API messages
	const [apiError, setApiError] = useState('');
	const [apiMsg, setApiMsg] = useState('');

	const steps = [
		{ id: 2, name: t('steps.forgot'), color: 'from-purple-500 to-pink-600' },
		{ id: 3, name: t('steps.verify'), color: 'from-cyan-500 to-blue-600' },
		{ id: 4, name: t('steps.reset'), color: 'from-emerald-500 to-teal-600' },
	];

	const showSteps = currentStep > 1 && currentStep < 5;


	const redirectAfterLogin = async (data) => {

		console.log(data);

		const role = data?.user?.role
		const r = String(role || "").toUpperCase();

		if (r === "SUPER_ADMIN") {
			router.push("/dashboard/users");
			return;
		}

		if (r === "ADMIN") {
			router.push("/products");
			return;
		}

		router.push("/products");
	};


	const getStepSchema = () => {
		switch (currentStep) {
			case 1:
				return loginSchema;
			case 2:
				return forgotPasswordSchema;
			case 4:
				return resetPasswordSchema;
			default:
				return null;
		}
	};

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		watch,
	} = useForm({
		resolver: getStepSchema() ? yupResolver(getStepSchema()) : undefined,
	});

	const password = watch('password', '');

	const extractApiMessage = (err, fallback = 'Something went wrong') => {
		const msg =
			err?.response?.data?.message ||
			err?.response?.data?.error ||
			err?.message ||
			fallback;
		return Array.isArray(msg) ? msg.join(', ') : msg;
	};

	/** =========================
	 * Submit handler (integrated)
	 * ========================= */
	const onSubmit = async (data) => {
		setIsLoading(true);
		setApiError('');
		setApiMsg('');

		try {
			if (currentStep === 1) {
				const res = await api.post('/auth/login', {
					email: data.email,
					password: data.password,
				});

				if (res?.data?.accessToken) {
					localStorage.setItem("accessToken", res.data.accessToken);
					localStorage.setItem("user", JSON.stringify(res.data?.user));
				}
				setApiMsg(t("login.success") || "Logged in successfully");
				await redirectAfterLogin(res.data);

			}

			if (currentStep === 2) {
				// ✅ SEND OTP: POST /auth/forgot-password
				await api.post('/auth/forgot-password', { email: data.email });

				setEmail(data.email);
				setApiMsg(t('forgotPassword.otpSent') || 'OTP sent');
				setCurrentStep(3);
			}

			if (currentStep === 4) {
				// ✅ RESET PASSWORD: POST /auth/reset-password
				const res = await api.post('/auth/reset-password', {
					email,
					newPassword: data.password,
				});

				// optional: backend might return accessToken
				if (res?.data?.accessToken) {
					localStorage.setItem('accessToken', res.data.accessToken);
				}

				setCurrentStep(5);
				setTimeout(() => setCurrentStep(1), 2500);
			}
		} catch (err) {
			console.log(err)
			setApiError(extractApiMessage(err, 'Request failed'));
		} finally {
			setIsLoading(false);
		}
	};

	const handleForgotPassword = () => {
		setApiError('');
		setApiMsg('');
		reset();
		setCurrentStep(2);
	};

	const handleBackToLogin = () => {
		setApiError('');
		setApiMsg('');
		reset();
		setCurrentStep(1);
	};


	const handleGoogleLogin = async () => {
		setIsLoading(true);
		setApiError("");
		setApiMsg("");

		try {
			const auth = getFirebaseAuth();
			const provider = new GoogleAuthProvider();

			const cred = await signInWithPopup(auth, provider);
			const idToken = await cred.user.getIdToken();

			const res = await api.post("/auth/google", { idToken });

			if (res?.data?.accessToken) {
				localStorage.setItem("accessToken", res.data.accessToken);
			}

			setApiMsg("Logged in with Google");

			// ✅ Redirect based on role (same function used for normal login)
			await redirectAfterLogin(res.data.accessToken);
		} catch (err) {
			setApiError(extractApiMessage(err, "Google login failed"));
		} finally {
			setIsLoading(false);
		}
	};


	return (
		<div
			className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950"
		>
			<div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
				{/* Animated Background */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					<div className="absolute inset-0 opacity-30">
						<svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
							<defs>
								<pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
									<circle cx="2" cy="2" r="1" fill="currentColor" className="text-primary/20" />
								</pattern>
							</defs>
							<rect width="100%" height="100%" fill="url(#grid)" />
						</svg>
					</div>

					<motion.div
						className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
						animate={{
							scale: [1, 1.2, 1],
							x: [0, 50, 0],
							y: [0, 30, 0],
						}}
						transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
					/>
					<motion.div
						className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"
						animate={{
							scale: [1.2, 1, 1.2],
							x: [0, -30, 0],
							y: [0, 50, 0],
						}}
						transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
					/>
				</div>

				<div className="w-full   max-w-6xl flex items-center justify-between gap-12 relative z-10">
					{/* Right Side - Branding */}
					<motion.div
						className="hidden lg:flex flex-col items-end flex-1"
						initial={{ opacity: 0, x: 50 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.8 }}
					>
						<motion.div
							className="mb-8 w-full"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2 }}
						>
							<div className="flex  items-center w-full gap-3 mb-2">
								<motion.div
									animate={{ rotate: 360 }}
									transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
								>
									<svg
										className="w-10 h-10 text-primary"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
										/>
									</svg>
								</motion.div>
								<h1 className="text-2xl  font-bold text-gray-800 dark:text-white">{t('title')}</h1>
							</div>
						</motion.div>

						<motion.h2
							className="text-6xl ltr:text-left w-full font-bold text-gray-900 dark:text-white mb-4 leading-tight"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3 }}
						>
							{currentStep === 1 && t('login.welcomeBack')}
							{currentStep === 2 && t('forgotPassword.title')}
							{currentStep === 3 && t('otp.title')}
							{currentStep === 4 && t('resetPassword.title')}
							{currentStep === 5 && t('resetPassword.successTitle')}
						</motion.h2>

						<motion.p
							className="text-xl ltr:text-left w-full text-gray-600 dark:text-gray-400 leading-relaxed mb-12"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4 }}
						>
							{currentStep === 1 && t('login.description')}
							{currentStep === 2 && t('forgotPassword.description')}
							{currentStep === 3 && t('otp.description')}
							{currentStep === 4 && t('resetPassword.description')}
							{currentStep === 5 && t('resetPassword.successDescription')}
						</motion.p>

						{currentStep === 1 && (
							<motion.div
								className="space-y-4 w-full"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.5 }}
							>
								{[
									{ icon: '📊', text: t('login.feature1') },
									{ icon: '🔒', text: t('login.feature2') },
									{ icon: '⚡', text: t('login.feature3') },
								].map((feature, index) => (
									<motion.div
										key={index}
										className="flex items-center gap-4 text-right "
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: 0.6 + index * 0.1 }}
									>
										<div className="text-3xl">{feature.icon}</div>
										<p className="text-gray-700 dark:text-gray-300 text-lg  ">{feature.text}</p>
									</motion.div>
								))}
							</motion.div>
						)}

						{/* Social Icons */}
						<motion.div
							className="flex gap-3 mt-16 w-full"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.8 }}
						>
							{['facebook', 'instagram', 'twitter', 'telegram', 'whatsapp'].map((social, index) => {
								const Icon = SOCIAL_ICONS[social];
								return (
									<motion.a
										key={social}
										href="#"
										className="w-11 h-11 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary transition-all duration-300 shadow-sm hover:shadow-md"
										whileHover={{ scale: 1.05, y: -2 }}
										whileTap={{ scale: 0.95 }}
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ delay: 0.9 + index * 0.05 }}
									>
										<Icon className="w-5 h-5" />
									</motion.a>
								);
							})}
						</motion.div>
					</motion.div>

					{/* Left Side - Form Card */}
					<motion.div
						className="w-full lg:w-auto lg:min-w-[520px] mt-20 lg:mt-0"
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.6 }}
					>
						<div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 p-10 relative overflow-hidden">
							<div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />
							<div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-3xl" />

							<div className="relative z-10">
								{/* Global API Messages */}
								{apiError && (
									<div className=" mb-4 rounded-xl border p-3 text-sm text-center border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300 ">
										{apiError}
									</div>
								)}

								{apiMsg && (
									<div className=" mb-4 text-center rounded-xl border p-3 text-sm  border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300 ">
										{apiMsg}
									</div>
								)}


								{showSteps && (
									<motion.div
										className="mb-8 flex flex-col items-center"
										initial={{ opacity: 0, y: -20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -20 }}
									>
										{/* Steps */}
										<div
											className="w-[400px] mx-auto  grid items-center mb-3"
											style={{
												gridTemplateColumns: `repeat(${steps.length * 2 - 1}, minmax(0, 1fr))`,
											}}
										>
											{steps.map((step, index) => (
												<React.Fragment key={step.id}>
													{/* Circle */}
													<div className="flex justify-center">
														<motion.div
															className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${currentStep >= step.id
																? `bg-primary1 text-white shadow-lg`
																: 'bg-gray-200 dark:bg-gray-700 text-gray-400'
																}`}
															whileHover={{ scale: 1.05 }}
															animate={{
																scale: currentStep === step.id ? [1, 1.1, 1] : 1,
															}}
															transition={{
																scale: {
																	duration: 0.5,
																	repeat: currentStep === step.id ? Infinity : 0,
																	repeatDelay: 1,
																},
															}}
														>
															{currentStep > step.id ? (
																<CheckCircle2 className="w-5 h-5" />
															) : (
																<span className="text-sm font-bold">{index + 1}</span>
															)}
														</motion.div>
													</div>

													{/* Line */}
													{index < steps.length - 1 && (
														<motion.div
															className={`h-1 rounded-full transition-all duration-500 ${currentStep > step.id
																? 'bg-gradient-to-r from-primary to-indigo-500'
																: 'bg-gray-200 dark:bg-gray-700'
																}`}
															initial={{ scaleX: 0 }}
															animate={{ scaleX: 1 }}
															transition={{ delay: index * 0.2 }}
														/>
													)}
												</React.Fragment>
											))}
										</div>
									</motion.div>
								)}

								{/* Step Content */}
								<AnimatePresence mode="wait">
									{currentStep === 1 && (
										<LoginStep
											key="login"
											register={register}
											errors={errors}
											handleSubmit={handleSubmit}
											onSubmit={onSubmit}
											isLoading={isLoading}
											showPassword={showPassword}
											setShowPassword={setShowPassword}
											onForgotPassword={handleForgotPassword}
											onGoogle={handleGoogleLogin}
											t={t}
										/>
									)}

									{currentStep === 2 && (
										<ForgotPasswordStep
											key="forgot"
											register={register}
											errors={errors}
											handleSubmit={handleSubmit}
											onSubmit={onSubmit}
											isLoading={isLoading}
											onBack={handleBackToLogin}
											t={t}
										/>
									)}

									{currentStep === 3 && (
										<OtpStep
											key="otp"
											email={email}
											onVerified={() => setCurrentStep(4)}
											onBack={handleBackToLogin}
											t={t}
										/>
									)}

									{currentStep === 4 && (
										<ResetPasswordStep
											key="reset"
											register={register}
											errors={errors}
											handleSubmit={handleSubmit}
											onSubmit={onSubmit}
											isLoading={isLoading}
											showPassword={showPassword}
											setShowPassword={setShowPassword}
											showConfirmPassword={showConfirmPassword}
											setShowConfirmPassword={setShowConfirmPassword}
											password={password}
											t={t}
										/>
									)}

									{currentStep === 5 && <SuccessStep key="success" t={t} />}
								</AnimatePresence>
							</div>
						</div>
					</motion.div>
				</div>
			</div>
		</div>
	);
}

/** =========================
 * Step Components
 * ========================= */

function LoginStep({
	register,
	errors,
	handleSubmit,
	onSubmit,
	isLoading,
	showPassword,
	setShowPassword,
	onForgotPassword,
	onGoogle,
	t,
}) {
	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			transition={{ duration: 0.3 }}
			className="space-y-6"
		>
			<div className=" ltr:text-left text-right mb-6">
				<h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
					{t('login.title')}
				</h3>
				<p className="text-gray-500 dark:text-gray-400 text-sm">{t('login.subtitle')}</p>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
				{/* Email */}
				<div>
					<Label className=" ltr:text-left text-right block text-gray-700 dark:text-gray-300 mb-2">
						{t('login.email')}
					</Label>
					<div className="relative">
						<Input
							type="email"
							startIcon={<Mail size={18} />}
							placeholder={t("login.emailPlaceholder")}
							{...register("email")}
							className={cn(
								"text-start font-en bg-gray-50 dark:bg-gray-800/50 rounded-xl",
								errors.email && "border-red-500"
							)}
						/>
					</div>
					<AnimatePresence>
						{errors.email && (
							<motion.p
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								className="text-red-500 text-sm mt-1  ltr:text-left text-right"
							>
								{t(errors.email.message)}
							</motion.p>
						)}
					</AnimatePresence>
				</div>

				{/* Password */}
				<div>
					<Label className=" ltr:text-left text-right block text-gray-700 dark:text-gray-300 mb-2">
						{t('login.password')}
					</Label>
					<div className="relative">
						<Input
							type={showPassword ? 'text' : 'password'}
							startIcon={<Lock size={18} />}
							placeholder={t('login.passwordPlaceholder')}
							{...register('password')}
							className={` ltr:text-left text-right font-en pl-11 pr-11 h-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl ${errors.password ? 'border-red-500' : ''
								}`}
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute ltr:right-4 rtl:left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
						>
							{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
						</button>
					</div>
					<AnimatePresence>
						{errors.password && (
							<motion.p
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								className="text-red-500 text-sm mt-1  ltr:text-left text-right"
							>
								{t(errors.password.message)}
							</motion.p>
						)}
					</AnimatePresence>
				</div>

				{/* Forgot Password */}
				<div className=" ltr:text-left text-right">
					<button
						type="button"
						onClick={onForgotPassword}
						className="text-primary hover:text-primary/80 font-medium text-sm transition-colors inline-flex items-center gap-2 group"
					>
						{t('login.forgotPassword')}
						<ArrowRight className="rtl:scale-x-[-1] w-4 h-4 group-hover:-translate-x-1 transition-transform" />
					</button>
				</div>

				<Button type="submit" disabled={isLoading} className="w-full h-12 btn-primary1 text-white rounded-xl shadow-lg">
					{isLoading ? (
						<motion.div
							className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
							animate={{ rotate: 360 }}
							transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
						/>
					) : (
						<span className="flex items-center gap-2">
							{t('login.submit')}
							<ArrowRight className="rtl:scale-x-[-1] w-5 h-5" />
						</span>
					)}
				</Button>

				{/* Divider */}
				<div className="relative my-6">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-t border-gray-200 dark:border-gray-700" />
					</div>
					<div className="relative flex justify-center text-sm">
						<span className="px-4 bg-[#f7f8fe] dark:bg-gray-900/80 text-gray-500">
							{t('login.orContinueWith')}
						</span>
					</div>
				</div>

				{/* Google */}
				<Button
					type="button"
					variant="outline"
					onClick={onGoogle}
					className="group relative w-full h-12 rounded-xl border-1 overflow-hidden flex items-center justify-center gap-3 bg-background/70 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
				>
					<span className="pointer-events-none absolute -inset-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl bg-gradient-to-br from-primary/30 via-primary/10 to-primary/30" />
					<span className="pointer-events-none absolute inset-0 before:content-[''] before:absolute before:top-0 before:right-[-160%] before:h-full before:w-[140%] before:skew-x-[-20deg] before:bg-gradient-to-l before:from-transparent before:via-white/35 before:to-transparent group-hover:before:right-[160%] before:transition-[right] before:duration-700 before:ease-out" />

					<FcGoogle className="text-xl" />
					<span className="font-medium tracking-wide">{t('login.googleSignIn')}</span>
				</Button>
			</form>
		</motion.div>
	);
}

function ForgotPasswordStep({ register, errors, handleSubmit, onSubmit, isLoading, onBack, t }) {
	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			transition={{ duration: 0.3 }}
			className="space-y-6"
		>
			<div className="flex   items-center gap-2 mb-6">
				<div className="w-16 h-16 rounded-xl bg-primary1 flex items-center justify-center shadow-lg">
					<Mail className="w-8 h-8 text-white" />
				</div>
				<div className="ltr:text-left">
					<h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('forgotPassword.title')}</h3>
					<p className="text-gray-500 max-w-[300px] w-full dark:text-gray-400 text-xs">
						{t('forgotPassword.description')}
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
				<div >
					<Label className=" ltr:text-left text-right block text-gray-700 dark:text-gray-300 mb-2">
						{t('forgotPassword.email')}
					</Label>
					<div className="relative">
						<Mail className="absolute rtl:right-4 ltr:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
						<Input
							type="email"
							placeholder={t('forgotPassword.emailPlaceholder')}
							{...register('email')}
							className={` ltr:text-left text-right font-en rtl:pr-11 ltr:pl-11 h-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl ${errors.email ? 'border-red-500' : ''
								}`}
						/>
					</div>
					<AnimatePresence>
						{errors.email && (
							<motion.p
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								className="text-red-500 text-sm mt-1 text-right"
							>
								{t(errors.email.message)}
							</motion.p>
						)}
					</AnimatePresence>
				</div>

				<Button
					type="submit"
					disabled={isLoading}
					className="btn-primary1 w-full h-12 bg-primary1 text-white rounded-xl shadow-lg shadow-purple-500/25"
				>
					{isLoading ? (
						<motion.div
							className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
							animate={{ rotate: 360 }}
							transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
						/>
					) : (
						<span className="flex items-center gap-2">
							{t('forgotPassword.submit')}
							<ArrowRight className="w-5 h-5 rtl:scale-x-[-1]" />
						</span>
					)}
				</Button>

				<div className="text-center">
					<button
						type="button"
						onClick={onBack}
						className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
					>
						{t('forgotPassword.backToLogin') || 'الرجوع لتسجيل الدخول'}
					</button>
				</div>
			</form>
		</motion.div>
	);
}

function OtpStep({ email, onVerified, onBack, t }) {
	const [otp, setOtp] = useState(""); // ✅ single string: "123456"
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [timer, setTimer] = useState(120);
	const [canResend, setCanResend] = useState(false);

	useEffect(() => {
		if (timer > 0) {
			const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
			return () => clearInterval(interval);
		}
		setCanResend(true);
	}, [timer]);

	const extractOtpError = (err) => {
		const msg = err?.response?.data?.message || err?.message || t("otp.error");
		return Array.isArray(msg) ? msg.join(", ") : msg;
	};

	const handleVerify = async (code) => {
		if (code.length !== 6) return;

		setIsLoading(true);
		setError("");

		try {
			await api.post("/auth/verify-otp", { email, otp: code });
			onVerified?.();
		} catch (err) {
			setError(extractOtpError(err));
			setOtp("");
		} finally {
			setIsLoading(false);
		}
	};

	const handleResend = async () => {
		if (!canResend) return;

		setCanResend(false);
		setTimer(120);
		setOtp("");
		setError("");

		try {
			await api.post("/auth/forgot-password", { email });
		} catch (err) {
			setError(extractOtpError(err));
		}
	};

	const formatTime = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			transition={{ duration: 0.3 }}
			className="space-y-6"
		>
			<div className="flex items-center gap-2 mb-6">
				<div className="w-16 h-16 rounded-xl bg-primary1 flex items-center justify-center shadow-lg">
					<Shield className="w-8 h-8 text-white" />
				</div>
				<div>
					<h3 className="text-xl font-bold text-gray-900 dark:text-white">
						{t("otp.title")}
					</h3>
					<p className="text-gray-500 max-w-[300px] w-full dark:text-gray-400 text-xs">
						{t("otp.description")}
					</p>
				</div>
			</div>

			{/* ✅ OTP LIBRARY INPUT */}
			<div className="flex justify-start mb-6">
				<OtpInput
					value={otp}
					onChange={(val) => {
						// numeric only
						const cleaned = val.replace(/\D/g, "").slice(0, 6);
						setOtp(cleaned);
						setError("");

						if (cleaned.length === 6) handleVerify(cleaned);
					}}
					numInputs={6}
					shouldAutoFocus
					inputType="tel"
					renderSeparator={<span className="w-3" />}
					renderInput={(props) => (
						<input
							{...props}
							disabled={isLoading}
							className={`!w-14 !h-14 flex-none text-center text-2xl font-bold rounded-xl border-2 transition-all bg-gray-50 dark:bg-gray-800/50
                ${error
									? "border-red-500 text-red-500"
									: props.value
										? "border-primary text-primary"
										: "border-gray-200 dark:border-gray-700"
								}
                focus:outline-none focus:ring-2 focus:ring-primary/20`}
						/>
					)}
				/>
			</div>

			<AnimatePresence>
				{error && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-center"
					>
						<p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
					</motion.div>
				)}
			</AnimatePresence>

			<div className="flex items-center justify-between text-sm">
				<div className="flex items-center gap-2">
					{!canResend ? (
						<>
							<motion.div
								className="w-2 h-2 bg-cyan-500 rounded-full"
								animate={{ scale: [1, 1.2, 1] }}
								transition={{ duration: 1, repeat: Infinity }}
							/>
							<span className="text-gray-600 dark:text-gray-400">
								{t("otp.timeRemaining")}: {formatTime(timer)}
							</span>
						</>
					) : (
						<span className="text-gray-600 dark:text-gray-400">
							{t("otp.codeExpired")}
						</span>
					)}
				</div>

				<button
					onClick={handleResend}
					disabled={!canResend}
					className={`font-medium transition-all ${canResend
						? "text-primary hover:text-primary/80"
						: "text-gray-400 cursor-not-allowed"
						}`}
				>
					{t("otp.resend")}
				</button>
			</div>

			<Button
				onClick={() => handleVerify(otp)}
				disabled={isLoading || otp.length !== 6}
				className="w-full h-12 btn-primary1 rounded-xl shadow-lg disabled:opacity-50"
			>
				{isLoading ? (
					<motion.div
						className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
						animate={{ rotate: 360 }}
						transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
					/>
				) : (
					<span className="flex items-center gap-2">
						{t("otp.verify")}
						<ArrowRight className="rtl:scale-x-[-1] w-5 h-5" />
					</span>
				)}
			</Button>
		</motion.div>
	);
}


function ResetPasswordStep({
	register,
	errors,
	handleSubmit,
	onSubmit,
	isLoading,
	showPassword,
	setShowPassword,
	showConfirmPassword,
	setShowConfirmPassword,
	password,
	t,
}) {
	const passwordStrength = {
		length: password.length >= 8,
		uppercase: /[A-Z]/.test(password),
		lowercase: /[a-z]/.test(password),
		number: /[0-9]/.test(password),
	};

	const strengthScore = Object.values(passwordStrength).filter(Boolean).length;

	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			transition={{ duration: 0.3 }}
			className="space-y-6"
		>
			<div className="flex items-center gap-2 mb-6">
				<div className="w-16 h-16 rounded-xl bg-primary1 flex items-center justify-center shadow-lg">
					<KeyRound className="w-8 h-8 text-white" />
				</div>
				<div>
					<h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('resetPassword.title')}</h3>
					<p className="text-gray-500 max-w-[300px] w-full dark:text-gray-400 text-xs">
						{t('resetPassword.description')}
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
				{/* New Password */}
				<div>
					<Label className="ltr:text-left text-right block text-gray-700 dark:text-gray-300 mb-2">
						{t('resetPassword.newPassword')}
					</Label>
					<div className="relative">
						<Lock className="absolute rtl:right-4 ltr:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
						<Input
							type={showPassword ? 'text' : 'password'}
							placeholder={t('resetPassword.passwordPlaceholder')}
							{...register('password')}
							className={`ltr:text-left text-right pl-11 pr-11 h-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl ${errors.password ? 'border-red-500' : ''
								}`}
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute rtl:left-4 ltr:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
						>
							{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
						</button>
					</div>

					{/* Password Strength */}
					{password && (
						<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-2">
							<div className="flex gap-1">
								{[1, 2, 3, 4].map((level) => (
									<div
										key={level}
										className={`h-1.5 flex-1 rounded-full transition-all ${strengthScore >= level
											? strengthScore === 4
												? 'bg-emerald-500'
												: strengthScore === 3
													? 'bg-yellow-500'
													: 'bg-red-500'
											: 'bg-gray-200 dark:bg-gray-700'
											}`}
									/>
								))}
							</div>

							<div className="space-y-1 text-xs"  >
								{Object.entries({
									length: t('resetPassword.requirement.length'),
									uppercase: t('resetPassword.requirement.uppercase'),
									lowercase: t('resetPassword.requirement.lowercase'),
									number: t('resetPassword.requirement.number'),
								}).map(([key, label]) => (
									<div
										key={key}
										className={`flex items-center gap-2 ${passwordStrength[key] ? 'text-emerald-600' : 'text-gray-500'
											}`}
									>
										<div
											className={`w-1 h-1 rounded-full ${passwordStrength[key] ? 'bg-emerald-500' : 'bg-gray-400'
												}`}
										/>
										{label}
									</div>
								))}
							</div>
						</motion.div>
					)}

					<AnimatePresence>
						{errors.password && (
							<motion.p
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								className="text-red-500 text-sm mt-1 ltr:text-left text-right"
							>
								{t(errors.password.message)}
							</motion.p>
						)}
					</AnimatePresence>
				</div>

				{/* Confirm Password */}
				<div>
					<Label className="ltr:text-left text-right block text-gray-700 dark:text-gray-300 mb-2">
						{t('resetPassword.confirmPassword')}
					</Label>
					<div className="relative">
						<Lock className="absolute rtl:right-4 ltr:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
						<Input
							type={showConfirmPassword ? 'text' : 'password'}
							placeholder={t('resetPassword.confirmPasswordPlaceholder')}
							{...register('confirmPassword')}
							className={`ltr:text-left text-right pl-11 pr-11 h-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl ${errors.confirmPassword ? 'border-red-500' : ''
								}`}
						/>
						<button
							type="button"
							onClick={() => setShowConfirmPassword(!showConfirmPassword)}
							className="absolute ltr:right-4 rtl:left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
						>
							{showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
						</button>
					</div>

					<AnimatePresence>
						{errors.confirmPassword && (
							<motion.p
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								className="text-red-500 text-sm mt-1 ltr:text-left text-right"
							>
								{t(errors.confirmPassword.message)}
							</motion.p>
						)}
					</AnimatePresence>
				</div>

				<Button type="submit" disabled={isLoading} className="w-full h-12 btn-primary1 text-white rounded-xl shadow-lg">
					{isLoading ? (
						<motion.div
							className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
							animate={{ rotate: 360 }}
							transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
						/>
					) : (
						<span className="flex items-center gap-2">
							{t('resetPassword.submit')}
							<ArrowRight className="rtl:scale-x-[-1] w-5 h-5" />
						</span>
					)}
				</Button>
			</form>
		</motion.div>
	);
}

function SuccessStep({ t }) {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			className="text-center py-12"
		>
			<motion.div
				initial={{ scale: 0 }}
				animate={{ scale: 1 }}
				transition={{ type: 'spring', duration: 0.6 }}
				className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-6 mx-auto shadow-2xl"
			>
				<CheckCircle2 className="w-12 h-12 text-white" />
			</motion.div>

			<motion.h3
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
				className="text-3xl font-bold text-gray-900 dark:text-white mb-3"
			>
				{t('resetPassword.successTitle')}
			</motion.h3>

			<motion.p
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3 }}
				className="text-gray-600 dark:text-gray-400"
			>
				{t('resetPassword.successDescription')}
			</motion.p>

			<motion.div className="mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
				<div className="inline-flex items-center gap-2 text-sm text-gray-500">
					<motion.div
						className="w-2 h-2 bg-primary rounded-full"
						animate={{ scale: [1, 1.2, 1] }}
						transition={{ duration: 1, repeat: Infinity }}
					/>
					{t("resetPassword.redirecting")}
				</div>
			</motion.div>
		</motion.div>
	);
}
