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

function lastWeekdayOfMonth(year: number, month: number, weekday: number): number {
  const lastDay = new Date(year, month, 0).getDate()
  const lastDayWeekday = new Date(year, month - 1, lastDay).getDay()
  const daysBack = (lastDayWeekday - weekday + 7) % 7
  return lastDay - daysBack
}

// Easter date using the Anonymous Gregorian algorithm (computus)
function easterSunday(year: number): { month: number; day: number } {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return { month, day }
}

function addDays(year: number, month: number, day: number, offset: number): { month: number; day: number } {
  const d = new Date(year, month - 1, day + offset)
  return { month: d.getMonth() + 1, day: d.getDate() }
}

// Passover (15 Nisan) — dates as displayed on the example calendars
const PASSOVER_DATES: Record<number, { month: number; day: number }> = {
  2024: { month: 4, day: 23 },
  2025: { month: 4, day: 13 },
  2026: { month: 4, day: 2 },
  2027: { month: 4, day: 22 },
  2028: { month: 4, day: 11 },
  2029: { month: 3, day: 31 },
  2030: { month: 4, day: 18 },
}

// Hanukkah (25 Kislev) — dates as displayed on the example calendars
const HANUKKAH_DATES: Record<number, { month: number; day: number }> = {
  2024: { month: 12, day: 26 },
  2025: { month: 12, day: 15 },
  2026: { month: 12, day: 5 },
  2027: { month: 12, day: 25 },
  2028: { month: 12, day: 13 },
  2029: { month: 12, day: 2 },
  2030: { month: 12, day: 21 },
}

// Equinox/solstice dates (approximate, verified against example PDFs)
const SPRING_BEGINS: Record<number, number> = {
  2024: 19, 2025: 20, 2026: 20, 2027: 20, 2028: 19, 2029: 20, 2030: 20,
}
const SUMMER_BEGINS: Record<number, number> = {
  2024: 20, 2025: 20, 2026: 21, 2027: 21, 2028: 20, 2029: 20, 2030: 21,
}
const AUTUMN_BEGINS: Record<number, number> = {
  2024: 22, 2025: 22, 2026: 22, 2027: 22, 2028: 22, 2029: 22, 2030: 22,
}
const WINTER_BEGINS: Record<number, number> = {
  2024: 21, 2025: 21, 2026: 21, 2027: 21, 2028: 21, 2029: 21, 2030: 21,
}

export interface HolidayDefinition {
  name: string
  compute: (year: number) => { month: number; day: number } | null
}

const fixed = (month: number, day: number) =>
  () => ({ month, day })

export const HOLIDAY_DEFINITIONS: HolidayDefinition[] = [
  // Fixed-date holidays
  { name: "NEW YEARS DAY", compute: fixed(1, 1) },
  { name: "GROUND HOG DAY", compute: fixed(2, 2) },
  { name: "LINCOLN'S BIRTHDAY", compute: fixed(2, 12) },
  { name: "WASHINGTON'S BIRTHDAY", compute: fixed(2, 22) },
  { name: "ST PATRICK'S DAY", compute: fixed(3, 17) },
  { name: "ALL FOOLS' DAY", compute: fixed(4, 1) },
  { name: "EARTH DAY", compute: fixed(4, 22) },
  { name: "FLAG DAY", compute: fixed(6, 14) },
  { name: "INDEPENDENCE DAY", compute: fixed(7, 4) },
  { name: "PATRIOT DAY", compute: fixed(9, 11) },
  { name: "NATIONAL BOSS DAY", compute: fixed(10, 16) },
  { name: "HALLOWEEN", compute: fixed(10, 31) },
  { name: "ALL SAINTS' DAY", compute: fixed(11, 1) },
  { name: "VETERANS DAY", compute: fixed(11, 11) },
  { name: "PEARL HARBOR DAY", compute: fixed(12, 7) },
  { name: "CHRISTMAS DAY", compute: fixed(12, 25) },

  // Floating holidays — weekday-based
  { name: "MARTIN LUTHER KING DAY", compute: (y) => ({ month: 1, day: nthWeekdayOfMonth(y, 1, 1, 3) }) },
  { name: "PRESIDENTS' DAY", compute: (y) => ({ month: 2, day: nthWeekdayOfMonth(y, 2, 1, 3) }) },
  { name: "MOTHER'S DAY", compute: (y) => ({ month: 5, day: nthWeekdayOfMonth(y, 5, 0, 2) }) },
  { name: "ARMED FORCES DAY", compute: (y) => ({ month: 5, day: nthWeekdayOfMonth(y, 5, 6, 3) }) },
  { name: "MEMORIAL DAY", compute: (y) => ({ month: 5, day: lastWeekdayOfMonth(y, 5, 1) }) },
  { name: "FATHER'S DAY", compute: (y) => ({ month: 6, day: nthWeekdayOfMonth(y, 6, 0, 3) }) },
  { name: "LABOR DAY", compute: (y) => ({ month: 9, day: nthWeekdayOfMonth(y, 9, 1, 1) }) },
  { name: "GRANDPARENTS DAY", compute: (y) => {
    // Sunday after the first Monday of September
    const laborDay = nthWeekdayOfMonth(y, 9, 1, 1)
    return { month: 9, day: laborDay + 6 }
  }},
  { name: "COLUMBUS DAY", compute: (y) => ({ month: 10, day: nthWeekdayOfMonth(y, 10, 1, 2) }) },
  { name: "ELECTION DAY", compute: (y) => {
    // First Tuesday after the first Monday of November
    const firstMonday = nthWeekdayOfMonth(y, 11, 1, 1)
    return { month: 11, day: firstMonday + 1 }
  }},
  { name: "THANKSGIVING DAY", compute: (y) => ({ month: 11, day: nthWeekdayOfMonth(y, 11, 4, 4) }) },
  { name: "NATIONAL DAY OF PRAYER", compute: (y) => ({ month: 5, day: nthWeekdayOfMonth(y, 5, 4, 1) }) },

  // Professionals Day: Wednesday of the last full week (Mon-Fri) of April
  { name: "PROFESSIONALS DAY", compute: (y) => {
    // Find the last Friday in April, then go back to its Wednesday
    const lastFriday = lastWeekdayOfMonth(y, 4, 5)
    return { month: 4, day: lastFriday - 2 }
  }},

  // Easter-dependent holidays
  { name: "EASTER SUNDAY", compute: (y) => easterSunday(y) },
  { name: "GOOD FRIDAY", compute: (y) => {
    const easter = easterSunday(y)
    return addDays(y, easter.month, easter.day, -2)
  }},
  { name: "PALM SUNDAY", compute: (y) => {
    const easter = easterSunday(y)
    return addDays(y, easter.month, easter.day, -7)
  }},
  { name: "ASH WEDNESDAY", compute: (y) => {
    const easter = easterSunday(y)
    return addDays(y, easter.month, easter.day, -46)
  }},
  { name: "ASCENSION DAY", compute: (y) => {
    const easter = easterSunday(y)
    return addDays(y, easter.month, easter.day, 39)
  }},

  // Hebrew calendar holidays (lookup table)
  { name: "PASSOVER BEGINS", compute: (y) => PASSOVER_DATES[y] ?? null },
  { name: "HANUKKAH BEGINS", compute: (y) => HANUKKAH_DATES[y] ?? null },

  // Seasonal dates (equinoxes and solstices)
  { name: "SPRING BEGINS", compute: (y) => SPRING_BEGINS[y] ? { month: 3, day: SPRING_BEGINS[y] } : null },
  { name: "SUMMER BEGINS", compute: (y) => SUMMER_BEGINS[y] ? { month: 6, day: SUMMER_BEGINS[y] } : null },
  { name: "AUTUMN BEGINS", compute: (y) => AUTUMN_BEGINS[y] ? { month: 9, day: AUTUMN_BEGINS[y] } : null },
  { name: "WINTER BEGINS", compute: (y) => WINTER_BEGINS[y] ? { month: 12, day: WINTER_BEGINS[y] } : null },
]
