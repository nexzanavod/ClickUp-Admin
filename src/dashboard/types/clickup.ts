export type ClickUpChecklistItem = {
  id: string;
  name: string;
  resolved: boolean;
  assignee?: ClickUpUser | null;
};

export type ClickUpUser = {
  id: number;
  username: string;
  email?: string;
  initials?: string;
};

export type ClickUpChecklist = {
  id: string;
  name: string;
  items: ClickUpChecklistItem[];
};

export type ClickUpTask = {
  id: string;
  name: string;
  description: string;
  status: {
    status: string;
    color: string;
    type: string;
  };
  assignees?: ClickUpUser[];
  checklists: ClickUpChecklist[];
};

export type ClickUpTasksResponse = {
  tasks: ClickUpTask[];
  last_page: boolean;
};
