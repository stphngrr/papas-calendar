// ABOUTME: Button that generates and downloads a PDF calendar for the current month.
// ABOUTME: Uses generateCalendarPdf to create the document and triggers a file download.

import { useCallback } from 'react'
import type { CalendarGrid } from '../types'
import { generateCalendarPdf, downloadCalendarPdf } from '../lib/pdf'

interface DownloadPdfButtonProps {
  grid: CalendarGrid
  title: string
}

export function DownloadPdfButton({ grid, title }: DownloadPdfButtonProps) {
  const handleDownload = useCallback(() => {
    const doc = generateCalendarPdf(grid, { title })
    downloadCalendarPdf(doc, `${title}.pdf`)
  }, [grid, title])

  return (
    <button onClick={handleDownload}>Download PDF</button>
  )
}
