// File: orders/edit/[orderId]/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import CreateOrderPageComplete from '../../new/page';
import api from '@/utils/api';
import { useTranslations } from 'next-intl';

function normalizeAxiosError(err) {
  const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? 'Unexpected error';
  return Array.isArray(msg) ? msg.join(', ') : String(msg);
}

export default function EditOrderPage() {
  const t = useTranslations('createOrder');
  const params = useParams();
  const orderId = params?.orderId;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!orderId) return;

    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/orders/${orderId}`);
        setOrder(res.data);
      } catch (e) {
        toast.error(normalizeAxiosError(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">{t('loading.message')}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-600 dark:text-slate-300">{t('loading.notFound')}</p>
        </div>
      </div>
    );
  }

  return <CreateOrderPageComplete isEditMode={true} existingOrder={order} orderId={orderId} />;
}
