import type { ClickUpChecklist, ClickUpChecklistItem, ClickUpTask } from "../types/clickup";

export type ClickUpSubTask = ClickUpChecklistItem & {
  checklistId: string;
  checklistName: string;
};

export type ClickUpMainSubTask = ClickUpChecklist & {
  taskId: string;
  taskName: string;
  subTasks: ClickUpSubTask[];
};

export type ClickUpMainTaskHierarchy = {
  id: string;
  name: string;
  checklists: ClickUpMainSubTask[];
  subTaskCount: number;
  mainSubTaskCount: number;
};

export const buildClickUpHierarchy = (
  tasks: ClickUpTask[]
): ClickUpMainTaskHierarchy[] =>
  tasks.map((task) => {
    const checklists = (task.checklists ?? []).map((checklist) => ({
      ...checklist,
      taskId: task.id,
      taskName: task.name,
      subTasks: (checklist.items ?? []).map((item) => ({
        ...item,
        checklistId: checklist.id,
        checklistName: checklist.name,
      })),
    }));

    const subTaskCount = checklists.reduce(
      (sum, checklist) => sum + (checklist.items?.length ?? 0),
      0
    );

    return {
      id: task.id,
      name: task.name,
      checklists,
      subTaskCount,
      mainSubTaskCount: checklists.length,
    };
  });
