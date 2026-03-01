// ABOUTME: Expands recurring events into concrete dates for a given month/year.
// ABOUTME: Handles weekly and nth-weekday recurrence patterns.

import type { CalendarEvent, RecurrenceRule } from '../types'

const DAY_NAMES: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
}

export function parseRecurrenceRule(raw: string): RecurrenceRule | null {
  if (!raw) return null

  const parts = raw.toLowerCase().split(':')
  const prefix = parts[0]

  if (prefix === 'weekly') {
    if (parts.length !== 2) return null
    const dayOfWeek = DAY_NAMES[parts[1]]
    if (dayOfWeek === undefined) return null
    return { kind: 'weekly', dayOfWeek }
  }

  if (prefix === 'nth') {
    if (parts.length !== 3) return null
    const n = parseInt(parts[1], 10)
    if (!Number.isInteger(n) || n < 1 || n > 5) return null
    const dayOfWeek = DAY_NAMES[parts[2]]
    if (dayOfWeek === undefined) return null
    return { kind: 'nth', n, dayOfWeek }
  }

  return null
}

export interface ExpandedRecurringEvent {
  name: string
  day: number
}

export function expandRecurringEvents(
  events: CalendarEvent[],
  year: number,
  month: number,
): ExpandedRecurringEvent[] {
  const results: ExpandedRecurringEvent[] = []
  const daysInMonth = new Date(year, month, 0).getDate()

  for (const event of events) {
    if (event.type !== 'R' || !event.recurrence) continue

    const rule = event.recurrence
    if (rule.kind === 'weekly') {
      for (let d = 1; d <= daysInMonth; d++) {
        if (new Date(year, month - 1, d).getDay() === rule.dayOfWeek) {
          results.push({ name: event.name, day: d })
        }
      }
    } else if (rule.kind === 'nth') {
      let count = 0
      for (let d = 1; d <= daysInMonth; d++) {
        if (new Date(year, month - 1, d).getDay() === rule.dayOfWeek) {
          count++
          if (count === rule.n) {
            results.push({ name: event.name, day: d })
            break
          }
        }
      }
    }
  }

  return results
}

const DAY_NAME_LIST = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const ORDINAL_SUFFIXES = ['th', 'st', 'nd', 'rd', 'th']

function ordinal(n: number): string {
  return `${n}${ORDINAL_SUFFIXES[n] ?? 'th'}`
}

export function serializeRecurrenceRule(rule: RecurrenceRule): string {
  const dayName = DAY_NAME_LIST[rule.dayOfWeek]
  if (rule.kind === 'weekly') {
    return `weekly:${dayName}`
  }
  return `nth:${rule.n}:${dayName}`
}

export function formatRecurrenceRule(rule: RecurrenceRule): string {
  const dayName = DAY_NAME_LIST[rule.dayOfWeek]
  if (rule.kind === 'weekly') {
    return `Every ${dayName}`
  }
  return `${ordinal(rule.n)} ${dayName} of month`
}
