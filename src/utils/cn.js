import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names conditionally
 * - supports strings, arrays, objects
 * - removes Tailwind conflicts (ex: p-2 vs p-4)
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
