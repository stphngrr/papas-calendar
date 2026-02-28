// ABOUTME: Tests for PDF generation — structural tests and visual verification helpers.
// ABOUTME: Visual .skip tests write PDFs to /tmp for manual inspection against examples.

import { describe, it, expect } from 'vitest'
import { writeFileSync } from 'fs'
import { generateCalendarPdf, padGridToSixRows } from './pdf'
import { buildCalendarGrid } from './calendar'
import { getMoonPhases } from './moon'
import { getHolidaysForMonth, HOLIDAY_DEFINITIONS } from './holidays'
import type { CalendarGrid, CalendarDay, CalendarEvent } from '../types'

const ALL_HOLIDAYS = HOLIDAY_DEFINITIONS.map(d => d.name)

function makeDay(day: number): CalendarDay {
  return { day, events: [], holidays: [], moonPhases: [] }
}

function makeGrid(weeks: (CalendarDay | null)[][]): CalendarGrid {
  return { year: 2026, month: 2, weeks, overflowEvents: [] }
}

describe('padGridToSixRows', () => {
  it('pads a 4-row grid to 6 rows', () => {
    const weeks = [
      [makeDay(1), makeDay(2), makeDay(3), makeDay(4), makeDay(5), makeDay(6), makeDay(7)],
      [makeDay(8), makeDay(9), makeDay(10), makeDay(11), makeDay(12), makeDay(13), makeDay(14)],
      [makeDay(15), makeDay(16), makeDay(17), makeDay(18), makeDay(19), makeDay(20), makeDay(21)],
      [makeDay(22), makeDay(23), makeDay(24), makeDay(25), makeDay(26), makeDay(27), makeDay(28)],
    ]
    const padded = padGridToSixRows(weeks)
    expect(padded).toHaveLength(6)
    // Original data preserved
    expect(padded[0][0]!.day).toBe(1)
    expect(padded[3][6]!.day).toBe(28)
    // Padded rows are all null
    expect(padded[4].every(cell => cell === null)).toBe(true)
    expect(padded[5].every(cell => cell === null)).toBe(true)
  })

  it('pads a 5-row grid to 6 rows', () => {
    const weeks = Array(5).fill(null).map(() => Array(7).fill(null) as (CalendarDay | null)[])
    weeks[0][0] = makeDay(1)
    const padded = padGridToSixRows(weeks)
    expect(padded).toHaveLength(6)
    expect(padded[0][0]!.day).toBe(1)
    expect(padded[5].every(cell => cell === null)).toBe(true)
  })

  it('returns 6 rows unchanged for a 6-row grid', () => {
    const weeks = Array(6).fill(null).map(() => Array(7).fill(null) as (CalendarDay | null)[])
    weeks[0][0] = makeDay(1)
    weeks[5][6] = makeDay(30)
    const padded = padGridToSixRows(weeks)
    expect(padded).toHaveLength(6)
    expect(padded[0][0]!.day).toBe(1)
    expect(padded[5][6]!.day).toBe(30)
  })

  it('does not mutate the original array', () => {
    const weeks = [
      [makeDay(1), null, null, null, null, null, null],
    ]
    const padded = padGridToSixRows(weeks)
    expect(weeks).toHaveLength(1)
    expect(padded).toHaveLength(6)
  })
})

describe('generateCalendarPdf', () => {
  it('returns a jsPDF instance', () => {
    const grid = makeGrid([
      [makeDay(1), makeDay(2), makeDay(3), makeDay(4), makeDay(5), makeDay(6), makeDay(7)],
      [makeDay(8), makeDay(9), makeDay(10), makeDay(11), makeDay(12), makeDay(13), makeDay(14)],
      [makeDay(15), makeDay(16), makeDay(17), makeDay(18), makeDay(19), makeDay(20), makeDay(21)],
      [makeDay(22), makeDay(23), makeDay(24), makeDay(25), makeDay(26), makeDay(27), makeDay(28)],
    ])
    const doc = generateCalendarPdf(grid, { title: 'FEBRUARY 2026' })
    expect(doc).toBeDefined()
    expect(typeof doc.output).toBe('function')
  })

  it('produces a landscape letter-sized PDF', () => {
    const grid = makeGrid([
      [makeDay(1), makeDay(2), makeDay(3), makeDay(4), makeDay(5), makeDay(6), makeDay(7)],
      [makeDay(8), makeDay(9), makeDay(10), makeDay(11), makeDay(12), makeDay(13), makeDay(14)],
      [makeDay(15), makeDay(16), makeDay(17), makeDay(18), makeDay(19), makeDay(20), makeDay(21)],
      [makeDay(22), makeDay(23), makeDay(24), makeDay(25), makeDay(26), makeDay(27), makeDay(28)],
    ])
    const doc = generateCalendarPdf(grid, { title: 'FEBRUARY 2026' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    // Landscape letter: 279.4mm × 215.9mm
    expect(pageWidth).toBeCloseTo(279.4, 0)
    expect(pageHeight).toBeCloseTo(215.9, 0)
  })
})

describe('visual verification', () => {
  it.skip('writes Feb 2026 grid to /tmp for inspection', () => {
    const moonPhases = getMoonPhases(2026, 2)
    const holidays = getHolidaysForMonth(2026, 2, ALL_HOLIDAYS)
    const grid = buildCalendarGrid(2026, 2, [], holidays, moonPhases)
    const doc = generateCalendarPdf(grid, { title: 'FEBRUARY 2026' })
    const buffer = Buffer.from(doc.output('arraybuffer'))
    writeFileSync('/tmp/feb-2026-test.pdf', buffer)
  })
})
