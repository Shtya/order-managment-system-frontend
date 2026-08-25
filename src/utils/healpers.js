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

export const DEFAULT_FONT_FAMILY = "Cairo";

export const PLATFORM_CURRENCY = "EGP"

// Returns normalized startDate/endDate ISO strings for API params.
// "YYYY-MM-DD" inputs are treated as local dates:
//   startDate = local midnight of the start day,
//   endDate   = local midnight of the day AFTER the end day (keeps the whole end day).
export function getDateRangeParams(filters) {
  const out = {};
  if (!filters) return out;

  const toLocalMidnight = (value, addDay = false) => {
    if (!value) return null;
    let date;
    if (value instanceof Date) {
      date = new Date(value);
    } else if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-").map(Number);
      date = new Date(y, m - 1, d);
    } else {
      date = new Date(value);
    }
    if (isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    if (addDay) date.setDate(date.getDate() + 1);
    return date;
  };

  const start = toLocalMidnight(filters.startDate);
  const end = filters.endDate
    ? toLocalMidnight(filters.endDate, true)
    : null;

  if (start) out.startDate = start.toISOString();
  if (end) {
    out.endDate = end.toISOString();
  } else if (start) {
    out.endDate = null;
  }

  return out;
}
