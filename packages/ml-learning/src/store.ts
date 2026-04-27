import { format } from "date-fns";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SpecializationId } from "./data/curriculum";

export type ActivityEntry = {
  date: string;
  taskIds: string[];
  minutes: number;
};

export type AppState = {
  completedTaskIds: Record<string, string>;
  activity: Record<string, ActivityEntry>;
  specialization: SpecializationId | null;
  startedAt: string;
};

type Actions = {
  toggleTask: (taskId: string) => void;
  logMinutes: (minutes: number) => void;
  setSpecialization: (s: SpecializationId) => void;
};

function today() {
  return format(new Date(), "yyyy-MM-dd");
}

export const useStore = create<AppState & Actions>()(
  persist(
    (set) => ({
      completedTaskIds: {},
      activity: {},
      specialization: null,
      startedAt: today(),

      toggleTask: (taskId) =>
        set((state) => {
          const date = today();
          const alreadyDone = !!state.completedTaskIds[taskId];
          const newCompleted = { ...state.completedTaskIds };
          if (!alreadyDone) {
            newCompleted[taskId] = new Date().toISOString();
          }
          const existing = state.activity[date] ?? { date, taskIds: [], minutes: 0 };
          const taskIds = alreadyDone ? existing.taskIds : [...existing.taskIds, taskId];
          return {
            completedTaskIds: newCompleted,
            activity: {
              ...state.activity,
              [date]: { ...existing, taskIds },
            },
          };
        }),

      logMinutes: (minutes) =>
        set((state) => {
          const date = today();
          const existing = state.activity[date] ?? { date, taskIds: [], minutes: 0 };
          return {
            activity: {
              ...state.activity,
              [date]: { ...existing, minutes: existing.minutes + minutes },
            },
          };
        }),

      setSpecialization: (s) => set({ specialization: s }),
    }),
    { name: "ml-tracker-v1" },
  ),
);
