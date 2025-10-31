import { DATE_LOCALE } from "../config";

export function formatRelativeTime(input: string | number | Date): string {
  const value = typeof input === "string" ? new Date(input) : new Date(input);
  const now = new Date();
  const diffMs = value.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const absSec = Math.abs(diffSec);

  const rtf = new Intl.RelativeTimeFormat(DATE_LOCALE, { numeric: "auto" });

  if (absSec < 60) return rtf.format(Math.round(diffSec), "second");
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHours = Math.round(diffMin / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, "day");
  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) return rtf.format(diffMonths, "month");
  const diffYears = Math.round(diffMonths / 12);
  return rtf.format(diffYears, "year");
}

export function formatDate(input: string | Date, options: Intl.DateTimeFormatOptions = {}): string {
  const value = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    dateStyle: "medium",
    ...options,
  }).format(value);
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

export function formatDistanceKm(kilometers: number | null | undefined): string {
  if (kilometers === undefined || kilometers === null) return "—";
  if (kilometers < 1) {
    return `${Math.round(kilometers * 1000)} m`;
  }
  if (kilometers < 50) {
    return `${kilometers.toFixed(1)} km`;
  }
  return `${Math.round(kilometers)} km`;
}
