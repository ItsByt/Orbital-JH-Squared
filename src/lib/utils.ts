import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

export function getCurrentAcadYear(): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); //0-indexed, so Jan is 0

  if (currentMonth >= 7) {
    return currentYear;
  } else {
    return currentYear - 1;
  }
}