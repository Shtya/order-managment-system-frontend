import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    Clock,
    Eye,
    Layout,
    Loader2,
    Package,
    Plus,
    RefreshCw,
    Search,
    Sparkles,
    Store,
    User,
    X,
    Beaker,
} from 'lucide-react';
import { faker } from '@faker-js/faker';

// adjust these imports to your project

import { OrderDetailModal } from '@/app/[locale]/warehouse/tabs/DistributionTab';
import api from '@/utils/api';
import { cn } from '@/utils/cn';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';


const CREATE_STORE_OPTION = '__create_preview_store__';
const CREATE_STATUS_OPTION = '__create_preview_status__';

function slugify(value) {
    return String(value || '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\u0600-\u06FFa-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function clone(value) {
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
}

function dedupeById(list) {
    const map = new Map();
    list.forEach((item) => {
        if (item?.id) map.set(String(item?.id), item);
    });
    return Array.from(map.values());
}

function matchesSearch(order, search) {
    if (!search) return true;
    const s = search.toLowerCase();

    const parts = [
        order?.orderNumber,
        order?.customerName,
        order?.phoneNumber,
        order?.secondPhoneNumber,
        order?.status?.name,
        order?.status?.code,
        order?.store?.name,
        order?.store?.storeUrl,
        ...(order?.items || []).flatMap((item) => [
            item?.variant?.sku,
            item?.variant?.key,
            item?.variant?.product?.name,
            item?.product?.name,
        ]),
    ];

    return parts
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s));
}

function normalizeStores(data) {
    return dedupeById(
        (Array.isArray(data) ? data : [])
            .filter(Boolean)
            .map((store) => ({
                ...store,
                id: String(store?.id),
                name: store.name || 'Store',
                isActive: store.isActive ?? true,
                isIntegrated: store.isIntegrated ?? false,
                __mock: false,
            })),
    );
}

function normalizeStatuses(data) {
    return dedupeById(
        (Array.isArray(data) ? data : [])
            .filter(Boolean)
            .map((status) => ({
                ...status,
                id: String(status?.id),
                name: status.name || 'Status',
                code: status.code || slugify(status.name || 'status'),
                color: status.color || '#64748b',
                __mock: false,
            })),
    );
}

function getFallbackStores() {
    return [
        {
            id: 'mock-store-1',
            name: 'Demo Store One',
            storeUrl: 'https://demo-store-one.example',
            provider: 'mock',
            isActive: true,
            isIntegrated: false,
            __mock: true,
        },
        {
            id: 'mock-store-2',
            name: 'Demo Store Two',
            storeUrl: 'https://demo-store-two.example',
            provider: 'mock',
            isActive: true,
            isIntegrated: false,
            __mock: true,
        },
    ];
}

function getFallbackStatuses() {
    return [
        {
            id: 'mock-status-new',
            name: 'New',
            code: 'new',
            description: 'Incoming order',
            system: true,
            isDefault: true,
            sortOrder: 1,
            color: '#2563eb',
            __mock: true,
        },
        {
            id: 'mock-status-confirmed',
            name: 'Confirmed',
            code: 'confirmed',
            description: 'Confirmed order',
            system: true,
            isDefault: false,
            sortOrder: 2,
            color: '#16a34a',
            __mock: true,
        },
        {
            id: 'mock-status-preparing',
            name: 'Preparing',
            code: 'preparing',
            description: 'Preparing order',
            system: true,
            isDefault: false,
            sortOrder: 3,
            color: '#f59e0b',
            __mock: true,
        },
        {
            id: 'mock-status-shipped',
            name: 'Shipped',
            code: 'shipped',
            description: 'Shipped order',
            system: true,
            isDefault: false,
            sortOrder: 4,
            color: '#7c3aed',
            __mock: true,
        },
        {
            id: 'mock-status-delivered',
            name: 'Delivered',
            code: 'delivered',
            description: 'Delivered order',
            system: true,
            isDefault: false,
            sortOrder: 5,
            color: '#059669',
            __mock: true,
        },
    ];
}

function makeMockStore(overrides = {}) {
    const name = overrides.name || `Mock Store ${faker.company.name()}`;
    return {
        id: overrides?.id || `mock-store-${faker.string.uuid()}`,
        name,
        storeUrl: overrides.storeUrl || `https://${slugify(name || 'mock-store')}.example.com`,
        provider: overrides.provider || 'mock',
        isActive: overrides.isActive ?? true,
        isIntegrated: overrides.isIntegrated ?? false,
        __mock: true,
    };
}

function makeMockStatus(overrides = {}) {
    const name = overrides.name || `Mock Status ${faker.word.adjective()} ${faker.number.int({ min: 1, max: 99 })}`;
    return {
        id: overrides?.id || `mock-status-${faker.string.uuid()}`,
        name,
        code: overrides.code || slugify(name),
        description: overrides.description || 'Preview-only mock status',
        system: overrides.system ?? false,
        isDefault: overrides.isDefault ?? false,
        sortOrder: overrides.sortOrder ?? 999,
        color: overrides.color || faker.helpers.arrayElement(['#2563eb', '#16a34a', '#f59e0b', '#7c3aed', '#ef4444']),
        __mock: true,
    };
}

function resolveStoreFromId({ selectedId, stores, triggerStoreId }) {
    const id = selectedId || triggerStoreId || stores[0]?.id;

    if (!id || id === CREATE_STORE_OPTION) return null;

    const store = stores.find((s) => String(s?.id) === String(id));
    if (store) return store;

    return {
        id: String(id),
        name: `Store ${String(id).slice(0, 6)}`,
        storeUrl: '',
        provider: 'mock',
        isActive: true,
        isIntegrated: false,
        __mock: true,
    };
}

function resolveStatusFromId({ selectedId, statuses, triggerType, triggerStatusId }) {
    const preferredId =
        selectedId ||
        (triggerType === 'order_updated' ? triggerStatusId : null) ||
        statuses.find((s) => s.code === 'new')?.id ||
        statuses[0]?.id;

    if (!preferredId || preferredId === CREATE_STATUS_OPTION) return null;

    const status = statuses.find((s) => String(s?.id) === String(preferredId));
    if (status) return status;

    return {
        id: String(preferredId),
        name: `Status ${String(preferredId).slice(0, 6)}`,
        code: slugify(String(preferredId)),
        description: 'Preview-only mock status',
        system: false,
        isDefault: false,
        sortOrder: 999,
        color: '#64748b',
        __mock: true,
    };
}

function makeVariantAndProduct({ index, store, status }) {
    const productName = faker.commerce.productName();
    const productId = `mock-product-${faker.string.uuid()}`;
    const variantId = `mock-variant-${faker.string.uuid()}`;
    const sku = `PRV-${faker.string.alphanumeric(6).toUpperCase()}`;
    const unitPrice = faker.number.int({ min: 90, max: 2500 });
    const unitCost = Math.max(20, Math.floor(unitPrice * faker.number.float({ min: 0.35, max: 0.8 })));
    const quantity = faker.number.int({ min: 1, max: 3 });
    const lineTotal = Number((unitPrice * quantity).toFixed(2));
    const lineProfit = Number(((unitPrice - unitCost) * quantity).toFixed(2));

    const product = {
        id: productId,
        name: productName,
        salePrice: unitPrice,
        sku: `SKU-${faker.string.alphanumeric(8).toUpperCase()}`,
        type: 'VARIABLE',
        storageRack: faker.location.secondaryAddress(),
        categoryId: null,
        storeId: store?.id,
        warehouseId: null,
        description: faker.commerce.productDescription(),
        callCenterProductDescription: faker.commerce.productDescription(),
        upsellingEnabled: faker.datatype.boolean(),
        upsellingProducts: [],
        slug: slugify(productName),
        createdByUserId: null,
        mainImage: faker.image.url(),
        images: [
            { url: faker.image.url() },
        ],
        updatedByUserId: null,
        created_at: faker.date.recent({ days: 30 }).toISOString(),
        syncStates: [],
        __mock: true,
    };

    const variant = {
        id: variantId,
        productId,
        product,
        key: `${product.slug}-${index + 1}`,
        sku,
        price: unitPrice,
        attributes: {
            color: faker.color.human(),
            size: faker.helpers.arrayElement(['S', 'M', 'L', 'XL']),
        },
        stockOnHand: faker.number.int({ min: 5, max: 200 }),
        reserved: faker.number.int({ min: 0, max: 10 }),
        externalId: `EXT-${faker.string.alphanumeric(7).toUpperCase()}`,
        deletdWithParent: false,
        created_at: faker.date.recent({ days: 30 }).toISOString(),
        __mock: true,
    };

    const item = {
        id: `mock-item-${faker.string.uuid()}`,
        adminId: null,
        orderId: null,
        variantId,
        variant,
        quantity,
        scannedQuantity: 0,
        shippingScannedQuantity: 0,
        unitPrice,
        unitCost,
        lineTotal,
        lineProfit,
        isAdditional: false,
        stockDeducted: false,
        created_at: faker.date.recent({ days: 10 }).toISOString(),
        product,
        __mock: true,
    };

    return { product, variant, item, lineTotal, lineProfit };
}

function buildMockOrder({
    seed,
    index,
    triggerType,
    store,
    status,
    pinnedLabel,
    adminId
}) {
    faker.seed(seed);

    const id = `mock-order-${faker.string.uuid()}`;
    const orderNumber = `PRV-${new Date().getFullYear()}-${String(index + 1).padStart(4, '0')}-${faker.number.int({ min: 100, max: 999 })}`;

    const itemsCount = triggerType === 'order_updated'
        ? faker.number.int({ min: 1, max: 3 })
        : faker.number.int({ min: 1, max: 4 });

    const items = [];
    let productsTotal = 0;
    let profit = 0;

    for (let i = 0; i < itemsCount; i += 1) {
        const bundle = makeVariantAndProduct({ index: i + index * 10, store, status });
        const item = clone(bundle.item);
        item.orderId = id;
        items.push(item);
        productsTotal += item.lineTotal;
        profit += item.lineProfit;
    }

    const shippingCost = faker.number.int({ min: 0, max: 120 });
    const discount = faker.number.int({ min: 0, max: Math.min(150, Math.round(productsTotal * 0.2)) });
    const finalTotal = Math.max(0, productsTotal + shippingCost - discount);

    const paymentMethod = faker.helpers.arrayElement(['cash_on_delivery', 'cash', 'card', 'bank_transfer', 'wallet']);
    const paymentStatus = paymentMethod === 'cash_on_delivery' ? 'pending' : faker.helpers.arrayElement(['pending', 'paid', 'partial']);

    const createdAt = faker.date.recent({ days: 7 }).toISOString();
    const city = faker.location.city();
    const area = faker.location.county();

    return {
        id,
        externalId: `mock-ext-${faker.string.alphanumeric(10).toUpperCase()}`,
        rejectReason: null,
        rejectedAt: null,
        returnedAt: null,
        rejectedBy: null,
        rejectedById: null,
        returnedBy: null,
        returnedById: null,

        adminId: adminId,
        admin: null,

        orderNumber,
        customerName: faker.person.fullName(),
        phoneNumber: faker.phone.number(),
        secondPhoneNumber: faker.datatype.boolean() ? faker.phone.number() : null,
        email: faker.datatype.boolean() ? faker.internet.email() : null,
        address: faker.location.streetAddress(),
        landmark: faker.location.secondaryAddress(),
        deposit: faker.number.int({ min: 0, max: 300 }),
        city,
        area,

        status,
        statusId: status?.id || null,

        paymentMethod,
        paymentStatus,

        shippingCompany: null,
        shippingCompanyId: null,

        store: store || null,
        storeId: store?.id || null,

        trackingNumber: faker.datatype.boolean() ? `TRK-${faker.string.alphanumeric(9).toUpperCase()}` : null,
        distributed_at: null,
        shippedAt: null,
        deliveredAt: null,
        labelPrinted: null,

        productsTotal,
        shippingCost,
        discount,
        finalTotal,
        profit: Math.max(0, profit - discount),

        notes: pinnedLabel || 'Preview order generated for automation testing.',
        customerNotes: faker.datatype.boolean()
            ? faker.lorem.sentence()
            : null,

        items,

        statusHistory: [],
        createdByUserId: null,
        updatedByUserId: null,

        assignments: [],
        shipments: [],

        created_at: createdAt,
        updated_at: createdAt,

        isReplacement: false,
        allowOpenPackage: faker.datatype.boolean(),

        lastReturnId: null,
        lastReturn: null,
        manifestId: null,
        manifest: null,

        failedScanCounts: {
            preparation: faker.number.int({ min: 0, max: 2 }),
            shipping: faker.number.int({ min: 0, max: 2 }),
        },

        replacementRequest: null,
        replacementResult: null,
        collections: [],
        scanLogs: [],

        collectedAmount: 0,
        shippingMetadata: {
            cityId: `city-${slugify(city)}`,
            districtId: `district-${slugify(area)}`,
            zoneId: `zone-${faker.number.int({ min: 1, max: 9 })}`,
            locationId: `loc-${faker.string.alphanumeric(6).toLowerCase()}`,
            orderSize: faker.helpers.arrayElement(['small', 'medium', 'large']),
        },

        monthlyClosingId: null,
        monthlyClosing: null,
        deleted_at: null,

        __mock: true,
        __pinned: Boolean(pinnedLabel),
    };
}

function buildPresetMockOrders({
    triggerType,
    stores,
    statuses,
    triggerStoreId,
    triggerStatusId,
    adminId
}) {
    if (triggerType !== 'order_created' && triggerType !== 'order_updated') {
        return [];
    }

    const primaryStore =
        resolveStoreFromId({
            selectedId: triggerStoreId,
            stores,
            triggerStoreId,
        });
    // || getFallbackStores()[0];

    let triggerAlignedStatus = null;

    if (triggerType === 'order_created') {
        triggerAlignedStatus =
            statuses.find((s) => s.code === 'new') ||
            statuses[0];
        //   || getFallbackStatuses().find((s) => s.code === 'new');
    } else {
        triggerAlignedStatus =
            resolveStatusFromId({
                selectedId: triggerStatusId,
                statuses,
                triggerType,
                triggerStatusId,
            }) ||
            statuses[0]
        //    || getFallbackStatuses()[0];
    }

    return [
        buildMockOrder({
            seed: 101,
            index: 0,
            triggerType,
            store: primaryStore || null,
            status: triggerAlignedStatus,
            pinnedLabel: 'Pinned preview order',
            adminId,
        }),
        buildMockOrder({
            seed: 102,
            index: 1,
            triggerType,
            store: primaryStore,
            status: triggerAlignedStatus,
            pinnedLabel: 'Pinned preview order',
            adminId
        }),
    ];
}

function PreviewOrderCard({
    order,
    isMock,
    selected,
    onSelect,
    onView,
    onUse,
}) {
    return (
        <div
            onClick={() => onSelect(order)}
            className={cn(
                'w-full p-4 rounded-2xl text-right transition-all border border-transparent cursor-pointer block',
                selected
                    ? 'bg-primary/[0.04] border-primary/20 shadow-sm'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
            )}
        >
            <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-slate-900 dark:text-slate-100">
                        {order.orderNumber}
                    </span>

                    {isMock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300">
                            <Sparkles size={9} />
                            Mock
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            Real
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onView(order, e);
                        }}
                        className="flex items-center justify-center p-2 text-slate-500 bg-slate-100 hover:text-primary hover:bg-primary/10 dark:bg-slate-800/80 dark:hover:bg-primary/20 rounded-xl transition-all"
                        title="عرض التفاصيل"
                    >
                        <Eye size={16} />
                    </button> */}

                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onUse(order, e);
                        }}
                        className="flex items-center justify-center gap-1 px-3 py-2 text-[11px] font-black text-white bg-primary hover:bg-primary/90 rounded-xl transition-all"
                        title="استخدام في المعاينة"
                    >
                        <Sparkles size={14} />
                        استخدام
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-1 mb-2">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <User size={10} className="text-primary/60" />
                    <span className="text-[10px] font-bold">{order.customerName}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Activity size={10} className="text-slate-500" />
                    <span className="text-[10px]">
                        {order.status?.name || 'غير محدد'}
                    </span>
                </div>

                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Store size={10} className="text-slate-500" />
                    <span className="text-[10px]">
                        {order.store?.name || 'غير محدد'}
                    </span>
                </div>
            </div>

            <div className="flex items-center justify-between text-[9px] text-slate-700 dark:text-slate-400">
                <div className="flex items-center gap-1">
                    <Clock size={10} />
                    <span>
                        {order.created_at
                            ? new Date(order.created_at).toLocaleTimeString()
                            : '--'}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <Package size={10} />
                    <span>{Array.isArray(order.items) ? order.items.length : 0} items</span>
                </div>
            </div>
        </div>
    );
}

export default function PreviewSidebar({ nodes, onClose, onSelectOrder }) {
    const [orders, setOrders] = useState([]);
    const [stores, setStores] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [extraStores, setExtraStores] = useState([]);
    const [extraStatuses, setExtraStatuses] = useState([]);
    const [manualMockOrders, setManualMockOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [metaLoading, setMetaLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);

    const [draftStoreId, setDraftStoreId] = useState('');
    const [draftStatusId, setDraftStatusId] = useState('');

    const triggerNode = useMemo(
        () => nodes.find((n) => n.type === 'trigger'),
        [nodes],
    );
    const triggerType = triggerNode?.data?.type;
    const triggerStoreId = triggerNode?.data?.config?.storeId || '';
    const triggerStatusId = triggerNode?.data?.config?.statusId || '';

    const relevantTrigger =
        triggerType === 'order_created' || triggerType === 'order_updated';

    const loading = ordersLoading || metaLoading;

    useEffect(() => {
        const fetchMeta = async () => {
            try {
                setMetaLoading(true);
                const [storesRes, statusesRes] = await Promise.all([
                    api.get('/lookups/stores', { params: { limit: 200, isActive: true } }),
                    api.get('/orders/statuses'),
                ]);

                setStores(normalizeStores(storesRes.data || []));
                setStatuses(
                    normalizeStatuses(
                        Array.isArray(statusesRes.data)
                            ? statusesRes.data
                            : statusesRes.data?.records || [],
                    ),
                );
            } catch (error) {
                console.error('Failed to fetch preview meta data:', error);
            } finally {
                setMetaLoading(false);
            }
        };

        fetchMeta();
    }, []);

    const fetchOrders = useCallback(async () => {
        try {
            setOrdersLoading(true);

            const params = {
                page: 1,
                per_page: 100,
            };

            if (triggerStoreId) {
                params.storeId = triggerStoreId;
            }

            if (triggerType === 'order_created') {
                params.status = 'new';
            } else if (triggerType === 'order_updated' && triggerStatusId) {
                params.statusId = triggerStatusId;
            }

            const res = await api.get('/orders', { params });
            const data = res.data || {};
            setOrders(Array.isArray(data.records) ? data.records : []);
        } catch (error) {
            console.error('Error fetching preview orders:', error);
            setOrders([]);
        } finally {
            setOrdersLoading(false);
        }
    }, [triggerStoreId, triggerStatusId, triggerType]);

    useEffect(() => {
        if (relevantTrigger) {
            fetchOrders();
        } else {
            setOrders([]);
        }
    }, [fetchOrders, relevantTrigger]);

    const availableStores = useMemo(() => {
        const merged = dedupeById([
            ...extraStores,
            ...stores,
            //   ...getFallbackStores(),
        ]);
        return merged;
    }, [extraStores, stores]);

    const availableStatuses = useMemo(() => {
        const merged = dedupeById([
            ...extraStatuses,
            ...statuses,
            //   ...getFallbackStatuses(),
        ]);
        return merged;
    }, [extraStatuses, statuses]);

    useEffect(() => {
        // if (!draftStoreId) {
        if (triggerStoreId && availableStores.some((s) => String(s?.id) === String(triggerStoreId))) {
            setDraftStoreId(triggerStoreId);
        }
        // }
    }, [availableStores, draftStoreId, triggerStoreId]);

    useEffect(() => {
        // if (!draftStatusId) {
        if (
            triggerType === 'order_updated' &&
            triggerStatusId &&
            availableStatuses.some((s) => String(s?.id) === String(triggerStatusId))
        ) {
            setDraftStatusId(triggerStatusId);
        } else if (triggerType === 'order_created') {
            const newStatus = availableStatuses.find((s) => s.code === 'new');
            setDraftStatusId(newStatus?.id || availableStatuses?.[0]?.id || CREATE_STATUS_OPTION);
        }
        // }
    }, [availableStatuses, draftStatusId, triggerStatusId, triggerType]);
    const { user } = useAuth();
    const adminId = user?.id;
    const presetMockOrders = useMemo(() => {
        if (!relevantTrigger) return [];
        return buildPresetMockOrders({
            triggerType,
            stores: availableStores,
            statuses: availableStatuses,
            triggerStoreId,
            triggerStatusId,
            adminId
        });
    }, [
        relevantTrigger,
        triggerType,
        availableStores,
        availableStatuses,
        triggerStoreId,
        triggerStatusId,
        adminId
    ]);

    const combinedMockOrders = useMemo(() => {
        return [...presetMockOrders, ...manualMockOrders];
    }, [presetMockOrders, manualMockOrders]);

    const filteredMockOrders = useMemo(
        () => combinedMockOrders.filter((order) => matchesSearch(order, search)),
        [combinedMockOrders, search],
    );

    const filteredOrders = useMemo(
        () => orders.filter((order) => matchesSearch(order, search)),
        [orders, search],
    );

    const handleOrderClick = (order) => {
        setSelectedOrder(order);
        // if (typeof onSelectOrder === 'function') {
        //     onSelectOrder(order);
        // }
    };

    const handleViewOrder = (order, e) => {
        e.stopPropagation();
        setSelectedOrder(order);
    };

    const handleUseOrder = (order, e) => {
        e.stopPropagation();

        // setSelectedOrder(order);
        if (typeof onSelectOrder === 'function') {
            onSelectOrder(order);
        }
    };

    const handleGenerateMockOrder = () => {
        let chosenStore = null;
        let chosenStatus = null;
        let finalStoreId = draftStoreId;
        let finalStatusId = draftStatusId;

        if (draftStoreId === CREATE_STORE_OPTION) {
            chosenStore = makeMockStore();
            setExtraStores((prev) => [chosenStore, ...prev]);
            finalStoreId = chosenStore?.id;
        } else {
            chosenStore =
                availableStores.find((s) => String(s?.id) === String(draftStoreId)) ||
                resolveStoreFromId({
                    selectedId: draftStoreId,
                    stores: availableStores,
                    triggerStoreId,
                });
        }

        if (draftStatusId === CREATE_STATUS_OPTION || !draftStatusId) {
            chosenStatus = makeMockStatus();
            setExtraStatuses((prev) => [chosenStatus, ...prev]);
            finalStatusId = chosenStatus?.id;
        } else {
            chosenStatus =
                availableStatuses.find((s) => String(s?.id) === String(draftStatusId)) ||
                resolveStatusFromId({
                    selectedId: draftStatusId,
                    statuses: availableStatuses,
                    triggerType,
                    triggerStatusId,
                }) ||
                makeMockStatus({
                    id: draftStatusId,
                    name: `Status ${String(draftStatusId).slice(0, 6)}`,
                });
        }

        const newOrder = buildMockOrder({
            seed: Date.now() % 1000000,
            index: manualMockOrders.length + 100,
            triggerType: triggerType || 'order_created',
            store: chosenStore,
            status: chosenStatus,
            pinnedLabel: 'Dynamic preview order',
            adminId
        });

        newOrder.storeId = finalStoreId;
        newOrder.statusId = finalStatusId;
        newOrder.store = chosenStore;
        newOrder.status = chosenStatus;

        setManualMockOrders((prev) => [newOrder, ...prev]);
        setSelectedOrder(newOrder);
        // if (typeof onSelectOrder === 'function') {
        //     onSelectOrder(newOrder);
        // }
    };

    if (!relevantTrigger) {
        return (
            <>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-40 cursor-pointer"
                />

                <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed top-0 end-0 h-full w-[320px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-50 shadow-2xl"
                >
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h2 className="text-[13px] font-black">معاينة المسار</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 text-center text-slate-400 text-[12px]">
                        هذا المحفز لا يتطلب اختيار طلب
                    </div>
                </motion.div>
            </>
        );
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-40 cursor-pointer"
            />

            <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 end-0 h-full w-[360px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-50 shadow-2xl flex flex-col"
            >
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-[13px] font-black">اختر طلب للمعاينة</h2>
                        <p className="text-[10px] text-slate-400 mt-1">
                            الطلبات التجريبية في الأعلى ثم الطلبات الحقيقية
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchOrders}
                            disabled={loading}
                            className="text-slate-400 hover:text-primary bg-white dark:bg-slate-800 rounded-xl p-2 border border-slate-100 dark:border-slate-800 transition-all hover:scale-110 disabled:opacity-50"
                            title="تحديث"
                        >
                            <RefreshCw size={18} className={cn(loading && 'animate-spin')} />
                        </button>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-4 border-b border-slate-50 dark:border-slate-800/50 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            placeholder="البحث بالاسم أو الهاتف..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl py-2 pl-9 pr-4 text-[11px] focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>

                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-3 bg-slate-50/70 dark:bg-slate-800/30">
                        <div className="flex items-center gap-2 mb-3">
                            <Plus size={14} className="text-primary" />
                            <span className="text-[11px] font-black">توليد طلب تجريبي</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            <div className="grid grid-cols-2 gap-2">
                                {/* اختيارات المتجر */}
                                {/* <div>
                                    <label className="block text-[9px] font-black text-slate-500 mb-1">
                                        المتجر
                                    </label>
                                    <Select  value={draftStoreId || ""} onValueChange={(val) => setDraftStoreId(val)} disabled={!!triggerStoreId}>
                                        <SelectTrigger  className="h-10 rounded-xl border-border bg-background text-sm">
                                            <SelectValue placeholder="اختر المتجر..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {triggerStoreId &&  draftStoreId !== triggerStoreId ? (
                                                <SelectItem value={triggerStoreId}>
                                                    متجر المحفز
                                                </SelectItem>
                                            ) : null}
                                            {availableStores.map((store) => (
                                                <SelectItem key={store?.id} value={store?.id}>
                                                    {store.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                
                                <div>
                                    <label className="block text-[9px] font-black text-slate-500 mb-1">
                                        الحالة
                                    </label>
                                    <Select value={draftStatusId || ""} onValueChange={(val) => setDraftStatusId(val)} disabled={!!triggerStatusId}>
                                        <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                                            <SelectValue placeholder="اختر الحالة..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {triggerType === 'order_updated' && triggerStatusId &&  draftStatusId !== triggerStatusId ? (
                                                <SelectItem value={triggerStatusId}>
                                                    حالة المحفز
                                                </SelectItem>
                                            ) : null}
                                            {availableStatuses.map((status) => (
                                                <SelectItem key={status?.id} value={status?.id}>
                                                    {status.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div> */}
                            </div>

                            <button
                                onClick={handleGenerateMockOrder}
                                className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white text-[11px] font-black py-2.5 flex items-center justify-center gap-2"
                            >
                                <Sparkles size={14} />
                                إضافة طلب تجريبي جديد
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                جاري التحميل...
                            </p>
                        </div>
                    ) : (
                        <>
                            {filteredMockOrders.length > 0 ? (
                                <div className="space-y-2">
                                    <div className="px-2 pt-1 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Sparkles size={14} className="text-purple-500" />
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                الطلبات التجريبية
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-slate-400">
                                            {filteredMockOrders.length}
                                        </span>
                                    </div>

                                    {filteredMockOrders.map((order) => (
                                        <PreviewOrderCard
                                            key={order?.id}
                                            order={order}
                                            isMock
                                            selected={selectedOrder?.id === order?.id}
                                            onSelect={handleOrderClick}
                                            onView={handleViewOrder}
                                            onUse={handleUseOrder}
                                        />
                                    ))}
                                </div>
                            ) : null}

                            {filteredOrders.length > 0 ? (
                                <div className="space-y-2">
                                    <div className="px-2 pt-1 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Layout size={14} className="text-slate-500" />
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                الطلبات الحقيقية
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-slate-400">
                                            {filteredOrders.length}
                                        </span>
                                    </div>

                                    {filteredOrders.map((order) => (
                                        <PreviewOrderCard
                                            key={order?.id}
                                            order={order}
                                            isMock={Boolean(order.__mock)}
                                            selected={selectedOrder?.id === order?.id}
                                            onSelect={handleOrderClick}
                                            onView={handleViewOrder}
                                            onUse={handleUseOrder}
                                        />
                                    ))}
                                </div>
                            ) : null}

                            {filteredMockOrders.length === 0 && filteredOrders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Layout className="w-8 h-8 text-slate-200" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        لا توجد طلبات
                                    </p>
                                </div>
                            ) : null}
                        </>
                    )}
                </div>

                <OrderDetailModal
                    order={selectedOrder}
                    open={!!selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            </motion.div>
        </>
    );
}