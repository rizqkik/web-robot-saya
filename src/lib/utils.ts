import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatGasPpm(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "N/A";
  }

  if (value === 0) {
    return "0";
  }

  const absoluteValue = Math.abs(value);
  const fractionDigits = absoluteValue < 0.000001 ? 15 : absoluteValue < 1 ? 9 : 4;
  const fixedValue = value.toFixed(fractionDigits);
  const trimmedValue = fixedValue.replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "");

  return trimmedValue === "-0" ? "0" : trimmedValue;
}
