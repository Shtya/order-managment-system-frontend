"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
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
  Calendar,
  MessageSquare,
  Settings,
  RefreshCw,
  Edit,
  Save,
  X,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Fake order data
const orderData = {
  id: 1,
  orderNumber: "ORD-000123",
  customerName: "أحمد محمد علي",
  phoneNumber: "01234567890",
  alternativePhone: "01098765432",
  city: "القاهرة",
  area: "المعادي",
  address: "شارع 9 - مبنى 15 - شقة 3",
  landmark: "بجوار مسجد النور",
  products: [
    { id: 1, name: "خاتم فضة عيار 925", quantity: 2, price: 350, image: "https://via.placeholder.com/80" },
    { id: 2, name: "سلسلة ذهب عيار 18", quantity: 1, price: 1200, image: "https://via.placeholder.com/80" },
  ],
  subtotal: 1900,
  shippingCost: 50,
  discount: 100,
  finalTotal: 1850,
  deposit: 500,
  remaining: 1350,
  status: "confirmed",
  paymentMethod: "cod",
  paymentStatus: "partial",
  shippingCompany: "أرامكس",
  trackingCode: "TRK-ABC123456",
  assignedEmployee: "فاطمة علي",
  created_at: "2025-01-28T10:30:00",
  updated_at: "2025-01-30T14:20:00",
  expectedDelivery: "2025-02-02",
  notes: "يفضل التواصل بعد الساعة 6 مساءً",
  customerNotes: "أريد تغليف هدايا",
  internalNotes: "العميل طلب التأكد من المقاس",
  retryCount: 2,
  retryHistory: [
    { date: "2025-01-29T09:00:00", status: "no_answer", note: "لم يرد على المكالمة" },
    { date: "2025-01-29T15:30:00", status: "no_answer", note: "مشغول، طلب الاتصال مرة أخرى" },
    { date: "2025-01-30T11:00:00", status: "confirmed", note: "تم التأكيد بنجاح" },
  ],
  timeline: [
    { date: "2025-01-28T10:30:00", status: "new", user: "النظام", note: "تم إنشاء الطلب" },
    { date: "2025-01-28T11:00:00", status: "assigned", user: "أحمد مدير", note: "تم تعيين الموظف: فاطمة علي" },
    { date: "2025-01-30T11:00:00", status: "confirmed", user: "فاطمة علي", note: "تم تأكيد الطلب من العميل" },
    { date: "2025-01-30T14:20:00", status: "in_shipping", user: "النظام", note: "تم إرسال الطلب لشركة الشحن" },
  ],
};

// Retry Settings Modal
function RetrySettingsModal({ isOpen, onClose }) {
  const [maxRetries, setMaxRetries] = useState(3);
  const [retryInterval, setRetryInterval] = useState(30);
  const [autoMoveStatus, setAutoMoveStatus] = useState("cancelled");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Settings className="text-white" size={24} />
            </div>
            إعدادات إعادة المحاولة
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl">
            <h4 className="font-bold mb-2 flex items-center gap-2">
              <AlertCircle size={18} />
              الحالة الحالية
            </h4>
            <div className="space-y-2 text-sm">
              <p>عدد المحاولات: <span className="font-bold text-primary">{orderData.retryCount}</span></p>
              <p>آخر محاولة: <span className="font-bold">{new Date(orderData.retryHistory[orderData.retryHistory.length - 1].date).toLocaleString("ar-EG")}</span></p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-lg font-bold">سجل المحاولات</Label>
            <div className="max-h-48 overflow-y-auto space-y-2 border rounded-xl p-4">
              {orderData.retryHistory.map((retry, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{i + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">محاولة رقم {i + 1}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(retry.date).toLocaleString("ar-EG")}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{retry.note}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn(
                    retry.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                  )}>
                    {retry.status === "confirmed" ? "تم التأكيد" : "لم يرد"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>الحد الأقصى لعدد المحاولات</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={maxRetries}
                onChange={(e) => setMaxRetries(parseInt(e.target.value))}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>الفترة الزمنية بين المحاولات (بالدقائق)</Label>
              <Input
                type="number"
                min="5"
                max="1440"
                value={retryInterval}
                onChange={(e) => setRetryInterval(parseInt(e.target.value))}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>نقل إلى حالة معينة بعد انتهاء المحاولات</Label>
              <Select value={autoMoveStatus} onValueChange={setAutoMoveStatus}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                  <SelectItem value="postponed">مؤجل</SelectItem>
                  <SelectItem value="pending_confirmation">لا يرد للتأكيد</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">إلغاء</Button>
          <Button onClick={() => { toast.success("تم حفظ الإعدادات"); onClose(); }} className="rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600">
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Order Details Page
export default function OrderDetailsPage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [orderStatus, setOrderStatus] = useState(orderData.status);
  const [notes, setNotes] = useState(orderData.internalNotes);

  const statusConfig = {
    new: { color: "bg-blue-100 text-blue-700", label: "جديد" },
    confirmed: { color: "bg-green-100 text-green-700", label: "مؤكد" },
    pending_confirmation: { color: "bg-orange-100 text-orange-700", label: "لا يرد للتأكيد" },
    in_shipping: { color: "bg-purple-100 text-purple-700", label: "في الشحن" },
    delivered: { color: "bg-green-100 text-green-700", label: "تم التسليم" },
    postponed: { color: "bg-yellow-100 text-yellow-700", label: "مؤجل" },
    cancelled: { color: "bg-red-100 text-red-700", label: "ملغي" },
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("تم النسخ");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setIsEditing(false);
    toast.success("تم حفظ التغييرات");
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <button onClick={() => router.back()} className="hover:text-primary">
            الرئيسية
          </button>
          <ChevronLeft size={16} />
          <button onClick={() => router.push("/employee/orders")} className="hover:text-primary">
            طلباتي
          </button>
          <ChevronLeft size={16} />
          <span className="text-primary font-semibold">{orderData.orderNumber}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">تفاصيل الطلب</h1>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-primary">{orderData.orderNumber}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(orderData.orderNumber)}
                className="h-8 w-8"
              >
                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              </Button>
              <Badge className={cn("rounded-lg text-sm px-4 py-2", statusConfig[orderStatus].color)}>
                {statusConfig[orderStatus].label}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setSettingsOpen(true)}
              className="rounded-xl flex items-center gap-2"
            >
              <Settings size={18} />
              إعدادات إعادة المحاولة
            </Button>
            
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl flex items-center gap-2"
                >
                  <X size={18} />
                  إلغاء
                </Button>
                <Button
                  onClick={handleSave}
                  className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center gap-2"
                >
                  <Save size={18} />
                  حفظ التغييرات
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center gap-2"
              >
                <Edit size={18} />
                تعديل
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <User className="text-primary" size={24} />
              معلومات العميل
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-500">الاسم</Label>
                {isEditing ? (
                  <Input defaultValue={orderData.customerName} className="rounded-xl" />
                ) : (
                  <p className="font-semibold text-lg">{orderData.customerName}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-500">رقم الهاتف</Label>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <Input defaultValue={orderData.phoneNumber} className="rounded-xl" />
                  ) : (
                    <>
                      <Phone size={16} className="text-gray-400" />
                      <p className="font-semibold">{orderData.phoneNumber}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(orderData.phoneNumber)}
                        className="h-8 w-8"
                      >
                        <Copy size={14} />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-500">رقم بديل</Label>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <Input defaultValue={orderData.alternativePhone} className="rounded-xl" />
                  ) : (
                    <>
                      <Phone size={16} className="text-gray-400" />
                      <p className="font-semibold">{orderData.alternativePhone}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-500">المدينة</Label>
                {isEditing ? (
                  <Input defaultValue={orderData.city} className="rounded-xl" />
                ) : (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    <p className="font-semibold">{orderData.city}</p>
                  </div>
                )}
              </div>

              <div className="col-span-2 space-y-2">
                <Label className="text-gray-500">العنوان الكامل</Label>
                {isEditing ? (
                  <Textarea defaultValue={orderData.address} className="rounded-xl" />
                ) : (
                  <p className="font-semibold">{orderData.city} - {orderData.area} - {orderData.address}</p>
                )}
              </div>

              {orderData.landmark && (
                <div className="col-span-2 space-y-2">
                  <Label className="text-gray-500">علامة مميزة</Label>
                  <p className="text-sm text-gray-600">{orderData.landmark}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Products */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Package className="text-primary" size={24} />
              المنتجات
            </h2>
            <div className="space-y-4">
              {orderData.products.map((product) => (
                <div key={product.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{product.name}</h3>
                    <p className="text-sm text-gray-500">الكمية: {product.quantity}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg text-primary">{product.price} جنيه</p>
                    <p className="text-xs text-gray-500">للقطعة</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">المجموع الفرعي</span>
                <span className="font-semibold">{orderData.subtotal} جنيه</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">تكلفة الشحن</span>
                <span className="font-semibold">{orderData.shippingCost} جنيه</span>
              </div>
              {orderData.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">الخصم</span>
                  <span className="font-semibold text-red-600">-{orderData.discount} جنيه</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center text-xl">
                <span className="font-bold">الإجمالي النهائي</span>
                <span className="font-bold text-green-600">{orderData.finalTotal} جنيه</span>
              </div>
            </div>
          </Card>

          {/* Notes Tabs */}
          <Card className="p-6">
            <Tabs defaultValue="internal">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="internal">ملاحظات داخلية</TabsTrigger>
                <TabsTrigger value="customer">ملاحظات العميل</TabsTrigger>
              </TabsList>
              
              <TabsContent value="internal" className="space-y-3">
                <Label>ملاحظات داخلية</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={!isEditing}
                  className="rounded-xl min-h-[100px]"
                  placeholder="أضف ملاحظات داخلية..."
                />
              </TabsContent>
              
              <TabsContent value="customer" className="space-y-3">
                <Label>ملاحظات العميل</Label>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-xl">
                  <p className="text-sm">{orderData.customerNotes || "لا توجد ملاحظات من العميل"}</p>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Column - Status & Timeline */}
        <div className="space-y-6">
          {/* Order Status */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">حالة الطلب</h2>
            
            {isEditing ? (
              <Select value={orderStatus} onValueChange={setOrderStatus}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className={cn("p-4 rounded-xl text-center", statusConfig[orderStatus].color)}>
                <p className="text-2xl font-bold">{statusConfig[orderStatus].label}</p>
              </div>
            )}

            <Separator className="my-4" />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">تاريخ الإنشاء</span>
                <span className="text-sm font-semibold">
                  {new Date(orderData.created_at).toLocaleDateString("ar-EG")}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">آخر تحديث</span>
                <span className="text-sm font-semibold">
                  {new Date(orderData.updated_at).toLocaleDateString("ar-EG")}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">التسليم المتوقع</span>
                <span className="text-sm font-semibold text-primary">
                  {new Date(orderData.expectedDelivery).toLocaleDateString("ar-EG")}
                </span>
              </div>
            </div>
          </Card>

          {/* Payment Info */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <DollarSign className="text-green-600" size={24} />
              معلومات الدفع
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">طريقة الدفع</span>
                <Badge variant="outline">
                  {orderData.paymentMethod === "cod" ? "عند الاستلام" : "أونلاين"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">حالة الدفع</span>
                <Badge className="bg-orange-100 text-orange-700">
                  {orderData.paymentStatus === "partial" ? "جزئي" : "كامل"}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">العربون</span>
                <span className="font-semibold text-green-600">{orderData.deposit} جنيه</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">المتبقي</span>
                <span className="font-semibold text-orange-600">{orderData.remaining} جنيه</span>
              </div>
            </div>
          </Card>

          {/* Shipping Info */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Truck className="text-purple-600" size={24} />
              معلومات الشحن
            </h2>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-gray-500">شركة الشحن</Label>
                <p className="font-semibold">{orderData.shippingCompany}</p>
              </div>
              
              <div className="space-y-1">
                <Label className="text-gray-500">كود التتبع</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-gray-100 dark:bg-slate-800 rounded-lg text-sm font-mono">
                    {orderData.trackingCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(orderData.trackingCode)}
                    className="h-9 w-9"
                  >
                    <Copy size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="text-primary" size={24} />
              سجل الأحداث
            </h2>
            
            <div className="space-y-4">
              {orderData.timeline.map((event, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex gap-3"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    {idx < orderData.timeline.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 dark:bg-slate-700 mt-1" />
                    )}
                  </div>
                  
                  <div className="flex-1 pb-4">
                    <p className="font-semibold text-sm">{event.note}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(event.date).toLocaleString("ar-EG")}
                    </p>
                    <p className="text-xs text-gray-400">بواسطة: {event.user}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <RetrySettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}