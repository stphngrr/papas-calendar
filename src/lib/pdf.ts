// ABOUTME: Generates printable monthly calendar PDFs using jsPDF direct drawing.
// ABOUTME: Takes a CalendarGrid and produces a landscape letter PDF matching Papa's calendar style.

import { jsPDF } from 'jspdf'
import type { CalendarGrid, CalendarDay, CalendarEvent, MoonPhase } from '../types'

export interface PdfOptions {
  title: string
}

export function downloadCalendarPdf(doc: jsPDF, filename: string): void {
  doc.save(filename)
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

const MONTH_ABBR = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export function formatOverflowEvent(event: CalendarEvent): string {
  return `${event.type}: ${event.name} ${MONTH_ABBR[event.month - 1]} ${event.day}`
}

export function padGridToSixRows(weeks: (CalendarDay | null)[][]): (CalendarDay | null)[][] {
  const padded = weeks.map(row => [...row])
  while (padded.length < BODY_ROWS) {
    padded.push(Array(COLS).fill(null))
  }
  return padded
}

export interface TitleRegion {
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}

function isCellEmpty(
  paddedWeeks: (CalendarDay | null)[][],
  row: number,
  col: number,
  reserved: Set<string>,
): boolean {
  return paddedWeeks[row][col] === null && !reserved.has(`${row},${col}`)
}

export function findTitleRegion(
  paddedWeeks: (CalendarDay | null)[][],
  reserved: Set<string> = new Set(),
): TitleRegion {
  // Find the largest rectangular area of empty, unreserved cells
  let best: TitleRegion = { startRow: 0, startCol: 0, endRow: 0, endCol: 0 }
  let bestArea = 0

  for (let r1 = 0; r1 < BODY_ROWS; r1++) {
    for (let c1 = 0; c1 < COLS; c1++) {
      if (!isCellEmpty(paddedWeeks, r1, c1, reserved)) continue

      for (let r2 = r1; r2 < BODY_ROWS; r2++) {
        let maxCol = COLS - 1
        for (let r = r1; r <= r2; r++) {
          let colLimit = c1
          while (colLimit <= maxCol && isCellEmpty(paddedWeeks, r, colLimit, reserved)) {
            colLimit++
          }
          maxCol = colLimit - 1
        }
        if (maxCol < c1) break

        const area = (r2 - r1 + 1) * (maxCol - c1 + 1)
        if (area > bestArea) {
          bestArea = area
          best = { startRow: r1, startCol: c1, endRow: r2, endCol: maxCol }
        }
      }
    }
  }

  return best
}

export function generateCalendarPdf(grid: CalendarGrid, options: PdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'letter',
  })

  const paddedWeeks = padGridToSixRows(grid.weeks)

  // Reserve empty cells for overflow events before finding the title region
  const overflowCells = findOverflowCells(paddedWeeks, grid.overflowEvents.length)
  const reserved = new Set(overflowCells.map(c => `${c.row},${c.col}`))
  const titleRegion = findTitleRegion(paddedWeeks, reserved)

  drawGrid(doc)
  drawHeaderRow(doc)
  drawDayCells(doc, paddedWeeks)
  drawOverflowEvents(doc, overflowCells, grid.overflowEvents)
  drawTitle(doc, titleRegion, options.title)

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

function findOverflowCells(
  paddedWeeks: (CalendarDay | null)[][],
  count: number,
): { row: number; col: number }[] {
  if (count === 0) return []

  // Scan bottom-up, left-to-right for empty cells
  const cells: { row: number; col: number }[] = []
  for (let row = BODY_ROWS - 1; row >= 0 && cells.length < count; row--) {
    for (let col = 0; col < COLS && cells.length < count; col++) {
      if (paddedWeeks[row][col] === null) {
        cells.push({ row, col })
      }
    }
  }
  return cells
}

function drawOverflowEvents(
  doc: jsPDF,
  overflowCells: { row: number; col: number }[],
  overflowEvents: CalendarEvent[],
): void {
  if (overflowEvents.length === 0) return

  const headerBottom = MARGIN + HEADER_ROW_HEIGHT

  for (let i = 0; i < overflowEvents.length && i < overflowCells.length; i++) {
    const { row, col } = overflowCells[i]
    const x = MARGIN + col * COL_WIDTH
    const y = headerBottom + row * ROW_HEIGHT
    const maxTextWidth = COL_WIDTH - 2 * CELL_PADDING

    const text = formatOverflowEvent(overflowEvents[i])
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(CONTENT_FONT_SIZE)
    const wrapped = doc.splitTextToSize(text, maxTextWidth) as string[]
    const lineHeight = getLineHeightMm(doc)

    let cursorY = y + CELL_PADDING
    for (const line of wrapped) {
      doc.text(line, x + CELL_PADDING, cursorY, { baseline: 'top' })
      cursorY += lineHeight
    }
  }
}

function drawTitle(doc: jsPDF, region: TitleRegion, title: string): void {
  const headerBottom = MARGIN + HEADER_ROW_HEIGHT

  const x1 = MARGIN + region.startCol * COL_WIDTH
  const y1 = headerBottom + region.startRow * ROW_HEIGHT
  const x2 = MARGIN + (region.endCol + 1) * COL_WIDTH
  const y2 = headerBottom + (region.endRow + 1) * ROW_HEIGHT

  const centerX = (x1 + x2) / 2
  const centerY = (y1 + y2) / 2

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(TITLE_FONT_SIZE)

  // Scale down if title doesn't fit in the region width
  const regionWidth = x2 - x1 - 2 * CELL_PADDING
  let fontSize = TITLE_FONT_SIZE
  while (fontSize > MIN_FONT_SIZE) {
    doc.setFontSize(fontSize)
    if (doc.getTextWidth(title) <= regionWidth) break
    fontSize -= 1
  }

  doc.text(title, centerX, centerY, { align: 'center', baseline: 'middle' })
}
