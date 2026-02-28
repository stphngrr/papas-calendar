// ABOUTME: Checkbox list for enabling/disabling event groups.
// ABOUTME: Controls which groups of events appear on the calendar.

interface GroupFilterProps {
  groups: string[]
  enabledGroups: string[]
  onToggle: (group: string) => void
}

export function GroupFilter({ groups, enabledGroups, onToggle }: GroupFilterProps) {
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
    </fieldset>
  )
}
