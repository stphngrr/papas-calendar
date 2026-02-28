// ABOUTME: Tests for PDF generation — structural tests and visual verification helpers.
// ABOUTME: Visual .skip tests write PDFs to /tmp for manual inspection against examples.

import { describe, it, expect } from 'vitest'
import { writeFileSync } from 'fs'
import { generateCalendarPdf, padGridToSixRows, formatMoonPhase, formatEvent } from './pdf'
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

describe('formatMoonPhase', () => {
  it('maps Full Moon to FULL MOON', () => {
    expect(formatMoonPhase('Full Moon')).toBe('FULL MOON')
  })

  it('maps First Qtr to FIRST QTR', () => {
    expect(formatMoonPhase('First Qtr')).toBe('FIRST QTR')
  })

  it('maps Last Qtr to LAST QTR', () => {
    expect(formatMoonPhase('Last Qtr')).toBe('LAST QTR')
  })

  it('maps New Moon to NEW MOON', () => {
    expect(formatMoonPhase('New Moon')).toBe('NEW MOON')
  })
})

describe('formatEvent', () => {
  it('formats a birthday as B: NAME', () => {
    expect(formatEvent({ id: '1', name: 'AMY HOLLAND', type: 'B', month: 2, day: 4, groups: [] }))
      .toBe('B: AMY HOLLAND')
  })

  it('formats an anniversary as A: NAME', () => {
    expect(formatEvent({ id: '2', name: 'SAM & KASSIE JONES', type: 'A', month: 2, day: 19, groups: [] }))
      .toBe('A: SAM & KASSIE JONES')
  })
})

describe('visual verification', () => {
  it.skip('writes Feb 2026 grid to /tmp for inspection', () => {
    const feb2026Events: CalendarEvent[] = [
      { id: '1', name: 'MELISSA MCCULLOUGH', type: 'B', month: 2, day: 2, groups: [] },
      { id: '2', name: 'KENNY BERTIN', type: 'B', month: 2, day: 2, groups: [] },
      { id: '3', name: 'ALEX DECHERT', type: 'B', month: 2, day: 2, groups: [] },
      { id: '4', name: 'AMY HOLLAND', type: 'B', month: 2, day: 4, groups: [] },
      { id: '5', name: 'TYLER MOYER', type: 'B', month: 2, day: 6, groups: [] },
      { id: '6', name: 'KAMRYN LEE HOLLAND', type: 'B', month: 2, day: 7, groups: [] },
      { id: '7', name: 'NICKI HOLLAND', type: 'B', month: 2, day: 9, groups: [] },
      { id: '8', name: 'LORRAINE HORTON', type: 'B', month: 2, day: 9, groups: [] },
      { id: '9', name: 'SOGNIRA WILLIAMS', type: 'B', month: 2, day: 10, groups: [] },
      { id: '10', name: 'PAM WILLIAMS', type: 'B', month: 2, day: 11, groups: [] },
      { id: '11', name: 'LUTHER WALDROUPE', type: 'B', month: 2, day: 11, groups: [] },
      { id: '12', name: 'BRYAN HURST', type: 'B', month: 2, day: 13, groups: [] },
      { id: '13', name: 'TOOTSIE POWSZUKIEWICZ', type: 'B', month: 2, day: 16, groups: [] },
      { id: '14', name: 'JEFF COPLEY', type: 'B', month: 2, day: 17, groups: [] },
      { id: '15', name: 'LAURI HOLLAND', type: 'B', month: 2, day: 17, groups: [] },
      { id: '16', name: 'EMY BURBACK', type: 'B', month: 2, day: 17, groups: [] },
      { id: '17', name: 'SAM & KASSIE JONES', type: 'A', month: 2, day: 19, groups: [] },
      { id: '18', name: 'CHERRY WILLIAMS', type: 'B', month: 2, day: 21, groups: [] },
      { id: '19', name: 'KALIN COOK', type: 'B', month: 2, day: 21, groups: [] },
      { id: '20', name: 'KEVIN MOTTER', type: 'B', month: 2, day: 24, groups: [] },
      { id: '21', name: 'WAYNE ANDERSON', type: 'B', month: 2, day: 25, groups: [] },
      { id: '22', name: 'CHARLES DECHERT', type: 'B', month: 2, day: 26, groups: [] },
      { id: '23', name: 'BEN WONG', type: 'B', month: 2, day: 26, groups: [] },
      { id: '24', name: 'DAVID HOLLAND', type: 'B', month: 2, day: 28, groups: [] },
      { id: '25', name: 'MATT & ELIZABETH KERN', type: 'A', month: 2, day: 29, groups: [] },
    ]
    const moonPhases = getMoonPhases(2026, 2)
    const holidays = getHolidaysForMonth(2026, 2, ALL_HOLIDAYS)
    const grid = buildCalendarGrid(2026, 2, feb2026Events, holidays, moonPhases)
    const doc = generateCalendarPdf(grid, { title: 'FEBRUARY 2026' })
    const buffer = Buffer.from(doc.output('arraybuffer'))
    writeFileSync('/tmp/feb-2026-test.pdf', buffer)
  })
})
