import type { ClassValue } from "clsx";
import * as clsxModule from "clsx";
import * as twMergeModule from "tailwind-merge";

type ClsxFn = (...inputs: ClassValue[]) => string;
type TwMergeFn = (value: string) => string;

const fallbackClsx: ClsxFn = (...inputs) =>
  inputs
    .flatMap((input) => {
      if (!input) return [];
      if (typeof input === "string" || typeof input === "number") return [String(input)];
      if (Array.isArray(input)) return fallbackClsx(...input);
      if (typeof input === "object") {
        return Object.entries(input)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key);
      }
      return [];
    })
    .join(" ");

const clsxExport =
  typeof (clsxModule as { default?: unknown }).default === "function"
    ? ((clsxModule as { default: ClsxFn }).default)
    : typeof (clsxModule as { clsx?: unknown }).clsx === "function"
      ? ((clsxModule as { clsx: ClsxFn }).clsx)
      : fallbackClsx;

const twMergeExport =
  typeof (twMergeModule as { default?: unknown }).default === "function"
    ? ((twMergeModule as { default: TwMergeFn }).default)
    : typeof (twMergeModule as { twMerge?: unknown }).twMerge === "function"
      ? ((twMergeModule as { twMerge: TwMergeFn }).twMerge)
      : undefined;

export function cn(...inputs: ClassValue[]) {
  const classes = clsxExport(...inputs);
  return twMergeExport ? twMergeExport(classes) : classes;
}
