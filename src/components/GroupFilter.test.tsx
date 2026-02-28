// ABOUTME: Tests for GroupFilter component.
// ABOUTME: Verifies group checkboxes render and toggle correctly.

import { render, screen, fireEvent } from '@testing-library/react'
import { GroupFilter } from './GroupFilter'

describe('GroupFilter', () => {
  test('shows a checkbox for each group', () => {
    render(<GroupFilter groups={['Family', 'Friends']} enabledGroups={['Family', 'Friends']} onToggle={() => {}} onAddGroup={() => {}} />)
    expect(screen.getByLabelText('Family')).toBeChecked()
    expect(screen.getByLabelText('Friends')).toBeChecked()
  })

  test('unchecking a group calls onToggle', () => {
    const onToggle = vi.fn()
    render(<GroupFilter groups={['Family', 'Friends']} enabledGroups={['Family', 'Friends']} onToggle={onToggle} onAddGroup={() => {}} />)
    fireEvent.click(screen.getByLabelText('Family'))
    expect(onToggle).toHaveBeenCalledWith('Family')
  })

  test('add group form is collapsed by default', () => {
    render(<GroupFilter groups={[]} enabledGroups={[]} onToggle={() => {}} onAddGroup={() => {}} />)
    expect(screen.queryByPlaceholderText(/new group/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add group/i })).toBeInTheDocument()
  })

  test('clicking Add Group expands form, Cancel collapses it', () => {
    render(<GroupFilter groups={[]} enabledGroups={[]} onToggle={() => {}} onAddGroup={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /add group/i }))
    expect(screen.getByPlaceholderText(/new group/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByPlaceholderText(/new group/i)).not.toBeInTheDocument()
  })

  test('saving a new group calls onAddGroup and collapses form', () => {
    const onAddGroup = vi.fn()
    render(<GroupFilter groups={['Family']} enabledGroups={['Family']} onToggle={() => {}} onAddGroup={onAddGroup} />)
    fireEvent.click(screen.getByRole('button', { name: /add group/i }))
    fireEvent.change(screen.getByPlaceholderText(/new group/i), { target: { value: 'Work' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onAddGroup).toHaveBeenCalledWith('Work')
    expect(screen.queryByPlaceholderText(/new group/i)).not.toBeInTheDocument()
  })
})
