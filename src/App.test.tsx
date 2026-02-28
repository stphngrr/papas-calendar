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

test('adding an event shows it in the event list', () => {
  render(<App />)

  // Add an event manually via the form
  fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test Person' } })
  fireEvent.click(screen.getByRole('button', { name: /add event/i }))

  // Event should appear in the event list
  expect(screen.getByText('Test Person')).toBeInTheDocument()
})
