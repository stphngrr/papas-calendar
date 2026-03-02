// ABOUTME: HTML table rendering of the calendar grid for on-screen preview.
// ABOUTME: Visual approximation of the PDF output using the same CalendarGrid data.

import type { CalendarGrid, CalendarDay } from '../types'

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const MONTH_NAMES = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
]

interface CalendarPreviewProps {
  grid: CalendarGrid
  title: string
}

export function CalendarPreview({ grid, title }: CalendarPreviewProps) {
  return (
    <div>
      <h2>{title}</h2>
      <table>
        <thead>
          <tr>
            {DAY_NAMES.map((name) => (
              <th key={name}>{name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((cell, ci) => (
                <td key={ci}>
                  {cell && <DayCell cell={cell} />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {grid.overflowEvents.length > 0 && (
        <div className="overflow-events">
          {grid.overflowEvents.map((event) => (
            <div key={event.id}>
              {event.type}: {event.name.toUpperCase()} {MONTH_NAMES[event.month - 1]} {event.day}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DayCell({ cell }: { cell: CalendarDay }) {
  return (
    <>
      <div className="day-header">
        <strong>{cell.day}</strong>
        {cell.moonPhases.map((mp, i) => (
          <span key={i} className="moon-phase">{mp.type.toUpperCase()}</span>
        ))}
      </div>
      {cell.recurringEvents.map((name, i) => (
        <div key={`recurring-${i}`} className="cell-event">
          {name.toUpperCase()}
        </div>
      ))}
      {cell.events.map((event) => (
        <div key={event.id} className="cell-event">
          {event.type}: {event.name.toUpperCase()}
        </div>
      ))}
      {cell.holidays.map((holiday, i) => (
        <div key={i} className="cell-holiday">
          {holiday.name}
        </div>
      ))}
    </>
  )
}
