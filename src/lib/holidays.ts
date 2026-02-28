// ABOUTME: Holiday definitions and date computation for calendar display.
// ABOUTME: Contains fixed and floating holiday rules derived from example calendars.

/**
 * Returns the day-of-month for the nth occurrence of a weekday in a given month.
 * weekday: 0=Sunday, 1=Monday, ..., 6=Saturday
 * n: 1-based (1=first, 2=second, etc.)
 */
export function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): number {
  const firstOfMonth = new Date(year, month - 1, 1)
  const firstWeekday = firstOfMonth.getDay()
  // Days until the first occurrence of the target weekday
  const daysUntilFirst = (weekday - firstWeekday + 7) % 7
  return 1 + daysUntilFirst + (n - 1) * 7
}
