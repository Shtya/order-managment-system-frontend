"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Eye,

  Trash2,

  MapPin,
  Phone,

  AlertCircle,

  Copy,

  Plus,
  Upload,
  Settings,

  Save,
  Edit2,
  Loader2,
  X,

  AlertTriangle,
  Truck,
  Package,
  Info,
  Building2,
  Calendar,
  Clock,
  MessageCircle,
  PhoneCall,
  LucideMessageCircle,
  GitMerge,
  Printer,
  ScanBarcode,
  ScanLine,
  Send,
  ClipboardList,
  Undo2,
  CheckCircle2,
  History,
  ArrowRight,
} from "lucide-react";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import toast from "react-hot-toast";

import Button_ from "@/components/atoms/Button";

import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
} from "@/components/ui/dialog";
import api, { BASE_URL } from "@/utils/api";
import UserSelect from "@/components/atoms/UserSelect";
import Flatpickr from "react-flatpickr";

import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { generateBgColors, getIconForStatus } from "../page";
import DistributionModal from "../atoms/DistrubtionModal";
import BulkUploadModal from "../atoms/BulkUploadModal";
import Table, { FilterField } from "@/components/atoms/Table";
import PageHeader from "@/components/atoms/Pageheader";
import SettingsModal from "../atoms/SettingsModal";
import ActionButtons from "@/components/atoms/Actions";
import StoreFilter from "@/components/atoms/StoreFilter";
import ShippingCompanyFilter from "@/components/atoms/ShippingCompanyFilter";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import { useClipboard } from "@/hook/useClipboard";
import { useAuth } from "@/context/AuthContext";
import { useExport } from "@/hook/useExport";

import AdminFilter from "@/components/atoms/AdminFilter";
import { Switch } from "@/components/ui/switch";
import {
  calcShippingDaysElapsed,
  getShippingDaysBadgeStyles,
  getShippingDaysRangeStatus,
} from "@/utils/order-utils";

//order status flow
// New => Confirmed => Distrebuted (Assed to shipment company) =>  Printed (Waybills printed) =>  preparing (scanign its items for preparation)
// =>  Ready (completly scaned) => packed (scaned again for outgoing and packed) => shipped (The relaetd manifast printed and order not gived to Delivary boy) => 
// Delivered or failed deliver (for faield can be reassign to shipping compnay (Distrebuted) )

// ✅ Order Status Constants (Mirroring your Enum)
//
export const OrderStatus = {
  NEW: "new",
  UNDER_REVIEW: "under_review",
  // ✅ حالات مرحلة التأكيد الجديدة
  CONFIRMED: "confirmed", // مؤكد
  DISTRIBUTED: "distributed",
  POSTPONED: "postponed", // مؤجل

  NO_ANSWER: "no_answer", // لا يوجد رد
  WRONG_NUMBER: "wrong_number", // الرقم غلط
  OUT_OF_DELIVERY_AREA: "out_of_area", // خارج نطاق التوصيل
  DUPLICATE: "duplicate", // طلب مكرر

  PREPARING: "preparing",
  PRINTED: "printed",
  READY: "ready",
  PACKED: "packed",
  REJECTED: "rejected",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  FAILED_DELIVERY: "failed_delivery",
  CANCELLED: "cancelled",
  RETURN_PREPARING: "return_preparing",
  RETURNED: "returned",
};

// // Helper function to generate random order number like ORD77QURTE
// const generateOrderNumber = () => {
//   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
//   let suffix = '';
//   for (let i = 0; i < 7; i++) {
//     suffix += chars.charAt(Math.floor(Math.random() * chars.length));
//   }
//   return `ORD${suffix}`;
// };

// // Mock Egyptian Orders for Demo
// const mockOrders = [
//   {
//     id: "1",
//     customerName: "Ahmed Mohamed",
//     orderNumber: generateOrderNumber(),
//     duplicateCount: 0,
//     originalOrderNumber: null,
//     city: "Cairo",
//     address: "123 Street Name, Nasr City, Cairo",
//     finalTotal: 350,
//     shippingCost: 30,
//     phoneNumber: "01012345678",
//     status: {
//       id: "6aa5ba0a-61b5-4a4f-87fb-c7fea5bac389",
//       code: OrderStatus.NEW,
//       system: true,
//       name: "New",
//       color: "#2196F3",
//     },
//     postponedDate: null,
//     shippedAt: null,
//     cityDetails: {
//       tenantConfigs: [{ minShippingDays: 2, maxShippingDays: 4 }],
//     },
//     items: [
//       {
//         variant: {
//           product: { name: "T-Shirt" },
//           sku: "TS-001",
//         },
//         quantity: 2,
//       },
//     ],
//   },
//   {
//     id: "2",
//     customerName: "Fatma Ali",
//     orderNumber: generateOrderNumber(),
//     duplicateCount: 0,
//     originalOrderNumber: generateOrderNumber(),
//     city: "Alexandria",
//     address: "456 Corniche Road, Alexandria",
//     finalTotal: 500,
//     shippingCost: 45,
//     phoneNumber: "01298765439",
//     status: {
//       id: "d6f944e4-103d-48c6-afeb-1a9448bc62c3",
//       code: OrderStatus.CONFIRMED,
//       system: true,
//       name: "Confirmed",
//       color: "#4CAF50",
//     },
//     postponedDate: null,
//     shippedAt: null,
//     cityDetails: {
//       tenantConfigs: [{ minShippingDays: 3, maxShippingDays: 5 }],
//     },
//     items: [
//       {
//         variant: {
//           product: { name: "Jeans" },
//           sku: "JN-0022",
//         },
//         quantity: 1,
//       },
//       {
//         variant: {
//           product: { name: "Belt" },
//           sku: "BL-003",
//         },
//         quantity: 1,
//       },
//     ],
//   },
//   {
//     id: "3",
//     customerName: "Omar Hassan",
//     orderNumber: generateOrderNumber(),
//     duplicateCount: 0,
//     originalOrderNumber: null,
//     city: "Giza",
//     address: "789 Pyramids Road, Giza",
//     finalTotal: 280,
//     shippingCost: 25,
//     phoneNumber: "01145678901",
//     status: {
//       id: "17f3407e-dc2f-4ec1-94ea-1e43b7353f5f",
//       code: OrderStatus.PREPARING,
//       system: true,
//       name: "Preparing",
//       color: "#9C27B0",
//     },
//     postponedDate: null,
//     shippedAt: null,
//     cityDetails: {
//       tenantConfigs: [{ minShippingDays: 1, maxShippingDays: 3 }],
//     },
//     items: [
//       {
//         variant: {
//           product: { name: "Shoes" },
//           sku: "SH-004",
//         },
//         quantity: 1,
//       },
//     ],
//   },
//   {
//     id: "4",
//     customerName: "Sara Kamal",
//     orderNumber: generateOrderNumber(),
//     duplicateCount: 0,
//     originalOrderNumber: null,
//     city: "Luxor",
//     address: "321 Karnak Street, Luxor",
//     finalTotal: 800,
//     shippingCost: 60,
//     phoneNumber: "01055556666",
//     status: {
//       id: "30a29f2e-8d28-4f4a-b521-1139004d929d",
//       code: OrderStatus.SHIPPED,
//       system: true,
//       name: "Shipped",
//       color: "#03A9F4",
//     },
//     postponedDate: null,
//     shippedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
//     cityDetails: {
//       tenantConfigs: [{ minShippingDays: 4, maxShippingDays: 6 }],
//     },
//     shipments: [
//       { id: "1", status: "in_transit" },
//     ],
//     items: [
//       {
//         variant: {
//           product: { name: "Dress" },
//           sku: "DR-005",
//         },
//         quantity: 1,
//       },
//     ],
//   },
//   {
//     id: "5",
//     customerName: "Mohamed Ahmed",
//     orderNumber: generateOrderNumber(),
//     duplicateCount: 0,
//     originalOrderNumber: null,
//     city: "Cairo",
//     address: "654 Heliopolis Square, Cairo",
//     finalTotal: 420,
//     shippingCost: 35,
//     phoneNumber: "01233334444",
//     status: {
//       id: "4c4c203b-c304-4ae2-b22d-9ee108fe2ced",
//       code: OrderStatus.DELIVERED,
//       system: true,
//       name: "Delivered",
//       color: "#4CAF50",
//     },
//     postponedDate: null,
//     shippedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
//     cityDetails: {
//       tenantConfigs: [{ minShippingDays: 2, maxShippingDays: 4 }],
//     },
//     shipments: [
//       { id: "2", status: "delivered" },
//     ],
//     items: [
//       {
//         variant: {
//           product: { name: "Watch" },
//           sku: "WT-006",
//         },
//         quantity: 1,
//       },
//     ],
//   },
//   {
//     id: "6",
//     customerName: "Hala Hussein",
//     orderNumber: generateOrderNumber(),
//     duplicateCount: 0,
//     originalOrderNumber: null,
//     city: "Port Said",
//     address: "987 Port Fuad Street, Port Said",
//     finalTotal: 300,
//     shippingCost: 40,
//     phoneNumber: "01177778888",
//     status: {
//       id: "d8c6a65d-6682-495d-8658-a4f4a14dee03",
//       code: OrderStatus.FAILED_DELIVERY,
//       system: true,
//       name: "Failed Delivery",
//       color: "#E91E63",
//     },
//     postponedDate: null,
//     shippedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
//     cityDetails: {
//       tenantConfigs: [{ minShippingDays: 3, maxShippingDays: 5 }],
//     },
//     shipments: [
//       { id: "3", status: "failed" },
//     ],
//     items: [
//       {
//         variant: {
//           product: { name: "Bag" },
//           sku: "BG-007",
//         },
//         quantity: 1,
//       },
//     ],
//   },
//   {
//     id: "7",
//     customerName: "Youssef Ibrahim",
//     orderNumber: generateOrderNumber(),
//     duplicateCount: 0,
//     originalOrderNumber: null,
//     city: "Ismailia",
//     address: "147 Taha Hussein Street, Ismailia",
//     finalTotal: 550,
//     shippingCost: 50,
//     phoneNumber: "01099990000",
//     status: {
//       id: "1900816e-59b6-408c-a1ec-41525af685f3",
//       code: OrderStatus.POSTPONED,
//       system: true,
//       name: "PostPoned",
//       color: "#00BCD4",
//     },
//     postponedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
//     shippedAt: null,
//     cityDetails: {
//       tenantConfigs: [{ minShippingDays: 2, maxShippingDays: 4 }],
//     },
//     items: [
//       {
//         variant: {
//           product: { name: "Hat" },
//           sku: "HT-008",
//         },
//         quantity: 2,
//       },
//     ],
//   },
//   {
//     id: "8",
//     customerName: "Nour El-Din",
//     orderNumber: generateOrderNumber(),
//     duplicateCount: 0,
//     originalOrderNumber: generateOrderNumber(),
//     city: "Mansoura",
//     address: "258 Mansoura University Street, Mansoura",
//     finalTotal: 650,
//     shippingCost: 45,
//     phoneNumber: "01211112222",
//     status: {
//       id: "35e718ea-54d5-40f0-bf93-10ffb87b8461",
//       code: OrderStatus.PRINTED,
//       system: true,
//       name: "Printed",
//       color: "#3F51B5",
//     },
//     postponedDate: null,
//     shippedAt: null,
//     cityDetails: {
//       tenantConfigs: [{ minShippingDays: 2, maxShippingDays: 4 }],
//     },
//     items: [
//       {
//         variant: {
//           product: { name: "Jacket" },
//           sku: "JK-009",
//         },
//         quantity: 1,
//       },
//     ],
//   },
//   {
//     id: "9",
//     customerName: "Lina Samir",
//     orderNumber: generateOrderNumber(),
//     duplicateCount: 0,
//     originalOrderNumber: null,
//     city: "Cairo",
//     address: "369 Downtown Cairo",
//     finalTotal: 200,
//     shippingCost: 25,
//     phoneNumber: "01133334444",
//     status: {
//       id: "ed668cd2-5fc1-4002-abf6-9c84da52ffb7",
//       code: OrderStatus.CANCELLED,
//       system: true,
//       name: "Cancelled",
//       color: "#F44336",
//     },
//     postponedDate: null,
//     shippedAt: null,
//     cityDetails: {
//       tenantConfigs: [{ minShippingDays: 2, maxShippingDays: 4 }],
//     },
//     items: [
//       {
//         variant: {
//           product: { name: "Socks" },
//           sku: "SK-010",
//         },
//         quantity: 3,
//       },
//     ],
//   },
//   {
//     id: "10",
//     customerName: "Karim Mostafa",
//     orderNumber: generateOrderNumber(),
//     duplicateCount: 0,
//     originalOrderNumber: null,
//     city: "Suez",
//     address: "741 Suez Canal Street, Suez",
//     finalTotal: 480,
//     shippingCost: 40,
//     phoneNumber: "01066667777",
//     status: {
//       id: "9fc00157-582e-46d3-a276-fec76f7f6359",
//       code: OrderStatus.READY,
//       system: true,
//       name: "Ready",
//       color: "#009688",
//     },
//     postponedDate: null,
//     shippedAt: null,
//     cityDetails: {
//       tenantConfigs: [{ minShippingDays: 2, maxShippingDays: 4 }],
//     },
//     items: [
//       {
//         variant: {
//           product: { name: "Sunglasses" },
//           sku: "SG-011",
//         },
//         quantity: 1,
//       },
//     ],
//   },
//   /*{
//     id: "11",
//     customerName: "Mona Farid",
//     orderNumber: generateOrderNumber(),
//     duplicateCount: 0,
//     originalOrderNumber: null,
//     city: "Tanta",
//     address: "852 Tanta Center, Tanta",
//     finalTotal: 700,
//     shippingCost: 55,
//     phoneNumber: "01288889999",
//     status: {
//       id: "6e38513d-0af6-44a3-9973-f2cf9e322835",
//       code: OrderStatus.PACKED,
//       system: true,
//       name: "Packed",
//       color: "#795548",
//     },
//     postponedDate: null,
//     shippedAt: null,
//     cityDetails: {
//       tenantConfigs: [{ minShippingDays: 3, maxShippingDays: 5 }],
//     },
//     items: [
//       {
//         variant: {
//           product: { name: "Perfume" },
//           sku: "PF-012",
//         },
//         quantity: 1,
//       },
//       {
//         variant: {
//           product: { name: "Body Lotion" },
//           sku: "BL-013",
//         },
//         quantity: 2,
//       },
//     ],
//   },
//   {
//     id: "12",
//     customerName: "Ali Nasser",
//     orderNumber: generateOrderNumber(),
//     duplicateCount: 0,
//     originalOrderNumber: null,
//     city: "Cairo",
//     address: "963 Maadi, Cairo",
//     finalTotal: 320,
//     shippingCost: 30,
//     phoneNumber: "01112345678",
//     status: {
//       id: "57c48914-fc18-4ad5-8d29-789b73afc52b",
//       code: OrderStatus.RETURN_PREPARING,
//       system: true,
//       name: "Return Preparing",
//       color: "#FF9800",
//     },
//     postponedDate: null,
//     shippedAt: null,
//     cityDetails: {
//       tenantConfigs: [{ minShippingDays: 2, maxShippingDays: 4 }],
//     },
//     items: [
//       {
//         variant: {
//           product: { name: "Shirt" },
//           sku: "ST-014",
//         },
//         quantity: 1,
//       },
//     ],
//   },
//   {
//     id: "13",
//     customerName: "Dina Zaki",
//     orderNumber: generateOrderNumber(),
//     duplicateCount: 0,
//     originalOrderNumber: null,
//     city: "Asyut",
//     address: "159 Asyut City Center, Asyut",
//     finalTotal: 450,
//     shippingCost: 45,
//     phoneNumber: "01022223333",
//     status: {
//       id: "00778a5b-31d7-4b74-8c9b-6b6c60e8f6ce",
//       code: OrderStatus.RETURNED,
//       system: true,
//       name: "Returned",
//       color: "#607D8B",
//     },
//     postponedDate: null,
//     shippedAt: null,
//     cityDetails: {
//       tenantConfigs: [{ minShippingDays: 4, maxShippingDays: 6 }],
//     },
//     items: [
//       {
//         variant: {
//           product: { name: "Wallet" },
//           sku: "WL-015",
//         },
//         quantity: 1,
//       },
//     ],
//   },
//   {
//     id: "14",
//     customerName: "Hassan Youssef",
//     orderNumber: generateOrderNumber(),
//     duplicateCount: 0,
//     originalOrderNumber: null,
//     city: "Sohag",
//     address: "753 Sohag Downtown, Sohag",
//     finalTotal: 600,
//     shippingCost: 50,
//     phoneNumber: "01244445555",
//     status: {
//       id: "8029db59-3618-4e71-8031-970a3c9a9d1c",
//       code: OrderStatus.NO_ANSWER,
//       system: true,
//       name: "No Answer",
//       color: "#FF5722",
//     },
//     postponedDate: null,
//     shippedAt: null,
//     cityDetails: {
//       tenantConfigs: [{ minShippingDays: 3, maxShippingDays: 5 }],
//     },
//     items: [
//       {
//         variant: {
//           product: { name: "Belt" },
//           sku: "BL-016",
//         },
//         quantity: 1,
//       },
//     ],
//   },
//   {
//     id: "15",
//     customerName: "Yara Adel",
//     orderNumber: generateOrderNumber(),
//     duplicateCount: 0,
//     originalOrderNumber: null,
//     city: "Cairo",
//     address: "852 New Cairo, Cairo",
//     finalTotal: 380,
//     shippingCost: 35,
//     phoneNumber: "01166667777",
//     status: {
//       id: "711db153-884d-44b9-acce-0a6e84ab86cf",
//       code: OrderStatus.WRONG_NUMBER,
//       system: true,
//       name: "Wrong Number",
//       color: "#795548",
//     },
//     postponedDate: null,
//     shippedAt: null,
//     cityDetails: {
//       tenantConfigs: [{ minShippingDays: 2, maxShippingDays: 4 }],
//     },
//     items: [
//       {
//         variant: {
//           product: { name: "Scarf" },
//           sku: "SF-017",
//         },
//         quantity: 2,
//       },
//     ],
//   },
//   {
//     id: "16",
//     customerName: "Omar Khaled",
//     orderNumber: generateOrderNumber(),
//     duplicateCount: 0,
//     originalOrderNumber: null,
//     city: "Hurghada",
//     address: "951 Hurghada Resort, Hurghada",
//     finalTotal: 900,
//     shippingCost: 65,
//     phoneNumber: "01088889999",
//     status: {
//       id: "eb0c612c-9ea2-443d-bde2-f3e5bb944012",
//       code: OrderStatus.OUT_OF_DELIVERY_AREA,
//       system: true,
//       name: "Out of Delivery Area",
//       color: "#673AB7",
//     },
//     postponedDate: null,
//     shippedAt: null,
//     cityDetails: {
//       tenantConfigs: [{ minShippingDays: 5, maxShippingDays: 7 }],
//     },
//     items: [
//       {
//         variant: {
//           product: { name: "Swimsuit" },
//           sku: "SW-018",
//         },
//         quantity: 1,
//       },
//       {
//         variant: {
//           product: { name: "Towel" },
//           sku: "TW-019",
//         },
//         quantity: 2,
//       },
//     ],
//   },*/
// ];




// Main Orders Page Component
export default function OrdersTab({
  stats = [], fetchStats, statsLoading,
  readOnlyStatus = false,
  restrictedStatuses = [],
  restrictedSelectStatuses = [],
  showTopActions = true, showBulkUpload = true, showCustom = true,
  label = "",
  adminId,
  setAdminId
}) {

  const t = useTranslations("orders");
  const { formatCurrency } = usePlatformSettings();
  const { user, isSuperAdmin } = useAuth();
  const restrictedSet = useMemo(() => {
    return new Set(restrictedStatuses || []);
  }, [restrictedStatuses]);

  const restrictedSelectSet = useMemo(() => {
    return new Set(restrictedSelectStatuses?.length ? restrictedSelectStatuses : restrictedStatuses || []);
  }, [restrictedSelectStatuses, restrictedStatuses]);

  const filteredStats = useMemo(() => {
    if (!stats) return [];

    return stats.filter((s) => {
      // If no restrictions are passed, consider it restricted-pass (show all)
      const isRestricted = restrictedStatuses.length === 0 || restrictedSet.has(s.code);
      const isCustom = s.system === false;

      return isRestricted || (showCustom && isCustom);
    });
  }, [stats, restrictedSet, showCustom, restrictedStatuses]);

  const filteredSelectStats = useMemo(() => {
    if (!stats) return [];

    return stats.filter((s) => {
      // Use the same logic for select statuses, considering both potential restriction sources
      const hasAnyRestriction = restrictedSelectStatuses?.length > 0 || restrictedStatuses?.length > 0;
      const isRestricted = !hasAnyRestriction || restrictedSelectSet.has(s.code);
      const isCustom = s.system === false;

      return isRestricted || (showCustom && isCustom);
    });
  }, [stats, restrictedSelectSet, showCustom, restrictedSelectStatuses, restrictedStatuses]);

  const router = useRouter();
  const [retrySettingsOpen, setRetrySettingsOpen] = useState(false);
  const [statusFormOpen, setStatusFormOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingStatus, setDeletingStatus] = useState(null);

  const [deleteOrderModalOpen, setDeleteOrderModalOpen] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(null);

  const [trackShipmentModalOpen, setTrackShipmentModalOpen] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState(null);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyOrder, setHistoryOrder] = useState(null);

  const [shipmentLogsModalOpen, setShipmentLogsModalOpen] = useState(false);
  const [shipmentLogsOrder, setShipmentLogsOrder] = useState(null);
  const [shipmentLogsShipment, setShipmentLogsShipment] = useState(null);
  const [shipmentLogs, setShipmentLogs] = useState([]);
  const [shipmentLogsLoading, setShipmentLogsLoading] = useState(false);

  const [postponedOrder, setPostponedOrder] = useState(null); // { id, statusId }
  const [postponedDate, setPostponedDate] = useState(null);
  const [reminderDaysBefore, setReminderDaysBefore] = useState("");

  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    return d;
  }, []);

  const reminderOptions = useMemo(() => {
    if (!postponedDate) return [];
    const postDate = new Date(postponedDate);
    postDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = postDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return [];

    const options = [];
    for (let i = 1; i <= diffDays; i++) {
      options.push({ value: String(i), label: String(i) });
    }
    return options;
  }, [postponedDate]);

  useEffect(() => {
    if (reminderOptions.length === 1) {
      setReminderDaysBefore("0");
    } else {
      setReminderDaysBefore("");
    }
  }, [postponedDate, reminderOptions]);


  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [distributionOpen, setDistributionOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    paymentStatus: "all",
    employee: "all",
    startDate: null,
    endDate: null,
    // product: "all",
    // area: "all",
    store: "all",
    shippingCompany: "all",
  });

  const [loading, setLoading] = useState(false);

  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 12,
    records: [],
  });
  const [ordersLoading, setOrdersLoading] = useState(false);
  const searchTimer = useRef(null);
  useEffect(() => {
    fetchOrders();
  }, []);

  // ── Debounce search ──
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  // ── Fetch on search / filter change ──
  useEffect(() => {
    handlePageChange(1, pager.per_page);
  }, [debouncedSearch, adminId]);

  useEffect(() => {
    if (filters.status !== OrderStatus.POSTPONED) {
      setFilters(prev => ({
        ...prev,
        postponedStartDate: null,
        postponedEndDate: null
      }));
    }
  }, [filters.status]);

  const buildParams = (
    page = pager.current_page,
    per_page = pager.per_page,
  ) => {
    const params = {
      page,
      limit: per_page,
    };

    if (search) params.search = search;
    if (filters.status === "all" || !filters.status) {
      if (restrictedStatuses?.length) {
        params.status = restrictedStatuses.join(",");
      }
    } else {
      params.status = filters.status;
    }

    if (filters.paymentStatus && filters.paymentStatus !== "all")
      params.paymentStatus = filters.paymentStatus;
    // if (filters.paymentMethod && filters.paymentMethod !== 'all') params.paymentMethod = filters.paymentMethod;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;

    if (filters.status === OrderStatus.POSTPONED) {
      if (filters.postponedStartDate) params.postponedStartDate = filters.postponedStartDate;
      if (filters.postponedEndDate) params.postponedEndDate = filters.postponedEndDate;
    }
    if (filters.shippingCompany && filters.shippingCompany !== "all")
      params.shippingCompanyId = filters.shippingCompany;
    if (filters.store && filters.store !== "all")
      params.storeId = filters.store;
    if (filters.employee && filters.employee !== "all")
      params.userId = filters.employee;

    if (adminId && adminId !== "all") {
      params.adminId = adminId;
    }

    return params;
  };

  const fetchOrders = async (
    page = pager.current_page,
    per_page = pager.per_page,
  ) => {
    try {
      setOrdersLoading(true);
      const params = buildParams(page, per_page);
      const res = await api.get("/orders", { params });
      const data = res.data || {};
      setPager({
        total_records: data.total_records || 0,
        current_page: data.current_page || page,
        per_page: data.per_page || per_page,
        records: Array.isArray(data.records) ? data.records : [],
      });
    } catch (e) {
      console.error("Error fetching orders", e);
      toast.error(t("messages.errorFetchingOrders"));
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleDeleteStatus = (status) => {
    setDeletingStatus(status);
    setDeleteModalOpen(true);
  };

  const handleEditStatus = (status) => {
    setEditingStatus(status);
    setStatusFormOpen(true);
  };

  const handleAddStatus = () => {
    setEditingStatus(null);
    setStatusFormOpen(true);
  };

  const statsCards = useMemo(() => {
    const final = (readOnlyStatus ? filteredStats : stats) || [];
    if (!final.length) return [];

    return final
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((stat) => {
        const Icon = getIconForStatus(stat.code);
        const bgColors = generateBgColors(stat.color);

        return {
          id: stat.id,
          title: stat.system ? t(`statuses.${stat.code}`) : stat.name,
          value: String(stat.count || 0),
          icon: Icon,
          bg: `bg-[${bgColors.light}] dark:bg-[${bgColors.dark}]`,
          bgInlineLight: bgColors.light,
          bgInlineDark: bgColors.dark,
          iconColor: `text-[${stat.color}]`,
          iconColorInline: stat.color,
          iconBorder: `border-[${stat.color}]`,
          iconBorderInline: stat.color,
          code: stat.code,
          system: stat.system,
          sortOrder: stat.sortOrder,
          fullData: stat,
        };
      });
  }, [stats, readOnlyStatus, filteredStats]);

  // Create statusesMap for filters and dropdowns
  const statusesMap = useMemo(() => {
    const map = {};
    stats.forEach((stat) => {
      map[stat.code] = {
        id: stat.id,
        name: stat.name,
        color: stat.color,
        system: stat.system,
        count: stat.count,
      };
    });
    return map;
  }, [stats]);

  const handlePageChange = ({ page, per_page }) => {
    fetchOrders(page, per_page);
  };

  const applyFilters = () => {
    toast.success(t("messages.filtersApplied"));
    fetchOrders(1, pager.per_page);
  };
  const [exportLoading, setExportLoading] = useState();

  const handleExport = async () => {
    let toastId;
    try {
      setExportLoading(true);
      toastId = toast.loading(t("messages.exportStarted"));

      // Build export params (same as list but without pagination)
      const params = {};
      if (search) params.search = search;
      if (filters.status && filters.status !== "all")
        params.status = filters.status;
      if (filters.paymentStatus && filters.paymentStatus !== "all")
        params.paymentStatus = filters.paymentStatus;
      // if (filters.paymentMethod && filters.paymentMethod !== 'all') params.paymentMethod = filters.paymentMethod;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.shippingCompany && filters.shippingCompany !== "all")
        params.shippingCompanyId = filters.shippingCompany;
      if (filters.store && filters.store !== "all")
        params.storeId = filters.store;
      if (filters.employee && filters.employee !== "all")
        params.userId = filters.employee;

      const response = await api.get("/orders/export", {
        params,
        responseType: "blob", // Important for file download
      });

      // Parse filename from Content-Disposition header
      const contentDisposition = response.headers["content-disposition"];
      let filename = `orders_export_${Date.now()}.xlsx`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(
        new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      );

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success(t("messages.exportSuccess"), {
        id: toastId,
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast.dismiss();
      toast.error(error.response?.data?.message || t("messages.exportFailed"), {
        id: toastId,
      });
    } finally {
      setExportLoading(false);
    }
  };

  const [updatingStatuses, setUpdatingStatuses] = useState([]);

  const setUpdating = (id, v) => {
    setUpdatingStatuses((prev) => {
      if (v) return Array.from(new Set(prev.concat(id)));
      return prev.filter((x) => x !== id);
    });
  };

  const [updatingShipments, setUpdatingShipments] = useState([]);
  const setShipmentUpdating = (id, v) => {
    setUpdatingShipments((prev) => {
      if (v) return Array.from(new Set(prev.concat(id)));
      return prev.filter((x) => x !== id);
    });
  };

  const [unifiedShipmentStatuses, setUnifiedShipmentStatuses] = useState([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await api.get("/shipping/statuses");
        if (!cancelled) setUnifiedShipmentStatuses(r.data?.statuses ?? []);
      } catch {
        if (!cancelled) setUnifiedShipmentStatuses([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getStatusBadge = (statusCode) => {
    const status = statusesMap[statusCode];
    if (!status) {
      return "bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400";
    }

    // Generate badge colors from status color
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
    return {
      style: rgb
        ? {
          backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
          color: status.color,
        }
        : {},
      className: "rounded-xl",
    };
  };

  const columns = useMemo(() => {
    return [
      {
        key: "created_at",
        header: t("table.createdat"),
        cell: (row) => (
          <span className="text-xs text-gray-500">
            {new Date(row.created_at).toLocaleDateString("en-US")}
          </span>
        ),
      },
      {
        key: "orderNumber",
        header: t("table.orderNumber"),
        cell: (row) => (
          <span className="text-primary font-bold font-mono">
            {row.orderNumber}
          </span>
        ),
      },
      {
        key: "customerName",
        header: t("table.customerName"),
        cell: (row) => (
          <span className="text-gray-700 dark:text-slate-200 font-semibold">
            {row.customerName}
          </span>
        ),
      },
      {
        key: "products",
        header: t("table.products"),
        cell: (row) => (
          <div className="text-sm">
            {row.items.map((p, i) => (
              <div key={i} className="flex gap-2">
                <span>{p.variant.product.name}</span> -
                <span>{p.variant.sku}</span> -
                <span> (x{p.quantity})</span>
              </div>
            ))}
          </div>
        ),
      },
      {
        key: "shippingCost",
        header: t("table.finalTotal"),
        cell: (row) => (
          <span className="text-gray-600 dark:text-slate-200">
            {formatCurrency(row.finalTotal)}
          </span>
        ),
      },
      {
        key: "city",
        header: t("table.city"),
        cell: (row) => (
          <div className="flex items-center gap-1 text-sm">
            <MapPin size={12} />
            {row.city}
          </div>
        ),
      },

      {
        key: "address",
        header: t("table.address"),
        cell: (row) => (
          <span title={row.address} className="text-sm text-gray-600 dark:text-slate-300 line-clamp-1 truncate max-w-[120px]">
            {row.address}
          </span>
        ),
      },

      {
        key: "phoneNumber",
        header: t("table.phoneNumber"),
        cell: (row) => {
          const rawNumber = String(row.phoneNumber || "").trim();
          const cleanNumber = rawNumber.replace(/\D/g, "");

          return (
            <div className="flex items-center justify-between gap-3 text-sm group">

              {/* Phone */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center gap-1 transition-opacity duration-200">
                  <a
                    href={`tel:${cleanNumber}`}
                    className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-full transition-all"
                    title={t("common.call")}
                  >
                    <PhoneCall size={15} />
                  </a>

                  <a
                    href={`https://wa.me/${cleanNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-green-100 text-green-600 rounded-full transition-all"
                    title="Whatsapp"
                  >
                    <LucideMessageCircle size={15} />
                  </a>
                </div>
                <span className="truncate">{rawNumber}</span>
              </div>

            </div>
          );
        },
      },
      // Admin details (for super admin)
      ...(isSuperAdmin ? [{
        key: "admin",
        header: t("common.admin") || "Admin",
        cell: (row) => (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              {row.admin?.name || "—"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {row.admin?.email || "—"}
            </span>
          </div>
        ),
      }] : []),

      {
        key: "duplicate",
        header: t("table.duplicate") || "Duplicate",
        cell: (row) => (
          <div className="flex items-center gap-2">
            <Switch
              checked={row.duplicateCount > 0}
              disabled
              size="sm"
              activeColor="#b91c1c"
            />

            {row.duplicateCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-red-600 leading-tight">
                    {t("table.duplicate") || "Duplicate"} ({row.duplicateCount + 1})
                  </span>

                  {row.originalOrderNumber && (
                    <span className="text-[9px] text-red-500/80 font-medium leading-tight">
                      {t("table.from")}: {row.originalOrderNumber}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ),
      },
      {
        key: "shippingCost",
        header: t("table.shippingCost"),
        cell: (row) => (
          <span className="text-gray-600 dark:text-slate-200">
            {formatCurrency(row.shippingCost)}
          </span>
        ),
      },


      readOnlyStatus ? {
        key: "status",
        header: t("table.status"),
        cell: (row) => (
          <Badge className={cn("rounded-xl", getStatusBadge(row.status))}>
            {row.status.system
              ? t(`statuses.${row.status.code}`)
              : row.status.name || row.status.code}
          </Badge>
        ),
      } :
        {
          key: "confirmStatus",
          header: t("table.status"),
          cell: (row) => {
            const currentCode = row.status?.code;
            const currentStatusId = row.status?.id;

            return (
              <div className="flex items-center gap-2">
                <Select
                  value={currentStatusId ? String(currentStatusId) : undefined}
                  onValueChange={async (val) => {
                    const statusId = val;
                    if (!statusId || statusId === currentStatusId) return;

                    const newStatus = filteredSelectStats.find(s => String(s.id) === statusId);
                    if (newStatus?.code === OrderStatus.POSTPONED) {
                      setPostponedOrder({ id: row.id, statusId });
                      return;
                    }

                    const toastId = toast.loading(t("messages.statusUpdating"));
                    try {
                      setUpdating(row.id, true);
                      const res = await api.patch(`/orders/${row.id}/status`, { statusId });
                      const newOrder = res.data || {};

                      toast.success(t("messages.statusUpdated"), { id: toastId });
                      await fetchStats(true);
                      //await fetchOrders(pager.current_page, pager.per_page);
                      // remove new  order  from records if its status is confirmed

                      setPager(p => ({
                        ...p, records: p.records.map((r) => (r.id === row.id ?
                          { ...r, statusId, status: newOrder.status }
                          : r))
                      }));
                    } catch (err) {
                      console.error(err);
                      toast.error(
                        err.response?.data?.message ||
                        t("messages.errorUpdatingStatus"),
                        { id: toastId }
                      );
                    } finally {
                      setUpdating(row.id, false);
                    }
                  }}
                  disabled={
                    updatingStatuses.includes(row.id) ||
                    currentCode === OrderStatus.DELIVERED
                  }
                >
                  <SelectTrigger className="w-[150px] h-8">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {(filteredSelectStats || []).map((s) => {
                      const isSame = s.code === currentCode;

                      return (
                        <SelectItem
                          key={s.id}
                          value={String(s.id)}
                        // disabled={isSame} // 🔥 main logic
                        >
                          {s.system ? t(`statuses.${s.code}`) : s.name || s.code}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            );
          },
        },
      {
        key: "postponedDate",
        header: t("table.postponedDate"),
        cell: (row) => (
          <span className="text-gray-600 dark:text-slate-200">
            {row.postponedDate ? new Date(row.postponedDate).toLocaleDateString("en-US") : "-"}
          </span>
        ),
      },
      {
        key: "shippingCompanyStatus",
        header: t("table.shippingCompanyStatus"),
        cell: (row) => {
          const ship = row.shipments?.[0];
          if (!ship?.id) return "—"
          return (
            <div className="flex items-center gap-2">
              {ship?.rawStatus ? (
                <Badge className={cn("rounded-xl")}>
                  {ship?.rawStatus}
                </Badge>
              ) : (
                "—"
              )}
              <ActionButtons
                row={row}
                actions={[
                  {
                    icon: <History size={16} />,
                    tooltip: t("actions.viewShipmentLogs"),
                    onClick: (r) => {
                      setShipmentLogsOrder(r);
                      setShipmentLogsShipment(ship);
                      setShipmentLogsModalOpen(true);
                    },
                    variant: "secondary",
                  }
                ]}
              />
            </div>
          )
        }
      },
      {
        key: "shipment",
        header: t("table.shipmentStatus"),
        cell: (row) => {
          const ship = row.shipments?.[0];

          const currentStatus = ship?.status || "";
          const isDelivered = currentStatus === "delivered";

          if (!ship?.id) {
            return (
              <span className="text-muted-foreground text-sm">—</span>
            );
          }

          return (
            <div className="flex items-center gap-2">
              <Select
                value={currentStatus || undefined}
                onValueChange={async (val) => {
                  return;
                  const toastId = toast.loading(t("messages.shipmentStatusUpdating"));
                  try {
                    setShipmentUpdating(row.id, true);
                    const { data } = await api.patch(`/shipping/shipments/${ship.id}/status`, {
                      status: val,
                    });
                    toast.success(t("messages.shipmentStatusUpdated"), {
                      id: toastId,
                    });
                    const newOrder = data.order || {};
                    const newShipment = data.shipment || {};
                    await fetchStats(true);
                    if (newOrder) {
                      setPager((p) => ({
                        ...p,
                        records: p.records.map((r) => {
                          if (r.id !== row.id) return r;

                          return {
                            ...r,

                            // order status
                            statusId: newOrder.status?.id,
                            status: newOrder.status,

                            // shipment update
                            shipments: (r.shipments || []).map((s) =>
                              s.id === ship.id
                                ? {
                                  ...s,
                                  ...newShipment,
                                  status: newShipment.status || val,
                                }
                                : s
                            ),
                          };
                        }),
                      }));
                    }
                  } catch (err) {
                    console.error(err);
                    toast.error(
                      err.response?.data?.message ||
                      t("messages.shipmentStatusUpdateFailed"),
                      { id: toastId },
                    );
                  } finally {
                    setShipmentUpdating(row.id, false);
                  }
                }}
                disabled={updatingShipments.includes(row.id)}
              >
                <SelectTrigger className="w-[170px] h-8">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {(unifiedShipmentStatuses || []).map((code) => (
                    <SelectItem key={code} value={code} className="cursor-default!">
                      {t(`trackingStatus.${code}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        },
      },
      {
        key: "shippingDays",
        header: t("table.shippingDays"),
        cell: (row) => {
          if (row.status?.code !== OrderStatus.SHIPPED || !row.shippedAt) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }

          const cityConfig = row.cityDetails?.tenantConfigs?.[0];
          const minDays = cityConfig?.minShippingDays ?? null;
          const maxDays = cityConfig?.maxShippingDays ?? null;
          const days = calcShippingDaysElapsed(row.shippedAt);
          const rangeStatus = getShippingDaysRangeStatus(days, minDays, maxDays);
          const { className } = getShippingDaysBadgeStyles(rangeStatus);
          const statusLabel = t(`shippingDays.${rangeStatus}`);
          const daysLabel = days === 1
            ? t("shippingDays.day", { count: days })
            : t("shippingDays.days", { count: days });

          return (
            <Badge
              className={cn("rounded-lg px-2.5 py-1 font-semibold tabular-nums", className)}
              title={statusLabel}
            >
              {daysLabel}
            </Badge>
          );
        },
      },


      {
        key: "paymentMethod",
        header: t("table.paymentMethod"),
        cell: (row) => (
          <Badge variant="outline">
            {t(`paymentMethods.${row.paymentMethod}`)}
          </Badge>
        ),
      },
      {
        key: "paymentStatus",
        header: t("table.paymentStatus"),
        cell: (row) => {
          if (!row.paymentStatus)
            return <span className="text-muted-foreground text-sm">—</span>;

          return <Badge variant="outline">
            {t(`paymentStatuses.${row.paymentStatus}`)}
          </Badge>
        },
      },

      {
        key: "shippingCompany",
        header: t("table.shippingCompany"),
        cell: (row) => {
          if (!row.shippingCompany)
            return <span className="text-muted-foreground text-sm">—</span>;

          return <Badge variant="outline">
            {row.shippingCompany?.name || "-"}
          </Badge>
        },
      },
      {
        key: "store",
        header: t("table.store"),
        cell: (row) => {
          if (!row.store)
            return <span className="text-muted-foreground text-sm">—</span>;

          return <Badge variant="outline">
            {row.store?.name || "-"}
          </Badge>
        },
      },

      {
        key: "deposit",
        header: t("table.deposit"),
        cell: (row) => (
          <span className="text-sm">
            {formatCurrency(row.deposit)}
          </span>
        ),
      },
      {
        key: "assignedUser",
        header: t("table.assignedEmployee"),
        cell: (row) => {
          const assignment = row.assignments?.[0];
          const user = assignment?.employee;
          if (!user) return <span className="text-muted-foreground">—</span>;
          const avatarUrl = user.avatarUrl
            ? user.avatarUrl.startsWith("http")
              ? user.avatarUrl
              : `${(BASE_URL || "").replace(/\/+$/, "")}/${(user.avatarUrl || "").replace(/^\/+/, "")}`
            : "";
          return (
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 p-2 min-w-[180px] max-w-[220px]">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={avatarUrl} alt={user.name} />
                <AvatarFallback className="text-xs">
                  {(user.name || "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-sm">{user.name}</div>
                {user.employeeType && (
                  <div className="text-xs text-muted-foreground">
                    {user.employeeType}
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        key: "updated_at",
        header: t("table.lastUpdate"),
        cell: (row) => (
          <span className="text-xs text-gray-500">
            {new Date(row.updated_at).toLocaleDateString("en-US")}
          </span>
        ),
      },
      {
        key: "actions",
        header: t("table.actions"),
        cell: (row) => (
          <ActionButtons
            row={row}
            actions={[
              // --- WAREHOUSE ACTIONS ---
              {
                icon: <GitMerge size={18} />,
                tooltip: t("actions.distribute"),
                onClick: () => router.push(`/warehouse?tab=distribution&subtab=unassigned`),
                variant: "primary",
                permission: "orders.update",
                hidden: isSuperAdmin || row?.status?.code !== OrderStatus.CONFIRMED,
              },
              {
                icon: <Printer size={18} />,
                tooltip: t("actions.print"),
                onClick: () => router.push(`/warehouse?tab=print`),
                variant: "primary",
                permission: "orders.update",
                hidden: isSuperAdmin || row?.status?.code !== OrderStatus.DISTRIBUTED,
              },
              {
                icon: <ScanBarcode size={18} />,
                tooltip: t("actions.startPreparing"),
                onClick: (r) => router.push(`/warehouse?tab=preparation&subtab=scanning&order=${r.id}`),
                variant: "primary",
                permission: "orders.update",
                hidden: isSuperAdmin || row?.status?.code !== OrderStatus.PRINTED,
              },
              {
                icon: <ScanLine size={18} />,
                tooltip: t("actions.continuePreparing"),
                onClick: (r) => router.push(`/warehouse?tab=preparation&subtab=scanning&order=${r.id}`),
                variant: "primary",
                permission: "orders.update",
                hidden: isSuperAdmin || row?.status?.code !== OrderStatus.PREPARING,
              },
              {
                icon: <Send size={18} />,
                tooltip: t("actions.scanOutgoing"),
                onClick: (r) => router.push(`/warehouse?tab=outgoing&subtab=scan&order=${r.orderNumber}`),
                variant: "primary",
                permission: "orders.update",
                hidden: isSuperAdmin || row?.status?.code !== OrderStatus.READY,
              },
              {
                icon: <ClipboardList size={18} />,
                tooltip: t("actions.createManifest"),
                onClick: () => router.push(`/warehouse?tab=outgoing&subtab=scan&manifest=open`),
                variant: "primary",
                permission: "orders.update",
                hidden: isSuperAdmin || row?.status?.code !== OrderStatus.PACKED,
              },
              {
                icon: <Undo2 size={18} />,
                tooltip: t("actions.createReturnManifest"),
                onClick: () => router.push(`/warehouse?tab=returns&subtab=scan&manifest=open`),
                variant: "primary",
                permission: "orders.update",
                hidden: isSuperAdmin || row?.status?.code !== OrderStatus.RETURN_PREPARING,
              },
              {
                icon: <Truck />,
                tooltip: t("actions.trackShipment"), // "تتبع الشحنة"
                onClick: (r) => {
                  setTrackingOrder(r);
                  setTrackShipmentModalOpen(true);
                },
                variant: "primary",
                permission: "orders.read",
                disabled: !row.trackingNumber,
                hidden: row?.status?.code !== OrderStatus.SHIPPED && row?.status?.code !== OrderStatus.DELIVERED,
              },
              {
                icon: <History />,
                tooltip: t("actions.statusHistory"),
                onClick: (r) => {
                  setHistoryOrder(r);
                  setHistoryModalOpen(true);
                },
                variant: "primary",
                permission: "orders.read",
              },
              // -----------------------------
              {
                icon: <Eye />,
                tooltip: t("actions.view"),
                onClick: (r) => {
                  if (isSuperAdmin) {
                    router.push(`/dashboard/orders/details/${r.id}`);
                  } else {
                    router.push(`/orders/details/${r.id}`);
                  }
                },
                variant: "primary",
                permission: "orders.read",
              },
              {
                icon: <Copy />,
                tooltip: t("actions.duplicate"),
                onClick: (r) => router.push(`/orders/new?from=${r.id}`),
                variant: "primary",
                permission: "orders.create",
                hidden: isSuperAdmin
              },
              {
                icon: <Edit2 />,
                tooltip: t("actions.edit"),
                onClick: (r) => router.push(`/orders/edit/${r.id}`),
                disabled: row?.status?.code === OrderStatus.SHIPPED || row?.status?.code === OrderStatus.DELIVERED,
                variant: "primary",
                permission: "orders.update",
                hidden: isSuperAdmin
              },

              {
                icon: <Trash2 />,
                tooltip: t("actions.delete"),
                onClick: (r) => {
                  setDeletingOrder(r);
                  setDeleteOrderModalOpen(true);
                },
                variant: "red",
                permission: "orders.delete",
                hidden: isSuperAdmin || readOnlyStatus
              },
            ]
            }
          />
        ),
      },
    ];
  }, [
    t,
    router,
    filteredStats,
    formatCurrency,
    readOnlyStatus,
    unifiedShipmentStatuses,
    updatingShipments,
    fetchOrders,
    pager.current_page,
    pager.per_page,
    pager.records,
    fetchStats,
  ]);
  const { handleExport: handleExportLogs, exportLoading: exportLogsLoading } = useExport(); 
  return (
    <div className=" ">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: label ? label : t("tabs.orders") },
        ]}
        buttons={
          <>
            {isSuperAdmin && (
              <div className="min-w-[200px]">
                <AdminFilter
                  value={adminId}
                  onChange={setAdminId}
                  showAllOption={true}
                />
              </div>
            )}
            {showTopActions && (
              <>
                <Button_
                  href="/orders/new"
                  size="sm"
                  label={t("actions.createOrder")}
                  variant="solid"
                  icon={<Plus size={18} />}
                  permission="orders.create"
                />
                <Button_
                  size="sm"
                  label={t("actions.settings")}
                  variant="outline"
                  onClick={() => setRetrySettingsOpen(true)}
                  icon={<Settings size={18} />}
                  permission="order.updateSettings"
                />
              </>
            )}
          </>
        }
        statsLoading={statsLoading}
        statsCount={12}
        stats={[
          ...statsCards.map((stat) => ({
            id: stat.id,
            name: stat.title,
            value: stat.value,
            icon: stat.icon,
            color: stat.iconColorInline,
            sortOrder: stat.sortOrder,
            editable: !stat.system,
            onEdit: () => handleEditStatus(stat.fullData),
            onDelete: () => handleDeleteStatus(stat),
          })),
          ...(!readOnlyStatus ? [{
            id: "add",
            name: t("actions.addStatus"),
            icon: Plus,
            color: "#94a3b8",
            isAddCard: true,
            onClick: handleAddStatus,
            sortOrder: 9999,
          }] : []),
        ]}
      />

      <Table
        // ── Row Styling ───────────────────────────────────────────────────────
        rowClassName={(row) =>
          row.duplicateCount > 0
            ? "bg-red-50 dark:bg-red-950/30 border-red-100/60"
            : ""
        }
        // ── Search (always visible) ───────────────────────────────────────────
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={applyFilters}
        // ── i18n labels ───────────────────────────────────────────────────────
        labels={{
          searchPlaceholder: t("toolbar.searchPlaceholder"),
          filter: t("toolbar.filter"),
          apply: t("filters.apply"),
          total: t("pagination.total"),
          limit: t("pagination.limit"),
          emptyTitle: t("empty"),
          emptySubtitle: t("emptySubtitle"),
          preview: t("image.preview"),
        }}
        actions={[
          {
            key: "export",
            label: t("toolbar.export"),
            icon: exportLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            ),
            color: "primary",
            onClick: handleExport,
            disabled: exportLoading,
            permission: "orders.read",
          },
          ...(showBulkUpload
            ? [{
              key: "bulk",
              label: t("toolbar.bulkUpload"),
              icon: <Upload size={14} />,
              color: "primary",
              onClick: () => setBulkUploadOpen(true),
              permission: "orders.create",
            }]
            : []),
        ]}
        hasActiveFilters={Object.values(filters).some(
          (v) => v && v !== "all" && v !== null,
        )}
        onApplyFilters={applyFilters}
        filters={
          <>
            {/* Status */}
            <FilterField label={t("filters.status")}>
              <Select
                value={filters.status}
                onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm  focus:border-[var(--primary)] dark:focus:border-[#5b4bff] transition-all">
                  <SelectValue placeholder={t("filters.statusPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.all")}</SelectItem>
                  {Array.isArray(filteredStats) &&
                    filteredStats.map((s) => (
                      <SelectItem
                        key={s.code || s.id}
                        value={s.code || String(s.id)}
                      >
                        {s.system ? t(`statuses.${s.code}`) : s.name || s.code}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </FilterField>

            {/* Payment status */}
            <FilterField label={t("filters.paymentStatus")}>
              <Select
                value={filters.paymentStatus}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, paymentStatus: v }))
                }
              >
                <SelectTrigger
                  className="h-10 rounded-xl border-border bg-background text-sm
            focus:border-[var(--primary)] dark:focus:border-[#5b4bff] transition-all"
                >
                  <SelectValue
                    placeholder={t("filters.paymentStatusPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.all")}</SelectItem>
                  <SelectItem value="pending">
                    {t("paymentStatuses.pending")}
                  </SelectItem>
                  <SelectItem value="paid">
                    {t("paymentStatuses.paid")}
                  </SelectItem>
                  <SelectItem value="partial">
                    {t("paymentStatuses.partial")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label={t("filters.employee")}>
              <UserSelect
                value={filters.employee}
                onSelect={(user) =>
                  setFilters((f) => ({
                    ...f,
                    employee: user ? String(user.id) : "all",
                  }))
                }
                placeholder={t("filters.employeePlaceholder")}
                allowAll
                allLabel={t("filters.all")}
                className="h-10 rounded-xl border-border bg-background"
                contentClassName="bg-card-select"
              />
            </FilterField>

            {/* Date range */}
            <FilterField label={t("filters.date")}>
              <DateRangePicker
                value={{
                  startDate: filters.startDate,
                  endDate: filters.endDate,
                }}
                onChange={(newDates) =>
                  setFilters((prev) => ({
                    ...prev,
                    ...newDates,
                  }))
                }
                placeholder={t("filters.datePlaceholder")}
                dataSize="default"
                maxDate="today"
              />
            </FilterField>

            {filters.status === OrderStatus.POSTPONED && (
              <FilterField label={t("postponed.date")}>
                <DateRangePicker
                  value={{
                    startDate: filters.postponedStartDate,
                    endDate: filters.postponedEndDate,
                  }}
                  onChange={(newDates) =>
                    setFilters((prev) => ({
                      ...prev,
                      postponedStartDate: newDates.startDate,
                      postponedEndDate: newDates.endDate,
                    }))
                  }
                  placeholder={t("postponed.datePlaceholder")}
                  dataSize="default"
                  maxDate={null}
                />
              </FilterField>
            )}

            <StoreFilter
              value={filters.store}
              onChange={(v) => setFilters((f) => ({ ...f, store: v }))}
            />

            <ShippingCompanyFilter
              value={filters.shippingCompany}
              onChange={(v) =>
                setFilters((f) => ({ ...f, shippingCompany: v }))
              }
            />
          </>
        }
        // ── Table ─────────────────────────────────────────────────────────────
        columns={columns}
        data={pager.records}
        isLoading={ordersLoading || loading}
        // ── Pagination ────────────────────────────────────────────────────────
        pagination={{
          total_records: pager.total_records,
          current_page: pager.current_page,
          per_page: pager.per_page,
        }}
        onPageChange={handlePageChange}
      />

      <DistributionModal
        isOpen={distributionOpen}
        onClose={() => setDistributionOpen(false)}
        statuses={stats}
        onSuccess={() => {
          fetchOrders(1, pager.per_page);
          fetchStats();
        }}
      />

      <SettingsModal
        isOpen={retrySettingsOpen}
        statuses={stats}
        onClose={() => setRetrySettingsOpen(false)}
      />

      <BulkUploadModal
        isOpen={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        onSuccess={() => {
          fetchOrders(1, pager.per_page);
          fetchStats();
        }}
      />

      <StatusFormModal
        isOpen={statusFormOpen}
        onClose={() => {
          setStatusFormOpen(false);
          setEditingStatus(null);
        }}
        status={editingStatus}
        onSuccess={fetchStats}
      />

      <DeleteStatusModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingStatus(null);
        }}
        status={deletingStatus}
        onSuccess={fetchStats}
      />

      <TrackShipmentModal
        isOpen={trackShipmentModalOpen}
        onClose={() => {
          setTrackShipmentModalOpen(false);
          setTrackingOrder(null);
        }}
        order={trackingOrder}
      />

      <DeleteOrderModal
        isOpen={deleteOrderModalOpen}
        onClose={() => {
          setDeleteOrderModalOpen(false);
          setDeletingOrder(null);
        }}
        order={deletingOrder}
        onSuccess={() => {
          fetchOrders(pager.current_page, pager.per_page);
          fetchStats();
        }}
      />

      <Dialog
        open={!!postponedOrder}
        onOpenChange={() => {
          setPostponedOrder(null);
          setPostponedDate(null);
        }}
      >
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-[30px] border-none shadow-2xl bg-[#f8f9fc] dark:bg-slate-950">
          <div className="flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 pe-[60px]">
              <DialogTitle className="text-xl font-bold">
                {t("postponed.dialogTitle")}
              </DialogTitle>
              <DialogDescription className="mt-1 text-slate-500">
                {t("postponed.dialogDescription")}
              </DialogDescription>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>
                  {t("postponed.date")}
                  <span className="text-red-500">*</span>
                </Label>
                <DateRangePicker
                  mode="single"
                  value={postponedDate}
                  onChange={(date) => setPostponedDate(date)}
                  placeholder={t("postponed.datePlaceholder")}
                  dataSize="default"
                  maxDate={null}
                  minDate={tomorrow}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  {t("postponed.reminderDays")}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={reminderDaysBefore}
                  onValueChange={(val) => setReminderDaysBefore(val)}
                  disabled={!postponedDate || reminderOptions.length <= 1}
                >
                  <SelectTrigger className="rounded-xl h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <SelectValue placeholder={t("postponed.reminderDaysPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {reminderOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {t("postponed.daysBefore", { days: opt.label })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setPostponedOrder(null);
                  setPostponedDate(null);
                }}
                className="rounded-xl"
              >
                {t("postponed.cancel")}
              </Button>
              <Button
                disabled={!postponedDate || (reminderDaysBefore !== 0 && !reminderDaysBefore) || updatingStatuses.includes(postponedOrder?.id)}

                onClick={async () => {
                  if (!postponedDate || !postponedOrder) return;
                  const { id, statusId } = postponedOrder;
                  const toastId = toast.loading(t("messages.statusUpdating"));
                  try {
                    setUpdating(id, true);
                    const res = await api.patch(`/orders/${id}/status`, {
                      statusId,
                      postponedDate: postponedDate.toISOString(),
                      reminderDaysBefore: reminderDaysBefore ? Number(reminderDaysBefore) : null,
                    });
                    const newOrder = res.data || {};

                    toast.success(t("messages.statusUpdated"), { id: toastId });
                    await fetchStats(true);
                    setPager(p => ({
                      ...p, records: p.records.map((r) => (r.id === id ?
                        { ...r, statusId, status: newOrder.status, postponedDate: newOrder.postponedDate, reminderDaysBefore: newOrder.reminderDaysBefore }
                        : r))
                    }));
                    setPostponedOrder(null);
                    setPostponedDate(null);
                    setReminderDaysBefore("");
                  } catch (err) {
                    console.error(err);
                    toast.error(
                      err.response?.data?.message ||
                      t("messages.errorUpdatingStatus"),
                      { id: toastId }
                    );
                  } finally {
                    setUpdating(id, false);
                  }
                }}
                className="rounded-xl bg-primary hover:bg-primary/90 text-white"
              >
                {t("postponed.confirm")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <OrderStatusHistoryModal
        isOpen={historyModalOpen}
        onClose={() => {
          setHistoryModalOpen(false);
          setHistoryOrder(null);
        }}
        order={historyOrder}
      />

      <ShipmentLogsModal
        isOpen={shipmentLogsModalOpen}
        onClose={() => {
          setShipmentLogsModalOpen(false);
          setShipmentLogsOrder(null);
          setShipmentLogsShipment(null);
          setShipmentLogs([]);
        }}
        order={shipmentLogsOrder}
        shipment={shipmentLogsShipment}
        logs={shipmentLogs}
        loading={shipmentLogsLoading}
        onExport={async () => {
          console.log("called");
          await handleExportLogs({
            endpoint: "/shipping/external-logs/export",
            params: {
              shipmentId: shipmentLogsShipment?.id,
              orderId: shipmentLogsOrder?.id,
            },
            filename: `shipment-logs-${Date.now()}.xlsx`,
          });
        }}
        exportLoading={exportLogsLoading}
      />
    </div>
  );
}

function ShipmentLogsModal({ isOpen, onClose, order, shipment, logs, loading, onExport, exportLoading }) {
  const t = useTranslations("orders");
  const [pager, setPager] = useState({ total_records: 0, current_page: 1, per_page: 10, records: [] });
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchLogs = async (page = 1, perPage = 10) => {
    if (!shipment?.id) return;
    setLogsLoading(true);
    try {
      const res = await api.get("/shipping/external-logs", {
        params: {
        shipmentId: shipment.id,
        orderId: order.id,
        page,
        limit: perPage,
        },
      });
      setPager(res.data);
    } catch (error) {
      console.error(error);
      toast.error(t("messages.errorFetchingShipmentLogs"));
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs(1, 10);
    }
  }, [isOpen, shipment?.id, order?.id]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-4xl rounded-xl max-h-[90vh] flex flex-col p-0 shadow-2xl border-0 overflow-hidden">
        <div className="relative px-6 pt-6 pb-5 shrink-0 bg-gradient-to-br from-primary to-secondary">
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <History size={22} className="text-white" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium mb-0.5">{order?.orderNumber}</p>
                <h2 className="text-white text-xl font-bold">{t("shipmentLogs.title")}</h2>
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
                    <th className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-400">{t("shipmentLogs.date")}</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-400">{t("shipmentLogs.status")}</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-400">{t("shipmentLogs.notes")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {logsLoading ? (
                    <tr>
                      <td colSpan="3" className="px-4 py-8 text-center text-slate-500">
                        <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                        {t("common.loading")}
                      </td>
                    </tr>
                  ) : pager.records.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-4 py-8 text-center text-slate-500">
                        {t("shipmentLogs.noLogs")}
                      </td>
                    </tr>
                  ) : (
                    pager.records.map((log, index) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs text-gray-500">
                            {new Date(log.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {log.rawStatus ? (
                            log.rawStatus
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-gray-700 dark:text-slate-300">{log.notes || "—"}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* {!logsLoading && <Loader2 size={16} className="animate-spin" />} */}
            {!logsLoading && pager.total_records > 0 && (
              <span className="text-sm text-slate-500">
                {t("shipmentLogs.totalRecords", { count: pager.total_records })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              {t("common.cancel")}
            </Button>
            <Button
              disabled={exportLoading || pager.records.length === 0}
              onClick={onExport}
              className="rounded-xl px-8 bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95"
            >
              {exportLoading ? (
                <Loader2 size={18} className="mr-2 animate-spin" />
              ) : (
                <Download size={18} className="mr-2" />
              )}
              {t("common.export")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function isValidHex(color) {
  return /^#([0-9A-F]{6})$/i.test(color);
}

const ColorPicker = ({ value, onChange, disabled }) => {
  const t = useTranslations("orders");
  const [showPicker, setShowPicker] = useState(false);
  const wrapperRef = useRef(null);

  // Local state for input typing
  const [inputValue, setInputValue] = useState(value);

  // Sync when parent value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      if (isValidHex(inputValue)) {
        onChange(inputValue.toUpperCase());
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(handler);
  }, [inputValue]);

  const presetColors = [
    "#F44336",
    "#E91E63",
    "#9C27B0",
    "#673AB7",
    "#3F51B5",
    "#2196F3",
    "#03A9F4",
    "#00BCD4",
    "#009688",
    "#4CAF50",
    "#8BC34A",
    "#CDDC39",
    "#FFEB3B",
    "#FFC107",
    "#FF9800",
    "#FF5722",
    "#795548",
    "#9E9E9E",
    "#607D8B",
    "#000000",
  ];

  // ✅ Outside click detection
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPicker]);

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="flex gap-2">
        {/* Color Preview Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setShowPicker(!showPicker)}
          className="w-12 h-12 rounded-xl border-2 border-gray-300 dark:border-slate-600"
          style={{ backgroundColor: value }}
        />

        {/* Manual HEX Input */}
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={disabled}
          placeholder="#000000"
          className="flex-1 h-12 font-mono rounded-xl"
          maxLength={7}
        />
      </div>

      {showPicker && !disabled && (
        <div className="absolute z-50 mt-2 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 space-y-4">
          {/* Native Color Picker (Any Hex) */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("customColor")}
            </label>
            <input
              type="color"
              value={value}
              onChange={(e) => {
                setInputValue(e.target.value);
              }}
              className="w-full h-10 cursor-pointer"
            />
          </div>

          {/* Preset Colors */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("presetColors")}
            </label>
            <div className="grid grid-cols-6 gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onChange(color)}
                  className={[
                    "w-8 h-8 rounded-xl border-2 transition-all",
                    value === color
                      ? "border-black dark:border-white scale-110"
                      : "border-gray-300 dark:border-slate-600 hover:scale-110",
                  ].join(" ")}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function StatusFormModal({ isOpen, onClose, status, onSuccess }) {
  const t = useTranslations("orders");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#2196F3",
    sortOrder: 0,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status) {
      setFormData({
        name: status.name || "",
        description: status.description || "",
        color: status.color || "#2196F3",
        sortOrder: status.sortOrder || status.sortorder || 0,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        color: "#2196F3",
        sortOrder: 0,
      });
    }
    setErrors({});
  }, [status, isOpen]);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t("validation.statusNameRequired");
    } else if (formData.name.length > 50) {
      newErrors.name = t("validation.statusNameMaxLength");
    }

    if (!/^#[0-9A-F]{6}$/i.test(formData.color)) {
      newErrors.color = t("validation.invalidColorCode");
    }

    if (formData.sortOrder < 0) {
      newErrors.sortOrder = t("validation.sortOrderMin");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      if (status) {
        // Update existing status
        await api.patch(`/orders/statuses/${status.id}`, formData);
        toast.success(t("messages.statusUpdated"));
      } else {
        // Create new status
        await api.post("/orders/statuses", formData);
        toast.success(t("messages.statusCreated"));
      }

      onClose();
      onSuccess();
    } catch (error) {
      console.error("Error saving status:", error);
      toast.error(
        error.response?.data?.message || t("messages.errorSavingStatus"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {status ? t("statusForm.editTitle") : t("statusForm.addTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm text-gray-600 dark:text-slate-300">
              {t("statusForm.name")} *
            </Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder={t("statusForm.namePlaceholder")}
              className="rounded-xl h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
              maxLength={50}
            />
            {errors.name && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-600 dark:text-slate-300">
              {t("statusForm.description")}
            </Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder={t("statusForm.descriptionPlaceholder")}
              className="rounded-xl bg-[#fafafa] dark:bg-slate-800/50 min-h-[100px]"
            />
          </div>

          {/* <div className="space-y-2">
            <Label className="text-sm text-gray-600 dark:text-slate-300">
              {t("statusForm.color")} *
            </Label>
            <ColorPicker
              value={formData.color}
              onChange={(color) => setFormData({ ...formData, color: color })}
            />
            {errors.color && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.color}
              </p>
            )}
          </div> */}

          <div className="space-y-2">
            <Label className="text-sm text-gray-600 dark:text-slate-300">
              {t("statusForm.sortOrder")}
            </Label>
            <Input
              type="number"
              value={formData.sortOrder}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sortOrder: parseInt(e.target.value) || 0,
                })
              }
              className="rounded-xl h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
              min={0}
            />
            {errors.sortOrder && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.sortOrder}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {t("statusForm.sortOrderHelp")}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-[45px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("statusForm.saving")}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {status ? t("statusForm.update") : t("statusForm.create")}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="h-[45px] px-8"
            >
              {t("statusForm.cancel")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OrderStatusHistoryModal({ isOpen, onClose, order }) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const t = useTranslations("orders");

  useEffect(() => {
    if (!isOpen || !order?.id) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/orders/${order.id}/history`);
        setHistory(response.data || []);
      } catch (err) {
        console.error("Error fetching order history:", err);
        toast.error(t("messages.errorFetchingHistory") || "Error fetching history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, order]);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString(isRtl ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const P = "var(--primary)";
  const P_15 = "color-mix(in oklab, var(--primary) 15%, transparent)";
  const P_20 = "color-mix(in oklab, var(--primary) 20%, transparent)";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl">
        <DialogHeader className="p-6 border-b dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <History size={24} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                {t("details.statusHistory")}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {t("table.orderNumber")}: {order?.orderNumber}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t("actions.loading")}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">{t("logs.empty")}</p>
            </div>
          ) : (
            <div className="space-y-0 px-2">
              {history
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map((item, idx, arr) => {
                  const isFirst = idx === 0;
                  const isLast = idx === arr.length - 1;
                  return (
                    <div key={item.id} className="relative flex gap-4">
                      {/* Track */}
                      <div className="relative flex flex-col items-center pt-1.5">
                        <div
                          className="w-3 h-3 rounded-full z-10 shrink-0 transition-all duration-200"
                          style={{
                            background: isFirst ? P : "var(--border)",
                            boxShadow: isFirst ? `0 0 0 4px ${P_15}` : "none",
                          }}
                        />
                        {!isLast && (
                          <div
                            className="w-0.5 flex-1 mt-1 min-h-[40px]"
                            style={{
                              background: isFirst
                                ? `linear-gradient(to bottom, ${P_20}, var(--border))`
                                : "var(--border)",
                            }}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className={cn("flex-1 pb-6", isLast && "pb-0")}>
                        <div className="flex flex-col gap-1">
                          <p
                            className="text-sm font-bold leading-snug flex gap-2 items-center flex-wrap"
                            style={{ color: isFirst ? P : "var(--foreground)" }}
                          >
                            <span className="px-2 py-0.5 rounded-lg bg-muted border text-[11px] font-medium">
                              {item.fromStatus?.system
                                ? t(`statuses.${item.fromStatus.code}`)
                                : item.fromStatus?.name || "—"}
                            </span>
                            <ArrowRight size={12} className="rtl:rotate-180 text-muted-foreground" />
                            <span className="px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold">
                              {item.toStatus?.system
                                ? t(`statuses.${item.toStatus.code}`)
                                : item.toStatus?.name || "—"}
                            </span>
                          </p>

                          {item.notes && (
                            <p className="text-[12px] text-muted-foreground mt-1 bg-muted/30 p-2 rounded-lg border border-border/50">
                              {item.notes}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 mt-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                              <Clock size={12} />
                              {formatDate(item.created_at)}
                            </div>

                            {(item.changedByUser || item.admin) && (
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium border-s ps-3">
                                <span className="opacity-70">{t("details.changedBy")}:</span>
                                <span className="text-foreground font-semibold">
                                  {item.changedByUser?.name || item.admin?.name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <div className="p-4 bg-muted/30 border-t dark:border-slate-800 flex justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-xl px-6">
            {t("common.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeleteStatusModal({ isOpen, onClose, status, onSuccess }) {
  const t = useTranslations("orders");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { copied: isCopiedStatusName, handleCopy: handleCopyStatusName } = useClipboard();
  const handleDelete = async (e) => {
    e.preventDefault();
    setError("");

    // Validate confirmation text
    if (confirmText.trim().toLowerCase() !== status?.title.toLowerCase()) {
      setError(t("deleteStatus.errorMismatch"));
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/orders/statuses/${status.id}`);
      toast.success(t("messages.statusDeleted"));
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error deleting status:", error);
      toast.error(
        error.response?.data?.message || t("messages.errorDeletingStatus"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmText("");
    setError("");
    onClose();
  };

  if (!status) return null;
  const isConfirmValid =
    confirmText.trim().toLowerCase() === status?.title.toLowerCase();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {t("deleteStatus.title")}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t("deleteStatus.subtitle")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleDelete} className="space-y-4 pt-4">
          {/* Warning message */}
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">
              {t("deleteStatus.warning")}
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-2 font-semibold">
              {t("deleteStatus.statusName")}:{" "}
              <span className="font-bold">{status?.title}</span>
            </p>
          </div>

          {/* Status details */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center"
                style={{ borderColor: status?.iconBorderInline }}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: status?.bgInlineLight }}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  <motion.button type="button" onClick={() => handleCopyStatusName(status?.title)}>
                    <span className="flex items-center gap-1">
                      {isCopiedStatusName ? (
                        <motion.span key="copied" initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 size={9} /> {t("messages.copied")}
                        </motion.span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Copy size={16} />
                          <motion.span key="statusName" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{status?.title}</motion.span>
                        </span>
                      )}
                    </span>
                  </motion.button>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {status?.count} {t("deleteStatus.ordersWithStatus")}
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation input */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-600 dark:text-slate-300">
              {t("deleteStatus.confirmLabel")}
            </Label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {t("deleteStatus.confirmHint")}{" "}
              <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                {status?.name}
              </span>
            </p>
            <Input
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError("");
              }}
              placeholder={status?.name}
              className="rounded-xl h-[45px] bg-white dark:bg-slate-800 border-2"
              autoComplete="off"
            />
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle size={12} />
                {error}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 h-[45px]"
            >
              {t("deleteStatus.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={loading || !isConfirmValid}
              className="flex-1 h-[45px] bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("deleteStatus.deleting")}
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("deleteStatus.confirm")}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteOrderModal({ isOpen, onClose, order, onSuccess }) {
  const t = useTranslations("orders");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { copied: isCopiedOrderNumber, handleCopy: handleCopyOrderNumber } = useClipboard();

  const handleDelete = async (e) => {
    e.preventDefault();
    setError("");

    // Validate confirmation text
    if (
      confirmText.trim().toLowerCase() !== order?.orderNumber?.toLowerCase()
    ) {
      setError(t("deleteOrder.errorMismatch"));
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/orders/${order.id}`);
      toast.success(t("messages.orderDeleted"));
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error(
        error.response?.data?.message || t("messages.errorDeletingOrder"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmText("");
    setError("");
    onClose();
  };

  if (!order) return null;
  const isConfirmValid =
    confirmText.trim().toLowerCase() === order?.orderNumber?.toLowerCase();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {t("deleteOrder.title")}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t("deleteOrder.subtitle")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleDelete} className="space-y-4 pt-4">
          {/* Warning message */}
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">
              {t("deleteOrder.warning")}
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-2 font-semibold">
              {t("deleteOrder.orderNumber")}:{" "}
              <span className="font-bold">{order?.orderNumber}</span>
            </p>
          </div>

          {/* Order details */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("table.orderNumber")}
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  <motion.button type="button" onClick={() => handleCopyOrderNumber(order?.orderNumber)}>
                    <span className="flex items-center gap-1">
                      {isCopiedOrderNumber ? (
                        <motion.span key="copied" initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 size={9} /> {t("messages.copied")}
                        </motion.span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Copy size={16} />
                          <motion.span key="orderNumber" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{order?.orderNumber}</motion.span>
                        </span>
                      )}
                    </span>
                  </motion.button>

                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("table.customerName")}
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {order?.customerName}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("table.phoneNumber")}
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {order?.phoneNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation input */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-600 dark:text-slate-300">
              {t("deleteOrder.confirmLabel")}
            </Label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {t("deleteOrder.confirmHint")}{" "}
              {/* <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                {order?.orderNumber}
              </span> */}
            </p>
            <Input
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError("");
              }}
              placeholder={order?.orderNumber}
              className="rounded-xl h-[45px] bg-white dark:bg-slate-800 border-2"
              autoComplete="off"
            />
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle size={12} />
                {error}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 h-[45px]"
            >
              {t("deleteOrder.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={loading || !isConfirmValid}
              className="flex-1 h-[45px] bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("deleteOrder.deleting")}
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("deleteOrder.confirm")}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}



function TrackShipmentModal({ isOpen, onClose, order }) {
  const t = useTranslations("orders");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trackingData, setTrackingData] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTracking = async () => {
      if (!isOpen || !order?.trackingNumber) return;

      setLoading(true);
      setError("");
      setTrackingData(null);

      try {
        const response = await api.get(
          `/shipping/shipments/${order.trackingNumber}/track`
        );

        if (isMounted && response.data?.ok) {
          setTrackingData(response.data);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching tracking:", err);
          setError(
            err.response?.data?.message || t("messages.errorFetchingTracking")
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTracking();

    return () => {
      isMounted = false;
    };
  }, [isOpen, order]);

  const handleClose = () => {
    setTrackingData(null);
    setError("");
    onClose();
  };

  // دالة مساعدة لتنسيق التواريخ بشكل مقروء
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }); // يمكنك تغيير 'en-US' إلى 'ar-EG' إذا كنت تفضل عرض التاريخ بالعربية دائماً
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {t("trackShipment.title")}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t("trackShipment.subtitle")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* تفاصيل الطلب الأساسية */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("table.orderNumber")}
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {order.orderNumber}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("table.customerName")}
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {order.customerName}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("trackShipment.trackingNumber")}
              </p>
              <p className="text-sm font-mono font-semibold text-[var(--primary)]">
                {order.trackingNumber}
              </p>
            </div>
          </div>

          {/* حالة التحميل */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
              <p className="text-sm text-gray-500">{t("trackShipment.loading")}</p>
            </div>
          )}

          {/* حالة الخطأ */}
          {!loading && error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200 leading-relaxed">
                {error}
              </p>
            </div>
          )}

          {/* بيانات التتبع من الـ API الجديد */}
          {!loading && !error && trackingData && (
            <div className="p-4 rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/15 space-y-4">

              {/* الحالة الموحدة */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--primary)]/10">
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-[var(--primary)]" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("trackShipment.currentStatus")}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--primary)]/10 text-[var(--primary)]">
                  {trackingData.status ? t(`trackingStatus.${trackingData.status}`) : trackingData.status || "N/A"}
                </span>
              </div>

              <div className="space-y-4 pt-1">
                {/* شركة الشحن */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-gray-400" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("trackShipment.company")}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {trackingData.company || "—"}
                  </p>
                </div>

                {/* معرف شحنة المزود */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-gray-400" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("trackShipment.providerShipmentId")}
                    </p>
                  </div>
                  <p className="text-sm font-mono text-gray-900 dark:text-gray-100">
                    {trackingData.providerShipmentId || "—"}
                  </p>
                </div>

                {/* تاريخ الإنشاء */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("trackShipment.createdAt")}
                    </p>
                  </div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {formatDate(trackingData.created_at)}
                  </p>
                </div>

                {/* تاريخ التحديث */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("trackShipment.updatedAt")}
                    </p>
                  </div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {formatDate(trackingData.updated_at)}
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* أزرار الإجراءات */}
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="w-full sm:w-auto h-[45px] px-8"
            >
              {t("common.close")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}