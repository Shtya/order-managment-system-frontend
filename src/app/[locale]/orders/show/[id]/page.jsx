"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  Package,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  DollarSign,
  Truck,
  User,
  Copy,
  Check,
  Settings,
  Save,
  X,
  Edit,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/utils/api";

const statusConfig = {
  new: { color: "bg-blue-100 text-blue-700", label: "New" },
  under_review: { color: "bg-orange-100 text-orange-700", label: "Under Review" },
  preparing: { color: "bg-teal-100 text-teal-700", label: "Preparing" },
  ready: { color: "bg-green-100 text-green-700", label: "Ready" },
  shipped: { color: "bg-blue-100 text-blue-700", label: "Shipped" },
  delivered: { color: "bg-green-100 text-green-700", label: "Delivered" },
  cancelled: { color: "bg-red-100 text-red-700", label: "Cancelled" },
  returned: { color: "bg-yellow-100 text-yellow-700", label: "Returned" },
};

export default function OrderShowByIdPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id ? Number(params.id) : null;

  const [order, setOrder] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [orderStatus, setOrderStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get(`/orders/${id}`),
      api.get(`/orders/${id}/status-history`),
    ])
      .then(([orderRes, historyRes]) => {
        const o = orderRes.data;
        setOrder(o);
        setOrderStatus(o?.status || "new");
        setNotes(o?.notes || "");
        setStatusHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      })
      .catch(() => {
        toast.error("Order not found");
        setOrder(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopied(true);
    toast.success("Copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusChange = async (newStatus) => {
    if (!id || newStatus === orderStatus) return;
    setSavingStatus(true);
    try {
      await api.patch(`/orders/${id}/status`, { status: newStatus });
      setOrderStatus(newStatus);
      setOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      const historyRes = await api.get(`/orders/${id}/status-history`);
      setStatusHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      toast.success("Status updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading || !order) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          {loading ? <p className="text-gray-500">Loading...</p> : <p className="text-gray-500">Order not found</p>}
          <Button variant="outline" className="mt-4" onClick={() => router.push("/orders")}>
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  const products = order.items || [];
  const subtotal = order.productsTotal ?? 0;

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <button onClick={() => router.back()} className="hover:text-primary">Home</button>
          <ChevronLeft size={16} />
          <button onClick={() => router.push("/orders/employee-orders")} className="hover:text-primary">My Orders</button>
          <ChevronLeft size={16} />
          <span className="text-primary font-semibold">{order.orderNumber}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Order Details</h1>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-primary">{order.orderNumber}</span>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(order.orderNumber)} className="h-8 w-8">
                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              </Button>
              <Badge className={cn("rounded-lg text-sm px-4 py-2", (statusConfig[orderStatus] || statusConfig.new).color)}>
                {(statusConfig[orderStatus] || statusConfig.new).label}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={orderStatus} onValueChange={handleStatusChange} disabled={savingStatus}>
              <SelectTrigger className="w-[180px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => router.push("/orders/employee-orders")} className="rounded-xl">
              <ChevronLeft size={18} className="mr-2" />
              Back to My Orders
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <User className="text-primary" size={24} />
              Customer
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500">Name</Label>
                <p className="font-semibold">{order.customerName}</p>
              </div>
              <div>
                <Label className="text-gray-500">Phone</Label>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-gray-400" />
                  <p className="font-semibold">{order.phoneNumber}</p>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(order.phoneNumber)} className="h-8 w-8">
                    <Copy size={14} />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">City</Label>
                <p className="font-semibold">{order.city}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-gray-500">Address</Label>
                <p className="font-semibold">{order.address}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Package className="text-primary" size={24} />
              Products
            </h2>
            <div className="space-y-4">
              {products.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex-1">
                    <h3 className="font-bold">{item.variant?.product?.name || item.variant?.sku || "—"}</h3>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-primary">{item.unitPrice} × {item.quantity} = {item.lineTotal ?? item.unitPrice * item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">{subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="font-semibold">{order.shippingCost ?? 0}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-semibold text-red-600">-{order.discount}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center text-xl">
                <span className="font-bold">Total</span>
                <span className="font-bold text-green-600">{order.finalTotal ?? 0}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <Tabs defaultValue="internal">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="internal">Internal notes</TabsTrigger>
                <TabsTrigger value="customer">Customer notes</TabsTrigger>
              </TabsList>
              <TabsContent value="internal" className="space-y-3">
                <Label>Internal notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} disabled className="rounded-xl min-h-[100px]" />
              </TabsContent>
              <TabsContent value="customer" className="space-y-3">
                <Label>Customer notes</Label>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-xl">
                  <p className="text-sm">{order.customerNotes || "—"}</p>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Status</h2>
            <div className={cn("p-4 rounded-xl text-center", (statusConfig[orderStatus] || statusConfig.new).color)}>
              <p className="text-2xl font-bold">{(statusConfig[orderStatus] || statusConfig.new).label}</p>
            </div>
            <Separator className="my-4" />
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created</span>
                <span>{order.created_at ? new Date(order.created_at).toLocaleDateString() : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Updated</span>
                <span>{order.updated_at ? new Date(order.updated_at).toLocaleDateString() : "—"}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <DollarSign className="text-green-600" size={24} />
              Payment
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Method</span>
                <Badge variant="outline">{order.paymentMethod || "cod"}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment status</span>
                <Badge>{order.paymentStatus || "pending"}</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Truck className="text-purple-600" size={24} />
              Shipping
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <Label className="text-gray-500">Company</Label>
                <p className="font-semibold">{order.shippingCompany || "—"}</p>
              </div>
              <div>
                <Label className="text-gray-500">Tracking</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-gray-100 dark:bg-slate-800 rounded-lg text-sm font-mono">{order.trackingNumber || "—"}</code>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(order.trackingNumber)} className="h-9 w-9">
                    <Copy size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="text-primary" size={24} />
              Status history (logs)
            </h2>
            <div className="space-y-4">
              {statusHistory.length === 0 ? (
                <p className="text-sm text-gray-500">No history yet.</p>
              ) : (
                statusHistory.map((entry, idx) => (
                  <div key={entry.id || idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      {idx < statusHistory.length - 1 && <div className="w-0.5 h-full bg-gray-200 dark:bg-slate-700 mt-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-semibold text-sm">{entry.fromStatus} → {entry.toStatus}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {entry.created_at ? new Date(entry.created_at).toLocaleString() : ""}
                      </p>
                      {entry.notes && <p className="text-xs text-gray-600 mt-1">{entry.notes}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
