// ABOUTME: Tests for CalendarPreview component.
// ABOUTME: Verifies grid structure, day numbers, events, holidays, moon phases, title, and overflow.

import { render, screen } from '@testing-library/react'
import { CalendarPreview } from './CalendarPreview'
import { buildCalendarGrid } from '../lib/calendar'
import type { CalendarEvent, CalendarGrid, Holiday, MoonPhase } from '../types'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function makeGrid(opts: {
  year?: number
  month?: number
  events?: CalendarEvent[]
  holidays?: Holiday[]
  moonPhases?: MoonPhase[]
} = {}) {
  return buildCalendarGrid(
    opts.year ?? 2026,
    opts.month ?? 2,
    opts.events ?? [],
    opts.holidays ?? [],
    opts.moonPhases ?? [],
  )
}

describe('CalendarPreview', () => {
  test('renders 7 column headers (Sunday through Saturday)', () => {
    const grid = makeGrid()
    render(<CalendarPreview grid={grid} title="FEBRUARY 2026" />)
    for (const name of DAY_NAMES) {
      expect(screen.getByText(name.toUpperCase())).toBeInTheDocument()
    }
  })

  test('renders the correct number of week rows', () => {
    // Feb 2026 starts on Sunday, 28 days = 4 rows
    const grid = makeGrid({ year: 2026, month: 2 })
    render(<CalendarPreview grid={grid} title="FEBRUARY 2026" />)
    // 4 week rows + 1 header row = 5 total <tr> elements
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(4 + 1)

    // Nov 2025 starts on Saturday, 30 days = 6 rows
    const grid6 = makeGrid({ year: 2025, month: 11 })
    const { container } = render(<CalendarPreview grid={grid6} title="NOVEMBER 2025" />)
    const tables = container.querySelectorAll('table')
    const lastTable = tables[tables.length - 1]
    const rows6 = lastTable.querySelectorAll('tbody tr')
    expect(rows6).toHaveLength(6)
  })

  test('shows day numbers in cells', () => {
    const grid = makeGrid()
    render(<CalendarPreview grid={grid} title="FEBRUARY 2026" />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('28')).toBeInTheDocument()
  })

  test('shows events with B:/A: prefix', () => {
    const events: CalendarEvent[] = [
      { id: '1', name: 'AMY HOLLAND', type: 'B', month: 2, day: 4, groups: ['Family'] },
      { id: '2', name: 'SAM & KASSIE JONES', type: 'A', month: 2, day: 19, groups: ['Friends'] },
    ]
    const grid = makeGrid({ events })
    render(<CalendarPreview grid={grid} title="FEBRUARY 2026" />)
    expect(screen.getByText(/B: AMY HOLLAND/)).toBeInTheDocument()
    expect(screen.getByText(/A: SAM & KASSIE JONES/)).toBeInTheDocument()
  })

  test('shows holidays without prefix', () => {
    const holidays: Holiday[] = [
      { name: "LINCOLN'S BIRTHDAY", month: 2, day: 12 },
    ]
    const grid = makeGrid({ holidays })
    render(<CalendarPreview grid={grid} title="FEBRUARY 2026" />)
    expect(screen.getByText("LINCOLN'S BIRTHDAY")).toBeInTheDocument()
  })

  test('shows moon phases', () => {
    const moonPhases: MoonPhase[] = [
      { type: 'Full Moon', month: 2, day: 1 },
    ]
    const grid = makeGrid({ moonPhases })
    render(<CalendarPreview grid={grid} title="FEBRUARY 2026" />)
    expect(screen.getByText(/FULL MOON/)).toBeInTheDocument()
  })

  test('shows the title', () => {
    const grid = makeGrid()
    render(<CalendarPreview grid={grid} title="FEBRUARY 2026" />)
    expect(screen.getByText('FEBRUARY 2026')).toBeInTheDocument()
  })

  test('shows overflow events', () => {
    const events: CalendarEvent[] = [
      { id: '1', name: 'MATT & ELIZABETH KERN', type: 'A', month: 2, day: 29, groups: [] },
    ]
    const grid = makeGrid({ events })
    render(<CalendarPreview grid={grid} title="FEBRUARY 2026" />)
    expect(screen.getByText(/A: MATT & ELIZABETH KERN FEB 29/)).toBeInTheDocument()
  })

  test('renders recurring events without type prefix', () => {
    const recurring = [{ name: 'CHURCH - 9 AM', day: 5 }]
    const grid = buildCalendarGrid(2025, 1, [], [], [], recurring)
    render(<CalendarPreview grid={grid} title="JANUARY 2025" />)
    expect(screen.getByText('CHURCH - 9 AM')).toBeInTheDocument()
    expect(screen.queryByText(/[BA]: CHURCH/)).not.toBeInTheDocument()
  })

  test('recurring events appear before regular events in a cell', () => {
    const events: CalendarEvent[] = [
      { id: '1', name: 'JUSTIN SMITH', type: 'B', month: 1, day: 12, groups: [] },
    ]
    const recurring = [{ name: 'CHURCH - 9 AM', day: 12 }]
    const grid = buildCalendarGrid(2025, 1, events, [], [], recurring)
    const { container } = render(<CalendarPreview grid={grid} title="JANUARY 2025" />)

    // Find all .cell-event elements in the cell containing day 12
    const cellEvents = container.querySelectorAll('.cell-event')
    const texts = Array.from(cellEvents).map(el => el.textContent)
    const churchIdx = texts.indexOf('CHURCH - 9 AM')
    const justinIdx = texts.indexOf('B: JUSTIN SMITH')
    expect(churchIdx).toBeGreaterThanOrEqual(0)
    expect(justinIdx).toBeGreaterThanOrEqual(0)
    expect(churchIdx).toBeLessThan(justinIdx)
  })

  test('uppercases event names in display', () => {
    const events: CalendarEvent[] = [
      { id: '1', name: 'Aaron Smead', type: 'B', month: 2, day: 4, groups: [] },
    ]
    const grid = makeGrid({ events })
    render(<CalendarPreview grid={grid} title="FEBRUARY 2026" />)
    expect(screen.getByText('B: AARON SMEAD')).toBeInTheDocument()
  })
})
