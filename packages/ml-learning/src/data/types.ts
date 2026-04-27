export type Task = {
  id: string;
  title: string;
  notes?: string;
  estMinutes?: number;
  branch?: string;
};

export type Phase = {
  id: string;
  title: string;
  subtitle: string;
  tasks: Task[];
};

export type Skill = {
  id: string;
  name: string;
  description: string;
  unlockedBy: { phaseId: string; branch?: string };
};

export type CurriculumDef = {
  id: string;
  name: string;
  phases: Phase[];
  skills?: Skill[];
};
