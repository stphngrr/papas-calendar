// ABOUTME: Tests for GroupFilter component.
// ABOUTME: Verifies group checkboxes render and toggle correctly.

import { render, screen, fireEvent } from '@testing-library/react'
import { GroupFilter } from './GroupFilter'

describe('GroupFilter', () => {
  test('shows a checkbox for each group', () => {
    render(<GroupFilter groups={['Family', 'Friends']} enabledGroups={['Family', 'Friends']} onToggle={() => {}} />)
    expect(screen.getByLabelText('Family')).toBeChecked()
    expect(screen.getByLabelText('Friends')).toBeChecked()
  })

  test('unchecking a group calls onToggle', () => {
    const onToggle = vi.fn()
    render(<GroupFilter groups={['Family', 'Friends']} enabledGroups={['Family', 'Friends']} onToggle={onToggle} />)
    fireEvent.click(screen.getByLabelText('Family'))
    expect(onToggle).toHaveBeenCalledWith('Family')
  })
})
