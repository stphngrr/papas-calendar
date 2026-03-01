// ABOUTME: Tests for recurrence rule parsing, expansion, formatting, and serialization.
// ABOUTME: Validates weekly and nth-weekday patterns against known month layouts.

import { describe, test, expect } from 'vitest'
import { parseRecurrenceRule, expandRecurringEvents, formatRecurrenceRule } from './recurrence'
import type { CalendarEvent } from '../types'

function makeRecurring(name: string, recurrence: CalendarEvent['recurrence']): CalendarEvent {
  return { id: '1', name, type: 'R', month: 0, day: 0, groups: [], recurrence }
}

describe('parseRecurrenceRule', () => {
  test('parses weekly:Sunday', () => {
    expect(parseRecurrenceRule('weekly:Sunday')).toEqual({ kind: 'weekly', dayOfWeek: 0 })
  })

  test('parses weekly:Tuesday', () => {
    expect(parseRecurrenceRule('weekly:Tuesday')).toEqual({ kind: 'weekly', dayOfWeek: 2 })
  })

  test('parses weekly:Saturday', () => {
    expect(parseRecurrenceRule('weekly:Saturday')).toEqual({ kind: 'weekly', dayOfWeek: 6 })
  })

  test('is case-insensitive', () => {
    expect(parseRecurrenceRule('weekly:sunday')).toEqual({ kind: 'weekly', dayOfWeek: 0 })
    expect(parseRecurrenceRule('WEEKLY:TUESDAY')).toEqual({ kind: 'weekly', dayOfWeek: 2 })
  })

  test('parses nth:1:Sunday', () => {
    expect(parseRecurrenceRule('nth:1:Sunday')).toEqual({ kind: 'nth', n: 1, dayOfWeek: 0 })
  })

  test('parses nth:3:Wednesday', () => {
    expect(parseRecurrenceRule('nth:3:Wednesday')).toEqual({ kind: 'nth', n: 3, dayOfWeek: 3 })
  })

  test('parses nth:5:Friday', () => {
    expect(parseRecurrenceRule('nth:5:Friday')).toEqual({ kind: 'nth', n: 5, dayOfWeek: 5 })
  })

  test('returns null for unknown prefix', () => {
    expect(parseRecurrenceRule('daily:Monday')).toBeNull()
  })

  test('returns null for invalid day name', () => {
    expect(parseRecurrenceRule('weekly:Sundayy')).toBeNull()
  })

  test('returns null for empty string', () => {
    expect(parseRecurrenceRule('')).toBeNull()
  })

  test('returns null for nth with n=0', () => {
    expect(parseRecurrenceRule('nth:0:Sunday')).toBeNull()
  })

  test('returns null for nth with n=6', () => {
    expect(parseRecurrenceRule('nth:6:Sunday')).toBeNull()
  })

  test('returns null for nth with non-numeric n', () => {
    expect(parseRecurrenceRule('nth:abc:Sunday')).toBeNull()
  })

  test('returns null for nth with missing parts', () => {
    expect(parseRecurrenceRule('nth:1')).toBeNull()
  })

  test('returns null for weekly with missing day', () => {
    expect(parseRecurrenceRule('weekly:')).toBeNull()
    expect(parseRecurrenceRule('weekly')).toBeNull()
  })
})

// January 2025 starts on Wednesday (day-of-week 3), has 31 days
describe('expandRecurringEvents', () => {
  test('weekly Sunday in January 2025 produces days 5, 12, 19, 26', () => {
    const events = [makeRecurring('CHURCH', { kind: 'weekly', dayOfWeek: 0 })]
    const expanded = expandRecurringEvents(events, 2025, 1)
    expect(expanded.map(e => e.day)).toEqual([5, 12, 19, 26])
  })

  test('weekly Tuesday in January 2025 produces days 7, 14, 21, 28', () => {
    const events = [makeRecurring('BIBLE STUDY', { kind: 'weekly', dayOfWeek: 2 })]
    const expanded = expandRecurringEvents(events, 2025, 1)
    expect(expanded.map(e => e.day)).toEqual([7, 14, 21, 28])
  })

  test('weekly Wednesday in January 2025 produces 5 occurrences', () => {
    const events = [makeRecurring('MEETING', { kind: 'weekly', dayOfWeek: 3 })]
    const expanded = expandRecurringEvents(events, 2025, 1)
    expect(expanded.map(e => e.day)).toEqual([1, 8, 15, 22, 29])
  })

  test('1st Sunday of January 2025 produces day 5', () => {
    const events = [makeRecurring('COMMUNION', { kind: 'nth', n: 1, dayOfWeek: 0 })]
    const expanded = expandRecurringEvents(events, 2025, 1)
    expect(expanded).toEqual([{ name: 'COMMUNION', day: 5 }])
  })

  test('3rd Monday of January 2025 produces day 20', () => {
    const events = [makeRecurring('MLK DAY', { kind: 'nth', n: 3, dayOfWeek: 1 })]
    const expanded = expandRecurringEvents(events, 2025, 1)
    expect(expanded).toEqual([{ name: 'MLK DAY', day: 20 }])
  })

  test('5th Thursday of January 2025 produces day 30', () => {
    const events = [makeRecurring('EVENT', { kind: 'nth', n: 5, dayOfWeek: 4 })]
    const expanded = expandRecurringEvents(events, 2025, 1)
    expect(expanded).toEqual([{ name: 'EVENT', day: 30 }])
  })

  test('5th Sunday of February 2025 produces nothing (only 4 Sundays)', () => {
    const events = [makeRecurring('EVENT', { kind: 'nth', n: 5, dayOfWeek: 0 })]
    const expanded = expandRecurringEvents(events, 2025, 2)
    expect(expanded).toEqual([])
  })

  test('ignores non-R events', () => {
    const events: CalendarEvent[] = [
      { id: '1', name: 'Amy', type: 'B', month: 1, day: 5, groups: [] },
      makeRecurring('CHURCH', { kind: 'weekly', dayOfWeek: 0 }),
    ]
    const expanded = expandRecurringEvents(events, 2025, 1)
    expect(expanded.every(e => e.name === 'CHURCH')).toBe(true)
  })

  test('R events without recurrence field are skipped', () => {
    const events: CalendarEvent[] = [
      { id: '1', name: 'BAD', type: 'R', month: 0, day: 0, groups: [] },
    ]
    const expanded = expandRecurringEvents(events, 2025, 1)
    expect(expanded).toEqual([])
  })

  test('multiple recurring events expand independently', () => {
    const events = [
      makeRecurring('CHURCH', { kind: 'weekly', dayOfWeek: 0 }),
      makeRecurring('COMMUNION', { kind: 'nth', n: 1, dayOfWeek: 0 }),
    ]
    const expanded = expandRecurringEvents(events, 2025, 1)
    const churchDays = expanded.filter(e => e.name === 'CHURCH').map(e => e.day)
    const communionDays = expanded.filter(e => e.name === 'COMMUNION').map(e => e.day)
    expect(churchDays).toEqual([5, 12, 19, 26])
    expect(communionDays).toEqual([5])
  })
})

describe('formatRecurrenceRule', () => {
  test('formats weekly rule', () => {
    expect(formatRecurrenceRule({ kind: 'weekly', dayOfWeek: 0 })).toBe('Every Sunday')
    expect(formatRecurrenceRule({ kind: 'weekly', dayOfWeek: 2 })).toBe('Every Tuesday')
  })

  test('formats nth rule with ordinal suffix', () => {
    expect(formatRecurrenceRule({ kind: 'nth', n: 1, dayOfWeek: 0 })).toBe('1st Sunday of month')
    expect(formatRecurrenceRule({ kind: 'nth', n: 2, dayOfWeek: 2 })).toBe('2nd Tuesday of month')
    expect(formatRecurrenceRule({ kind: 'nth', n: 3, dayOfWeek: 3 })).toBe('3rd Wednesday of month')
    expect(formatRecurrenceRule({ kind: 'nth', n: 4, dayOfWeek: 4 })).toBe('4th Thursday of month')
    expect(formatRecurrenceRule({ kind: 'nth', n: 5, dayOfWeek: 5 })).toBe('5th Friday of month')
  })
})
