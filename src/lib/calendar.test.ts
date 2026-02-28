// ABOUTME: Tests for calendar grid logic — date math, event placement, and overflow handling.
// ABOUTME: Validates buildCalendarGrid against known month layouts and edge cases.

import { describe, test, expect } from 'vitest'
import { buildCalendarGrid } from './calendar'

describe('buildCalendarGrid', () => {
  test('February 2026 starts on Sunday, has 28 days, needs 4 rows', () => {
    const grid = buildCalendarGrid(2026, 2, [], [], [])

    expect(grid.year).toBe(2026)
    expect(grid.month).toBe(2)
    expect(grid.weeks).toHaveLength(4)

    // Feb 1 2026 is Sunday (column 0)
    expect(grid.weeks[0][0]).not.toBeNull()
    expect(grid.weeks[0][0]!.day).toBe(1)

    // Feb 7 is Saturday (column 6)
    expect(grid.weeks[0][6]).not.toBeNull()
    expect(grid.weeks[0][6]!.day).toBe(7)

    // Feb 28 is Saturday (last day), row 3 column 6
    expect(grid.weeks[3][6]).not.toBeNull()
    expect(grid.weeks[3][6]!.day).toBe(28)

    // No nulls at all — Feb 2026 perfectly fills 4 weeks
    for (const week of grid.weeks) {
      for (const cell of week) {
        expect(cell).not.toBeNull()
      }
    }

    expect(grid.overflowEvents).toEqual([])
  })

  test('November 2025 starts on Saturday, needs 6 rows', () => {
    const grid = buildCalendarGrid(2025, 11, [], [], [])

    expect(grid.weeks).toHaveLength(6)

    // Nov 1 2025 is Saturday (column 6)
    expect(grid.weeks[0][0]).toBeNull()
    expect(grid.weeks[0][6]).not.toBeNull()
    expect(grid.weeks[0][6]!.day).toBe(1)

    // Nov 30 is Sunday (column 0) in row 5
    expect(grid.weeks[5][0]).not.toBeNull()
    expect(grid.weeks[5][0]!.day).toBe(30)

    // Rest of row 5 should be null
    for (let col = 1; col < 7; col++) {
      expect(grid.weeks[5][col]).toBeNull()
    }
  })
})
