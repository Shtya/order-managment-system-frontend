"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Package,
  Phone,
  MapPin,
  User,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Plus,
  X,
  Edit,
  Trash2,
  Eye,
  Copy,
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

// Mock order data
const getOrderData = (id) => ({
  id,
  orderNumber: "ORD-12345",
  customerName: "أحمد محمد",
  phoneNumber: "01012345678",
  alternatePhone: "01098765432",
  governorate: "القاهرة",
  city: "مدينة نصر",
  address: "شارع مصطفى النحاس، برج 5",
  status: "new",
  products: [
    {
      id: 1,
      name: "خاتم فضة",
      quantity: 4,
      unitPrice: 20,
      subtotal: 80,
      image: "🔐",
    },
    {
      id: 2,
      name: "وحيد ذهب",
      quantity: 4,
      unitPrice: 20,
      subtotal: 80,
      image: "📿",
    },
    {
      id: 3,
      name: "وحيد ذهب",
      quantity: 4,
      unitPrice: 20,
      subtotal: 80,
      image: "👤",
    },
  ],
  additionalProducts: [
    {
      id: 4,
      name: "وحيد ذهب",
      quantity: 4,
      unitPrice: 20,
      subtotal: 80,
      image: "🔐",
    },
    {
      id: 5,
      name: "وحيد ذهب",
      quantity: 4,
      unitPrice: 20,
      subtotal: 80,
      image: "🎯",
    },
  ],
  similarProducts: [
    { id: 1, name: "خاتم فضة", price: 2000, image: null },
    { id: 2, name: "خاتم فضة", price: 2000, image: null },
  ],
  subtotal: 3000,
  deliveryFee: 500,
  discount: 500,
  discountOnDelivery: 500,
  extraDiscount: 500,
  taxesAndFees: 500,
  finalTotal: 500,
  totalBeforeDiscount: 500,
  notes: "",
  callCenterNotes: "",
  deliveryNotes: "",
  createdAt: new Date(),
});

// Stats Card Component
function StatsCard({ title, value, icon: Icon, color }) {
  return (
    <Card className="p-4 text-center hover:shadow-md transition-shadow">
      <div className={cn("w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center", color)}>
        <Icon size={20} className="text-white" />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </Card>
  );
}

// Product Table Row
function ProductRow({ product, onEdit, onDelete, showActions = true }) {
  return (
    <tr className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl">
            {product.image || "📦"}
          </div>
          <span className="font-medium text-gray-900 dark:text-gray-100">{product.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <Badge variant="outline" className="font-medium">{product.quantity} ع.م</Badge>
      </td>
      <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
        {product.unitPrice} ج.م
      </td>
      <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
        مجانا
      </td>
      <td className="px-4 py-3 text-center font-bold text-gray-900 dark:text-gray-100">
        {product.subtotal} ج.م
      </td>
      {showActions && (
        <td className="px-4 py-3">
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={() => onDelete(product.id)}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </td>
      )}
    </tr>
  );
}

export default function OrderConfirmationPageCallCenter() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id || "1";
  
  const [order] = useState(getOrderData(orderId));
  const [notes, setNotes] = useState("");
  const [callCenterNotes, setCallCenterNotes] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  const handleConfirm = () => {
    toast.success("تم تأكيد الطلب بنجاح");
    router.push("/employee-orders");
  };

  const handleCancel = () => {
    toast.error("تم إلغاء الطلب");
    router.push("/employee-orders");
  };

  const handleAddToShipping = () => {
    toast.success("تم إضافة الطلب للشحن بنجاح");
  };

  const handleSaveOrder = () => {
    toast.success("تم حفظ الطلب");
  };

  const stats = [
    { title: "خدمة", value: "3000", icon: Package, color: "bg-blue-500" },
    { title: "تجربة المنتجات", value: "500", icon: Package, color: "bg-green-500" },
    { title: "مصنعين", value: "500", icon: Package, color: "bg-purple-500" },
    { title: "قريب من شريحة الحديد", value: "500", icon: Package, color: "bg-orange-500" },
    { title: "عملى", value: "500", icon: Package, color: "bg-pink-500" },
    { title: "تطبع الطلبات على من شريحة الحديد", value: "500", icon: Package, color: "bg-indigo-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto p-4 md:p-6 max-w-[1400px]">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="rounded-lg"
              >
                <ChevronLeft size={20} />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  تأكيد الطلب
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  رقم الطلب: {order.orderNumber}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 px-3 py-1">
                جديد
              </Badge>
              <Button variant="outline" size="sm" className="rounded-lg">
                <Eye size={16} className="mr-2" />
                عرض التفاصيل
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {stats.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Products & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Products */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Package size={20} />
                  المنتجات الأساسية
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                        صورة المنتج
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                        عدد التكرار
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                        سعر الوحدة
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                        تكلفة الشحن
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                        إجمالي السعر
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                        خيارات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.products.map((product) => (
                      <ProductRow
                        key={product.id}
                        product={product}
                        onDelete={(id) => console.log("Delete", id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Additional Products */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4 flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Package size={20} />
                  المنتجات الإضافية
                </h2>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  <Plus size={16} className="mr-2" />
                  إضافة منتج
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                        صورة المنتج
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                        عدد التكرار
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                        سعر الوحدة
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                        تكلفة الشحن
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                        إجمالي السعر
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                        خيارات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.additionalProducts.map((product) => (
                      <ProductRow
                        key={product.id}
                        product={product}
                        onDelete={(id) => console.log("Delete", id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Similar Products */}
            <Card>
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4">
                <h2 className="text-lg font-bold">منتجات من نفس الفئة</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {order.similarProducts.map((product) => (
                    <div
                      key={product.id}
                      className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                        <Package size={40} className="text-gray-400" />
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {product.name}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {product.price} ج.م
                        </span>
                        <Button size="sm" variant="outline" className="rounded-lg">
                          <Plus size={14} className="mr-1" />
                          إضافة
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Notes Section */}
            <Card>
              <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white p-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FileText size={20} />
                  ملاحظات
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <Label className="mb-2">آخر الملاحظات</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="أضف ملاحظات..."
                    className="rounded-xl min-h-[80px]"
                  />
                </div>

                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <Eye size={16} />
                  <button className="underline hover:no-underline">
                    عرض آخر 10 ملاحظات من الكول سنتر
                  </button>
                </div>

                <div>
                  <Label className="mb-2">ملاحظات الكول سنتر</Label>
                  <Textarea
                    value={callCenterNotes}
                    onChange={(e) => setCallCenterNotes(e.target.value)}
                    placeholder="ملاحظات خاصة بالكول سنتر..."
                    className="rounded-xl min-h-[80px]"
                  />
                </div>

                <div>
                  <Label className="mb-2">ملاحظات الديليفري</Label>
                  <Textarea
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="ملاحظات خاصة بالديليفري..."
                    className="rounded-xl min-h-[80px]"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Customer Info & Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Customer Information */}
            <Card>
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <User size={20} />
                  بيانات العميل
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <Label className="text-gray-600 dark:text-gray-400 mb-2">اسم العميل</Label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <User size={16} className="text-gray-400" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {order.customerName}
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-600 dark:text-gray-400 mb-2">رقم الهاتف</Label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Phone size={16} className="text-gray-400" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100" dir="ltr">
                      {order.phoneNumber}
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-600 dark:text-gray-400 mb-2">رقم بديل</Label>
                  <Input
                    value={order.alternatePhone}
                    className="rounded-lg"
                    placeholder="رقم بديل"
                  />
                </div>

                <div>
                  <Label className="text-gray-600 dark:text-gray-400 mb-2">المحافظة</Label>
                  <Select defaultValue={order.governorate}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="القاهرة">القاهرة</SelectItem>
                      <SelectItem value="الجيزة">الجيزة</SelectItem>
                      <SelectItem value="الإسكندرية">الإسكندرية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-600 dark:text-gray-400 mb-2">المدينة</Label>
                  <Input
                    value={order.city}
                    className="rounded-lg"
                    placeholder="المدينة"
                  />
                </div>

                <div>
                  <Label className="text-gray-600 dark:text-gray-400 mb-2">العنوان والوصف</Label>
                  <Textarea
                    value={order.address}
                    className="rounded-lg min-h-[80px]"
                    placeholder="العنوان التفصيلي..."
                  />
                </div>
              </div>
            </Card>

            {/* Order Summary */}
            <Card>
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <DollarSign size={20} />
                  الاجمالى المالى
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">المجموع الفرعى</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {order.subtotal} ج.م
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">سعر الشحن الافتراضى</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {order.deliveryFee} ج.م
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">خصم من المجموع</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    -{order.discount} ج.م
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">خصم على الشحن</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    -{order.discountOnDelivery} ج.م
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">خصم اضافى</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    -{order.extraDiscount} ج.م
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">ضرائب ورسوم</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {order.taxesAndFees} ج.م
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 dark:text-gray-100">المجموع قبل التخفيض</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {order.totalBeforeDiscount} ج.م
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg">
                  <span className="font-bold text-green-900 dark:text-green-100">المجموع النهائى</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {order.finalTotal} ج.م
                  </span>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleConfirm}
                className="w-full rounded-xl h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold"
              >
                <CheckCircle size={20} className="mr-2" />
                تأكيد الطلب
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleSaveOrder}
                  variant="outline"
                  className="rounded-xl h-11 border-2 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-semibold"
                >
                  حفظ الطلب
                </Button>

                <Button
                  onClick={() => toast.info("نسخ المعلومات")}
                  variant="outline"
                  className="rounded-xl h-11 border-2 border-purple-200 dark:border-purple-900 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 font-semibold"
                >
                  <Copy size={16} className="mr-2" />
                  نسخ
                </Button>
              </div>

              <Button
                onClick={handleAddToShipping}
                variant="outline"
                className="w-full rounded-xl h-11 border-2 border-orange-200 dark:border-orange-900 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 font-semibold"
              >
                إرجاع كطلب
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleAddToShipping}
                  variant="outline"
                  className="rounded-xl h-11 border-2 border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 font-semibold"
                >
                  تأجيل
                </Button>

                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="rounded-xl h-11 border-2 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold"
                >
                  إلغاء
                </Button>
              </div>

              <Button
                onClick={() => toast.info("خروج بدون حفظ")}
                variant="ghost"
                className="w-full rounded-xl h-11 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                خروج بدون حفظ
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}