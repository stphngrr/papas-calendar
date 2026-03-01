// ABOUTME: Expands recurring events into concrete dates for a given month/year.
// ABOUTME: Handles weekly and nth-weekday recurrence patterns.

import type { RecurrenceRule } from '../types'

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
