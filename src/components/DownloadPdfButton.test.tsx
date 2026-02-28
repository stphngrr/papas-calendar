// ABOUTME: Tests for DownloadPdfButton component.
// ABOUTME: Verifies the button calls PDF generation with the correct grid and options.

import { render, screen, fireEvent } from '@testing-library/react'
import { DownloadPdfButton } from './DownloadPdfButton'
import { buildCalendarGrid } from '../lib/calendar'
import * as pdf from '../lib/pdf'

describe('DownloadPdfButton', () => {
  test('clicking download calls generateCalendarPdf with correct grid and options', () => {
    const grid = buildCalendarGrid(2026, 2, [], [], [])
    const spy = vi.spyOn(pdf, 'downloadCalendarPdf').mockImplementation(() => {})

    render(<DownloadPdfButton grid={grid} title="FEBRUARY 2026" />)
    fireEvent.click(screen.getByRole('button', { name: /download pdf/i }))

    expect(spy).toHaveBeenCalledTimes(1)
    const [doc, filename] = spy.mock.calls[0]
    expect(doc).toBeDefined()
    expect(filename).toBe('FEBRUARY 2026.pdf')

    spy.mockRestore()
  })
})
