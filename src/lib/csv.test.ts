// ABOUTME: Tests for CSV parsing and export of calendar events.
// ABOUTME: Covers PapaParse integration, multi-group handling, deduplication, and round-tripping.

import { describe, expect, it } from 'vitest'
import { exportEventsToCsv, parseEventsFromCsv } from './csv'
import type { CalendarEvent } from '../types'

describe('parseEventsFromCsv', () => {
  it('parses a single birthday row', () => {
    const csv = `Name,Type,Month,Day,Groups
Amy Holland,B,2,4,Lewis`

    const events = parseEventsFromCsv(csv)

    expect(events).toHaveLength(1)
    expect(events[0].name).toBe('Amy Holland')
    expect(events[0].type).toBe('B')
    expect(events[0].month).toBe(2)
    expect(events[0].day).toBe(4)
    expect(events[0].groups).toEqual(['Lewis'])
    expect(events[0].id).toBeDefined()
  })

  it('parses multiple groups in quoted field', () => {
    const csv = `Name,Type,Month,Day,Groups
Sam Jones,A,2,19,"Lewis,Hooper"`

    const events = parseEventsFromCsv(csv)

    expect(events).toHaveLength(1)
    expect(events[0].groups).toEqual(['Lewis', 'Hooper'])
  })

  it('parses multiple rows with unique ids', () => {
    const csv = `Name,Type,Month,Day,Groups
Amy Holland,B,2,4,Lewis
Sam Jones,A,2,19,Hooper
Tootsie P,B,2,16,Lewis`

    const events = parseEventsFromCsv(csv)

    expect(events).toHaveLength(3)
    const ids = events.map((e) => e.id)
    expect(new Set(ids).size).toBe(3)
  })

  it('handles empty groups gracefully', () => {
    const csv = `Name,Type,Month,Day,Groups
Amy Holland,B,2,4,`

    const events = parseEventsFromCsv(csv)

    expect(events).toHaveLength(1)
    expect(events[0].groups).toEqual([])
  })

  it('trims whitespace from fields', () => {
    const csv = `Name,Type,Month,Day,Groups
 Amy Holland , B , 2 , 4 , Lewis `

    const events = parseEventsFromCsv(csv)

    expect(events).toHaveLength(1)
    expect(events[0].name).toBe('Amy Holland')
    expect(events[0].type).toBe('B')
    expect(events[0].month).toBe(2)
    expect(events[0].day).toBe(4)
    expect(events[0].groups).toEqual(['Lewis'])
  })

  it('deduplicates events with same name, type, month, day', () => {
    const csv = `Name,Type,Month,Day,Groups
Amy Holland,B,2,4,Lewis
Amy Holland,B,2,4,Lewis`

    const events = parseEventsFromCsv(csv)

    expect(events).toHaveLength(1)
  })

  it('merges groups when duplicate events have different groups', () => {
    const csv = `Name,Type,Month,Day,Groups
Amy Holland,B,2,4,Lewis
Amy Holland,B,2,4,Hooper`

    const events = parseEventsFromCsv(csv)

    expect(events).toHaveLength(1)
    expect(events[0].groups).toEqual(['Lewis', 'Hooper'])
  })

  it('does not duplicate groups when merging', () => {
    const csv = `Name,Type,Month,Day,Groups
Amy Holland,B,2,4,Lewis
Amy Holland,B,2,4,"Lewis,Hooper"`

    const events = parseEventsFromCsv(csv)

    expect(events).toHaveLength(1)
    expect(events[0].groups).toEqual(['Lewis', 'Hooper'])
  })

  it('accepts lowercase event types', () => {
    const csv = `Name,Type,Month,Day,Groups
Amy Holland,b,2,4,Lewis
Sam Jones,a,6,15,Hooper`

    const events = parseEventsFromCsv(csv)

    expect(events).toHaveLength(2)
    expect(events[0].type).toBe('B')
    expect(events[1].type).toBe('A')
  })

  it('skips rows with invalid data', () => {
    const csv = `Name,Type,Month,Day,Groups
,B,2,4,Lewis
Amy Holland,B,13,4,Lewis
Amy Holland,B,2,0,Lewis
Valid Person,B,6,15,Lewis`

    const events = parseEventsFromCsv(csv)

    expect(events).toHaveLength(1)
    expect(events[0].name).toBe('Valid Person')
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

    const events = parseEventsFromCsv(original)
    const exported = exportEventsToCsv(events)
    const reparsed = parseEventsFromCsv(exported)

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
