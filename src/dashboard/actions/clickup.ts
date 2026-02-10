import axios from "axios";
import type { ClickUpTasksResponse } from "../types/clickup";

const CLICKUP_BASE_URL = "https://api.clickup.com/api/v2";

export async function fetchClickUpListTasks(
  listId?: string
): Promise<ClickUpTasksResponse> {
  const token = import.meta.env.VITE_CLICKUP_TOKEN as string | undefined;
  const resolvedListId =
    listId ||
    (import.meta.env.VITE_CLICKUP_BENNY_LIST_ID as string | undefined);

  if (!token) {
    throw new Error("Missing VITE_CLICKUP_TOKEN environment variable.");
  }

  if (!resolvedListId) {
    throw new Error(
      "Missing ClickUp list ID. Set VITE_CLICKUP_BENNY_LIST_ID or pass a listId."
    );
  }

  const response = await axios.get<ClickUpTasksResponse>(
    `${CLICKUP_BASE_URL}/list/${resolvedListId}/task`,
    {
      headers: {
        Authorization: token,
      },
    }
  );

  return response.data;
}
