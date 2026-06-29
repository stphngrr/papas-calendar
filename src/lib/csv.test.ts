// ABOUTME: Tests for CSV parsing and export of calendar events.
// ABOUTME: Covers PapaParse integration, multi-group handling, deduplication, and round-tripping.

import { describe, expect, it } from 'vitest'
import { exportEventsToCsv, parseEventsFromCsv } from './csv'
import type { CalendarEvent } from '../types'

describe('parseEventsFromCsv', () => {
  it('parses a single birthday row', () => {
    const csv = `Name,Type,Month,Day,Groups
Amy Holland,B,2,4,Lewis`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(1)
    expect(result.errors).toEqual([])
    expect(result.events[0].name).toBe('Amy Holland')
    expect(result.events[0].type).toBe('B')
    expect(result.events[0].month).toBe(2)
    expect(result.events[0].day).toBe(4)
    expect(result.events[0].groups).toEqual(['Lewis'])
    expect(result.events[0].id).toBeDefined()
  })

  it('parses multiple groups in quoted field', () => {
    const csv = `Name,Type,Month,Day,Groups
Sam Jones,A,2,19,"Lewis,Hooper"`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(1)
    expect(result.events[0].groups).toEqual(['Lewis', 'Hooper'])
  })

  it('parses multiple rows with unique ids', () => {
    const csv = `Name,Type,Month,Day,Groups
Amy Holland,B,2,4,Lewis
Sam Jones,A,2,19,Hooper
Tootsie P,B,2,16,Lewis`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(3)
    const ids = result.events.map((e) => e.id)
    expect(new Set(ids).size).toBe(3)
  })

  it('handles empty groups gracefully', () => {
    const csv = `Name,Type,Month,Day,Groups
Amy Holland,B,2,4,`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(1)
    expect(result.events[0].groups).toEqual([])
  })

  it('trims whitespace from fields', () => {
    const csv = `Name,Type,Month,Day,Groups
 Amy Holland , B , 2 , 4 , Lewis `

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(1)
    expect(result.events[0].name).toBe('Amy Holland')
    expect(result.events[0].type).toBe('B')
    expect(result.events[0].month).toBe(2)
    expect(result.events[0].day).toBe(4)
    expect(result.events[0].groups).toEqual(['Lewis'])
  })

  it('deduplicates events with same name, type, month, day', () => {
    const csv = `Name,Type,Month,Day,Groups
Amy Holland,B,2,4,Lewis
Amy Holland,B,2,4,Lewis`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(1)
  })

  it('merges groups when duplicate events have different groups', () => {
    const csv = `Name,Type,Month,Day,Groups
Amy Holland,B,2,4,Lewis
Amy Holland,B,2,4,Hooper`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(1)
    expect(result.events[0].groups).toEqual(['Lewis', 'Hooper'])
  })

  it('does not duplicate groups when merging', () => {
    const csv = `Name,Type,Month,Day,Groups
Amy Holland,B,2,4,Lewis
Amy Holland,B,2,4,"Lewis,Hooper"`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(1)
    expect(result.events[0].groups).toEqual(['Lewis', 'Hooper'])
  })

  it('accepts lowercase event types', () => {
    const csv = `Name,Type,Month,Day,Groups
Amy Holland,b,2,4,Lewis
Sam Jones,a,6,15,Hooper`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(2)
    expect(result.events[0].type).toBe('B')
    expect(result.events[1].type).toBe('A')
  })

  it('skips rows with invalid data and reports errors', () => {
    const csv = `Name,Type,Month,Day,Groups
,B,2,4,Lewis
Amy Holland,B,13,4,Lewis
Amy Holland,B,2,0,Lewis
Valid Person,B,6,15,Lewis`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(1)
    expect(result.events[0].name).toBe('Valid Person')
    expect(result.errors).toHaveLength(3)
  })

  it('reports missing name error', () => {
    const csv = `Name,Type,Month,Day,Groups
,B,2,4,Lewis`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(0)
    expect(result.errors).toEqual(['Row 2: missing name'])
  })

  it('reports invalid type error', () => {
    const csv = `Name,Type,Month,Day,Groups
Amy Holland,X,2,4,Lewis`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(0)
    expect(result.errors).toEqual(['Row 2: invalid type "X" (expected B, A, or R)'])
  })

  it('reports invalid month error', () => {
    const csv = `Name,Type,Month,Day,Groups
Amy Holland,B,13,4,Lewis`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(0)
    expect(result.errors).toEqual(['Row 2: invalid month "13"'])
  })

  it('reports invalid day error', () => {
    const csv = `Name,Type,Month,Day,Groups
Amy Holland,B,2,0,Lewis`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(0)
    expect(result.errors).toEqual(['Row 2: invalid day "0"'])
  })

  it('reports non-numeric month', () => {
    const csv = `Name,Type,Month,Day,Groups
Amy Holland,B,abc,4,Lewis`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(0)
    expect(result.errors).toEqual(['Row 2: invalid month "abc"'])
  })

  it('reports non-numeric day', () => {
    const csv = `Name,Type,Month,Day,Groups
Amy Holland,B,2,xyz,Lewis`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(0)
    expect(result.errors).toEqual(['Row 2: invalid day "xyz"'])
  })

  it('reports missing required headers', () => {
    const csv = `Foo,Bar
hello,world`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(0)
    expect(result.errors).toEqual(['Missing required columns: Name, Type, Month, Day'])
  })

  it('reports only the first validation error per row', () => {
    const csv = `Name,Type,Month,Day,Groups
,X,13,0,Lewis`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toBe('Row 2: missing name')
  })

  it('returns correct row numbers accounting for header', () => {
    const csv = `Name,Type,Month,Day,Groups
Valid Person,B,1,1,Lewis
,B,2,4,Lewis
Another Valid,A,3,10,Hooper
Bad Type,X,4,5,Lewis`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(2)
    expect(result.errors).toEqual([
      'Row 3: missing name',
      'Row 5: invalid type "X" (expected B, A, or R)',
    ])
  })

  it('returns empty errors for valid CSV', () => {
    const csv = `Name,Type,Month,Day,Groups
Amy Holland,B,2,4,Lewis`

    const result = parseEventsFromCsv(csv)

    expect(result.errors).toEqual([])
  })

  it('parses an R event with weekly recurrence', () => {
    const csv = `Name,Type,Month,Day,Groups,Recurrence
CHURCH - 9 AM,R,,,Hooper,weekly:Sunday`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(1)
    expect(result.errors).toEqual([])
    expect(result.events[0].type).toBe('R')
    expect(result.events[0].month).toBe(0)
    expect(result.events[0].day).toBe(0)
    expect(result.events[0].groups).toEqual(['Hooper'])
    expect(result.events[0].recurrence).toEqual({ kind: 'weekly', dayOfWeek: 0 })
  })

  it('parses an R event with nth recurrence', () => {
    const csv = `Name,Type,Month,Day,Groups,Recurrence
COMMUNION,R,,,Hooper,nth:1:Sunday`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(1)
    expect(result.events[0].recurrence).toEqual({ kind: 'nth', n: 1, dayOfWeek: 0 })
  })

  it('reports error for R event with missing recurrence', () => {
    const csv = `Name,Type,Month,Day,Groups,Recurrence
CHURCH,R,,,Hooper,`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(0)
    expect(result.errors).toEqual(['Row 2: R event missing recurrence rule'])
  })

  it('reports error for R event with invalid recurrence', () => {
    const csv = `Name,Type,Month,Day,Groups,Recurrence
CHURCH,R,,,Hooper,bogus:value`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(0)
    expect(result.errors).toEqual(['Row 2: invalid recurrence rule "bogus:value"'])
  })

  it('parses mixed B, A, and R events', () => {
    const csv = `Name,Type,Month,Day,Groups,Recurrence
Amy Holland,B,2,4,Lewis,
CHURCH - 9 AM,R,,,Hooper,weekly:Sunday
Sam Jones,A,2,19,"Lewis,Hooper",`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(3)
    expect(result.errors).toEqual([])
    expect(result.events[0].type).toBe('B')
    expect(result.events[0].month).toBe(2)
    expect(result.events[1].type).toBe('R')
    expect(result.events[1].recurrence).toEqual({ kind: 'weekly', dayOfWeek: 0 })
    expect(result.events[2].type).toBe('A')
  })

  it('backward compatible with 5-column CSV (no Recurrence column)', () => {
    const csv = `Name,Type,Month,Day,Groups
Amy Holland,B,2,4,Lewis`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(1)
    expect(result.events[0].recurrence).toBeUndefined()
  })

  it('B/A events ignore the Recurrence column if present', () => {
    const csv = `Name,Type,Month,Day,Groups,Recurrence
Amy Holland,B,2,4,Lewis,weekly:Sunday`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(1)
    expect(result.events[0].type).toBe('B')
    expect(result.events[0].month).toBe(2)
    expect(result.events[0].day).toBe(4)
    expect(result.events[0].recurrence).toBeUndefined()
  })

  it('deduplicates R events by name and recurrence string', () => {
    const csv = `Name,Type,Month,Day,Groups,Recurrence
CHURCH - 9 AM,R,,,Hooper,weekly:Sunday
CHURCH - 9 AM,R,,,Lewis,weekly:Sunday`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(1)
    expect(result.events[0].groups).toEqual(['Hooper', 'Lewis'])
  })

  it('parses a row with Deleted=true as deleted', () => {
    const csv = `Name,Type,Month,Day,Groups,Recurrence,Deleted
Old Coworker,B,5,9,Work,,true`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(1)
    expect(result.errors).toEqual([])
    expect(result.events[0].deleted).toBe(true)
  })

  it('parses a blank Deleted value as active (deleted undefined)', () => {
    const csv = `Name,Type,Month,Day,Groups,Recurrence,Deleted
Amy Holland,B,2,4,Lewis,,`

    const result = parseEventsFromCsv(csv)

    expect(result.events[0].deleted).toBeUndefined()
  })

  it('parses Deleted=false (any case) as active', () => {
    const csv = `Name,Type,Month,Day,Groups,Recurrence,Deleted
Amy Holland,B,2,4,Lewis,,FALSE`

    const result = parseEventsFromCsv(csv)

    expect(result.events[0].deleted).toBeUndefined()
  })

  it('treats Deleted=true case-insensitively', () => {
    const csv = `Name,Type,Month,Day,Groups,Recurrence,Deleted
Old Coworker,B,5,9,Work,,TRUE`

    const result = parseEventsFromCsv(csv)

    expect(result.events[0].deleted).toBe(true)
  })

  it('keeps a deleted row and an identical active row as distinct events', () => {
    const csv = `Name,Type,Month,Day,Groups,Recurrence,Deleted
John,B,3,15,Family,,true
John,B,3,15,Family,,`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(2)
    const deleted = result.events.filter((e) => e.deleted)
    const active = result.events.filter((e) => !e.deleted)
    expect(deleted).toHaveLength(1)
    expect(active).toHaveLength(1)
  })

  it('merges groups of two matching deleted rows', () => {
    const csv = `Name,Type,Month,Day,Groups,Recurrence,Deleted
John,B,3,15,Family,,true
John,B,3,15,Friends,,true`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(1)
    expect(result.events[0].deleted).toBe(true)
    expect(result.events[0].groups).toEqual(['Family', 'Friends'])
  })

  it('reports an error and skips a row with a garbage Deleted value', () => {
    const csv = `Name,Type,Month,Day,Groups,Recurrence,Deleted
Amy Holland,B,2,4,Lewis,,maybe`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(0)
    expect(result.errors).toEqual(['Row 2: invalid Deleted value "maybe"'])
  })

  it('rejects truthy-looking but unsupported Deleted values like "1" and "yes"', () => {
    const csv = `Name,Type,Month,Day,Groups,Recurrence,Deleted
A,B,2,4,Lewis,,1
C,B,2,5,Lewis,,yes`

    const result = parseEventsFromCsv(csv)

    expect(result.events).toHaveLength(0)
    expect(result.errors).toEqual([
      'Row 2: invalid Deleted value "1"',
      'Row 3: invalid Deleted value "yes"',
    ])
  })
})

describe('exportEventsToCsv', () => {
  it('exports a single event to CSV', () => {
    const events: CalendarEvent[] = [
      { id: '1', name: 'Amy Holland', type: 'B', month: 2, day: 4, groups: ['Lewis'] },
    ]

    const csv = exportEventsToCsv(events)

    expect(csv).toContain('Name,Type,Month,Day,Groups,Recurrence')
    expect(csv).toContain('Amy Holland,B,2,4,Lewis')
  })

  it('quotes groups when there are multiple', () => {
    const events: CalendarEvent[] = [
      { id: '1', name: 'Sam Jones', type: 'A', month: 2, day: 19, groups: ['Lewis', 'Hooper'] },
    ]

    const csv = exportEventsToCsv(events)

    expect(csv).toContain('"Lewis,Hooper"')
  })

  it('round-trips: parse then export produces equivalent CSV', () => {
    const original = `Name,Type,Month,Day,Groups
Amy Holland,B,2,4,Lewis
Sam Jones,A,2,19,"Lewis,Hooper"
Tootsie P,B,2,16,Lewis`

    const { events } = parseEventsFromCsv(original)
    const exported = exportEventsToCsv(events)
    const { events: reparsed } = parseEventsFromCsv(exported)

    expect(reparsed).toHaveLength(events.length)
    for (const event of events) {
      const match = reparsed.find((e) => e.name === event.name)!
      expect(match.type).toBe(event.type)
      expect(match.month).toBe(event.month)
      expect(match.day).toBe(event.day)
      expect(match.groups).toEqual(event.groups)
    }
  })

  it('sorts dated events by month then day on export', () => {
    const events: CalendarEvent[] = [
      { id: '1', name: 'Sam Jones', type: 'A', month: 2, day: 19, groups: ['Lewis'] },
      { id: '2', name: 'Amy Holland', type: 'B', month: 2, day: 4, groups: ['Lewis'] },
      { id: '3', name: 'New Year Baby', type: 'B', month: 1, day: 1, groups: ['Lewis'] },
    ]

    const lines = exportEventsToCsv(events).trim().split('\n')

    expect(lines[1]).toContain('New Year Baby')
    expect(lines[2]).toContain('Amy Holland')
    expect(lines[3]).toContain('Sam Jones')
  })

  it('places recurring events after dated events on export', () => {
    const events: CalendarEvent[] = [
      {
        id: '1',
        name: 'CHURCH',
        type: 'R',
        month: 0,
        day: 0,
        groups: ['Hooper'],
        recurrence: { kind: 'weekly', dayOfWeek: 0 },
      },
      { id: '2', name: 'Amy Holland', type: 'B', month: 2, day: 4, groups: ['Lewis'] },
    ]

    const lines = exportEventsToCsv(events).trim().split('\n')

    expect(lines[1]).toContain('Amy Holland')
    expect(lines[2]).toContain('CHURCH')
  })

  it('round-trips R events through parse and export', () => {
    const csv = `Name,Type,Month,Day,Groups,Recurrence
CHURCH - 9 AM,R,,,Hooper,weekly:Sunday
COMMUNION,R,,,Hooper,nth:1:Sunday
Amy Holland,B,2,4,Lewis,`

    const { events } = parseEventsFromCsv(csv)
    const exported = exportEventsToCsv(events)
    const { events: reparsed } = parseEventsFromCsv(exported)

    expect(reparsed).toHaveLength(3)
    const church = reparsed.find(e => e.name === 'CHURCH - 9 AM')!
    expect(church.type).toBe('R')
    expect(church.recurrence).toEqual({ kind: 'weekly', dayOfWeek: 0 })

    const communion = reparsed.find(e => e.name === 'COMMUNION')!
    expect(communion.recurrence).toEqual({ kind: 'nth', n: 1, dayOfWeek: 0 })

    const amy = reparsed.find(e => e.name === 'Amy Holland')!
    expect(amy.type).toBe('B')
    expect(amy.month).toBe(2)
    expect(amy.recurrence).toBeUndefined()
  })

  it('writes the Deleted column header', () => {
    const csv = exportEventsToCsv([
      { id: '1', name: 'Amy', type: 'B', month: 2, day: 4, groups: ['Lewis'] },
    ])

    expect(csv).toContain('Name,Type,Month,Day,Groups,Recurrence,Deleted')
  })

  it('writes true for deleted events and blank for active ones', () => {
    const csv = exportEventsToCsv([
      { id: '1', name: 'Active One', type: 'B', month: 1, day: 1, groups: ['Lewis'] },
      { id: '2', name: 'Deleted One', type: 'B', month: 1, day: 2, groups: ['Lewis'], deleted: true },
    ])
    // PapaParse emits CRLF line endings; split on /\r?\n/ so no trailing \r
    // survives into the strings (the existing export tests sidestep this by using
    // toContain — we want exact matches here, so we strip the \r at the split).
    const lines = csv.trim().split(/\r?\n/)

    expect(lines[1]).toBe('Active One,B,1,1,Lewis,,')
    expect(lines[2]).toBe('Deleted One,B,1,2,Lewis,,true')
  })

  it('round-trips the deleted flag through export and re-parse', () => {
    const csv = `Name,Type,Month,Day,Groups,Recurrence,Deleted
Active One,B,1,1,Lewis,,
Deleted One,B,1,2,Lewis,,true`

    const { events } = parseEventsFromCsv(csv)
    const reparsed = parseEventsFromCsv(exportEventsToCsv(events)).events

    expect(reparsed.find((e) => e.name === 'Active One')!.deleted).toBeUndefined()
    expect(reparsed.find((e) => e.name === 'Deleted One')!.deleted).toBe(true)
  })
})
