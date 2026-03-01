// ABOUTME: Form for adding new calendar events with name, type, date, and groups.
// ABOUTME: Starts collapsed; expands on click, collapses after submission or cancel.

import { useState, useCallback } from 'react'
import type { CalendarEvent, EventType, RecurrenceRule } from '../types'
import { MONTH_NAMES } from '../constants'
import { isValidDay } from '../lib/validation'

const DAY_OF_WEEK_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

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
  const [error, setError] = useState('')
  const [recurrencePattern, setRecurrencePattern] = useState<'weekly' | 'nth'>('weekly')
  const [dayOfWeek, setDayOfWeek] = useState(0)
  const [nthOccurrence, setNthOccurrence] = useState(1)

  const resetForm = useCallback(() => {
    setName('')
    setType('B')
    setMonth(1)
    setDay(1)
    setSelectedGroups([])
    setError('')
    setRecurrencePattern('weekly')
    setDayOfWeek(0)
    setNthOccurrence(1)
    setExpanded(false)
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!name.trim()) {
        setError('Name is required')
        return
      }
      if (type === 'R') {
        const recurrence: RecurrenceRule =
          recurrencePattern === 'weekly'
            ? { kind: 'weekly', dayOfWeek }
            : { kind: 'nth', n: nthOccurrence, dayOfWeek }
        onAdd({ name, type, month: 0, day: 0, groups: selectedGroups, recurrence })
      } else {
        if (!isValidDay(month, day)) {
          setError('Invalid day for the selected month')
          return
        }
        onAdd({ name, type, month, day, groups: selectedGroups })
      }
      resetForm()
    },
    [name, type, month, day, selectedGroups, onAdd, resetForm, recurrencePattern, dayOfWeek, nthOccurrence],
  )

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    if (error) setError('')
  }, [error])

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
        <input type="text" value={name} onChange={handleNameChange} />
      </label>
      {error && <p className="form-error">{error}</p>}
      <label>
        Type
        <select value={type} onChange={(e) => setType(e.target.value as EventType)}>
          <option value="B">Birthday</option>
          <option value="A">Anniversary</option>
          <option value="R">Recurring</option>
        </select>
      </label>
      {type === 'R' ? (
        <>
          <label>
            Pattern
            <select value={recurrencePattern} onChange={(e) => setRecurrencePattern(e.target.value as 'weekly' | 'nth')}>
              <option value="weekly">Every week</option>
              <option value="nth">Nth weekday of month</option>
            </select>
          </label>
          <label>
            Day of week
            <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
              {DAY_OF_WEEK_NAMES.map((name, i) => (
                <option key={i} value={i}>{name}</option>
              ))}
            </select>
          </label>
          {recurrencePattern === 'nth' && (
            <label>
              Occurrence
              <select value={nthOccurrence} onChange={(e) => setNthOccurrence(Number(e.target.value))}>
                <option value={1}>1st</option>
                <option value={2}>2nd</option>
                <option value={3}>3rd</option>
                <option value={4}>4th</option>
                <option value={5}>5th</option>
              </select>
            </label>
          )}
        </>
      ) : (
        <>
          <label>
            Month
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
          </label>
          <label>
            Day
            <input type="number" min={1} max={31} value={day} onChange={(e) => { setDay(Number(e.target.value)); if (error) setError('') }} />
          </label>
        </>
      )}
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
