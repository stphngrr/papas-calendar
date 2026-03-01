// ABOUTME: Builds the calendar grid for a given month, placing events, holidays, and moon phases in day cells.
// ABOUTME: Pure date math with no UI dependencies — used by both the HTML preview and PDF generator.

import type { CalendarEvent, Holiday, MoonPhase, CalendarDay, CalendarGrid } from '../types'

export function buildCalendarGrid(
  year: number,
  month: number,
  events: CalendarEvent[],
  holidays: Holiday[],
  moonPhases: MoonPhase[]
): CalendarGrid {
  const startDow = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  const weeks: (CalendarDay | null)[][] = []
  let currentDay = 1

  // Build rows
  while (currentDay <= daysInMonth) {
    const week: (CalendarDay | null)[] = Array(7).fill(null)
    for (let col = 0; col < 7; col++) {
      if (weeks.length === 0 && col < startDow) continue
      if (currentDay > daysInMonth) break
      week[col] = {
        day: currentDay,
        events: [],
        holidays: [],
        moonPhases: [],
        recurringEvents: [],
      }
      currentDay++
    }
    weeks.push(week)
  }

  const overflowEvents: CalendarEvent[] = []

  // Place events
  for (const event of events) {
    if (event.month !== month) continue
    if (event.day < 1 || event.day > daysInMonth) {
      overflowEvents.push(event)
      continue
    }
    const cell = findCell(weeks, event.day)
    if (cell) cell.events.push(event)
  }

  // Place holidays
  for (const holiday of holidays) {
    if (holiday.month !== month) continue
    const cell = findCell(weeks, holiday.day)
    if (cell) cell.holidays.push(holiday)
  }

  // Place moon phases
  for (const phase of moonPhases) {
    if (phase.month !== month) continue
    const cell = findCell(weeks, phase.day)
    if (cell) cell.moonPhases.push(phase)
  }

  return { year, month, weeks, overflowEvents }
}

function findCell(weeks: (CalendarDay | null)[][], day: number): CalendarDay | null {
  for (const week of weeks) {
    for (const cell of week) {
      if (cell && cell.day === day) return cell
    }
  }
  return null
}
