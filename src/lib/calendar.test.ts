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

  test('events on Feb 29 are NOT overflow in a leap year', () => {
    const events: CalendarEvent[] = [
      { id: '1', name: 'Matt & Elizabeth Kern', type: 'A', month: 2, day: 29, groups: ['Lewis'] },
    ]

    // 2028 is a leap year — Feb has 29 days
    const grid = buildCalendarGrid(2028, 2, events, [], [])

    expect(grid.overflowEvents).toHaveLength(0)

    // Find the cell with day 29 and verify the event is there
    let found = false
    for (const week of grid.weeks) {
      for (const cell of week) {
        if (cell && cell.day === 29) {
          expect(cell.events).toHaveLength(1)
          expect(cell.events[0].name).toBe('Matt & Elizabeth Kern')
          found = true
        }
      }
    }
    expect(found).toBe(true)
  })

  test('holidays and moon phases are placed in correct cells', () => {
    const holidays: Holiday[] = [
      { name: "PRESIDENTS' DAY", month: 2, day: 16 },
      { name: "LINCOLN'S BIRTHDAY", month: 2, day: 12 },
    ]
    const moonPhases: MoonPhase[] = [
      { type: 'Full Moon', month: 2, day: 1 },
      { type: 'Last Qtr', month: 2, day: 9 },
    ]

    const grid = buildCalendarGrid(2026, 2, [], holidays, moonPhases)

    // Feb 16 is Monday (row 2, col 1)
    const feb16 = grid.weeks[2][1]
    expect(feb16).not.toBeNull()
    expect(feb16!.day).toBe(16)
    expect(feb16!.holidays).toHaveLength(1)
    expect(feb16!.holidays[0].name).toBe("PRESIDENTS' DAY")

    // Feb 12 is Thursday (row 1, col 4)
    const feb12 = grid.weeks[1][4]
    expect(feb12).not.toBeNull()
    expect(feb12!.day).toBe(12)
    expect(feb12!.holidays).toHaveLength(1)
    expect(feb12!.holidays[0].name).toBe("LINCOLN'S BIRTHDAY")

    // Feb 1 is Sunday (row 0, col 0)
    const feb1 = grid.weeks[0][0]
    expect(feb1).not.toBeNull()
    expect(feb1!.day).toBe(1)
    expect(feb1!.moonPhases).toHaveLength(1)
    expect(feb1!.moonPhases[0].type).toBe('Full Moon')

    // Feb 9 is Monday (row 1, col 1)
    const feb9 = grid.weeks[1][1]
    expect(feb9).not.toBeNull()
    expect(feb9!.day).toBe(9)
    expect(feb9!.moonPhases).toHaveLength(1)
    expect(feb9!.moonPhases[0].type).toBe('Last Qtr')
  })

  test('recurring events are placed on correct days', () => {
    const recurring = [
      { name: 'CHURCH - 9 AM', day: 5 },
      { name: 'CHURCH - 9 AM', day: 12 },
      { name: 'CHURCH - 9 AM', day: 19 },
      { name: 'CHURCH - 9 AM', day: 26 },
    ]

    // January 2025: starts on Wednesday
    const grid = buildCalendarGrid(2025, 1, [], [], [], recurring)

    // Jan 5 is Sunday (row 1, col 0)
    expect(grid.weeks[1][0]!.recurringEvents).toEqual(['CHURCH - 9 AM'])
    // Jan 12 is Sunday (row 2, col 0)
    expect(grid.weeks[2][0]!.recurringEvents).toEqual(['CHURCH - 9 AM'])
  })

  test('recurring events coexist with regular events and holidays in same cell', () => {
    const events: CalendarEvent[] = [
      { id: '1', name: 'BECKY LEWIS', type: 'B', month: 1, day: 26, groups: ['Lewis'] },
    ]
    const holidays: Holiday[] = [
      { name: 'SOME HOLIDAY', month: 1, day: 26 },
    ]
    const recurring = [
      { name: 'CHURCH - 9 AM', day: 26 },
    ]

    const grid = buildCalendarGrid(2025, 1, events, holidays, [], recurring)

    // Jan 26 (Sunday, row 4, col 0)
    const jan26 = grid.weeks[4][0]!
    expect(jan26.events).toHaveLength(1)
    expect(jan26.holidays).toHaveLength(1)
    expect(jan26.recurringEvents).toEqual(['CHURCH - 9 AM'])
  })

  test('days without recurring events have empty recurringEvents array', () => {
    const grid = buildCalendarGrid(2025, 1, [], [], [], [])
    // Jan 1 is Wednesday (row 0, col 3)
    expect(grid.weeks[0][3]!.recurringEvents).toEqual([])
  })
})
