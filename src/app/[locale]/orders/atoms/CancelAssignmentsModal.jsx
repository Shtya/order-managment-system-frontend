import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { X, UserMinus, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/utils/api";
import toast from "react-hot-toast";

export default function CancelAssignmentsModal({
  isOpen,
  onClose,
  orderIds,
  orders,
  onSuccess
}) {
  const t = useTranslations("orders");
  const [cancelLoading, setCancelLoading] = useState(false);

  const filteredOrders = useMemo(() => {
    if (!orders || !orderIds) return [];
    return orders.filter(r => orderIds.includes(r.id));
  }, [orders, orderIds]);

  const confirmCancelAssignments = async () => {
    setCancelLoading(true);
    try {
      await api.delete("/order-assignment/assignments", {
        data: { orderIds }
      });
      toast.success(t("assignmentsCancelledSuccessfully"));
      onSuccess?.();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error(t("failedToCancelAssignments"));
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!max-w-4xl rounded-xl max-h-[90vh] flex flex-col p-0 shadow-2xl border-0 overflow-hidden">
        <div className="relative px-6 pt-6 pb-5 shrink-0 bg-gradient-to-br from-primary to-secondary">
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <UserMinus size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-white text-xl font-bold">{t("actions.bulkCancelAssignments")}</h2>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              <X size={16} className="text-white" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950/50">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-400">{t("table.orderNumber")}</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-400">{t("table.assignedEmployee")}</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-400">{t("table.status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-center font-mono">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {order.assignments?.[0]?.employee?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {order.status?.system ? t(`statuses.${order.status.code}`) : (order.status?.name || order.status?.code || "-")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl"
          >
            {t("common.cancel")}
          </Button>
          <Button
            disabled={cancelLoading}
            onClick={confirmCancelAssignments}
            className="rounded-xl"
          >
            {cancelLoading ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : null}
            {t("actions.cancelAssignment")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
