// ABOUTME: Tests for holiday definitions and date computation functions.
// ABOUTME: Validates holiday dates against the example PDF calendars.

import { describe, it, expect } from 'vitest'
import { nthWeekdayOfMonth } from './holidays'

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
