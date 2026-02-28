// ABOUTME: Form for adding new calendar events with name, type, date, and groups.
// ABOUTME: Starts collapsed; expands on click, collapses after submission or cancel.

import { useState, useCallback } from 'react'
import type { CalendarEvent, EventType } from '../types'

interface EventFormProps {
  onAdd: (event: Omit<CalendarEvent, 'id'>) => void
  availableGroups: string[]
}

export function EventForm({ onAdd, availableGroups }: EventFormProps) {
  const [expanded, setExpanded] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<EventType>('B')
  const [month, setMonth] = useState(1)
  const [day, setDay] = useState(1)
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])

  const resetForm = useCallback(() => {
    setName('')
    setType('B')
    setMonth(1)
    setDay(1)
    setSelectedGroups([])
    setExpanded(false)
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      onAdd({ name, type, month, day, groups: selectedGroups })
      resetForm()
    },
    [name, type, month, day, selectedGroups, onAdd, resetForm],
  )

  const toggleGroup = useCallback((group: string) => {
    setSelectedGroups((prev) =>
      prev.includes(group)
        ? prev.filter((g) => g !== group)
        : [...prev, group],
    )
  }, [])

  if (!expanded) {
    return <button onClick={() => setExpanded(true)}>Add Event</button>
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Name
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        Type
        <select value={type} onChange={(e) => setType(e.target.value as EventType)}>
          <option value="B">Birthday</option>
          <option value="A">Anniversary</option>
        </select>
      </label>
      <label>
        Month
        <input type="number" min={1} max={12} value={month} onChange={(e) => setMonth(Number(e.target.value))} />
      </label>
      <label>
        Day
        <input type="number" min={1} max={31} value={day} onChange={(e) => setDay(Number(e.target.value))} />
      </label>
      {availableGroups.length > 0 && (
        <fieldset>
          <legend>Groups</legend>
          {availableGroups.map((group) => (
            <label key={group}>
              <input
                type="checkbox"
                checked={selectedGroups.includes(group)}
                onChange={() => toggleGroup(group)}
              />
              {group}
            </label>
          ))}
        </fieldset>
      )}
      <button type="submit">Save Event</button>
      <button type="button" onClick={resetForm}>Cancel</button>
    </form>
  )
}
