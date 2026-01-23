// File: bundles/edit/[id]/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import AddBundlePage from '../../new/page';
import api from '@/utils/api';

function normalizeAxiosError(err) {
	const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? 'Unexpected error';
	return Array.isArray(msg) ? msg.join(', ') : String(msg);
}

export default function EditBundlePage() {
	const t = useTranslations('addProduct');
	const params = useParams();
	const bundleId = params?.id;

	const [bundle, setBundle] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!bundleId) return;

		(async () => {
			try {
				const res = await api.get(`/bundles/${bundleId}`);
				setBundle(res.data);
			} catch (err) {
				toast.error(normalizeAxiosError(err));
			} finally {
				setLoading(false);
			}
		})();
	}, [bundleId]);

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

	if (!bundle) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<p className="text-lg text-slate-600 dark:text-slate-300">{t('loading.notFound')}</p>
				</div>
			</div>
		);
	} 

	return <AddBundlePage isEditMode={true} existingBundle={bundle} bundleId={bundleId} />;
}