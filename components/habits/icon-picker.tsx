"use client"

import * as Icons from "lucide-react"
import { HABIT_ICONS } from "./utils"

interface IconPickerProps {
  value: string | undefined
  onChange: (value: string) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-widest text-muted-foreground font-display">
        Icon
      </label>
      <div className="grid grid-cols-10 gap-1.5">
        {HABIT_ICONS.map((iconName) => {
          const Icon = Icons[iconName as keyof typeof Icons] as React.ComponentType<{ className?: string }>
          const isSelected = value === iconName

          return (
            <button
              key={iconName}
              type="button"
              onClick={() => onChange(iconName)}
              className={`h-9 flex items-center justify-center border transition-colors ${
                isSelected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card hover:bg-accent text-foreground"
              }`}
              aria-label={`Select ${iconName} icon`}
              aria-pressed={isSelected}
            >
              <Icon className="size-4" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
