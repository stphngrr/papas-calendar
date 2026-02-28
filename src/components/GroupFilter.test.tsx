// ABOUTME: Tests for GroupFilter component.
// ABOUTME: Verifies group checkboxes, add/edit/delete, and toggle behavior.

import { render, screen, fireEvent } from '@testing-library/react'
import { GroupFilter } from './GroupFilter'

const defaults = {
  groups: ['Family', 'Friends'],
  enabledGroups: ['Family', 'Friends'],
  onToggle: () => {},
  onAddGroup: () => {},
  onRenameGroup: () => {},
  onDeleteGroup: () => {},
}

describe('GroupFilter', () => {
  test('shows a checkbox for each group', () => {
    render(<GroupFilter {...defaults} />)
    expect(screen.getByLabelText('Family')).toBeChecked()
    expect(screen.getByLabelText('Friends')).toBeChecked()
  })

  test('unchecking a group calls onToggle', () => {
    const onToggle = vi.fn()
    render(<GroupFilter {...defaults} onToggle={onToggle} />)
    fireEvent.click(screen.getByLabelText('Family'))
    expect(onToggle).toHaveBeenCalledWith('Family')
  })

  test('add group form is collapsed by default', () => {
    render(<GroupFilter {...defaults} groups={[]} enabledGroups={[]} />)
    expect(screen.queryByPlaceholderText(/new group/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add group/i })).toBeInTheDocument()
  })

  test('clicking Add Group expands form, Cancel collapses it', () => {
    render(<GroupFilter {...defaults} groups={[]} enabledGroups={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /add group/i }))
    expect(screen.getByPlaceholderText(/new group/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByPlaceholderText(/new group/i)).not.toBeInTheDocument()
  })

  test('saving a new group calls onAddGroup and collapses form', () => {
    const onAddGroup = vi.fn()
    render(<GroupFilter {...defaults} groups={['Family']} enabledGroups={['Family']} onAddGroup={onAddGroup} />)
    fireEvent.click(screen.getByRole('button', { name: /add group/i }))
    fireEvent.change(screen.getByPlaceholderText(/new group/i), { target: { value: 'Work' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onAddGroup).toHaveBeenCalledWith('Work')
    expect(screen.queryByPlaceholderText(/new group/i)).not.toBeInTheDocument()
  })

  test('edit button opens inline rename, save calls onRenameGroup', () => {
    const onRenameGroup = vi.fn()
    render(<GroupFilter {...defaults} onRenameGroup={onRenameGroup} />)
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    fireEvent.click(editButtons[0])
    const input = screen.getByDisplayValue('Family')
    fireEvent.change(input, { target: { value: 'Relatives' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onRenameGroup).toHaveBeenCalledWith('Family', 'Relatives')
  })

  test('delete button calls onDeleteGroup after confirmation', () => {
    const onDeleteGroup = vi.fn()
    render(<GroupFilter {...defaults} onDeleteGroup={onDeleteGroup} />)
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    fireEvent.click(deleteButtons[0])
    expect(onDeleteGroup).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))
    expect(onDeleteGroup).toHaveBeenCalledWith('Family')
  })
})
