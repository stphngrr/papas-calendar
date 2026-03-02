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
const MIN_BODY_ROWS = 5
const COLS = 7
const GRID_WIDTH = PAGE_WIDTH - 2 * MARGIN
const GRID_HEIGHT = PAGE_HEIGHT - 2 * MARGIN
const COL_WIDTH = GRID_WIDTH / COLS
const CELL_PADDING = 1.5

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

// Font sizes in points
const HEADER_FONT_SIZE = 9
const DAY_NUMBER_FONT_SIZE = 14
const CONTENT_FONT_SIZE = 7.5
const TITLE_FONT_SIZE = 26
const MIN_FONT_SIZE = 5

export function formatMoonPhase(type: MoonPhase['type']): string {
  return type.toUpperCase()
}

export function formatEvent(event: CalendarEvent): string {
  return `${event.type}: ${event.name.toUpperCase()}`
}

const MONTH_ABBR = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export function formatOverflowEvent(event: CalendarEvent): string {
  return `${event.type}: ${event.name.toUpperCase()} ${MONTH_ABBR[event.month - 1]} ${event.day}`
}

export function padGridToMinRows(weeks: (CalendarDay | null)[][]): (CalendarDay | null)[][] {
  const padded = weeks.map(row => [...row])
  while (padded.length < MIN_BODY_ROWS) {
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
  const bodyRows = paddedWeeks.length
  let best: TitleRegion = { startRow: 0, startCol: 0, endRow: 0, endCol: 0 }
  let bestArea = 0

  for (let r1 = 0; r1 < bodyRows; r1++) {
    for (let c1 = 0; c1 < COLS; c1++) {
      if (!isCellEmpty(paddedWeeks, r1, c1, reserved)) continue

      for (let r2 = r1; r2 < bodyRows; r2++) {
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

  const paddedWeeks = padGridToMinRows(grid.weeks)
  const bodyRows = paddedWeeks.length
  const rowHeight = (GRID_HEIGHT - HEADER_ROW_HEIGHT) / bodyRows

  // Reserve empty cells for overflow events before finding the title region
  const overflowCells = findOverflowCells(paddedWeeks, grid.overflowEvents.length)
  const reserved = new Set(overflowCells.map(c => `${c.row},${c.col}`))
  const titleRegion = findTitleRegion(paddedWeeks, reserved)

  drawGrid(doc, bodyRows, rowHeight, titleRegion)
  drawHeaderRow(doc)
  drawDayCells(doc, paddedWeeks, rowHeight)
  drawOverflowEvents(doc, overflowCells, grid.overflowEvents, rowHeight)
  drawTitle(doc, titleRegion, options.title, rowHeight)

  return doc
}

function drawGrid(
  doc: jsPDF,
  bodyRows: number,
  rowHeight: number,
  titleRegion: TitleRegion,
): void {
  doc.setDrawColor(0)
  doc.setLineWidth(0.3)

  // Outer border
  doc.rect(MARGIN, MARGIN, GRID_WIDTH, GRID_HEIGHT)

  // Header row bottom line
  const headerBottom = MARGIN + HEADER_ROW_HEIGHT
  doc.line(MARGIN, headerBottom, MARGIN + GRID_WIDTH, headerBottom)

  // Title region bounds in page coordinates
  const titleY1 = headerBottom + titleRegion.startRow * rowHeight
  const titleY2 = headerBottom + (titleRegion.endRow + 1) * rowHeight
  const titleX1 = MARGIN + titleRegion.startCol * COL_WIDTH
  const titleX2 = MARGIN + (titleRegion.endCol + 1) * COL_WIDTH

  // Body row lines — skip segments inside title region
  for (let row = 1; row < bodyRows; row++) {
    const y = headerBottom + row * rowHeight
    const insideTitle = y > titleY1 && y < titleY2
    if (insideTitle) {
      // Draw left and right segments, skipping the title region
      if (titleX1 > MARGIN) doc.line(MARGIN, y, titleX1, y)
      if (titleX2 < MARGIN + GRID_WIDTH) doc.line(titleX2, y, MARGIN + GRID_WIDTH, y)
    } else {
      doc.line(MARGIN, y, MARGIN + GRID_WIDTH, y)
    }
  }

  // Column lines — skip segments inside title region
  for (let col = 1; col < COLS; col++) {
    const x = MARGIN + col * COL_WIDTH
    const insideTitle = x > titleX1 && x < titleX2
    if (insideTitle) {
      // Draw above and below segments, skipping the title region
      if (titleY1 > MARGIN) doc.line(x, MARGIN, x, titleY1)
      if (titleY2 < MARGIN + GRID_HEIGHT) doc.line(x, titleY2, x, MARGIN + GRID_HEIGHT)
    } else {
      doc.line(x, MARGIN, x, MARGIN + GRID_HEIGHT)
    }
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

function drawDayCells(doc: jsPDF, paddedWeeks: (CalendarDay | null)[][], rowHeight: number): void {
  const headerBottom = MARGIN + HEADER_ROW_HEIGHT

  for (let row = 0; row < paddedWeeks.length; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = paddedWeeks[row][col]
      if (!cell) continue

      const x = MARGIN + col * COL_WIDTH
      const y = headerBottom + row * rowHeight

      drawCellContent(doc, cell, x, y, COL_WIDTH, rowHeight)
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

  for (const name of cell.recurringEvents) {
    const wrapped = doc.splitTextToSize(name.toUpperCase(), maxTextWidth) as string[]
    for (const line of wrapped) {
      if (cursorY >= bottomLimit) break
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(CONTENT_FONT_SIZE)
      doc.text(line, x + CELL_PADDING, cursorY, { baseline: 'top' })
      cursorY += eventLineHeight
    }
  }

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
  for (let row = paddedWeeks.length - 1; row >= 0 && cells.length < count; row--) {
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
  rowHeight: number,
): void {
  if (overflowEvents.length === 0) return

  const headerBottom = MARGIN + HEADER_ROW_HEIGHT

  for (let i = 0; i < overflowEvents.length && i < overflowCells.length; i++) {
    const { row, col } = overflowCells[i]
    const x = MARGIN + col * COL_WIDTH
    const y = headerBottom + row * rowHeight
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

function drawTitle(doc: jsPDF, region: TitleRegion, title: string, rowHeight: number): void {
  const headerBottom = MARGIN + HEADER_ROW_HEIGHT

  const x1 = MARGIN + region.startCol * COL_WIDTH
  const y1 = headerBottom + region.startRow * rowHeight
  const x2 = MARGIN + (region.endCol + 1) * COL_WIDTH
  const y2 = headerBottom + (region.endRow + 1) * rowHeight

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
