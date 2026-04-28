import { useRevalidator } from "react-router";
import { useRootData } from "../../app/hooks/useRootData";
import type { SpecializationId } from "../data/curriculum";
import { apiClient } from "../lib/apiClient";

export type ActivityEntry = {
  date: string;
  taskIds: string[];
  minutes: number;
};

export type Progress = {
  completedTaskIds: Record<string, string>;
  activity: Record<string, ActivityEntry>;
  specializations: Record<string, string | null>;
  startedAt: string;
};

const EMPTY: Progress = {
  completedTaskIds: {},
  activity: {},
  specializations: {},
  startedAt: new Date().toISOString(),
};

export function useProgress() {
  const data = useRootData();
  const { revalidate } = useRevalidator();

  const progress: Progress = data?.progress ?? EMPTY;

  async function toggleTask(taskId: string) {
    await apiClient.api.progress.tasks[":taskId"].toggle.$post({ param: { taskId } });
    revalidate();
  }

  async function logMinutes(minutes: number) {
    await apiClient.api.progress.activity["log-minutes"].$post({ json: { minutes } });
    revalidate();
  }

  async function setSpecialization(curriculumId: string, s: SpecializationId) {
    await apiClient.api.progress.specializations[":curriculumId"].$put({
      param: { curriculumId },
      json: { branch: s },
    });
    revalidate();
  }

  async function clearSpecialization(curriculumId: string) {
    await apiClient.api.progress.specializations[":curriculumId"].$delete({ param: { curriculumId } });
    revalidate();
  }

  return { ...progress, toggleTask, logMinutes, setSpecialization, clearSpecialization };
}
