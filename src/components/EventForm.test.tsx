// ABOUTME: Tests for EventForm component.
// ABOUTME: Verifies form submission, clearing, and group checkbox display.

import { render, screen, fireEvent } from '@testing-library/react'
import { EventForm } from './EventForm'

describe('EventForm', () => {
  test('form is collapsed by default', () => {
    render(<EventForm onAdd={() => {}} availableGroups={[]} />)
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add event/i })).toBeInTheDocument()
  })

  test('clicking Add Event expands form, Cancel collapses it', () => {
    render(<EventForm onAdd={() => {}} availableGroups={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /add event/i }))
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument()
  })

  test('submitting form calls onAdd with correct values', () => {
    const onAdd = vi.fn()
    render(<EventForm onAdd={onAdd} availableGroups={['Family']} />)
    fireEvent.click(screen.getByRole('button', { name: /add event/i }))

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Dan' } })
    fireEvent.change(screen.getByLabelText(/month/i), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText(/day/i), { target: { value: '12' } })
    fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'A' } })
    fireEvent.click(screen.getByLabelText('Family'))
    fireEvent.click(screen.getByRole('button', { name: /save event/i }))

    expect(onAdd).toHaveBeenCalledWith({
      name: 'Dan',
      type: 'A',
      month: 5,
      day: 12,
      groups: ['Family'],
    })
  })

  test('form clears after submission and collapses', () => {
    const onAdd = vi.fn()
    render(<EventForm onAdd={onAdd} availableGroups={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /add event/i }))

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Eve' } })
    fireEvent.click(screen.getByRole('button', { name: /save event/i }))

    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument()
  })

  test('does not submit when name is empty and shows error', () => {
    const onAdd = vi.fn()
    render(<EventForm onAdd={onAdd} availableGroups={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /add event/i }))

    // Leave name empty and try to submit
    fireEvent.click(screen.getByRole('button', { name: /save event/i }))

    expect(onAdd).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByText(/name is required/i)).toBeInTheDocument()
  })

  test('error clears when user types a name', () => {
    render(<EventForm onAdd={vi.fn()} availableGroups={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /add event/i }))
    fireEvent.click(screen.getByRole('button', { name: /save event/i }))
    expect(screen.getByText(/name is required/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'A' } })
    expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument()
  })

  test('month dropdown shows month names instead of numbers', () => {
    render(<EventForm onAdd={() => {}} availableGroups={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /add event/i }))
    const monthSelect = screen.getByLabelText(/month/i)
    const options = Array.from((monthSelect as HTMLSelectElement).options)
    expect(options.map((o) => o.text)).toEqual([
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ])
  })

  test('shows existing groups as checkboxes', () => {
    render(<EventForm onAdd={() => {}} availableGroups={['Family', 'Friends', 'Work']} />)
    fireEvent.click(screen.getByRole('button', { name: /add event/i }))
    expect(screen.getByLabelText('Family')).toBeInTheDocument()
    expect(screen.getByLabelText('Friends')).toBeInTheDocument()
    expect(screen.getByLabelText('Work')).toBeInTheDocument()
  })
})
