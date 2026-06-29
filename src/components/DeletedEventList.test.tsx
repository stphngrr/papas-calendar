// ABOUTME: Tests for the DeletedEventList collapsible restore UI.
// ABOUTME: Covers empty state, count badge, expansion, and restore callback.

import { render, screen, fireEvent } from '@testing-library/react'
import { DeletedEventList } from './DeletedEventList'
import type { CalendarEvent } from '../types'

const deleted = (over: Partial<CalendarEvent>): CalendarEvent => ({
  id: 'x', name: 'X', type: 'B', month: 1, day: 1, groups: [], deleted: true, ...over,
})

test('renders nothing when there are no deleted events', () => {
  const { container } = render(<DeletedEventList events={[]} onRestore={() => {}} />)
  expect(container).toBeEmptyDOMElement()
})

test('shows a count badge of deleted events', () => {
  render(<DeletedEventList events={[deleted({ id: '1' }), deleted({ id: '2' })]} onRestore={() => {}} />)
  expect(screen.getByRole('button', { name: /deleted \(2\)/i })).toBeInTheDocument()
})

test('the Deleted header signals expandable state via aria-expanded', () => {
  render(<DeletedEventList events={[deleted({ id: '1' })]} onRestore={() => {}} />)
  const header = screen.getByRole('button', { name: /deleted \(1\)/i })
  expect(header).toHaveAttribute('aria-expanded', 'false')

  fireEvent.click(header)

  expect(header).toHaveAttribute('aria-expanded', 'true')
})

test('reveals deleted events when expanded', () => {
  render(<DeletedEventList events={[deleted({ id: '1', name: 'Old Coworker' })]} onRestore={() => {}} />)
  // collapsed: the name is not shown yet
  expect(screen.queryByText('Old Coworker')).not.toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: /deleted \(1\)/i }))

  expect(screen.getByText('Old Coworker')).toBeInTheDocument()
})

test('calls onRestore with the event id when Restore is clicked', () => {
  const onRestore = vi.fn()
  render(<DeletedEventList events={[deleted({ id: 'abc', name: 'Old Coworker' })]} onRestore={onRestore} />)
  fireEvent.click(screen.getByRole('button', { name: /deleted \(1\)/i }))

  fireEvent.click(screen.getByRole('button', { name: /restore/i }))

  expect(onRestore).toHaveBeenCalledWith('abc')
})

test('shows the groups of an expanded deleted event', () => {
  render(<DeletedEventList
    events={[deleted({ id: '1', name: 'Old Coworker', groups: ['Work', 'Bowling'] })]}
    onRestore={() => {}}
  />)
  fireEvent.click(screen.getByRole('button', { name: /deleted \(1\)/i }))

  expect(screen.getByText('Work, Bowling')).toBeInTheDocument()
})
