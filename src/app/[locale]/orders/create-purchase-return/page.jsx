"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Package,
  Phone,
  MapPin,
  User,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Plus,
  X,
  Save,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";

import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Mock order data
const getOrderData = (id) => ({
  id,
  orderNumber: "SRP56",
  customerName: "وحيد ذهب",
  phoneNumber: "01003337665",
  alternatePhone: "",
  city: "المعادي - القاهرة",
  address: "شارع ٩",
  governorate: "القاهرة",
  area: "المعادي",
  status: "new",
  type: "مدفوع",
  products: [
    {
      id: 1,
      name: "وحيد ذهب",
      quantity: 4,
      unitPrice: 20,
      subtotal: 80,
      image: null,
    },
    {
      id: 2,
      name: "وحيد ذهب",
      quantity: 4,
      unitPrice: 20,
      subtotal: 80,
      image: null,
    },
    {
      id: 3,
      name: "وحيد ذهب",
      quantity: 4,
      unitPrice: 20,
      subtotal: 80,
      image: null,
    },
  ],
  subtotal: 300,
  deliveryFee: 50,
  discount: 50,
  finalTotal: 300,
  notes: "",
  createdAt: new Date(),
});

export default function OrderConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id || "1";
  
  const [order] = useState(getOrderData(orderId));
  const [deliveryMethod, setDeliveryMethod] = useState("office");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [shippingCompany, setShippingCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [attachedImages, setAttachedImages] = useState([]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachedImages([...attachedImages, ...files]);
  };

  const handleRemoveImage = (index) => {
    setAttachedImages(attachedImages.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    toast.success("تم تأكيد الطلب بنجاح");
    router.push("/orders/employee-orders");
  };

  const handleCancel = () => {
    toast.error("تم إلغاء الطلب");
    router.push("/orders/employee-orders");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-950 dark:via-blue-950/30 dark:to-indigo-950/30">
      <div className="container mx-auto p-4 md:p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4 transition-colors"
          >
            <ChevronLeft size={16} />
            العودة للطلبات
          </button>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent mb-2">
                رقم الطلب {order.orderNumber}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 text-sm px-3 py-1">
                  {order.type}
                </Badge>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {order.createdAt.toLocaleDateString("ar-EG")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <User className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">بيانات العميل</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">معلومات العميل والتواصل</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-600 dark:text-gray-400">اسم العميل / رقم الطلب</Label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <User size={16} className="text-gray-400" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {order.customerName}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-600 dark:text-gray-400">رقم الهاتف</Label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Phone size={16} className="text-gray-400" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100" dir="ltr">
                      {order.phoneNumber}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-gray-600 dark:text-gray-400">العنوان</Label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <MapPin size={16} className="text-gray-400" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {order.city} - {order.address}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Products */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                  <Package className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">المنتجات المطلوبة</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">قائمة المنتجات في الطلب</p>
                </div>
              </div>

              <div className="space-y-3">
                {order.products.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
                  >
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center flex-shrink-0">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package size={24} className="text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>الكمية: {product.quantity}</span>
                        <span>•</span>
                        <span>سعر الوحدة: {product.unitPrice} ج.م</span>
                      </div>
                    </div>

                    <div className="text-left">
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {product.subtotal} ج.م
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/*
							
						*/}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Clock className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">إعدادات التوصيل والدفع</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">اختر طريقة التوصيل والدفع</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Delivery Method */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">طريقة التوصيل</Label>
                  <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                    <div className="flex items-center space-x-2 space-x-reverse p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
                      <RadioGroupItem value="office" id="office" />
                      <Label htmlFor="office" className="flex-1 cursor-pointer">تسليم في المكتب</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
                      <RadioGroupItem value="shipping" id="shipping" />
                      <Label htmlFor="shipping" className="flex-1 cursor-pointer">شحن عن طريق الشيبنق</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Shipping Company - if shipping selected */}
                {deliveryMethod === "shipping" && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">شركة الشحن</Label>
                    <Select value={shippingCompany} onValueChange={setShippingCompany}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="اختر شركة الشحن" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fedex">FedEx</SelectItem>
                        <SelectItem value="aramex">Aramex</SelectItem>
                        <SelectItem value="dhl">DHL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator />

                {/* Payment Method */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">طريقة الدفع</Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-2 space-x-reverse p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex-1 cursor-pointer">عن طريق الفيزا</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="flex-1 cursor-pointer">كاش في الديلفري</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </Card>

            {/* Notes & Attachments */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <FileText className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">ملاحظات ومرفقات</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">إضافة ملاحظات أو صور</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="أضف ملاحظاتك هنا..."
                    className="rounded-xl min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>إرفاق صور</Label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <ImageIcon size={32} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        اضغط لإضافة صور
                      </p>
                    </label>
                  </div>

                  {attachedImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-4">
                      {attachedImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg bg-gray-200 dark:bg-gray-700" />
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} className="text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar - Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Order Summary */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <DollarSign className="text-white" size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">ملخص الطلب</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">المجموع الفرعي</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{order.subtotal} ج.م</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">رسوم التوصيل</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{order.deliveryFee} ج.م</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">الخصم</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">-{order.discount} ج.م</span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">المجموع النهائي</span>
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {order.finalTotal} ج.م
                    </span>
                  </div>
                </div>
              </Card>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={handleConfirm}
                  className="w-full rounded-xl h-12 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold"
                >
                  <CheckCircle size={20} className="mr-2" />
                  تأكيد الطلب
                </Button>

                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="w-full rounded-xl h-12 border-2 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold"
                >
                  <XCircle size={20} className="mr-2" />
                  إلغاء الطلب
                </Button>
              </div>

              {/* Quick Info */}
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900">
                <div className="flex items-start gap-2">
                  <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-900 dark:text-blue-100">
                    <p className="font-semibold mb-1">نصيحة سريعة</p>
                    <p>تأكد من مراجعة جميع البيانات قبل تأكيد الطلب</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}