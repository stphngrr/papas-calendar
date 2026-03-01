// ABOUTME: Scrollable event list with inline editing, deletion, and search filtering.
// ABOUTME: Each row shows event details with edit/delete actions.

import { useState, useCallback } from 'react'
import type { CalendarEvent, RecurrenceRule } from '../types'
import { MONTH_NAMES } from '../constants'
import { isValidDay } from '../lib/validation'
import { formatRecurrenceRule } from '../lib/recurrence'

const DAY_OF_WEEK_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface EventListProps {
  events: CalendarEvent[]
  onUpdate: (id: string, updates: Partial<Omit<CalendarEvent, 'id'>>) => void
  onDelete: (id: string) => void
  availableGroups: string[]
}

export function EventList({ events, onUpdate, onDelete, availableGroups }: EventListProps) {
  const [search, setSearch] = useState('')
  const [filterGroup, setFilterGroup] = useState('')
  const [filterMonth, setFilterMonth] = useState(0)
  const [filterType, setFilterType] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editMonth, setEditMonth] = useState(1)
  const [editDay, setEditDay] = useState(1)
  const [editGroups, setEditGroups] = useState<string[]>([])
  const [editError, setEditError] = useState('')
  const [editRecurrencePattern, setEditRecurrencePattern] = useState<'weekly' | 'nth'>('weekly')
  const [editDayOfWeek, setEditDayOfWeek] = useState(0)
  const [editNthOccurrence, setEditNthOccurrence] = useState(1)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const startEdit = useCallback((event: CalendarEvent) => {
    setEditingId(event.id)
    setEditName(event.name)
    setEditMonth(event.month)
    setEditDay(event.day)
    setEditGroups([...event.groups])
    if (event.type === 'R' && event.recurrence) {
      setEditRecurrencePattern(event.recurrence.kind)
      setEditDayOfWeek(event.recurrence.dayOfWeek)
      if (event.recurrence.kind === 'nth') {
        setEditNthOccurrence(event.recurrence.n)
      }
    }
  }, [])

  const saveEdit = useCallback((eventType: CalendarEvent['type']) => {
    if (editingId) {
      if (eventType === 'R') {
        const recurrence: RecurrenceRule =
          editRecurrencePattern === 'weekly'
            ? { kind: 'weekly', dayOfWeek: editDayOfWeek }
            : { kind: 'nth', n: editNthOccurrence, dayOfWeek: editDayOfWeek }
        onUpdate(editingId, { name: editName, groups: editGroups, recurrence })
      } else {
        if (!isValidDay(editMonth, editDay)) {
          setEditError('Invalid day for the selected month')
          return
        }
        onUpdate(editingId, { name: editName, month: editMonth, day: editDay, groups: editGroups })
      }
      setEditingId(null)
    }
  }, [editingId, editName, editMonth, editDay, editGroups, onUpdate, editRecurrencePattern, editDayOfWeek, editNthOccurrence])

  const filtered = events.filter((e) => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterGroup && !e.groups.includes(filterGroup)) return false
    if (filterMonth && e.type !== 'R' && e.month !== filterMonth) return false
    if (filterType && e.type !== filterType) return false
    return true
  })

  return (
    <div>
      <input
        type="text"
        placeholder="Search events..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)}>
        <option value="">All Groups</option>
        {availableGroups.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>
      <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))}>
        <option value={0}>All Months</option>
        {MONTH_NAMES.map((name, i) => (
          <option key={i + 1} value={i + 1}>{name}</option>
        ))}
      </select>
      <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
        <option value="">All Types</option>
        <option value="B">Birthday</option>
        <option value="A">Anniversary</option>
        <option value="R">Recurring</option>
      </select>
      <div className="event-list-scroll">
        {filtered.map((event) => (
          <div key={event.id} className={event.groups.length === 0 ? 'ungrouped' : ''}>
            {editingId === event.id ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  aria-label="Name"
                />
                {event.type === 'R' ? (
                  <div className="edit-date-row">
                    <label>
                      Pattern
                      <select
                        value={editRecurrencePattern}
                        onChange={(e) => setEditRecurrencePattern(e.target.value as 'weekly' | 'nth')}
                      >
                        <option value="weekly">Every week</option>
                        <option value="nth">Nth weekday of month</option>
                      </select>
                    </label>
                    <label>
                      Day of week
                      <select
                        value={editDayOfWeek}
                        onChange={(e) => setEditDayOfWeek(Number(e.target.value))}
                      >
                        {DAY_OF_WEEK_NAMES.map((name, i) => (
                          <option key={i} value={i}>{name}</option>
                        ))}
                      </select>
                    </label>
                    {editRecurrencePattern === 'nth' && (
                      <label>
                        Occurrence
                        <select
                          value={editNthOccurrence}
                          onChange={(e) => setEditNthOccurrence(Number(e.target.value))}
                        >
                          <option value={1}>1st</option>
                          <option value={2}>2nd</option>
                          <option value={3}>3rd</option>
                          <option value={4}>4th</option>
                          <option value={5}>5th</option>
                        </select>
                      </label>
                    )}
                  </div>
                ) : (
                  <div className="edit-date-row">
                    <select
                      className="edit-month-select"
                      value={editMonth}
                      onChange={(e) => { setEditMonth(Number(e.target.value)); if (editError) setEditError('') }}
                      aria-label="Month"
                    >
                      {MONTH_NAMES.map((name, i) => (
                        <option key={i + 1} value={i + 1}>{name.slice(0, 3)}</option>
                      ))}
                    </select>
                    <input
                      className="edit-day-input"
                      type="number"
                      value={editDay}
                      onChange={(e) => { setEditDay(Number(e.target.value)); if (editError) setEditError('') }}
                      aria-label="Day"
                      min={1}
                      max={31}
                    />
                  </div>
                )}
                {editError && <p className="form-error">{editError}</p>}
                {availableGroups.length > 0 && (
                  <fieldset>
                    <legend>Groups</legend>
                    {availableGroups.map((group) => (
                      <label key={group}>
                        <input
                          type="checkbox"
                          checked={editGroups.includes(group)}
                          onChange={() => setEditGroups((prev) =>
                            prev.includes(group)
                              ? prev.filter((g) => g !== group)
                              : [...prev, group],
                          )}
                        />
                        {group}
                      </label>
                    ))}
                  </fieldset>
                )}
                <button onClick={() => saveEdit(event.type)}>Save</button>
                <button onClick={() => setEditingId(null)}>Cancel</button>
              </>
            ) : (
              <>
                <span>{event.name}</span>
                <span>
                  {event.type === 'R' && event.recurrence
                    ? ` (R) ${formatRecurrenceRule(event.recurrence)}`
                    : ` (${event.type}) ${event.month}/${event.day}`}
                </span>
                <button onClick={() => startEdit(event)}>Edit</button>
                {confirmDeleteId === event.id ? (
                  <div className="delete-confirm">
                    <p className="form-error">Are you sure you want to delete?</p>
                    <div className="delete-confirm-buttons">
                      <button onClick={() => { onDelete(event.id); setConfirmDeleteId(null) }}>Confirm</button>
                      <button onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(event.id)}>Delete</button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
