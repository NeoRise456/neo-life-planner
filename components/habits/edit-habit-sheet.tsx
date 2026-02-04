"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useHabitsContext } from "./habits-provider"
import { IconPicker } from "./icon-picker"
import { useMutation, useQuery } from "convex/react"
import { api, Id } from "@/convex/_generated/api"

const CARD_COLORS = [
  { name: "Slate", value: "oklch(0.55 0.02 260)" },
  { name: "Red", value: "oklch(0.55 0.18 25)" },
  { name: "Orange", value: "oklch(0.65 0.18 55)" },
  { name: "Amber", value: "oklch(0.70 0.18 80)" },
  { name: "Green", value: "oklch(0.55 0.15 150)" },
  { name: "Teal", value: "oklch(0.55 0.12 180)" },
  { name: "Blue", value: "oklch(0.55 0.15 240)" },
  { name: "Violet", value: "oklch(0.55 0.18 280)" },
  { name: "Pink", value: "oklch(0.60 0.18 340)" },
]

const editHabitSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  color: z.string().min(1, "Color is required"),
  icon: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "scheduled"]),
  targetDaysPerWeek: z.number().min(1).max(7).optional(),
  targetCount: z.number().min(1),
  isTracked: z.boolean(),
  defaultDurationMinutes: z.number().min(15).max(720),
})

type EditHabitForm = z.infer<typeof editHabitSchema>

export function EditHabitSheet() {
  const { isEditSheetOpen, selectedHabitId, closeEditSheet } = useHabitsContext()
  const updateHabit = useMutation(api.habits.updateHabit)
  const archiveHabit = useMutation(api.habits.archiveHabit)
  const deleteHabit = useMutation(api.habits.deleteHabit)
  const habit = useQuery(
    api.habits.getHabitById,
    selectedHabitId ? { id: selectedHabitId } : "skip"
  )

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const form = useForm<EditHabitForm>({
    resolver: zodResolver(editHabitSchema),
    defaultValues: {
      name: "",
      description: "",
      color: CARD_COLORS[4].value,
      icon: "",
      frequency: "daily",
      targetDaysPerWeek: 3,
      targetCount: 1,
      isTracked: true,
      defaultDurationMinutes: 60,
    },
  })

  const { watch, setValue, reset } = form
  const frequency = watch("frequency")

  useEffect(() => {
    if (habit) {
      reset({
        name: habit.name,
        description: habit.description ?? "",
        color: habit.color,
        icon: habit.icon ?? "",
        frequency: habit.frequency as "daily" | "weekly" | "scheduled",
        targetDaysPerWeek: habit.targetDaysPerWeek ?? 3,
        targetCount: habit.targetCount,
        isTracked: habit.isTracked,
        defaultDurationMinutes: habit.defaultDurationMinutes,
      })
    }
  }, [habit, reset])

  const onSubmit = async (data: EditHabitForm) => {
    if (!selectedHabitId) return

    try {
      await updateHabit({
        id: selectedHabitId,
        name: data.name,
        description: data.description,
        color: data.color,
        icon: data.icon,
        frequency: data.frequency,
        targetDaysPerWeek: data.frequency === "weekly" ? data.targetDaysPerWeek : undefined,
        targetCount: data.targetCount,
        isTracked: data.isTracked,
        defaultDurationMinutes: data.defaultDurationMinutes,
      })

      closeEditSheet()
    } catch (error) {
      console.error("Failed to update habit:", error)
    }
  }

  const handleArchive = async () => {
    if (!selectedHabitId) return
    await archiveHabit({ id: selectedHabitId })
    closeEditSheet()
  }

  const handleDelete = async () => {
    if (!selectedHabitId) return
    await deleteHabit({ id: selectedHabitId })
    setShowDeleteDialog(false)
    closeEditSheet()
  }

  if (!habit) return null

  return (
    <>
      <Sheet open={isEditSheetOpen} onOpenChange={closeEditSheet}>
        <SheetContent className="w-[480px]">
          <SheetHeader>
            <SheetTitle className="text-2xl font-display font-bold">
              EDIT HABIT
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Morning Run"
                className="font-display"
              />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500 font-display">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="30 minute jog around the park"
                rows={2}
                className="resize-none font-display"
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-1.5">
                {CARD_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setValue("color", color.value)}
                    className={`w-9 h-9 border-2 transition-all ${
                      watch("color") === color.value
                        ? "border-foreground scale-110"
                        : "border-border hover:border-foreground"
                    }`}
                    style={{ backgroundColor: color.value }}
                    aria-label={`Select ${color.name} color`}
                    aria-pressed={watch("color") === color.value}
                  />
                ))}
              </div>
            </div>

            <IconPicker
              value={watch("icon")}
              onChange={(value) => setValue("icon", value)}
            />

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={watch("frequency")}
                onValueChange={(value: "daily" | "weekly" | "scheduled") => setValue("frequency", value)}
              >
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="scheduled">Scheduled (Only when on timetable)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {frequency === "weekly" && (
              <div className="space-y-2">
                <Label htmlFor="targetDaysPerWeek">Target Days Per Week</Label>
                <Input
                  id="targetDaysPerWeek"
                  type="number"
                  min={1}
                  max={7}
                  {...form.register("targetDaysPerWeek", { valueAsNumber: true })}
                  className="font-display"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="targetCount">Daily Target</Label>
              <Input
                id="targetCount"
                type="number"
                min={1}
                {...form.register("targetCount", { valueAsNumber: true })}
                className="font-display"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultDurationMinutes">Default Duration (minutes)</Label>
              <Input
                id="defaultDurationMinutes"
                type="number"
                min={15}
                max={720}
                {...form.register("defaultDurationMinutes", { valueAsNumber: true })}
                className="font-display"
              />
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="isTracked"
                checked={watch("isTracked")}
                onCheckedChange={(checked) => setValue("isTracked", checked as boolean)}
              />
              <Label htmlFor="isTracked" className="cursor-pointer">
                Track completions
              </Label>
            </div>

            <SheetFooter className="pt-4 flex-col gap-2">
              <div className="flex gap-2 w-full">
                <Button type="button" variant="outline" onClick={closeEditSheet} className="font-display flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="font-display flex-1">
                  Save
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={handleArchive}
                className="font-display text-muted-foreground hover:text-destructive w-full"
              >
                Archive Habit
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Delete Habit?</AlertDialogTitle>
            <AlertDialogDescription className="font-display">
              This will permanently delete "{habit.name}" and all its scheduled cards. Historical logs will be kept for stats. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-display">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground font-display">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
