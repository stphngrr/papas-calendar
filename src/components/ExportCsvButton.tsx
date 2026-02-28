// ABOUTME: Button that exports the current events as a downloadable CSV file.
// ABOUTME: Disabled when no events are loaded.

import { useCallback } from 'react'
import type { CalendarEvent } from '../types'
import { exportEventsToCsv, downloadCsv } from '../lib/csv'

interface ExportCsvButtonProps {
  events: CalendarEvent[]
}

export function ExportCsvButton({ events }: ExportCsvButtonProps) {
  const handleExport = useCallback(() => {
    const csv = exportEventsToCsv(events)
    downloadCsv(csv, 'calendar-events.csv')
  }, [events])

  return (
    <button onClick={handleExport} disabled={events.length === 0}>
      Export CSV
    </button>
  )
}
