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

const groups = ['Family', 'Friends']

describe('EventList', () => {
  test('renders event rows', () => {
    render(<EventList events={events} onUpdate={() => {}} onDelete={() => {}} availableGroups={groups} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Carol')).toBeInTheDocument()
  })

  test('delete requires confirmation before calling onDelete', () => {
    const onDelete = vi.fn()
    render(<EventList events={events} onUpdate={() => {}} onDelete={onDelete} availableGroups={groups} />)
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    fireEvent.click(deleteButtons[0])

    // Should not delete yet
    expect(onDelete).not.toHaveBeenCalled()
    // Should show warning message
    expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument()
    // Should show confirm/cancel
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))
    expect(onDelete).toHaveBeenCalledWith('1')
  })

  test('cancelling delete does not call onDelete', () => {
    const onDelete = vi.fn()
    render(<EventList events={events} onUpdate={() => {}} onDelete={onDelete} availableGroups={groups} />)
    fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onDelete).not.toHaveBeenCalled()
    // Delete button should be back
    expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(3)
  })

  test('edit button opens inline editor', () => {
    render(<EventList events={events} onUpdate={() => {}} onDelete={() => {}} availableGroups={groups} />)
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    fireEvent.click(editButtons[0])
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
  })

  test('save button in editor updates the event', () => {
    const onUpdate = vi.fn()
    render(<EventList events={events} onUpdate={onUpdate} onDelete={() => {}} availableGroups={groups} />)
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    fireEvent.click(editButtons[0])
    const nameInput = screen.getByDisplayValue('Alice')
    fireEvent.change(nameInput, { target: { value: 'Alicia' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onUpdate).toHaveBeenCalledWith('1', expect.objectContaining({ name: 'Alicia' }))
  })

  test('inline edit shows month names dropdown', () => {
    render(<EventList events={events} onUpdate={() => {}} onDelete={() => {}} availableGroups={groups} />)
    fireEvent.click(screen.getAllByRole('button', { name: /edit/i })[0])
    const monthSelect = screen.getByLabelText('Month') as HTMLSelectElement
    const options = Array.from(monthSelect.options)
    expect(options.map((o) => o.text)).toEqual([
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ])
    expect(monthSelect.value).toBe('3')
  })

  test('inline edit shows group checkboxes and saves group changes', () => {
    const onUpdate = vi.fn()
    render(<EventList events={events} onUpdate={onUpdate} onDelete={() => {}} availableGroups={groups} />)
    // Alice is in Family only
    fireEvent.click(screen.getAllByRole('button', { name: /edit/i })[0])
    expect(screen.getByLabelText('Family')).toBeChecked()
    expect(screen.getByLabelText('Friends')).not.toBeChecked()

    // Add Friends group
    fireEvent.click(screen.getByLabelText('Friends'))
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onUpdate).toHaveBeenCalledWith('1', expect.objectContaining({
      groups: ['Family', 'Friends'],
    }))
  })

  test('events with no groups are highlighted with a warning class', () => {
    const ungroupedEvents: CalendarEvent[] = [
      { id: '1', name: 'Alice', type: 'B', month: 3, day: 15, groups: ['Family'] },
      { id: '2', name: 'Bob', type: 'A', month: 3, day: 20, groups: [] },
    ]
    render(<EventList events={ungroupedEvents} onUpdate={() => {}} onDelete={() => {}} availableGroups={groups} />)
    const bobRow = screen.getByText('Bob').closest('div')!
    expect(bobRow.className).toContain('ungrouped')
    const aliceRow = screen.getByText('Alice').closest('div')!
    expect(aliceRow.className).not.toContain('ungrouped')
  })

  test('search box filters visible events by name', () => {
    render(<EventList events={events} onUpdate={() => {}} onDelete={() => {}} availableGroups={groups} />)
    const searchBox = screen.getByPlaceholderText(/search/i)
    fireEvent.change(searchBox, { target: { value: 'ali' } })
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.queryByText('Bob')).not.toBeInTheDocument()
    expect(screen.queryByText('Carol')).not.toBeInTheDocument()
  })

  test('month filter shows only events in the selected month', () => {
    render(<EventList events={events} onUpdate={() => {}} onDelete={() => {}} availableGroups={groups} />)
    const monthSelect = screen.getByDisplayValue('All Months')
    fireEvent.change(monthSelect, { target: { value: '6' } })
    expect(screen.getByText('Carol')).toBeInTheDocument()
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
    expect(screen.queryByText('Bob')).not.toBeInTheDocument()
  })

  test('type filter shows only events of the selected type', () => {
    render(<EventList events={events} onUpdate={() => {}} onDelete={() => {}} availableGroups={groups} />)
    const typeSelect = screen.getByDisplayValue('All Types')
    fireEvent.change(typeSelect, { target: { value: 'A' } })
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
    expect(screen.queryByText('Carol')).not.toBeInTheDocument()
  })

  test('filters combine with name search using AND logic', () => {
    render(<EventList events={events} onUpdate={() => {}} onDelete={() => {}} availableGroups={groups} />)
    // Filter to Family group (Alice + Carol)
    fireEvent.change(screen.getByDisplayValue('All Groups'), { target: { value: 'Family' } })
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Carol')).toBeInTheDocument()
    expect(screen.queryByText('Bob')).not.toBeInTheDocument()

    // Add month filter for March — only Alice remains
    fireEvent.change(screen.getByDisplayValue('All Months'), { target: { value: '3' } })
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.queryByText('Carol')).not.toBeInTheDocument()

    // Add name search — still Alice
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'ali' } })
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  test('rejects invalid day on save and shows error', () => {
    const onUpdate = vi.fn()
    render(<EventList events={events} onUpdate={onUpdate} onDelete={() => {}} availableGroups={groups} />)
    fireEvent.click(screen.getAllByRole('button', { name: /edit/i })[0])

    // Set day to 32 (invalid for any month)
    fireEvent.change(screen.getByLabelText('Day'), { target: { value: '32' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(onUpdate).not.toHaveBeenCalled()
    expect(screen.getByText(/invalid day/i)).toBeInTheDocument()
  })

  test('rejects Feb 30 on save', () => {
    const onUpdate = vi.fn()
    render(<EventList events={events} onUpdate={onUpdate} onDelete={() => {}} availableGroups={groups} />)
    fireEvent.click(screen.getAllByRole('button', { name: /edit/i })[0])

    // Change month to February, day to 30
    fireEvent.change(screen.getByLabelText('Month'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Day'), { target: { value: '30' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(onUpdate).not.toHaveBeenCalled()
    expect(screen.getByText(/invalid day/i)).toBeInTheDocument()
  })

  test('clears edit error when day or month changes', () => {
    const onUpdate = vi.fn()
    render(<EventList events={events} onUpdate={onUpdate} onDelete={() => {}} availableGroups={groups} />)
    fireEvent.click(screen.getAllByRole('button', { name: /edit/i })[0])

    // Trigger error
    fireEvent.change(screen.getByLabelText('Day'), { target: { value: '32' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(screen.getByText(/invalid day/i)).toBeInTheDocument()

    // Changing day clears error
    fireEvent.change(screen.getByLabelText('Day'), { target: { value: '15' } })
    expect(screen.queryByText(/invalid day/i)).not.toBeInTheDocument()
  })

  test('group filter shows only events in the selected group', () => {
    render(<EventList events={events} onUpdate={() => {}} onDelete={() => {}} availableGroups={groups} />)
    const groupSelect = screen.getByDisplayValue('All Groups')
    fireEvent.change(groupSelect, { target: { value: 'Friends' } })
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
    expect(screen.queryByText('Carol')).not.toBeInTheDocument()
  })
})
