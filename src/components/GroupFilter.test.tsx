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

  test('adding a new group calls onAddGroup', () => {
    const onAddGroup = vi.fn()
    render(<GroupFilter groups={['Family']} enabledGroups={['Family']} onToggle={() => {}} onAddGroup={onAddGroup} />)
    fireEvent.change(screen.getByPlaceholderText(/new group/i), { target: { value: 'Work' } })
    fireEvent.click(screen.getByRole('button', { name: /add group/i }))
    expect(onAddGroup).toHaveBeenCalledWith('Work')
  })
})
