// ABOUTME: Scrollable event list with inline editing, deletion, and search filtering.
// ABOUTME: Each row shows event details with edit/delete actions.

import { useState, useCallback } from 'react'
import type { CalendarEvent } from '../types'
import { MONTH_NAMES } from '../constants'

interface EventListProps {
  events: CalendarEvent[]
  onUpdate: (id: string, updates: Partial<Omit<CalendarEvent, 'id'>>) => void
  onDelete: (id: string) => void
}

export function EventList({ events, onUpdate, onDelete }: EventListProps) {
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editMonth, setEditMonth] = useState(1)
  const [editDay, setEditDay] = useState(1)

  const startEdit = useCallback((event: CalendarEvent) => {
    setEditingId(event.id)
    setEditName(event.name)
    setEditMonth(event.month)
    setEditDay(event.day)
  }, [])

  const saveEdit = useCallback(() => {
    if (editingId) {
      onUpdate(editingId, { name: editName, month: editMonth, day: editDay })
      setEditingId(null)
    }
  }, [editingId, editName, editMonth, editDay, onUpdate])

  const filtered = search
    ? events.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
    : events

  return (
    <div>
      <input
        type="text"
        placeholder="Search events..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="event-list-scroll">
        {filtered.map((event) => (
          <div key={event.id}>
            {editingId === event.id ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  aria-label="Name"
                />
                <select
                  value={editMonth}
                  onChange={(e) => setEditMonth(Number(e.target.value))}
                  aria-label="Month"
                >
                  {MONTH_NAMES.map((name, i) => (
                    <option key={i + 1} value={i + 1}>{name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={editDay}
                  onChange={(e) => setEditDay(Number(e.target.value))}
                  aria-label="Day"
                />
                <button onClick={saveEdit}>Save</button>
                <button onClick={() => setEditingId(null)}>Cancel</button>
              </>
            ) : (
              <>
                <span>{event.name}</span>
                <span> ({event.type}) {event.month}/{event.day}</span>
                <button onClick={() => startEdit(event)}>Edit</button>
                <button onClick={() => onDelete(event.id)}>Delete</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
