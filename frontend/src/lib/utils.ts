import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function getEventDate(dateStr: string | Date, timeStr?: string): Date {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  if (typeof dateStr === "string" && dateStr.includes("T")) return new Date(dateStr);
  const [year, month, day] = (dateStr as string).split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    date.setHours(hours || 0, minutes || 0, 0, 0);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date;
}
