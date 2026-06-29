// ABOUTME: Collapsible list of soft-deleted events with per-row restore.
// ABOUTME: Always shows the full deleted set, independent of active-list filters.

import { useState } from 'react'
import type { CalendarEvent } from '../types'
import { formatRecurrenceRule } from '../lib/recurrence'

interface DeletedEventListProps {
  events: CalendarEvent[]
  onRestore: (id: string) => void
}

export function DeletedEventList({ events, onRestore }: DeletedEventListProps) {
  const [expanded, setExpanded] = useState(false)

  if (events.length === 0) return null

  return (
    <div>
      <button onClick={() => setExpanded((v) => !v)}>
        Deleted ({events.length})
      </button>
      {expanded && (
        <div className="event-list-scroll">
          {events.map((event) => (
            <div key={event.id} className="deleted-event">
              <span>{event.name}</span>
              <span>
                {event.type === 'R' && event.recurrence
                  ? ` (R) ${formatRecurrenceRule(event.recurrence)}`
                  : ` (${event.type}) ${event.month}/${event.day}`}
              </span>
              {event.groups.length > 0 && (
                <span className="deleted-event-groups">{event.groups.join(', ')}</span>
              )}
              <button onClick={() => onRestore(event.id)}>Restore</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
