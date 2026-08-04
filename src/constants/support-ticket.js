export const TICKET_STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  WAITING_ON_CUSTOMER: "waiting_on_customer",
  ON_HOLD: "on_hold",
  RESOLVED: "resolved",
  CLOSED: "closed",
  REOPENED: "reopened",
  CANCELED: "canceled",
};

export const TICKET_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

export const STATUS_TRANSITIONS = {
  [TICKET_STATUS.OPEN]: [
    TICKET_STATUS.IN_PROGRESS,
    TICKET_STATUS.WAITING_ON_CUSTOMER,
    TICKET_STATUS.ON_HOLD,
    TICKET_STATUS.RESOLVED,
    TICKET_STATUS.CANCELED,
  ],
  [TICKET_STATUS.IN_PROGRESS]: [
    TICKET_STATUS.WAITING_ON_CUSTOMER,
    TICKET_STATUS.ON_HOLD,
    TICKET_STATUS.RESOLVED,
    TICKET_STATUS.CLOSED,
    TICKET_STATUS.CANCELED,
  ],
  [TICKET_STATUS.WAITING_ON_CUSTOMER]: [
    TICKET_STATUS.IN_PROGRESS,
    TICKET_STATUS.ON_HOLD,
    TICKET_STATUS.RESOLVED,
    TICKET_STATUS.CLOSED,
    TICKET_STATUS.CANCELED,
  ],
  [TICKET_STATUS.ON_HOLD]: [
    TICKET_STATUS.IN_PROGRESS,
    TICKET_STATUS.WAITING_ON_CUSTOMER,
    TICKET_STATUS.RESOLVED,
    TICKET_STATUS.CLOSED,
    TICKET_STATUS.CANCELED,
  ],
  [TICKET_STATUS.RESOLVED]: [TICKET_STATUS.CLOSED, TICKET_STATUS.REOPENED],
  [TICKET_STATUS.CLOSED]: [TICKET_STATUS.REOPENED],
  [TICKET_STATUS.REOPENED]: [
    TICKET_STATUS.IN_PROGRESS,
    TICKET_STATUS.WAITING_ON_CUSTOMER,
    TICKET_STATUS.ON_HOLD,
    TICKET_STATUS.RESOLVED,
    TICKET_STATUS.CLOSED,
  ],
  [TICKET_STATUS.CANCELED]: [TICKET_STATUS.REOPENED],
};

export const TERMINAL_STATUSES = [
  TICKET_STATUS.CLOSED,
  TICKET_STATUS.CANCELED,
];

export const allowedTransitionsFor = (status) =>
  STATUS_TRANSITIONS[status] || [];

export const STATUS_BADGE = {
  open: {
    variant: "outline",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  in_progress: {
    variant: "outline",
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  waiting_on_customer: {
    variant: "outline",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  on_hold: {
    variant: "outline",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  resolved: {
    variant: "outline",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  closed: {
    variant: "outline",
    className: "bg-zinc-100 text-zinc-700 border-zinc-200",
  },
  reopened: {
    variant: "outline",
    className: "bg-sky-100 text-sky-700 border-sky-200",
  },
  canceled: {
    variant: "outline",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

export const PRIORITY_BADGE = {
  low: {
    variant: "outline",
    className: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
  medium: {
    variant: "outline",
    className: "bg-sky-50 text-sky-600 border-sky-200",
  },
  high: {
    variant: "outline",
    className: "bg-amber-50 text-amber-600 border-amber-200",
  },
  urgent: {
    variant: "outline",
    className: "bg-red-50 text-red-600 border-red-200 animate-pulse",
  },
};

export const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
];

export const MAX_PER_FILE_IMAGE = 10 * 1024 * 1024;
export const MAX_PER_FILE_DOC = 25 * 1024 * 1024;
export const MAX_PER_FILE_VIDEO = 100 * 1024 * 1024;
export const MAX_FILES_PER_MSG = 10;

export const isImageMime = (mime) => (mime || "").startsWith("image/");
export const isVideoMime = (mime) => (mime || "").startsWith("video/");

export function validateFileSize(file) {
  if (!file) return true;
  const mime = file.type || "";
  const limit = isVideoMime(mime)
    ? MAX_PER_FILE_VIDEO
    : isImageMime(mime)
      ? MAX_PER_FILE_IMAGE
      : MAX_PER_FILE_DOC;
  return file.size <= limit;
}

export function validateMime(file) {
  if (!file) return true;
  return ALLOWED_MIME.includes(file.type || "");
}
