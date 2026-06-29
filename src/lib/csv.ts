// ABOUTME: Parses and exports CSV files containing birthday and anniversary events.
// ABOUTME: Handles multi-group fields, deduplication, and PapaParse integration.

import Papa from 'papaparse'
import type { CalendarEvent, EventType } from '../types'
import { parseRecurrenceRule, serializeRecurrenceRule } from './recurrence'

export interface CsvParseResult {
  events: CalendarEvent[]
  errors: string[]
}

const REQUIRED_HEADERS = ['Name', 'Type', 'Month', 'Day']

export function parseEventsFromCsv(csvString: string): CsvParseResult {
  const result = Papa.parse<Record<string, string>>(csvString, {
    header: true,
    skipEmptyLines: true,
  })

  const headers = result.meta.fields ?? []
  const missingHeaders = REQUIRED_HEADERS.filter((h) => !headers.includes(h))
  if (missingHeaders.length > 0) {
    return {
      events: [],
      errors: [`Missing required columns: ${missingHeaders.join(', ')}`],
    }
  }

  const events: CalendarEvent[] = []
  const errors: string[] = []
  const seen = new Set<string>()

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i]
    const rowNum = i + 2 // +1 for 0-index, +1 for header row

    const name = (row.Name ?? '').trim()
    const rawType = (row.Type ?? '').trim().toUpperCase()
    const rawMonth = (row.Month ?? '').trim()
    const rawDay = (row.Day ?? '').trim()
    const month = parseInt(rawMonth, 10)
    const day = parseInt(rawDay, 10)
    const groupsRaw = (row.Groups ?? '').trim()
    const groups = groupsRaw
      ? groupsRaw.split(',').map((g) => g.trim()).filter(Boolean)
      : []

    if (!name) {
      errors.push(`Row ${rowNum}: missing name`)
      continue
    }
    if (!isValidType(rawType)) {
      errors.push(`Row ${rowNum}: invalid type "${rawType}" (expected B, A, or R)`)
      continue
    }

    const type = rawType as EventType

    const rawDeleted = (row.Deleted ?? '').trim()
    const normalizedDeleted = rawDeleted.toLowerCase()
    let deleted: boolean
    if (normalizedDeleted === 'true') {
      deleted = true
    } else if (normalizedDeleted === '' || normalizedDeleted === 'false') {
      deleted = false
    } else {
      errors.push(`Row ${rowNum}: invalid Deleted value "${rawDeleted}"`)
      continue
    }

    if (type === 'R') {
      const rawRecurrence = (row.Recurrence ?? '').trim()
      if (!rawRecurrence) {
        errors.push(`Row ${rowNum}: R event missing recurrence rule`)
        continue
      }
      const recurrence = parseRecurrenceRule(rawRecurrence)
      if (!recurrence) {
        errors.push(`Row ${rowNum}: invalid recurrence rule "${rawRecurrence}"`)
        continue
      }
      const dedupKey = `${name.toLowerCase()}|R|${rawRecurrence.toLowerCase()}|${deleted}`
      if (seen.has(dedupKey)) {
        const existing = events.find(
          (e) => e.type === 'R' && e.name.toLowerCase() === name.toLowerCase()
            && e.recurrence && `${e.name.toLowerCase()}|R|${rawRecurrence.toLowerCase()}|${e.deleted ?? false}` === dedupKey
        )!
        const existingGroups = new Set(existing.groups)
        for (const g of groups) {
          if (!existingGroups.has(g)) {
            existing.groups.push(g)
            existingGroups.add(g)
          }
        }
        continue
      }
      seen.add(dedupKey)
      const base = {
        id: crypto.randomUUID(),
        name,
        type,
        month: 0,
        day: 0,
        groups,
        recurrence,
      }
      events.push(deleted ? { ...base, deleted: true } : base)
    } else {
      if (!isValidMonth(month)) {
        errors.push(`Row ${rowNum}: invalid month "${rawMonth}"`)
        continue
      }
      if (!isValidDay(day)) {
        errors.push(`Row ${rowNum}: invalid day "${rawDay}"`)
        continue
      }
      const dedupKey = `${name.toLowerCase()}|${type}|${month}|${day}|${deleted}`
      if (seen.has(dedupKey)) {
        const existing = events.find(
          (e) => `${e.name.toLowerCase()}|${e.type}|${e.month}|${e.day}|${e.deleted ?? false}` === dedupKey
        )!
        const existingGroups = new Set(existing.groups)
        for (const g of groups) {
          if (!existingGroups.has(g)) {
            existing.groups.push(g)
            existingGroups.add(g)
          }
        }
        continue
      }
      seen.add(dedupKey)
      const base = {
        id: crypto.randomUUID(),
        name,
        type,
        month,
        day,
        groups,
      }
      events.push(deleted ? { ...base, deleted: true } : base)
    }
  }

  return { events, errors }
}

export function exportEventsToCsv(events: CalendarEvent[]): string {
  const rows = [...events].sort(compareByDate).map((e) => ({
    Name: e.name,
    Type: e.type,
    Month: e.type === 'R' ? '' : e.month,
    Day: e.type === 'R' ? '' : e.day,
    Groups: e.groups.join(','),
    Recurrence: e.recurrence ? serializeRecurrenceRule(e.recurrence) : '',
    Deleted: e.deleted ? 'true' : '',
  }))

  return Papa.unparse(rows, {
    columns: ['Name', 'Type', 'Month', 'Day', 'Groups', 'Recurrence', 'Deleted'],
  })
}

export function downloadCsv(csvString: string, filename: string): void {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// Recurring events have no calendar date, so they sort after all dated events.
export function compareByDate(a: CalendarEvent, b: CalendarEvent): number {
  const aRecurring = a.type === 'R'
  const bRecurring = b.type === 'R'
  if (aRecurring !== bRecurring) return aRecurring ? 1 : -1
  if (aRecurring && bRecurring) return 0
  if (a.month !== b.month) return a.month - b.month
  return a.day - b.day
}

function isValidType(type: string): type is EventType {
  return type === 'B' || type === 'A' || type === 'R'
}

function isValidMonth(month: number): boolean {
  return Number.isInteger(month) && month >= 1 && month <= 12
}

function isValidDay(day: number): boolean {
  return Number.isInteger(day) && day >= 1 && day <= 31
}
