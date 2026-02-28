// ABOUTME: Parses and exports CSV files containing birthday and anniversary events.
// ABOUTME: Handles multi-group fields, deduplication, and PapaParse integration.

import Papa from 'papaparse'
import type { CalendarEvent, EventType } from '../types'

export function parseEventsFromCsv(csvString: string): CalendarEvent[] {
  const result = Papa.parse<Record<string, string>>(csvString, {
    header: true,
    skipEmptyLines: true,
  })

  const events: CalendarEvent[] = []
  const seen = new Set<string>()

  for (const row of result.data) {
    const name = (row.Name ?? '').trim()
    const type = (row.Type ?? '').trim() as EventType
    const month = parseInt(row.Month, 10)
    const day = parseInt(row.Day, 10)
    const groupsRaw = (row.Groups ?? '').trim()
    const groups = groupsRaw
      ? groupsRaw.split(',').map((g) => g.trim()).filter(Boolean)
      : []

    if (!name || !isValidType(type) || !isValidMonth(month) || !isValidDay(day)) {
      continue
    }

    const dedupKey = `${name.toLowerCase()}|${type}|${month}|${day}`
    if (seen.has(dedupKey)) {
      continue
    }
    seen.add(dedupKey)

    events.push({
      id: crypto.randomUUID(),
      name,
      type,
      month,
      day,
      groups,
    })
  }

  return events
}

function isValidType(type: string): type is EventType {
  return type === 'B' || type === 'A'
}

function isValidMonth(month: number): boolean {
  return Number.isInteger(month) && month >= 1 && month <= 12
}

function isValidDay(day: number): boolean {
  return Number.isInteger(day) && day >= 1 && day <= 31
}
