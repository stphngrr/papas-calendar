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

  test('shows existing groups as checkboxes', () => {
    render(<EventForm onAdd={() => {}} availableGroups={['Family', 'Friends', 'Work']} />)
    fireEvent.click(screen.getByRole('button', { name: /add event/i }))
    expect(screen.getByLabelText('Family')).toBeInTheDocument()
    expect(screen.getByLabelText('Friends')).toBeInTheDocument()
    expect(screen.getByLabelText('Work')).toBeInTheDocument()
  })
})
