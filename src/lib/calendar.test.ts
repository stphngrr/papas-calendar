// ABOUTME: Tests for calendar grid logic — date math, event placement, and overflow handling.
// ABOUTME: Validates buildCalendarGrid against known month layouts and edge cases.

import { describe, test, expect } from 'vitest'
import { buildCalendarGrid } from './calendar'
import type { CalendarEvent, Holiday, MoonPhase } from '../types'

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

  test('events are placed in the correct day cells', () => {
    const events: CalendarEvent[] = [
      { id: '1', name: 'Amy Holland', type: 'B', month: 2, day: 4, groups: ['Lewis'] },
      { id: '2', name: 'Sam Jones', type: 'A', month: 2, day: 28, groups: ['Lewis'] },
    ]

    const grid = buildCalendarGrid(2026, 2, events, [], [])

    // Feb 4 2026 is Wednesday (row 0, col 3)
    const feb4 = grid.weeks[0][3]
    expect(feb4).not.toBeNull()
    expect(feb4!.day).toBe(4)
    expect(feb4!.events).toHaveLength(1)
    expect(feb4!.events[0].name).toBe('Amy Holland')

    // Feb 28 2026 is Saturday (row 3, col 6)
    const feb28 = grid.weeks[3][6]
    expect(feb28).not.toBeNull()
    expect(feb28!.day).toBe(28)
    expect(feb28!.events).toHaveLength(1)
    expect(feb28!.events[0].name).toBe('Sam Jones')
  })

  test('events on nonexistent dates go into overflowEvents', () => {
    const events: CalendarEvent[] = [
      { id: '1', name: 'Matt & Elizabeth Kern', type: 'A', month: 2, day: 29, groups: ['Lewis'] },
      { id: '2', name: 'Amy Holland', type: 'B', month: 2, day: 4, groups: ['Lewis'] },
    ]

    // 2026 is not a leap year — Feb has 28 days
    const grid = buildCalendarGrid(2026, 2, events, [], [])

    expect(grid.overflowEvents).toHaveLength(1)
    expect(grid.overflowEvents[0].name).toBe('Matt & Elizabeth Kern')

    // The Feb 29 event should NOT appear in any cell
    for (const week of grid.weeks) {
      for (const cell of week) {
        if (cell) {
          for (const event of cell.events) {
            expect(event.day).not.toBe(29)
          }
        }
      }
    }

    // The Feb 4 event should still be in the grid
    const feb4 = grid.weeks[0][3]
    expect(feb4!.events).toHaveLength(1)
    expect(feb4!.events[0].name).toBe('Amy Holland')
  })
})
