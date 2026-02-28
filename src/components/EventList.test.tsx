// ABOUTME: Tests for EventList component.
// ABOUTME: Verifies event rendering, inline editing, deletion, and search filtering.

import { render, screen, fireEvent } from '@testing-library/react'
import { EventList } from './EventList'
import type { CalendarEvent } from '../types'

const events: CalendarEvent[] = [
  { id: '1', name: 'Alice', type: 'B', month: 3, day: 15, groups: ['Family'] },
  { id: '2', name: 'Bob', type: 'A', month: 3, day: 20, groups: ['Friends'] },
  { id: '3', name: 'Carol', type: 'B', month: 6, day: 10, groups: ['Family'] },
]

describe('EventList', () => {
  test('renders event rows', () => {
    render(<EventList events={events} onUpdate={() => {}} onDelete={() => {}} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Carol')).toBeInTheDocument()
  })

  test('delete requires confirmation before calling onDelete', () => {
    const onDelete = vi.fn()
    render(<EventList events={events} onUpdate={() => {}} onDelete={onDelete} />)
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    fireEvent.click(deleteButtons[0])

    // Should not delete yet
    expect(onDelete).not.toHaveBeenCalled()
    // Should show confirm/cancel
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))
    expect(onDelete).toHaveBeenCalledWith('1')
  })

  test('cancelling delete does not call onDelete', () => {
    const onDelete = vi.fn()
    render(<EventList events={events} onUpdate={() => {}} onDelete={onDelete} />)
    fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onDelete).not.toHaveBeenCalled()
    // Delete button should be back
    expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(3)
  })

  test('edit button opens inline editor', () => {
    render(<EventList events={events} onUpdate={() => {}} onDelete={() => {}} />)
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    fireEvent.click(editButtons[0])
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
  })

  test('save button in editor updates the event', () => {
    const onUpdate = vi.fn()
    render(<EventList events={events} onUpdate={onUpdate} onDelete={() => {}} />)
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    fireEvent.click(editButtons[0])
    const nameInput = screen.getByDisplayValue('Alice')
    fireEvent.change(nameInput, { target: { value: 'Alicia' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onUpdate).toHaveBeenCalledWith('1', expect.objectContaining({ name: 'Alicia' }))
  })

  test('inline edit shows month names dropdown', () => {
    render(<EventList events={events} onUpdate={() => {}} onDelete={() => {}} />)
    fireEvent.click(screen.getAllByRole('button', { name: /edit/i })[0])
    const monthSelect = screen.getByLabelText('Month') as HTMLSelectElement
    const options = Array.from(monthSelect.options)
    expect(options.map((o) => o.text)).toEqual([
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ])
    expect(monthSelect.value).toBe('3')
  })

  test('search box filters visible events by name', () => {
    render(<EventList events={events} onUpdate={() => {}} onDelete={() => {}} />)
    const searchBox = screen.getByPlaceholderText(/search/i)
    fireEvent.change(searchBox, { target: { value: 'ali' } })
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.queryByText('Bob')).not.toBeInTheDocument()
    expect(screen.queryByText('Carol')).not.toBeInTheDocument()
  })
})
