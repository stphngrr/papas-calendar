// ABOUTME: Generates printable monthly calendar PDFs using jsPDF direct drawing.
// ABOUTME: Takes a CalendarGrid and produces a landscape letter PDF matching Papa's calendar style.

import { jsPDF } from 'jspdf'
import type { CalendarGrid, CalendarDay, CalendarEvent, MoonPhase } from '../types'

export interface PdfOptions {
  title: string
}

// Layout constants (landscape letter, mm)
const PAGE_WIDTH = 279.4
const PAGE_HEIGHT = 215.9
const MARGIN = 5
const HEADER_ROW_HEIGHT = 8
const BODY_ROWS = 6
const COLS = 7
const GRID_WIDTH = PAGE_WIDTH - 2 * MARGIN
const GRID_HEIGHT = PAGE_HEIGHT - 2 * MARGIN
const COL_WIDTH = GRID_WIDTH / COLS
const ROW_HEIGHT = (GRID_HEIGHT - HEADER_ROW_HEIGHT) / BODY_ROWS
const CELL_PADDING = 1.5

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

// Font sizes in points
const HEADER_FONT_SIZE = 9
const DAY_NUMBER_FONT_SIZE = 14
const CONTENT_FONT_SIZE = 7
const TITLE_FONT_SIZE = 26
const MIN_FONT_SIZE = 5

export function formatMoonPhase(type: MoonPhase['type']): string {
  return type.toUpperCase()
}

export function formatEvent(event: CalendarEvent): string {
  return `${event.type}: ${event.name}`
}

export function padGridToSixRows(weeks: (CalendarDay | null)[][]): (CalendarDay | null)[][] {
  const padded = weeks.map(row => [...row])
  while (padded.length < BODY_ROWS) {
    padded.push(Array(COLS).fill(null))
  }
  return padded
}

export function generateCalendarPdf(grid: CalendarGrid, options: PdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'letter',
  })

  const paddedWeeks = padGridToSixRows(grid.weeks)

  drawGrid(doc)
  drawHeaderRow(doc)
  drawDayCells(doc, paddedWeeks)

  return doc
}

function drawGrid(doc: jsPDF): void {
  doc.setDrawColor(0)
  doc.setLineWidth(0.3)

  // Outer border
  doc.rect(MARGIN, MARGIN, GRID_WIDTH, GRID_HEIGHT)

  // Header row bottom line
  const headerBottom = MARGIN + HEADER_ROW_HEIGHT
  doc.line(MARGIN, headerBottom, MARGIN + GRID_WIDTH, headerBottom)

  // Body row lines
  for (let row = 1; row < BODY_ROWS; row++) {
    const y = headerBottom + row * ROW_HEIGHT
    doc.line(MARGIN, y, MARGIN + GRID_WIDTH, y)
  }

  // Column lines
  for (let col = 1; col < COLS; col++) {
    const x = MARGIN + col * COL_WIDTH
    doc.line(x, MARGIN, x, MARGIN + GRID_HEIGHT)
  }
}

function drawHeaderRow(doc: jsPDF): void {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(HEADER_FONT_SIZE)

  const headerY = MARGIN + HEADER_ROW_HEIGHT / 2

  for (let col = 0; col < COLS; col++) {
    const x = MARGIN + col * COL_WIDTH + COL_WIDTH / 2
    doc.text(DAY_NAMES[col], x, headerY, { align: 'center', baseline: 'middle' })
  }
}

function drawDayCells(doc: jsPDF, paddedWeeks: (CalendarDay | null)[][]): void {
  const headerBottom = MARGIN + HEADER_ROW_HEIGHT

  for (let row = 0; row < paddedWeeks.length; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = paddedWeeks[row][col]
      if (!cell) continue

      const x = MARGIN + col * COL_WIDTH
      const y = headerBottom + row * ROW_HEIGHT

      drawCellContent(doc, cell, x, y, COL_WIDTH, ROW_HEIGHT)
    }
  }
}

function getLineHeightMm(doc: jsPDF): number {
  return doc.getLineHeight() / doc.internal.scaleFactor
}

function drawCellContent(
  doc: jsPDF,
  cell: CalendarDay,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const maxTextWidth = width - 2 * CELL_PADDING

  // Day number (bold, top-left)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(DAY_NUMBER_FONT_SIZE)
  const dayNumStr = String(cell.day)
  doc.text(dayNumStr, x + CELL_PADDING, y + CELL_PADDING, { baseline: 'top' })

  // Moon phase on the same line as day number, to the right
  let cursorY = y + CELL_PADDING
  if (cell.moonPhases.length > 0) {
    const dayNumWidth = doc.getTextWidth(dayNumStr)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(CONTENT_FONT_SIZE)
    const moonText = formatMoonPhase(cell.moonPhases[0].type)
    doc.text(moonText, x + CELL_PADDING + dayNumWidth + 2, cursorY + 1, { baseline: 'top' })
  }

  // Advance past day number line
  doc.setFontSize(DAY_NUMBER_FONT_SIZE)
  cursorY += getLineHeightMm(doc)

  // Events flowing downward from top
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(CONTENT_FONT_SIZE)
  const eventLineHeight = getLineHeightMm(doc)

  // Collect holiday text for bottom anchoring — compute how much space they need
  const holidayLines: string[] = []
  for (const holiday of cell.holidays) {
    const wrapped = doc.splitTextToSize(holiday.name, maxTextWidth) as string[]
    holidayLines.push(...wrapped)
  }
  const holidayHeight = holidayLines.length * eventLineHeight
  const bottomLimit = y + height - CELL_PADDING - holidayHeight

  for (const event of cell.events) {
    const text = formatEvent(event)
    const wrapped = doc.splitTextToSize(text, maxTextWidth) as string[]
    for (const line of wrapped) {
      if (cursorY >= bottomLimit) break
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(CONTENT_FONT_SIZE)
      doc.text(line, x + CELL_PADDING, cursorY, { baseline: 'top' })
      cursorY += eventLineHeight
    }
  }

  // Holidays anchored to bottom of cell
  if (holidayLines.length > 0) {
    let holidayY = y + height - CELL_PADDING - holidayHeight
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(CONTENT_FONT_SIZE)
    for (const line of holidayLines) {
      doc.text(line, x + CELL_PADDING, holidayY, { baseline: 'top' })
      holidayY += eventLineHeight
    }
  }
}
