// ABOUTME: Tests for holiday definitions and date computation functions.
// ABOUTME: Validates holiday dates against the example PDF calendars.

import { describe, it, expect } from 'vitest'
import { nthWeekdayOfMonth, HOLIDAY_DEFINITIONS, getHolidaysForMonth } from './holidays'

describe('nthWeekdayOfMonth', () => {
  it('3rd Monday of February 2026 is day 16', () => {
    expect(nthWeekdayOfMonth(2026, 2, 1, 3)).toBe(16)
  })

  it('4th Thursday of November 2025 is day 27', () => {
    expect(nthWeekdayOfMonth(2025, 11, 4, 4)).toBe(27)
  })

  it('1st Sunday of May 2025 is day 4', () => {
    expect(nthWeekdayOfMonth(2025, 5, 0, 1)).toBe(4)
  })
})

function findHoliday(name: string) {
  const def = HOLIDAY_DEFINITIONS.find(h => h.name === name)
  if (!def) throw new Error(`Holiday not found: ${name}`)
  return def
}

describe('holiday definitions', () => {
  it('each holiday definition produces the correct date for example PDF years', () => {
    // All dates verified against extracted example PDFs
    const expected: Array<{ name: string; year: number; month: number; day: number }> = [
      // January 2024
      { name: "NEW YEARS DAY", year: 2024, month: 1, day: 1 },
      { name: "MARTIN LUTHER KING DAY", year: 2024, month: 1, day: 15 },
      // March 2025
      { name: "ASH WEDNESDAY", year: 2025, month: 3, day: 5 },
      { name: "ST PATRICK'S DAY", year: 2025, month: 3, day: 17 },
      { name: "SPRING BEGINS", year: 2025, month: 3, day: 20 },
      // April 2025
      { name: "ALL FOOLS' DAY", year: 2025, month: 4, day: 1 },
      { name: "PALM SUNDAY", year: 2025, month: 4, day: 13 },
      { name: "PASSOVER BEGINS", year: 2025, month: 4, day: 13 },
      { name: "GOOD FRIDAY", year: 2025, month: 4, day: 18 },
      { name: "EASTER SUNDAY", year: 2025, month: 4, day: 20 },
      { name: "EARTH DAY", year: 2025, month: 4, day: 22 },
      { name: "PROFESSIONALS DAY", year: 2025, month: 4, day: 23 },
      // May 2024
      { name: "NATIONAL DAY OF PRAYER", year: 2024, month: 5, day: 2 },
      { name: "ASCENSION DAY", year: 2024, month: 5, day: 9 },
      { name: "MOTHER'S DAY", year: 2024, month: 5, day: 12 },
      { name: "ARMED FORCES DAY", year: 2024, month: 5, day: 18 },
      { name: "MEMORIAL DAY", year: 2024, month: 5, day: 27 },
      // June 2024
      { name: "FLAG DAY", year: 2024, month: 6, day: 14 },
      { name: "FATHER'S DAY", year: 2024, month: 6, day: 16 },
      { name: "SUMMER BEGINS", year: 2024, month: 6, day: 20 },
      // July 2025
      { name: "INDEPENDENCE DAY", year: 2025, month: 7, day: 4 },
      // September 2024
      { name: "LABOR DAY", year: 2024, month: 9, day: 2 },
      { name: "GRANDPARENTS DAY", year: 2024, month: 9, day: 8 },
      { name: "PATRIOT DAY", year: 2024, month: 9, day: 11 },
      { name: "AUTUMN BEGINS", year: 2024, month: 9, day: 22 },
      // October 2024
      { name: "COLUMBUS DAY", year: 2024, month: 10, day: 14 },
      { name: "NATIONAL BOSS DAY", year: 2024, month: 10, day: 16 },
      { name: "HALLOWEEN", year: 2024, month: 10, day: 31 },
      // November 2025
      { name: "ALL SAINTS' DAY", year: 2025, month: 11, day: 1 },
      { name: "ELECTION DAY", year: 2025, month: 11, day: 4 },
      { name: "VETERANS DAY", year: 2025, month: 11, day: 11 },
      { name: "THANKSGIVING DAY", year: 2025, month: 11, day: 27 },
      // December 2025
      { name: "PEARL HARBOR DAY", year: 2025, month: 12, day: 7 },
      { name: "HANUKKAH BEGINS", year: 2025, month: 12, day: 15 },
      { name: "WINTER BEGINS", year: 2025, month: 12, day: 21 },
      { name: "CHRISTMAS DAY", year: 2025, month: 12, day: 25 },
      // February 2026
      { name: "GROUND HOG DAY", year: 2026, month: 2, day: 2 },
      { name: "LINCOLN'S BIRTHDAY", year: 2026, month: 2, day: 12 },
      { name: "PRESIDENTS' DAY", year: 2026, month: 2, day: 16 },
      { name: "WASHINGTON'S BIRTHDAY", year: 2026, month: 2, day: 22 },
    ]

    for (const { name, year, month, day } of expected) {
      const def = findHoliday(name)
      const result = def.compute(year)
      expect(result, `${name} in ${year}`).toEqual({ month, day })
    }
  })

  it('floating holidays compute correctly for 2026', () => {
    // Presidents' Day 2026 → Feb 16 (verified against Feb 2026 example PDF)
    expect(findHoliday("PRESIDENTS' DAY").compute(2026)).toEqual({ month: 2, day: 16 })
    // Thanksgiving 2026 → Nov 26 (4th Thursday of November)
    expect(findHoliday("THANKSGIVING DAY").compute(2026)).toEqual({ month: 11, day: 26 })
    // Easter 2026 → April 5
    expect(findHoliday("EASTER SUNDAY").compute(2026)).toEqual({ month: 4, day: 5 })
    // Mother's Day 2026 → May 10 (2nd Sunday of May)
    expect(findHoliday("MOTHER'S DAY").compute(2026)).toEqual({ month: 5, day: 10 })
  })

  it('Election Day appears every year (matches example PDFs)', () => {
    // Nov 2025 PDF shows ELECTION DAY on Nov 4 (odd year)
    const result2025 = findHoliday("ELECTION DAY").compute(2025)
    expect(result2025).toEqual({ month: 11, day: 4 })
    // Even year should also work
    const result2024 = findHoliday("ELECTION DAY").compute(2024)
    expect(result2024).toEqual({ month: 11, day: 5 })
  })
})

describe('getHolidaysForMonth', () => {
  const allHolidayNames = HOLIDAY_DEFINITIONS.map(h => h.name)

  it('returns only holidays in the given month', () => {
    // December 2025: should include Christmas, Pearl Harbor Day, Hanukkah, Winter Begins
    const dec2025 = getHolidaysForMonth(2025, 12, allHolidayNames)
    const names = dec2025.map(h => h.name)
    expect(names).toContain("CHRISTMAS DAY")
    expect(names).toContain("PEARL HARBOR DAY")
    expect(names).toContain("HANUKKAH BEGINS")
    expect(names).toContain("WINTER BEGINS")
    // Should NOT include holidays from other months
    expect(names).not.toContain("NEW YEARS DAY")
    expect(names).not.toContain("HALLOWEEN")
  })

  it('respects the enabled list — disabled holidays are excluded', () => {
    const enabled = allHolidayNames.filter(n => n !== "CHRISTMAS DAY")
    const dec2025 = getHolidaysForMonth(2025, 12, enabled)
    const names = dec2025.map(h => h.name)
    expect(names).not.toContain("CHRISTMAS DAY")
    expect(names).toContain("PEARL HARBOR DAY")
  })

  it('returns empty array when no holidays fall in the month', () => {
    // August has no holidays in our list
    const aug2025 = getHolidaysForMonth(2025, 8, allHolidayNames)
    expect(aug2025).toEqual([])
  })

  it('includes custom holidays', () => {
    const custom = [{ name: "PAPA'S BIRTHDAY", month: 12, day: 15 }]
    const dec2025 = getHolidaysForMonth(2025, 12, allHolidayNames, custom)
    const names = dec2025.map(h => h.name)
    expect(names).toContain("PAPA'S BIRTHDAY")
    expect(names).toContain("CHRISTMAS DAY")
  })
})
