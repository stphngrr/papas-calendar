// ABOUTME: Checkbox list for enabling/disabling event groups.
// ABOUTME: Controls which groups of events appear on the calendar with add/edit/delete.

import { useState } from 'react'

interface GroupFilterProps {
  groups: string[]
  enabledGroups: string[]
  onToggle: (group: string) => void
  onAddGroup: (group: string) => void
  onRenameGroup: (oldName: string, newName: string) => void
  onDeleteGroup: (group: string) => void
}

export function GroupFilter({ groups, enabledGroups, onToggle, onAddGroup, onRenameGroup, onDeleteGroup }: GroupFilterProps) {
  const [addExpanded, setAddExpanded] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [editingGroup, setEditingGroup] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<string | null>(null)

  return (
    <fieldset>
      <legend>Groups</legend>
      {groups.map((group) => (
        <div key={group} className="group-row">
          {editingGroup === group ? (
            <div>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <div className="delete-confirm-buttons">
                <button type="button" onClick={() => {
                  const trimmed = editName.trim()
                  if (!trimmed || trimmed === group) {
                    setEditingGroup(null)
                    return
                  }
                  onRenameGroup(group, trimmed)
                  setEditingGroup(null)
                }}>Save</button>
                <button type="button" onClick={() => setEditingGroup(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <label>
                <input
                  type="checkbox"
                  checked={enabledGroups.includes(group)}
                  onChange={() => onToggle(group)}
                />
                {group}
              </label>
              <button type="button" onClick={() => {
                setEditingGroup(group)
                setEditName(group)
                setConfirmDeleteGroup(null)
              }}>Edit</button>
              {confirmDeleteGroup === group ? (
                <div className="delete-confirm">
                  <p className="form-error">Are you sure you want to delete?</p>
                  <div className="delete-confirm-buttons">
                    <button type="button" onClick={() => {
                      onDeleteGroup(group)
                      setConfirmDeleteGroup(null)
                    }}>Confirm</button>
                    <button type="button" onClick={() => setConfirmDeleteGroup(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmDeleteGroup(group)}>Delete</button>
              )}
            </>
          )}
        </div>
      ))}
      {addExpanded ? (
        <div>
          <input
            type="text"
            placeholder="New group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <div className="delete-confirm-buttons">
            <button type="button" onClick={() => {
              const trimmed = newGroupName.trim()
              if (!trimmed) return
              onAddGroup(trimmed)
              setNewGroupName('')
              setAddExpanded(false)
            }}>Save</button>
            <button type="button" onClick={() => {
              setNewGroupName('')
              setAddExpanded(false)
            }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAddExpanded(true)}>Add Group</button>
      )}
    </fieldset>
  )
}
