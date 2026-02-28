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
    expect(result.errors).toEqual(['Row 2: invalid type "X" (expected B or A)'])
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
      'Row 5: invalid type "X" (expected B or A)',
    ])
  })

  it('returns empty errors for valid CSV', () => {
    const csv = `Name,Type,Month,Day,Groups
Amy Holland,B,2,4,Lewis`

    const result = parseEventsFromCsv(csv)

    expect(result.errors).toEqual([])
  })
})

describe('exportEventsToCsv', () => {
  it('exports a single event to CSV', () => {
    const events: CalendarEvent[] = [
      { id: '1', name: 'Amy Holland', type: 'B', month: 2, day: 4, groups: ['Lewis'] },
    ]

    const csv = exportEventsToCsv(events)

    expect(csv).toContain('Name,Type,Month,Day,Groups')
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
    for (let i = 0; i < events.length; i++) {
      expect(reparsed[i].name).toBe(events[i].name)
      expect(reparsed[i].type).toBe(events[i].type)
      expect(reparsed[i].month).toBe(events[i].month)
      expect(reparsed[i].day).toBe(events[i].day)
      expect(reparsed[i].groups).toEqual(events[i].groups)
    }
  })
})
