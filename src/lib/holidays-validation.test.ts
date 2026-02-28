// ABOUTME: Validates holiday definitions against dates extracted from example PDFs.
// ABOUTME: Ensures computed holidays match the actual calendars.

import { describe, it, expect } from 'vitest'
import { HOLIDAY_DEFINITIONS } from './holidays'

// Holidays extracted from example PDFs, verified against layout positions.
// Each entry: [name, year, month, day]
const PDF_HOLIDAYS: [string, number, number, number][] = [
  // January 2024
  ['NEW YEARS DAY', 2024, 1, 1],
  ['MARTIN LUTHER KING DAY', 2024, 1, 15],

  // February 2026
  ['GROUND HOG DAY', 2026, 2, 2],
  ["LINCOLN'S BIRTHDAY", 2026, 2, 12],
  ["PRESIDENTS' DAY", 2026, 2, 16],
  ["WASHINGTON'S BIRTHDAY", 2026, 2, 22],

  // March 2025
  ['ASH WEDNESDAY', 2025, 3, 5],
  ["ST PATRICK'S DAY", 2025, 3, 17],
  ['SPRING BEGINS', 2025, 3, 20],

  // April 2025
  ["ALL FOOLS' DAY", 2025, 4, 1],
  ['PALM SUNDAY', 2025, 4, 13],
  ['PASSOVER BEGINS', 2025, 4, 13],
  ['GOOD FRIDAY', 2025, 4, 18],
  ['EASTER SUNDAY', 2025, 4, 20],
  ['EARTH DAY', 2025, 4, 22],
  ['PROFESSIONALS DAY', 2025, 4, 23],

  // May 2024
  ['NATIONAL DAY OF PRAYER', 2024, 5, 2],
  ['ASCENSION DAY', 2024, 5, 9],
  ["MOTHER'S DAY", 2024, 5, 12],
  ['ARMED FORCES DAY', 2024, 5, 18],
  ['MEMORIAL DAY', 2024, 5, 27],

  // June 2024
  ['FLAG DAY', 2024, 6, 14],
  ["FATHER'S DAY", 2024, 6, 16],
  ['SUMMER BEGINS', 2024, 6, 20],

  // July 2025
  ['INDEPENDENCE DAY', 2025, 7, 4],

  // August 2024
  // (no holidays in August)

  // September 2024
  ['LABOR DAY', 2024, 9, 2],
  ['GRANDPARENTS DAY', 2024, 9, 8],
  ['PATRIOT DAY', 2024, 9, 11],
  ['AUTUMN BEGINS', 2024, 9, 22],

  // October 2024
  ['COLUMBUS DAY', 2024, 10, 14],
  ['NATIONAL BOSS DAY', 2024, 10, 16],
  ['HALLOWEEN', 2024, 10, 31],

  // November 2025
  ["ALL SAINTS' DAY", 2025, 11, 1],
  ['ELECTION DAY', 2025, 11, 4],
  ['VETERANS DAY', 2025, 11, 11],
  ['THANKSGIVING DAY', 2025, 11, 27],

  // December 2025
  ['PEARL HARBOR DAY', 2025, 12, 7],
  ['HANUKKAH BEGINS', 2025, 12, 15],
  ['WINTER BEGINS', 2025, 12, 21],
  ['CHRISTMAS DAY', 2025, 12, 25],
]

describe('holiday definitions match example PDFs', () => {
  const defMap = new Map(HOLIDAY_DEFINITIONS.map((d) => [d.name, d]))

  for (const [name, year, month, day] of PDF_HOLIDAYS) {
    it(`${name} in ${year} is ${month}/${day}`, () => {
      const def = defMap.get(name)
      expect(def, `No definition found for "${name}"`).toBeDefined()
      const result = def!.compute(year)
      expect(result, `${name} returned null for ${year}`).not.toBeNull()
      expect(result!.month).toBe(month)
      expect(result!.day).toBe(day)
    })
  }
})
