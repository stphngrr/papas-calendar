// ABOUTME: Checkbox list for enabling/disabling event groups.
// ABOUTME: Controls which groups of events appear on the calendar.

import { useState } from 'react'

interface GroupFilterProps {
  groups: string[]
  enabledGroups: string[]
  onToggle: (group: string) => void
  onAddGroup: (group: string) => void
}

export function GroupFilter({ groups, enabledGroups, onToggle, onAddGroup }: GroupFilterProps) {
  const [newGroupName, setNewGroupName] = useState('')

  return (
    <fieldset>
      <legend>Groups</legend>
      {groups.map((group) => (
        <label key={group}>
          <input
            type="checkbox"
            checked={enabledGroups.includes(group)}
            onChange={() => onToggle(group)}
          />
          {group}
        </label>
      ))}
      <div className="edit-date-row">
        <input
          type="text"
          placeholder="New group name"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
        />
        <button type="button" onClick={() => {
          const trimmed = newGroupName.trim()
          if (!trimmed) return
          onAddGroup(trimmed)
          setNewGroupName('')
        }}>Add Group</button>
      </div>
    </fieldset>
  )
}
