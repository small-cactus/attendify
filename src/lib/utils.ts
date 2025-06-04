import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Parse a date string in YYYY-MM-DD or ISO format into a Date using the local
// timezone. This prevents automatic UTC conversion that can shift the displayed
// day.
export function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date(NaN)
  // If the string already contains a time component, let the built-in parser
  // handle it since it represents a specific moment.
  if (dateString.includes('T')) {
    return new Date(dateString)
  }
  const [y, m, d] = dateString.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}
