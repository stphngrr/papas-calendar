// ABOUTME: Tests for CSV parsing and export of calendar events.
// ABOUTME: Covers PapaParse integration, multi-group handling, deduplication, and round-tripping.

import { describe, expect, it } from 'vitest'
import { parseEventsFromCsv } from './csv'

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
