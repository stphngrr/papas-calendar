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
})
