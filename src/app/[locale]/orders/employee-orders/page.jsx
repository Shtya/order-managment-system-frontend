"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	DndContext,
	DragOverlay,
	closestCorners,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	ChevronLeft,
	Package,
	Phone,
	MapPin,
	Calendar as CalendarIcon,
	CheckCircle,
	XCircle,
	AlertCircle,
	Truck,
	Clock,
	User,
	GripVertical,
	ArrowRight,
	ChevronDown,
	ChevronRight as ChevronRightIcon,
	Bell,
	Timer,
	RefreshCw,
	Lock,
	Unlock,
	ListTodo,
	Flame,
	TrendingUp,
	CheckCheck,
	X,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import api from "@/utils/api";

import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";

// Generate enhanced fake orders with retry logic
const generateEmployeeOrders = () => {
	const statuses = ["new", "confirmed", "pending_confirmation", "in_shipping", "delivered", "retry"];
	const cities = ["القاهرة", "الإسكندرية", "الجيزة", "المنصورة", "طنطا"];
	const products = ["خاتم فضة", "سلسلة ذهب", "أساور", "حلق ذهب", "دبلة"];
	const priorities = ["high", "medium", "low"];

	return Array.from({ length: 35 }, (_, i) => {
		const status = statuses[Math.floor(Math.random() * statuses.length)];
		const isRetry = status === "retry";
		
		const order = {
			id: `order-${i + 1}`,
			orderNumber: `#${String(i + 1).padStart(4, "0")}`,
			customerName: `عميل ${i + 1}`,
			phoneNumber: `01${Math.floor(Math.random() * 1000000000)}`.slice(0, 11),
			city: cities[Math.floor(Math.random() * cities.length)],
			product: products[Math.floor(Math.random() * products.length)],
			quantity: Math.floor(Math.random() * 3) + 1,
			status,
			total: Math.floor(Math.random() * 700) + 300,
			assignedDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
			createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
			priority: priorities[Math.floor(Math.random() * priorities.length)],
			todoCompleted: Math.random() > 0.5,
			notes: Math.random() > 0.7 ? "ملاحظة مهمة للعميل" : undefined,
		};

		// Add retry config for retry status orders - Set to 30 minutes for testing
		if (isRetry) {
			const maxAttempts = Math.floor(Math.random() * 3) + 2; // 2-4 attempts
			const currentAttempt = Math.floor(Math.random() * maxAttempts);
			const intervalMinutes = 30; // Set to 30 minutes as requested
			const lastAttemptTime = new Date(Date.now() - Math.random() * 20 * 60 * 1000); // Random time in last 20 mins
			const nextAttemptTime = new Date(lastAttemptTime.getTime() + intervalMinutes * 60 * 1000);

			order.retryConfig = {
				maxAttempts,
				currentAttempt,
				intervalMinutes,
				lastAttemptTime,
				nextAttemptTime,
			};
		}

		return order;
	});
};

// Calculate time until next retry
const getTimeUntilRetry = (nextAttemptTime) => {
	if (!nextAttemptTime) return { isLocked: false, minutes: 0, seconds: 0, display: "" };

	const now = new Date();
	const diff = nextAttemptTime.getTime() - now.getTime();

	if (diff <= 0) {
		return { isLocked: false, minutes: 0, seconds: 0, display: "متاح الآن" };
	}

	const minutes = Math.floor(diff / 60000);
	const seconds = Math.floor((diff % 60000) / 1000);

	return {
		isLocked: true,
		minutes,
		seconds,
		display: `${minutes}:${seconds.toString().padStart(2, "0")}`,
	};
};

// Sortable Order Card with enhanced features
function SortableOrderCard({ order, onViewDetails }) {
	const t = useTranslations("employeeOrders");
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: order.id });

	const [retryTime, setRetryTime] = useState(getTimeUntilRetry(order.retryConfig?.nextAttemptTime));

	useEffect(() => {
		if (order.status === "retry" && order.retryConfig?.nextAttemptTime) {
			const interval = setInterval(() => {
				setRetryTime(getTimeUntilRetry(order.retryConfig?.nextAttemptTime));
			}, 1000);

			return () => clearInterval(interval);
		}
	}, [order.status, order.retryConfig?.nextAttemptTime]);

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const statusConfig = {
		new: { color: "bg-primary", label: t("statuses.new"), icon: Package },
		under_review: { color: "bg-amber-500", label: t("statuses.underReview"), icon: AlertCircle },
		preparing: { color: "bg-teal-500", label: t("statuses.preparing"), icon: Package },
		ready: { color: "bg-green-500", label: t("statuses.ready"), icon: CheckCircle },
		shipped: { color: "bg-purple-500", label: t("statuses.shipped"), icon: Truck },
		delivered: { color: "bg-green-600", label: t("statuses.delivered"), icon: CheckCheck },
		cancelled: { color: "bg-red-500", label: t("statuses.cancelled"), icon: XCircle },
	};

	const priorityConfig = {
		high: { color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30", icon: Flame },
		medium: { color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", icon: TrendingUp },
		low: { color: "text-primary", bg: "bg-primary/10", icon: Clock },
	};

	const config = statusConfig[order.status] || statusConfig.new;
	const priorityInfo = priorityConfig[order.priority || "medium"];
	const PriorityIcon = priorityInfo.icon;
	const StatusIcon = config.icon;

	const isRetryLocked = order.status === "retry" && retryTime.isLocked;
	const retryProgress = order.retryConfig 
		? ((order.retryConfig.currentAttempt / order.retryConfig.maxAttempts) * 100)
		: 0;

	return (
		<motion.div
			ref={setNodeRef}
			style={style}
			layout
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			whileHover={{ scale: isRetryLocked ? 1 : 1.02 }}
			className={cn(
				"group relative mb-2",
				isDragging && "opacity-50",
				isRetryLocked && "opacity-60 cursor-not-allowed"
			)}
		>
			<Card className={cn(
				"overflow-hidden transition-all duration-200 border-2",
				isRetryLocked 
					? "border-orange-300 dark:border-orange-700 bg-orange-50/30 dark:bg-orange-950/10"
					: "border-gray-200 dark:border-gray-800 hover:shadow-xl hover:border-primary dark:hover:border-primary",
				isDragging && "shadow-2xl ring-4 ring-primary/50",
				order.todoCompleted && "ring-2 ring-green-500/30"
			)}>
				<div className="flex items-stretch">
					{/* Drag Handle */}
					<div
						{...attributes}
						{...listeners}
						className={cn(
							"w-8 flex items-center justify-center",
							isRetryLocked 
								? "bg-orange-50 dark:bg-orange-950/30 cursor-not-allowed"
								: "cursor-grab active:cursor-grabbing bg-gray-50 dark:bg-gray-900 hover:bg-primary/10 dark:hover:bg-primary/10 transition-colors",
							"border-r-2 border-gray-200 dark:border-gray-800"
						)}
					>
						{isRetryLocked ? (
							<Lock size={14} className="text-orange-500" />
						) : (
							<GripVertical size={16} className="text-gray-400" />
						)}
					</div>

					{/* Card Content */}
					<div className={cn("flex-1 p-3", isRetryLocked && "pointer-events-none")}>
						{/* Header */}
						<div className="flex items-center justify-between mb-2">
							<div className="flex items-center gap-2">
								<span className="font-bold text-sm text-gray-900 dark:text-gray-100">
									{order.orderNumber}
								</span>
								<Badge className={cn("text-xs px-2 py-0.5 text-white border-0 gap-1", config.color)}>
									<StatusIcon size={10} />
									{config.label}
								</Badge>
								
								{/* Priority Badge */}
								<div className={cn("px-1.5 py-0.5 rounded-md flex items-center gap-1", priorityInfo.bg)}>
									<PriorityIcon size={10} className={priorityInfo.color} />
								</div>

								{/* TODO Indicator */}
								{order.todoCompleted && (
									<CheckCircle size={12} className="text-green-500" />
								)}
							</div>
						</div>

						{/* Customer Info */}
						<div className="space-y-1 text-xs mb-2">
							<div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
								<User size={11} className="text-gray-400 flex-shrink-0" />
								<span className="truncate font-medium">{order.customerName}</span>
							</div>

							<div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
								<Phone size={11} className="text-gray-400 flex-shrink-0" />
								<span className="truncate">{order.phoneNumber}</span>
							</div>

							{order.notes && (
								<div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded">
									<AlertCircle size={10} />
									<span className="text-[10px] truncate">{order.notes}</span>
								</div>
							)}
						</div>

						{/* Retry Status */}
						{order.status === "retry" && order.retryConfig && (
							<div className="mb-2 p-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
								<div className="flex items-center justify-between mb-1">
									<span className="text-[10px] text-gray-600 dark:text-gray-400">
										{t("retry.attempt", { current: order.retryConfig.currentAttempt, max: order.retryConfig.maxAttempts })}
									</span>
									{retryTime.isLocked ? (
										<div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
											<Timer size={10} />
											<span className="text-xs font-mono font-bold">{retryTime.display}</span>
										</div>
									) : (
										<div className="flex items-center gap-1 text-green-600 dark:text-green-400">
											<Unlock size={10} />
											<span className="text-[10px] font-semibold">{t("retry.available")}</span>
										</div>
									)}
								</div>
								<Progress value={retryProgress} className="h-1" />
								<div className="text-[9px] text-gray-500 dark:text-gray-500 mt-1">
									{t("retry.interval", { minutes: order.retryConfig.intervalMinutes })}
								</div>
							</div>
						)}

						{/* Footer */}
						<div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
							<span className="text-sm font-bold text-green-600 dark:text-green-400">
								{order.total} {t("currency")}
							</span>

							<Button
								size="sm"
								variant="ghost"
								onClick={(e) => {
									e.stopPropagation();
									if (isRetryLocked) {
										toast.error(t("retry.waitMessage", { time: retryTime.display }));
									} else {
										onViewDetails(order);
									}
								}}
								disabled={isRetryLocked}
								className={cn(
									"h-7 px-2 text-xs",
									isRetryLocked
										? "text-gray-400 cursor-not-allowed"
										: "text-primary hover:text-primary/80 hover:bg-primary/10"
								)}
							>
								{t("viewDetails")}
								<ArrowRight size={12} className="mr-1" />
							</Button>
						</div>
					</div>
				</div>

				{/* Locked Overlay */}
				{isRetryLocked && (
					<div className="absolute inset-0 bg-orange-500/5 pointer-events-none backdrop-blur-[0.5px]">
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="bg-orange-100 dark:bg-orange-900/50 px-3 py-1.5 rounded-lg border border-orange-300 dark:border-orange-700">
								<div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
									<Lock size={14} />
									<span className="text-xs font-semibold">{t("retry.locked")}</span>
								</div>
							</div>
						</div>
					</div>
				)}
			</Card>
		</motion.div>
	);
}

// Todo Item Component for Side Panel
function TodoItem({ order, onToggle, completed = false }) {
	const t = useTranslations("employeeOrders");
	const [retryTime, setRetryTime] = useState(getTimeUntilRetry(order.retryConfig?.nextAttemptTime));

	useEffect(() => {
		if (order.status === "retry" && order.retryConfig?.nextAttemptTime) {
			const interval = setInterval(() => {
				setRetryTime(getTimeUntilRetry(order.retryConfig?.nextAttemptTime));
			}, 1000);

			return () => clearInterval(interval);
		}
	}, [order.status, order.retryConfig?.nextAttemptTime]);

	const statusConfig = {
		new: { color: "bg-primary", label: t("statuses.new") },
		under_review: { color: "bg-amber-500", label: t("statuses.underReview") },
		preparing: { color: "bg-teal-500", label: t("statuses.preparing") },
		ready: { color: "bg-green-500", label: t("statuses.ready") },
		shipped: { color: "bg-purple-500", label: t("statuses.shipped") },
		delivered: { color: "bg-green-600", label: t("statuses.delivered") },
		cancelled: { color: "bg-red-500", label: t("statuses.cancelled") },
	};

	const config = statusConfig[order.status] || statusConfig.new;
	const isRetryLocked = false;
	const retryProgress = order.retryConfig 
		? ((order.retryConfig.currentAttempt / order.retryConfig.maxAttempts) * 100)
		: 0;

	return (
		<motion.div
			layout
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			className={cn(
				"p-3 rounded-lg border-2 mb-2 transition-all relative",
				completed 
					? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800 opacity-60"
					: isRetryLocked
						? "bg-orange-50/30 dark:bg-orange-950/10 border-orange-300 dark:border-orange-700"
						: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary"
			)}
		>
			<div className={cn("flex items-start gap-3", isRetryLocked && "opacity-50")}>
				<motion.button
					whileHover={{ scale: isRetryLocked ? 1 : 1.1 }}
					whileTap={{ scale: isRetryLocked ? 1 : 0.9 }}
					onClick={() => !isRetryLocked && onToggle(order.id)}
					disabled={isRetryLocked}
					className={cn(
						"w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all mt-0.5",
						completed
							? "bg-green-500 border-green-500"
							: isRetryLocked
								? "border-gray-300 dark:border-gray-600 cursor-not-allowed"
								: "border-gray-300 dark:border-gray-600 hover:border-primary"
					)}
				>
					{completed && <CheckCircle size={14} className="text-white" />}
				</motion.button>

				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<span className={cn(
							"font-semibold text-sm",
							completed ? "line-through text-gray-500" : "text-gray-900 dark:text-gray-100"
						)}>
							{order.orderNumber}
						</span>
						<Badge className={cn("text-xs px-2 py-0.5 text-white border-0", config.color)}>
							{config.label}
						</Badge>
					</div>
					<div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
						<div className="flex items-center gap-2">
							<User size={10} />
							<span className="truncate">{order.customerName}</span>
						</div>
						<div className="flex items-center gap-2">
							<Phone size={10} />
							<span className="truncate">{order.phoneNumber}</span>
						</div>
						<div className="font-bold text-green-600 dark:text-green-400">
							{order.total} {t("currency")}
						</div>
					</div>

					{/* Retry Status in Todo */}
					{order.status === "retry" && order.retryConfig && (
						<div className="mt-2 p-2 bg-orange-100 dark:bg-orange-900/30 rounded border border-orange-200 dark:border-orange-700">
							<div className="flex items-center justify-between mb-1">
								<span className="text-[10px] text-gray-700 dark:text-gray-300">
									{t("retry.attempt", { current: order.retryConfig.currentAttempt, max: order.retryConfig.maxAttempts })}
								</span>
								{retryTime.isLocked ? (
									<div className="flex items-center gap-1 text-orange-700 dark:text-orange-300">
										<Timer size={10} />
										<span className="text-xs font-mono font-bold">{retryTime.display}</span>
									</div>
								) : (
									<div className="flex items-center gap-1 text-green-700 dark:text-green-300">
										<Unlock size={10} />
										<span className="text-[10px] font-semibold">{t("retry.available")}</span>
									</div>
								)}
							</div>
							<Progress value={retryProgress} className="h-1 mb-1" />
							<div className="text-[9px] text-gray-600 dark:text-gray-400">
								{t("retry.interval", { minutes: order.retryConfig.intervalMinutes })}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Locked indicator overlay */}
			{isRetryLocked && (
				<div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-0.5 rounded text-[9px] font-semibold flex items-center gap-1">
					<Lock size={8} />
					{t("retry.locked")}
				</div>
			)}
		</motion.div>
	);
}

// Enhanced TODO Side Panel
function TodoSidePanel({ isOpen, onClose, orders, selectedDate, onDateSelect, onToggleTodo }) {
	const t = useTranslations("employeeOrders");
	
	const todoOrders = orders.filter(o => !o.todoCompleted);
	const completedOrders = orders.filter(o => o.todoCompleted);
	const completionRate = orders.length > 0 ? (completedOrders.length / orders.length) * 100 : 0;

	const goToPreviousDay = () => {
		const newDate = new Date(selectedDate);
		newDate.setDate(newDate.getDate() - 1);
		onDateSelect(newDate);
	};

	const goToNextDay = () => {
		const newDate = new Date(selectedDate);
		newDate.setDate(newDate.getDate() + 1);
		onDateSelect(newDate);
	};

	const goToToday = () => {
		onDateSelect(new Date());
	};

	const isToday = selectedDate.toDateString() === new Date().toDateString();

	return (
		<Sheet open={isOpen} onOpenChange={onClose}>
			<SheetContent side="right" className="w-full sm:w-[500px] p-0 overflow-hidden">
				<div className="h-full flex flex-col">
					{/* Header */}
					<SheetHeader className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-primary to-primary/80">
						<div className="flex items-center justify-between">
							<SheetTitle className="text-white flex items-center gap-2">
								<ListTodo size={24} />
								{t("todo.title")}
							</SheetTitle>
							<Button
								variant="ghost"
								size="icon"
								onClick={onClose}
								className="text-white hover:bg-white/20"
							>
								<X size={20} />
							</Button>
						</div>
						
						{/* Stats */}
						<div className="flex items-center justify-between mt-3">
							<div className="text-white/90 text-sm">
								{t("todo.completed", { completed: completedOrders.length, total: orders.length })}
							</div>
							<div className="text-white text-xl font-bold">
								{completionRate.toFixed(0)}%
							</div>
						</div>
						<Progress value={completionRate} className="h-2 bg-white/20 mt-2" />
					</SheetHeader>

					{/* Calendar Navigation */}
					<div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
						<div className="flex items-center gap-2 mb-3">
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className="flex-1 justify-start text-right border-2 hover:border-primary"
									>
										<CalendarIcon size={16} className="ml-2" />
										<span className="font-semibold">
											{selectedDate.toLocaleDateString("ar-EG", { 
												weekday: "long", 
												year: "numeric", 
												month: "long", 
												day: "numeric" 
											})}
										</span>
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="single"
										selected={selectedDate}
										onSelect={(date) => date && onDateSelect(date)}
										className="rounded-lg"
									/>
								</PopoverContent>
							</Popover>
						</div>

						{/* Day Navigation */}
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={goToPreviousDay}
								className="flex-1 border-2 hover:border-primary"
							>
								<ChevronRightIcon size={16} className="ml-1" />
								{t("calendar.previousDay")}
							</Button>
							
							<Button
								variant={isToday ? "default" : "outline"}
								size="sm"
								onClick={goToToday}
								disabled={isToday}
								className={cn(
									"flex-1 border-2",
									isToday ? "bg-primary hover:bg-primary/90" : "hover:border-primary"
								)}
							>
								{t("calendar.today")}
							</Button>

							<Button
								variant="outline"
								size="sm"
								onClick={goToNextDay}
								className="flex-1 border-2 hover:border-primary"
							>
								{t("calendar.nextDay")}
								<ChevronLeft size={16} className="mr-1" />
							</Button>
						</div>
					</div>

					{/* Todo List */}
					<div className="flex-1 overflow-y-auto p-4">
						{/* Pending Tasks */}
						{todoOrders.length > 0 && (
							<div className="mb-6">
								<h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
									<Clock size={14} className="text-primary" />
									{t("todo.pending")} ({todoOrders.length})
								</h3>
								{todoOrders.map((order) => (
									<TodoItem key={order.id} order={order} onToggle={onToggleTodo} />
								))}
							</div>
						)}

						{/* Completed Tasks */}
						{completedOrders.length > 0 && (
							<div>
								<h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
									<CheckCheck size={14} className="text-green-500" />
									{t("todo.completedTasks")} ({completedOrders.length})
								</h3>
								{completedOrders.map((order) => (
									<TodoItem key={order.id} order={order} onToggle={onToggleTodo} completed />
								))}
							</div>
						)}

						{/* Empty State */}
						{orders.length === 0 && (
							<div className="text-center py-12 text-gray-400">
								<ListTodo size={48} className="mx-auto mb-3 opacity-20" />
								<p className="text-sm">{t("todo.noTasks")}</p>
							</div>
						)}
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}

// Enhanced Week Days Selector
function EnhancedWeekSelector({ selectedDate, onDateSelect, orders }) {
	const t = useTranslations("employeeOrders");
	const [currentWeekStart, setCurrentWeekStart] = useState(() => {
		const now = new Date();
		const day = now.getDay();
		const diff = now.getDate() - day;
		return new Date(now.setDate(diff));
	});

	const getWeekDays = (startDate) => {
		const days = [];
		const start = new Date(startDate);

		for (let i = 0; i < 7; i++) {
			const day = new Date(start);
			day.setDate(start.getDate() + i);
			days.push(day);
		}
		return days;
	};

	const getOrdersForDate = (date) => {
		return orders.filter(order => 
			order.assignedDate.toDateString() === date.toDateString()
		).length;
	};

	const goToPreviousWeek = () => {
		const newStart = new Date(currentWeekStart);
		newStart.setDate(newStart.getDate() - 7);
		setCurrentWeekStart(newStart);
	};

	const goToNextWeek = () => {
		const newStart = new Date(currentWeekStart);
		newStart.setDate(newStart.getDate() + 7);
		setCurrentWeekStart(newStart);
	};

	const weekDays = getWeekDays(currentWeekStart);
	const shortArabicDays = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

	return (
		<div className="flex items-center gap-3">
			{/* Previous Week Button */}
			<motion.button
				onClick={goToPreviousWeek}
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.9 }}
				className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary flex items-center justify-center transition-all shadow-sm hover:shadow-md"
			>
				<ChevronRightIcon size={20} className="text-gray-600 dark:text-gray-400" />
			</motion.button>

			{/* Week Days */}
			<div className="flex items-center gap-2">
				{weekDays.map((day, index) => {
					const isSelected = selectedDate?.toDateString() === day.toDateString();
					const isToday = new Date().toDateString() === day.toDateString();
					const ordersCount = getOrdersForDate(day);
					const hasOrders = ordersCount > 0;

					return (
						<motion.button
							key={index}
							onClick={() => onDateSelect(day)}
							whileHover={{ scale: 1.05, y: -2 }}
							whileTap={{ scale: 0.95 }}
							className={cn(
								"flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all min-w-[70px] relative overflow-hidden",
								isSelected
									? "bg-primary text-white shadow-lg scale-105"
									: isToday
										? "bg-primary/10 text-primary border-2 border-primary/30 shadow-md"
										: "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary hover:shadow-md"
							)}
						>
							{isSelected && (
								<motion.div
									layoutId="selectedDay"
									className="absolute inset-0 bg-primary"
									transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
								/>
							)}

							<span className={cn(
								"text-[10px] font-medium relative z-10",
								isSelected ? "text-white" : isToday ? "text-primary" : ""
							)}>
								{shortArabicDays[index]}
							</span>
							<span className={cn(
								"text-xl font-bold relative z-10",
								isSelected ? "text-white" : isToday ? "text-primary" : ""
							)}>
								{day.getDate()}
							</span>

							{hasOrders && (
								<div className={cn(
									"absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full z-10",
									isSelected 
										? "bg-white/30 text-white"
										: "bg-primary text-white"
								)}>
									{ordersCount}
								</div>
							)}

							{isToday && !isSelected && (
								<div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary z-10" />
							)}
						</motion.button>
					);
				})}
			</div>

			{/* Next Week Button */}
			<motion.button
				onClick={goToNextWeek}
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.9 }}
				className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary flex items-center justify-center transition-all shadow-sm hover:shadow-md"
			>
				<ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
			</motion.button>
		</div>
	);
}

// Drag Overlay Card
function DragOverlayCard({ order }) {
	const t = useTranslations("employeeOrders");
	
	const statusConfig = {
		new: { color: "bg-primary", label: t("statuses.new"), icon: Package },
		under_review: { color: "bg-amber-500", label: t("statuses.underReview"), icon: AlertCircle },
		preparing: { color: "bg-teal-500", label: t("statuses.preparing"), icon: Package },
		ready: { color: "bg-green-500", label: t("statuses.ready"), icon: CheckCircle },
		shipped: { color: "bg-purple-500", label: t("statuses.shipped"), icon: Truck },
		delivered: { color: "bg-green-600", label: t("statuses.delivered"), icon: CheckCheck },
		cancelled: { color: "bg-red-500", label: t("statuses.cancelled"), icon: XCircle },
	};

	const config = statusConfig[order.status] || statusConfig.new;
	const StatusIcon = config.icon;

	return (
		<motion.div
			initial={{ scale: 1 }}
			animate={{ scale: 1.05, rotate: 3 }}
			className="w-[300px]"
		>
			<Card className="overflow-hidden shadow-2xl ring-4 ring-primary/50 border-2 border-primary">
				<div className="flex items-stretch">
					<div className="w-8 flex items-center justify-center bg-primary/10">
						<GripVertical size={16} className="text-primary" />
					</div>

					<div className="flex-1 p-3 bg-white dark:bg-gray-900">
						<div className="flex items-center justify-between mb-2">
							<div className="flex items-center gap-2">
								<span className="font-bold text-sm text-gray-900 dark:text-gray-100">
									{order.orderNumber}
								</span>
								<Badge className={cn("text-xs px-2 py-0.5 text-white border-0 gap-1", config.color)}>
									<StatusIcon size={10} />
									{config.label}
								</Badge>
							</div>
						</div>

						<div className="space-y-1 text-xs mb-2">
							<div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
								<User size={11} className="text-gray-400 flex-shrink-0" />
								<span className="truncate font-medium">{order.customerName}</span>
							</div>

							<div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
								<Phone size={11} className="text-gray-400 flex-shrink-0" />
								<span className="truncate">{order.phoneNumber}</span>
							</div>
						</div>

						<div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
							<span className="text-sm font-bold text-green-600 dark:text-green-400">
								{order.total} {t("currency")}
							</span>
						</div>
					</div>
				</div>
			</Card>
		</motion.div>
	);
}

// Droppable Column
function DroppableColumn({ id, title, icon: Icon, color, orders, onViewDetails }) {
	const { setNodeRef } = useSortable({
		id: id,
		data: {
			type: "column",
		},
	});

	return (
		<motion.div
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			className="flex flex-col w-[320px] flex-shrink-0"
		>
			{/* Column Header */}
			<div className={cn(
				"rounded-xl p-3 mb-3 shadow-md",
				"bg-gradient-to-br",
				color
			)}>
				<div className="flex items-center justify-between text-white">
					<div className="flex items-center gap-2">
						<Icon size={18} />
						<h3 className="font-bold text-sm">{title}</h3>
					</div>
					<Badge className="bg-white/20 text-white border-0 text-xs">
						{orders.length}
					</Badge>
				</div>
			</div>

			{/* Droppable Area */}
			<div
				ref={setNodeRef}
				className="flex-1 space-y-2 overflow-y-auto pr-2 scrollbar-thin min-h-[200px]"
				style={{ maxHeight: "calc(100vh - 450px)" }}
			>
				<SortableContext
					items={orders.map((o) => o.id)}
					strategy={verticalListSortingStrategy}
				>
					<AnimatePresence>
						{orders.map((order) => (
							<SortableOrderCard
								key={order.id}
								order={order}
								onViewDetails={onViewDetails}
							/>
						))}
					</AnimatePresence>
				</SortableContext>

				{orders.length === 0 && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="text-center py-12 text-gray-400"
					>
						<Package size={32} className="mx-auto mb-2 opacity-20" />
						<p className="text-sm">لا توجد طلبات</p>
					</motion.div>
				)}
			</div>
		</motion.div>
	);
}

// Map API order to card format
function mapOrderFromApi(order) {
	return {
		id: order.id,
		orderNumber: order.orderNumber || `#${order.id}`,
		customerName: order.customerName,
		phoneNumber: order.phoneNumber,
		city: order.city,
		product: order.items?.[0]?.variant?.product?.name || order.items?.[0]?.variant?.sku || "-",
		quantity: order.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0,
		status: order.status || "new",
		total: order.finalTotal ?? 0,
		assignedDate: order.assignedAt ? new Date(order.assignedAt) : new Date(),
		priority: "medium",
		todoCompleted: false,
		notes: order.notes,
	};
}

// Main Component
export default function EmployeeOrdersPerfect() {
	const t = useTranslations("employeeOrders");
	const router = useRouter();
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [activeStatus, setActiveStatus] = useState("all");
	const [todoSidePanelOpen, setTodoSidePanelOpen] = useState(false);
	const [activeId, setActiveId] = useState(null);

	useEffect(() => {
		setLoading(true);
		const dateStr = selectedDate.toISOString().split("T")[0];
		api.get("/orders/employee-orders", { params: { date: dateStr, status: activeStatus !== "all" ? activeStatus : undefined, limit: 100 } })
			.then((res) => {
				const records = res.data?.records ?? [];
				setOrders(records.map(mapOrderFromApi));
			})
			.catch(() => setOrders([]))
			.finally(() => setLoading(false));
	}, [selectedDate, activeStatus]);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	// Filter orders by date and status
	const filteredOrders = useMemo(() => {
		let filtered = orders;

		if (selectedDate) {
			filtered = filtered.filter(
				order => order.assignedDate.toDateString() === selectedDate.toDateString()
			);
		}

		if (activeStatus !== "all") {
			filtered = filtered.filter(order => order.status === activeStatus);
		}

		return filtered;
	}, [orders, selectedDate, activeStatus]);

	// Group orders by status (backend statuses)
	const groupedOrders = useMemo(() => {
		const statuses = ["new", "under_review", "preparing", "ready", "shipped", "delivered", "cancelled"];
		const groups = {};
		statuses.forEach((status) => {
			groups[status] = filteredOrders.filter((order) => order.status === status);
		});
		return groups;
	}, [filteredOrders]);

	const statusColumns = [
		{ key: "new", label: t("statuses.new"), icon: Package, color: "from-primary to-primary/80" },
		{ key: "under_review", label: t("statuses.underReview"), icon: AlertCircle, color: "from-amber-500 to-orange-600" },
		{ key: "preparing", label: t("statuses.preparing"), icon: Package, color: "from-teal-500 to-cyan-600" },
		{ key: "ready", label: t("statuses.ready"), icon: CheckCircle, color: "from-green-500 to-green-600" },
		{ key: "shipped", label: t("statuses.shipped"), icon: Truck, color: "from-purple-500 to-purple-600" },
		{ key: "delivered", label: t("statuses.delivered"), icon: CheckCheck, color: "from-green-600 to-green-700" },
		{ key: "cancelled", label: t("statuses.cancelled"), icon: XCircle, color: "from-red-500 to-red-600" },
	];

	const handleDragStart = (event) => {
		setActiveId(event.active.id);
	};

	const handleDragOver = (event) => {
		const { active, over } = event;
		if (!over) return;

		const activeId = active.id;
		const overId = over.id;

		if (activeId === overId) return;

		const activeOrder = orders.find(o => o.id === activeId);
		if (!activeOrder) return;

		// Check if order is locked (retry with active timer)
		if (activeOrder.status === "retry" && activeOrder.retryConfig?.nextAttemptTime) {
			const timeUntil = getTimeUntilRetry(activeOrder.retryConfig.nextAttemptTime);
			if (timeUntil.isLocked) {
				toast.error(t("retry.cannotMove"));
				return;
			}
		}

		// Check if we're over a column
		const overColumn = statusColumns.find(col => col.key === overId);
		if (overColumn) {
			const newStatus = overColumn.key;
			setOrders(orders.map(order =>
				order.id === activeId ? { ...order, status: newStatus } : order
			));
			api.patch(`/orders/${activeId}/status`, { status: newStatus }).catch(() => toast.error(t("retry.cannotMove")));
			return;
		}

		// Check if we're over another order
		const overOrder = orders.find(o => o.id === overId);
		if (!overOrder) return;

		// If different status, change status
		if (activeOrder.status !== overOrder.status) {
			const newStatus = overOrder.status;
			setOrders(orders.map(order =>
				order.id === activeId ? { ...order, status: newStatus } : order
			));
			api.patch(`/orders/${activeId}/status`, { status: newStatus }).catch(() => toast.error(t("retry.cannotMove")));
		}
	};

	const handleDragEnd = (event) => {
		const { active, over } = event;

		setActiveId(null);

		if (!over) return;

		const activeId = active.id;
		const overId = over.id;

		const activeOrder = orders.find(o => o.id === activeId);
		const overOrder = orders.find(o => o.id === overId);

		if (!activeOrder) return;

		// If dropped on another order in the same column, reorder
		if (overOrder && activeOrder.status === overOrder.status) {
			const oldIndex = orders.findIndex(o => o.id === activeId);
			const newIndex = orders.findIndex(o => o.id === overId);

			if (oldIndex !== newIndex) {
				setOrders(arrayMove(orders, oldIndex, newIndex));
			}
		}

		// Show success message
		const newStatus = activeOrder.status;
		const statusLabel = statusColumns.find(s => s.key === newStatus)?.label;
		toast.success(t("orderMoved", { status: statusLabel }));
	};

	const handleViewDetails = (order) => {
		router.push(`/orders/show/${order.id}`);
	};

	const handleToggleTodo = (orderId) => {
		setOrders(orders.map(order =>
			order.id === orderId ? { ...order, todoCompleted: !order.todoCompleted } : order
		));
		
		const order = orders.find(o => o.id === orderId);
		if (order) {
			toast.success(order.todoCompleted ? t("todo.taskUncompleted") : t("todo.taskCompleted"));
		}
	};

	const activeOrder = activeId ? orders.find(o => o.id === activeId) : null;
	const totalOrders = filteredOrders.length;

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary/5 to-primary/10 dark:from-gray-950 dark:via-primary/5 dark:to-primary/10">
			<div className="container mx-auto p-4 md:p-6 max-w-[1800px]">
				{/* Header */}
				<div className="mb-6">
					<div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
						<span>{t("breadcrumb.home")}</span>
						<ChevronLeft size={16} />
						<span className="text-primary font-semibold">{t("breadcrumb.myOrders")}</span>
					</div>

					<div className="flex items-center justify-between flex-wrap gap-4 mb-6">
						<div>
							<h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-1">
								{t("title")}
							</h1>
							<p className="text-gray-600 dark:text-gray-400">
								{t("totalOrders", { count: totalOrders, date: selectedDate.toLocaleDateString("ar-EG") })}
							</p>
						</div>

						<Button
							variant="outline"
							size="sm"
							onClick={() => router.push("/")}
							className="rounded-xl border-2 hover:border-primary"
						>
							<ChevronLeft size={16} className="ml-2" />
							{t("backToHome")}
						</Button>
					</div>

					{/* Stats Cards */}
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
						{statusColumns.map((col, idx) => {
							const count = groupedOrders[col.key]?.length || 0;
							const Icon = col.icon;
							const isActive = activeStatus === col.key;

							return (
								<motion.button
									key={col.key}
									whileHover={{ scale: 1.03 }}
									whileTap={{ scale: 0.98 }}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: idx * 0.05 }}
									onClick={() => setActiveStatus(isActive ? "all" : col.key)}
									className={cn(
										"p-4 rounded-xl transition-all text-right",
										isActive
											? "bg-gradient-to-br shadow-lg ring-2 ring-primary/50 " + col.color
											: "bg-white dark:bg-gray-900 hover:shadow-md border-2 border-gray-200 dark:border-gray-800"
									)}
								>
									<div className="flex items-center justify-between mb-2">
										<div className={cn(
											"w-10 h-10 rounded-lg flex items-center justify-center",
											isActive ? "bg-white/20" : "bg-gradient-to-br " + col.color
										)}>
											<Icon size={18} className="text-white" />
										</div>
										<span className={cn(
											"text-2xl font-bold",
											isActive ? "text-white" : "text-gray-900 dark:text-gray-100"
										)}>
											{count}
										</span>
									</div>
									<p className={cn(
										"text-sm font-semibold",
										isActive ? "text-white" : "text-gray-700 dark:text-gray-300"
									)}>
										{col.label}
									</p>
								</motion.button>
							);
						})}
					</div>

					{/* TODO Button & Calendar */}
					<div className="flex items-center justify-between gap-4 mb-6">
						{/* TODO Button */}
						<Button
							onClick={() => setTodoSidePanelOpen(true)}
							className="bg-primary hover:bg-primary/90 text-white shadow-lg"
						>
							<ListTodo size={18} className="ml-2" />
							{t("todo.title")}
							<Badge className="bg-white/20 text-white border-0 text-xs mr-2">
								{filteredOrders.filter(o => !o.todoCompleted).length}
							</Badge>
						</Button>

						{/* Week Selector */}
						<EnhancedWeekSelector
							selectedDate={selectedDate}
							onDateSelect={setSelectedDate}
							orders={orders}
						/>
					</div>
				</div>

				{/* Kanban Board with DnD */}
				<DndContext
					sensors={sensors}
					collisionDetection={closestCorners}
					onDragStart={handleDragStart}
					onDragOver={handleDragOver}
					onDragEnd={handleDragEnd}
				>
					<div className="relative">
						<div className="overflow-x-auto pb-4 scrollbar-thin">
							<div className="flex gap-4 min-w-max">
								{statusColumns.map((col) => (
									<DroppableColumn
										key={col.key}
										id={col.key}
										title={col.label}
										icon={col.icon}
										color={col.color}
										orders={groupedOrders[col.key] || []}
										onViewDetails={handleViewDetails}
									/>
								))}
							</div>
						</div>

						{/* Scroll Indicators */}
						<div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-50 dark:from-gray-950 to-transparent pointer-events-none" />
						<div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-50 dark:from-gray-950 to-transparent pointer-events-none" />
					</div>

					{/* Drag Overlay */}
					<DragOverlay>
						{activeOrder ? <DragOverlayCard order={activeOrder} /> : null}
					</DragOverlay>
				</DndContext>
			</div>

			{/* TODO Side Panel */}
			<TodoSidePanel
				isOpen={todoSidePanelOpen}
				onClose={() => setTodoSidePanelOpen(false)}
				orders={filteredOrders}
				selectedDate={selectedDate}
				onDateSelect={setSelectedDate}
				onToggleTodo={handleToggleTodo}
			/>
		</div>
	);
}