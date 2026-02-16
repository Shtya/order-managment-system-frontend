"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Phone,
  MapPin,
  Truck,
  DollarSign,
  Calendar,
  Clock,
  Store,
  FileText,
  History,
  User,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  ArrowRight,
  Lock,
  Timer,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import api from "@/utils/api";
import { cn } from "@/utils/cn";
import { OrderDetailsPage } from "../../[id]/page";
import { getIconForStatus } from "../../page";

// Status Badge Component
const StatusBadge = ({ status, t }) => {
  if (!status) return null;

  const getBgColor = (colorCode) => {
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
        : null;
    };

    const rgb = hexToRgb(colorCode);
    return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)` : "#f5f5f5";
  };

  return (
    <Badge
      className="rounded-lg px-3 py-1.5 font-semibold"
      style={{
        backgroundColor: getBgColor(status.color),
        color: status.color,
        border: `1px solid ${status.color}`,
      }}
    >
      {status.system ? t(`statuses.${status.code}`) : status.name}
    </Badge>
  );
};

// Info Row Component
const InfoRow = ({ icon: Icon, label, value, valueClassName }) => (
  <div className="flex items-start gap-3 py-2">
    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
      <Icon size={20} className="text-gray-600 dark:text-gray-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className={cn("text-base font-semibold text-gray-900 dark:text-gray-100", valueClassName)}>
        {value || "-"}
      </p>
    </div>
  </div>
);

// Section Card Component
const SectionCard = ({ title, icon: Icon, children, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      "bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6",
      "shadow-sm",
      className
    )}
  >
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon size={20} className="text-primary" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
    </div>
    {children}
  </motion.div>
);

// Lock Timer Component
const LockTimer = ({ lockedUntil }) => {
  const t = useTranslations("orders");
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!lockedUntil) return null;

  const lockDate = new Date(lockedUntil);
  const isLocked = lockDate > new Date(currentTime);

  if (!isLocked) return null;

  const diff = lockDate.getTime() - currentTime;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const timeDisplay = hours > 0
    ? `${hours}h ${minutes}m ${seconds}s`
    : minutes > 0
      ? `${minutes}m ${seconds}s`
      : `${seconds}s`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-4 p-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 border border-orange-400"
    >
      <div className="flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Lock size={20} />
          <div>
            <p className="font-bold text-sm">{t("workPage.orderLocked")}</p>
            <p className="text-xs opacity-90">{t("workPage.lockedMessage")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
          <Timer size={18} />
          <span className="text-lg font-mono font-bold">{timeDisplay}</span>
        </div>
      </div>
    </motion.div>
  );
};

// Main Order Work Page
export default function OrderConfirmationWorkPage() {
  const t = useTranslations("orders");
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);
  const [refetchingOrder, setRefetchingOrder] = useState(false);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState(null);
  const [notes, setNotes] = useState("");
  const [allowedStatuses, setAllowedStatuses] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [statusDecided, setStatusDecided] = useState(false);

  useEffect(() => {
    fetchNextOrder();
    fetchAllowedStatuses();
  }, []);

  const fetchNextOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get("/orders/employee/orders/next");
      setOrder(response.data);
      checkLockStatus(response.data);
      setStatusDecided(false); // Reset when fetching new order
    } catch (error) {
      console.error("Error fetching next order:", error);
      toast.error(t("messages.errorFetchingOrder"));
    } finally {
      setLoading(false);
    }
  };

  const fetchAllowedStatuses = async () => {
    try {
      // Fetch all statuses and filter allowed ones
      const response = await api.get("/orders/stats");
      const statuses = response.data || [];

      // Allowed status codes for confirmation team
      const allowedCodes = [
        "under_review",
        "cancelled",
        "confirmed",
        "postponed",
        "no_answer",
        "wrong_number",
        "out_of_area",
        "duplicate",
      ];

      const filtered = statuses.filter((status) => {
        if (status.system) {
          return allowedCodes.includes(status.code);
        }
        return true; // Allow all custom statuses
      });

      setAllowedStatuses(filtered);
    } catch (error) {
      console.error("Error fetching statuses:", error);
      toast.error(t("messages.errorFetchingStatuses"));
    }
  };

  const checkLockStatus = (orderData) => {
    if (!orderData) return;

    const assignment = orderData.assignments?.find((a) => a.isAssignmentActive);
    if (assignment?.lockedUntil) {
      const lockDate = new Date(assignment.lockedUntil);
      const isCurrentlyLocked = lockDate > new Date();
      setIsLocked(isCurrentlyLocked);
      setLockedUntil(assignment.lockedUntil);
    } else {
      setIsLocked(false);
      setLockedUntil(null);
    }
  };

  const handleStatusChange = async (statusId) => {
    if (!order || isLocked || statusDecided) return;

    try {
      setChangingStatus(true);
      setSelectedStatusId(statusId);

      await api.put(`/orders/${order.id}/confirm-status`, {
        statusId,
        notes: notes.trim() || undefined,
      });

      toast.success(t("messages.statusUpdated"));

      // Mark status as decided
      setStatusDecided(true);

      // Show success card
      setShowSuccessCard(true);

      // Re-fetch the order to get updated status and lock info
      await refetchCurrentOrder();

      // Hide success card after 5 seconds
      // setTimeout(() => {
      //   setShowSuccessCard(false);
      // }, 5000);

      // Clear notes
      setNotes("");
      setSelectedStatusId(null);
    } catch (error) {
      console.error("Error changing status:", error);
      toast.error(error.response?.data?.message || t("messages.errorUpdatingStatus"));
      setSelectedStatusId(null);
      setStatusDecided(false); // Reset on error
    } finally {
      setChangingStatus(false);
    }
  };

  const refetchCurrentOrder = async () => {
    if (!order) return;

    try {
      setRefetchingOrder(true);
      const response = await api.get(`/orders/${order.id}`);
      setOrder(response.data);
      checkLockStatus(response.data);
    } catch (error) {
      console.error("Error refetching order:", error);
    } finally {
      setRefetchingOrder(false);
    }
  };

  const handleNextOrder = () => {
    fetchNextOrder();
    setNotes("");
    setSelectedStatusId(null);
    setIsLocked(false);
    setLockedUntil(null);
    setStatusDecided(false);
    setShowSuccessCard(false);
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const finalLoading = loading || refetchingOrder;

  if (finalLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t("messages.loading")}</p>
        </div>
      </div>
    );
  }


  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f6fa] dark:bg-[#19243950]">
        <div className="text-center">
          <Package size={64} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {t("workPage.noOrders")}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t("workPage.noOrdersDescription")}
          </p>
          <Button onClick={() => router.push("/orders/employee-orders")} className="rounded-xl">
            <ChevronLeft size={16} className="mr-2" />
            {t("workPage.backToMyOrders")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div >
      <OrderDetailsPage order={order} loading={finalLoading} />
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="fixed left-6 top-1/2 -translate-y-1/2 z-50"
      >
        <Button
          onClick={handleNextOrder}
          size="lg"
          disabled={!statusDecided || loading || changingStatus || refetchingOrder}
          className={cn(
            "rounded-full w-16 h-16 shadow-lg transition-all",
            statusDecided && !loading && !changingStatus && !refetchingOrder
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
          )}
        >
          <ArrowRight size={28} />
        </Button>
      </motion.div>

      <div className="space-y-6">
        {/* Change Status Section */}
        <SectionCard title={t("workPage.changeStatus")} icon={CheckCircle}>
          <AnimatePresence>
            {(showSuccessCard || refetchingOrder) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 border border-green-400"
              >
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    {refetchingOrder ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <div>
                          <p className="font-bold text-sm">{t("workPage.updatingOrder")}</p>
                          <p className="text-xs opacity-90">{t("workPage.pleaseWait")}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        <div>
                          <p className="font-bold text-sm">{t("workPage.statusChanged")}</p>
                          <p className="text-xs opacity-90">{t("workPage.orderUpdated")}</p>
                        </div>
                      </>
                    )}
                  </div>
                  {!refetchingOrder && (
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg">
                      <span className="text-xs font-semibold">{t("workPage.clickNext")}</span>
                      <ArrowRight size={16} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>


          {/* Notes Input */}
          <div className="mb-4">
            <Label className="text-sm text-gray-600 dark:text-slate-300 mb-2">
              {t("workPage.notes")}
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("workPage.notesPlaceholder")}
              disabled={isLocked || changingStatus}
              className="rounded-lg min-h-[80px] bg-[#fafafa] dark:bg-slate-800/50"
            />
          </div>

          {/* Status Cards Grid */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-600 dark:text-slate-300 mb-2">
              {t("workPage.selectStatus")}
            </Label>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
              {allowedStatuses.map((status) => {
                const isCurrentStatus = status.id === order.status?.id;
                const isChanging = changingStatus && selectedStatusId === status.id;
                const isDisabled = isLocked || changingStatus || isCurrentStatus || statusDecided;

                // Generate icon based on status code
                const StatusIcon = getIconForStatus(status.code);

                // Generate gradient colors
                const hexToRgb = (hex) => {
                  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                  return result
                    ? {
                      r: parseInt(result[1], 16),
                      g: parseInt(result[2], 16),
                      b: parseInt(result[3], 16),
                    }
                    : null;
                };

                const rgb = hexToRgb(status.color);
                const bgLight = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)` : "#f5f5f5";

                return (
                  <div
                    key={status.id}
                    onClick={() => !isDisabled && handleStatusChange(status.id)}
                    style={{
                      background: `linear-gradient(135deg, ${bgLight} 0%, ${bgLight} 100%)`,
                    }}
                    className={cn(
                      "rounded-lg transition-all duration-200",
                      isCurrentStatus && "ring-2 ring-primary/50",
                      !isDisabled && "cursor-pointer hover:scale-[1.02] hover:shadow-lg",
                      isDisabled && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <div
                      className={[
                        "relative w-full rounded-lg p-4 border-2",
                        isCurrentStatus
                          ? "border-primary"
                          : "border-gray-200 dark:border-gray-700",
                        "transition-all duration-200",
                      ].join(" ")}
                    >
                      {/* Current Status Badge */}
                      {isCurrentStatus && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle size={16} className="text-primary" />
                        </div>
                      )}

                      {/* Loading Spinner */}
                      {isChanging && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 rounded-lg flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      )}

                      <div className="flex flex-col items-center gap-2 text-center">
                        <div
                          className={[
                            "w-[40px] h-[40px] rounded-full",
                            "border-2 border-dashed",
                            "flex items-center justify-center",
                          ].join(" ")}
                          style={{
                            borderColor: status.color,
                          }}
                        >
                          <StatusIcon
                            size={20}
                            style={{ color: status.color }}
                          />
                        </div>
                        <div>
                          <div
                            className="text-sm font-bold"
                            style={{ color: status.color }}
                          >
                            {status.system ? t(`statuses.${status.code}`) : status.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lock Timer */}
          {isLocked && <LockTimer lockedUntil={lockedUntil} t={t} />}
        </SectionCard>


      </div>
    </div>
  );
}
