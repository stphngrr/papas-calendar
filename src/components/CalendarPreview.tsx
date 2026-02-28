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
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            {DAY_NAMES.map((name) => (
              <th key={name} style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((cell, ci) => (
                <td key={ci} style={{ border: '1px solid black', padding: '4px', verticalAlign: 'top', minHeight: '60px' }}>
                  {cell && <DayCell cell={cell} />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {grid.overflowEvents.length > 0 && (
        <div>
          {grid.overflowEvents.map((event) => (
            <div key={event.id}>
              {event.type}: {event.name} {MONTH_NAMES[event.month - 1]} {event.day}
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
      <div>
        <strong>{cell.day}</strong>
        {cell.moonPhases.map((mp, i) => (
          <span key={i} style={{ fontSize: '0.7em', marginLeft: '4px' }}>
            {mp.type.toUpperCase()}
          </span>
        ))}
      </div>
      {cell.events.map((event) => (
        <div key={event.id} style={{ fontSize: '0.75em' }}>
          {event.type}: {event.name}
        </div>
      ))}
      {cell.holidays.map((holiday, i) => (
        <div key={i} style={{ fontSize: '0.75em' }}>
          {holiday.name}
        </div>
      ))}
    </>
  )
}
