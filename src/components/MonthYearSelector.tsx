// ABOUTME: Month and year selection controls for navigating the calendar.
// ABOUTME: Month is a dropdown with names, year is a numeric input.

import { MONTH_NAMES } from '../constants'

interface MonthYearSelectorProps {
  month: number
  year: number
  onMonthChange: (month: number) => void
  onYearChange: (year: number) => void
}

export function MonthYearSelector({ month, year, onMonthChange, onYearChange }: MonthYearSelectorProps) {
  return (
    <div>
      <label>
        Month
        <select value={month} onChange={(e) => onMonthChange(Number(e.target.value))}>
          {MONTH_NAMES.map((name, i) => (
            <option key={i + 1} value={i + 1}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Year
        <input
          type="number"
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
        />
      </label>
    </div>
  )
}
