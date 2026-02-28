// ABOUTME: Tests for the root App component.
// ABOUTME: Verifies rendering, live preview updates, and group filtering.

import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

test('renders the app title', () => {
  render(<App />)
  expect(screen.getByText("Papa's Calendar")).toBeInTheDocument()
})

test('changing month updates the preview', () => {
  render(<App />)
  // The preview should show day-of-week headers
  expect(screen.getByText('SUNDAY')).toBeInTheDocument()

  // Change month via the MonthYearSelector (first select with Month label)
  const monthSelects = screen.getAllByLabelText(/^Month$/i)
  fireEvent.change(monthSelects[0], { target: { value: '6' } })
  // The default title should now reflect June
  const year = new Date().getFullYear()
  expect(screen.getByText(`JUNE ${year}`)).toBeInTheDocument()
})

test('renders Calendar and Events tabs, Calendar is default', () => {
  render(<App />)

  // Both tab buttons should be present
  expect(screen.getByRole('button', { name: 'Calendar' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Events' })).toBeInTheDocument()

  // Calendar tab content should be visible by default
  expect(screen.getByText(/import \/ export/i)).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /groups/i })).toBeInTheDocument()

  // Events tab content should NOT be visible
  expect(screen.queryByRole('heading', { name: /add event/i })).not.toBeInTheDocument()
})

test('clicking Events tab shows event form and hides calendar settings', () => {
  render(<App />)

  fireEvent.click(screen.getByRole('button', { name: 'Events' }))

  // Events content visible
  expect(screen.getByRole('heading', { name: /add event/i })).toBeInTheDocument()

  // Calendar content hidden
  expect(screen.queryByText(/import \/ export/i)).not.toBeInTheDocument()
})

test('adding an event shows it in the event list', () => {
  render(<App />)

  // Switch to Events tab first
  fireEvent.click(screen.getByRole('button', { name: 'Events' }))

  // Expand the event form, fill it in, and submit
  fireEvent.click(screen.getByRole('button', { name: /add event/i }))
  fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test Person' } })
  fireEvent.click(screen.getByRole('button', { name: /save event/i }))

  // Event should appear in the event list
  expect(screen.getByText('Test Person')).toBeInTheDocument()
})
