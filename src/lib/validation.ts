// ABOUTME: Date validation for calendar events.
// ABOUTME: Provides month-aware day validation for yearless recurring dates.

const DAYS_PER_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

/** Returns the maximum valid day for a month (1-12). Feb returns 29 since leap day events are valid. */
export function daysInMonth(month: number): number {
  return DAYS_PER_MONTH[month - 1]
}

/** Returns true if day is a valid integer between 1 and the month's maximum. */
export function isValidDay(month: number, day: number): boolean {
  return Number.isInteger(day) && day >= 1 && day <= daysInMonth(month)
}
