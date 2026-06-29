import { AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export function tenantId(me) {
    if (!me) return null;

    const roleName = typeof me.role === 'string' ? me.role : me.role?.name;
    if (roleName === 'super_admin') return null;
    if (roleName === 'admin') return me.id;

    return me.adminId;
}


export const platformCurrency = `${process.env.NEXT_PUBLIC_PLATFOMR_CURRENCY}`;

export const dollor = "USD"
export const dollorSign = "$"

 export  const alarmToast = (message) => {
  toast.custom((id) => (
    <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 px-2 py-2 shadow-lg dark:border-amber-800 dark:bg-amber-950">
      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          {message}
        </p>
      </div>
    </div>
  ));
};
