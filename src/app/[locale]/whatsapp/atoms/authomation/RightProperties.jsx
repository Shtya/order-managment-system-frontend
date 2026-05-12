import { useFlowStore } from '@/hook/useFlowStore';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointer2, Settings2, HelpCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export function RightProperties() {
  const { nodes, selectedNodeId, updateNodeData } = useFlowStore();
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const handleUpdateConfig = (key, value) => {
    updateNodeData(selectedNode.id, {
      config: { ...selectedNode.data.config, [key]: value }
    });
  };

  return (
    <aside className="w-96 border-l border-slate-200 bg-white h-full flex flex-col z-10 dark:bg-slate-950 dark:border-slate-800">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 size={18} className="text-primary" />
          <h2 className="font-bold text-slate-900 dark:text-white">الخصائص</h2>
        </div>
        {selectedNode && (
          <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-500 uppercase">
            {selectedNode.type === 'trigger' ? 'محفز' : selectedNode.type === 'condition' ? 'شرط' : 'إجراء'}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {!selectedNode ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center p-8"
            >
              <div className="h-20 w-20 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-800">
                <MousePointer2 size={32} className="text-slate-300" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200">لا يوجد عنصر محدد</h3>
              <p className="text-xs text-slate-500 mt-2 max-w-[200px] leading-relaxed">اختر أي عنصر من مساحة العمل لتكوين سلوكه وإعداداته.</p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6 space-y-8 text-right rtl"
            >
              {/* Trigger Configuration */}
              {selectedNode.type === 'trigger' && (
                <div className="space-y-6">
                  <FormGroup label="حدث المحفز" description="اختر الحدث الذي يبدأ هذه الأتمتة">
                    <select
                      className="w-full h-11 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-800 appearance-none"
                      value={selectedNode.data.triggerType || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { triggerType: e.target.value })}
                    >
                      <option value="">اختر حدثاً...</option>
                      <option value="order_created">إنشاء طلب جديد</option>
                      <option value="customer_signup">تسجيل عميل جديد</option>
                      <option value="scheduled">مجدول (Cron)</option>
                    </select>
                  </FormGroup>

                  <FormGroup label="المتجر المستهدف" description="اختياري: التصفية حسب المتجر">
                    <select
                      className="w-full h-11 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-800 appearance-none"
                      value={selectedNode.data.config?.store || ''}
                      onChange={(e) => handleUpdateConfig('store', e.target.value)}
                    >
                      <option value="all">جميع المتاجر</option>
                      <option value="main">المتجر الرئيسي</option>
                      <option value="dubai">فرع دبي</option>
                    </select>
                  </FormGroup>
                </div>
              )}

              {/* WhatsApp Action Configuration */}
              {selectedNode.type === 'whatsapp' && (
                <div className="space-y-6">
                  <FormGroup label="قالب الرسالة" description="اختر قالباً معتمداً من الواتساب">
                    <select
                      className="w-full h-11 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-800 appearance-none"
                      value={selectedNode.data.config?.templateId || ''}
                      onChange={(e) => {
                        const opt = e.target.options[e.target.selectedIndex];
                        handleUpdateConfig('templateId', e.target.value);
                        handleUpdateConfig('templateName', opt.text);
                        // Mock buttons for the template
                        if (e.target.value === 'order_confirm') {
                          handleUpdateConfig('buttons', [{ label: 'تأكيد الطلب' }, { label: 'إلغاء الطلب' }]);
                        } else {
                          handleUpdateConfig('buttons', null);
                        }
                      }}
                    >
                      <option value="">اختر قالباً...</option>
                      <option value="welcome_v1">رسالة الترحيب v1</option>
                      <option value="order_confirm">تدفق تأكيد الطلب</option>
                      <option value="payment_reminder">تذكير بالدفع</option>
                    </select>
                  </FormGroup>

                  {selectedNode.data.config?.templateId && (
                    <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20">
                      <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-2">ربط المتغيرات</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-700 dark:text-emerald-300">{'{{1}}'}</span>
                          <input type="text" placeholder="اسم العميل" className="flex-1 bg-transparent border-none text-xs focus:ring-0 p-0 text-right" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Logic Condition Configuration */}
              {selectedNode.type === 'condition' && (
                <div className="space-y-6">
                  <FormGroup label="نوع المنطق">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => updateNodeData(selectedNode.id, { conditionType: 'filter' })}
                        className={cn("p-3 rounded-xl border text-[10px] font-bold uppercase transition-all",
                          selectedNode.data.conditionType !== 'button_click' ? "bg-primary text-white border-primary shadow-md" : "bg-slate-50 border-slate-100 text-slate-500 dark:bg-slate-900 dark:border-slate-800"
                        )}
                      >
                        تصفية الحقول
                      </button>
                      <button
                        onClick={() => updateNodeData(selectedNode.id, { conditionType: 'button_click' })}
                        className={cn("p-3 rounded-xl border text-[10px] font-bold uppercase transition-all",
                          selectedNode.data.conditionType === 'button_click' ? "bg-primary text-white border-primary shadow-md" : "bg-slate-50 border-slate-100 text-slate-500 dark:bg-slate-900 dark:border-slate-800"
                        )}
                      >
                        تفرع الأزرار
                      </button>
                    </div>
                  </FormGroup>

                  {selectedNode.data.conditionType === 'button_click' ? (
                    <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/20">
                      <p className="text-[11px] text-purple-700 dark:text-purple-300 leading-relaxed italic">
                        سيتم ملء هذا التفرع تلقائياً بالأزرار من عنصر رسالة الواتساب السابق بمجرد توصيله.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <FormGroup label="الحقل المطلوب فحصه">
                        <input
                          type="text"
                          className="w-full h-11 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-800 text-right"
                          placeholder="order.status"
                          value={selectedNode.data.config?.field || ''}
                          onChange={(e) => handleUpdateConfig('field', e.target.value)}
                        />
                      </FormGroup>
                      <div className="grid grid-cols-3 gap-2">
                        <FormGroup label="المعامل">
                          <select
                            className="w-full h-11 rounded-xl border-slate-200 bg-slate-50 px-2 text-sm dark:bg-slate-900 dark:border-slate-800 appearance-none"
                            value={selectedNode.data.config?.operator || '=='}
                            onChange={(e) => handleUpdateConfig('operator', e.target.value)}
                          >
                            <option value="==">يساوي</option>
                            <option value="!=">لا يساوي</option>
                            <option value=">">أكبر من</option>
                          </select>
                        </FormGroup>
                        <FormGroup label="القيمة" className="col-span-2">
                          <input
                            type="text"
                            className="w-full h-11 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm dark:bg-slate-900 dark:border-slate-800 text-right"
                            placeholder="PENDING"
                            value={selectedNode.data.config?.value || ''}
                            onChange={(e) => handleUpdateConfig('value', e.target.value)}
                          />
                        </FormGroup>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Update Order Configuration */}
              {selectedNode.type === 'action' && selectedNode.data.actionType === 'update_order' && (
                <div className="space-y-6">
                  <FormGroup label="الحالة المستهدفة" description="تغيير حالة الطلب إلى هذه القيمة">
                    <select
                      className="w-full h-11 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-800 appearance-none"
                      value={selectedNode.data.config?.status || ''}
                      onChange={(e) => handleUpdateConfig('status', e.target.value)}
                    >
                      <option value="">اختر حالة...</option>
                      <option value="pending">قيد الانتظار</option>
                      <option value="confirmed">تم التأكيد</option>
                      <option value="cancelled">ملغي</option>
                      <option value="processing">قيد المعالجة</option>
                    </select>
                  </FormGroup>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {selectedNode && (
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">تم حفظ التغييرات محلياً</span>
          </div>
        </div>
      )}
    </aside>
  );

}

function FormGroup({ label, description, children, className }) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">{label}</label>
        {description && (
          <div className="group relative">
            <HelpCircle size={12} className="text-slate-300 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-3 bg-slate-900 text-[10px] text-white rounded-xl shadow-xl z-50 leading-relaxed">
              {description}
            </div>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}