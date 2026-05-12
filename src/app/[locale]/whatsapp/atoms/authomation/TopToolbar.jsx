import React from 'react';
import {
    Save,
    Play,
    Undo,
    Redo,
    Trash2,
    Rocket
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import Button_ from '@/components/atoms/Button';
import { useFlowStore } from '@/hook/useFlowStore';
import PageHeader from '@/components/atoms/Pageheader';

export function TopToolbar() {
    const router = useRouter();

    // Logic
    const clearFlow = useFlowStore((s) => s.clearFlow);
    const nodes = useFlowStore((s) => s.nodes);

    const handleSave = () => {
        toast.success("تم حفظ سير عمل الأتمتة بنجاح!");
    };

    const handlePublish = () => {
        if (nodes.length === 0) {
            toast.error("لا يمكن نشر سير عمل فارغ.");
            return;
        }
        toast.success("تم نشر سير العمل وهو الآن قيد التشغيل!");
    };

    return (
        <PageHeader
            breadcrumbs={[
                { name: "الرئيسية", href: "/dashboard" },
                { name: "واتساب", href: "/whatsapp" },
                { name: "باني الأتمتة" }
            ]}
            buttons={
                <div className="flex items-center gap-3">

                    {/* الأزرار الرئيسية */}
                    <Button_
                        variant="ghost"
                        tone="secondary"
                        size="sm"
                        icon={<Play size={16} />}
                        label="معاينة"
                        className="hidden sm:flex"
                    />

                    <Button_
                        variant="outline"
                        tone="secondary"
                        size="sm"
                        icon={<Save size={16} />}
                        label="حفظ التغييرات"
                        onClick={handleSave}
                        className="border-slate-200 dark:border-slate-800"
                    />

                    <Button_
                        variant="solid"
                        tone="primary"
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                        icon={<Rocket size={16} />}
                        label="نشر المسار"
                        onClick={handlePublish}
                    />
                </div>
            }
        />
    );
}