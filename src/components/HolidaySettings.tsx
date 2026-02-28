// ABOUTME: Collapsible holiday settings with toggles for built-in holidays.
// ABOUTME: Includes a form for adding custom holidays by name, month, and day.

import { useState, useCallback } from 'react'
import type { Holiday } from '../types'
import { HOLIDAY_DEFINITIONS } from '../lib/holidays'

interface HolidaySettingsProps {
  enabledHolidays: string[]
  customHolidays: Holiday[]
  onToggle: (name: string) => void
  onAddCustom: (holiday: Holiday) => void
}

export function HolidaySettings({
  enabledHolidays,
  customHolidays,
  onToggle,
  onAddCustom,
}: HolidaySettingsProps) {
  const [expanded, setExpanded] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customMonth, setCustomMonth] = useState(1)
  const [customDay, setCustomDay] = useState(1)
  const [duplicateError, setDuplicateError] = useState('')

  const handleNameChange = useCallback((value: string) => {
    setCustomName(value)
    setDuplicateError('')
  }, [])

  const handleAddCustom = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = customName.trim()
      if (!trimmed) return
      const nameUpper = trimmed.toUpperCase()
      const isDuplicate =
        customHolidays.some((h) => h.name.toUpperCase() === nameUpper) ||
        HOLIDAY_DEFINITIONS.some((d) => d.name.toUpperCase() === nameUpper)
      if (isDuplicate) {
        setDuplicateError(`"${trimmed}" already exists`)
        return
      }
      onAddCustom({ name: trimmed, month: customMonth, day: customDay })
      setCustomName('')
      setCustomMonth(1)
      setCustomDay(1)
    },
    [customName, customMonth, customDay, onAddCustom, customHolidays],
  )

  return (
    <div>
      <button onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Hide' : 'Show'} Holiday Settings
      </button>
      {expanded && (
        <div>
          <fieldset>
            <legend>Built-in Holidays</legend>
            {HOLIDAY_DEFINITIONS.map((def) => (
              <label key={def.name}>
                <input
                  type="checkbox"
                  checked={enabledHolidays.includes(def.name)}
                  onChange={() => onToggle(def.name)}
                />
                {def.name}
              </label>
            ))}
          </fieldset>
          {customHolidays.length > 0 && (
            <div>
              <h4>Custom Holidays</h4>
              {customHolidays.map((h, i) => (
                <div key={i}>
                  {h.name} — {h.month}/{h.day}
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleAddCustom}>
            <label>
              Holiday name
              <input type="text" value={customName} onChange={(e) => handleNameChange(e.target.value)} />
            </label>
            <label>
              Holiday month
              <input type="number" min={1} max={12} value={customMonth} onChange={(e) => setCustomMonth(Number(e.target.value))} />
            </label>
            <label>
              Holiday day
              <input type="number" min={1} max={31} value={customDay} onChange={(e) => setCustomDay(Number(e.target.value))} />
            </label>
            {duplicateError && <div role="alert">{duplicateError}</div>}
            <button type="submit">Add Holiday</button>
          </form>
        </div>
      )}
    </div>
  )
}
