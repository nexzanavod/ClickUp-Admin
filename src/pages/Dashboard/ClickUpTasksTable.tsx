import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { CheckCircleIcon, ListIcon, TaskIcon } from "../../icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { fetchClickUpListTasks } from "../../dashboard/actions/clickup";
import type { ClickUpChecklist, ClickUpTask } from "../../dashboard/types/clickup";

const getProgressColor = (percent: number) => {
  if (percent === 100) {
    return "bg-emerald-500";
  }
  if (percent >= 70) {
    return "bg-emerald-400";
  }
  if (percent >= 40) {
    return "bg-amber-400";
  }
  return "bg-rose-400";
};

const getChecklistProgress = (checklist: ClickUpChecklist) => {
  const totalItems = checklist.items?.length ?? 0;
  const resolvedItems = (checklist.items ?? []).filter((item) => item.resolved).length;
  const percent = totalItems === 0 ? 0 : Math.round((resolvedItems / totalItems) * 100);

  return { totalItems, resolvedItems, percent };
};

const MONTHLY_KEY = "monthly delivery sign off";
const WEEKLY_KEY = "weekly delivery sign off";

const getClientFirstName = (taskName: string, keyword: string) => {
  const lowerName = taskName.toLowerCase();
  const index = lowerName.indexOf(keyword);

  if (index === -1) {
    return taskName.trim();
  }

  const remainder = taskName
    .slice(index + keyword.length)
    .replace(/[\-–—:]/g, " ")
    .trim();
  const [firstWord] = remainder.split(/\s+/).filter(Boolean);

  return firstWord || taskName.trim();
};

export default function ClickUpTasksTable() {
  const [tasks, setTasks] = useState<ClickUpTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("all");

  useEffect(() => {
    let isMounted = true;

    const loadTasks = async () => {
      try {
        const data = await fetchClickUpListTasks();
        if (isMounted) {
          setTasks(data.tasks ?? []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load tasks.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTasks();

    return () => {
      isMounted = false;
    };
  }, []);

  const taskOptions = useMemo(
    () =>
      tasks.map((task) => ({
        id: task.id,
        name: task.name,
      })),
    [tasks]
  );

  const rows = useMemo(() => {
    const filteredTasks =
      selectedTaskId === "all"
        ? tasks
        : tasks.filter((task) => task.id === selectedTaskId);

    return filteredTasks.flatMap((task) => {
      const assignees = (task.assignees ?? []).map((assignee) => assignee.username);
      const assignedLabel = assignees.length ? assignees.join(", ") : "Unassigned";

      return (task.checklists ?? []).map((checklist) => {
        const progress = getChecklistProgress(checklist);

        return {
          id: `${task.id}-${checklist.id}`,
          taskId: task.id,
          taskName: task.name,
          assignees: assignedLabel,
          checklistName: checklist.name,
          subTasks: checklist.items ?? [],
          progress,
        };
      });
    });
  }, [tasks, selectedTaskId]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      const subTaskMatch = row.subTasks.some((item) => item.name.toLowerCase().includes(query));

      return (
        row.taskName.toLowerCase().includes(query) ||
        row.assignees.toLowerCase().includes(query) ||
        row.checklistName.toLowerCase().includes(query) ||
        subTaskMatch
      );
    });
  }, [rows, search]);

  const totalRowCount = useMemo(
    () =>
      filteredRows.reduce((sum, row) => sum + row.subTasks.length + 1, 0),
    [filteredRows]
  );

  const groupedRows = useMemo(() => {
    const groups = new Map<
      string,
      {
        taskId: string;
        taskName: string;
        assignees: string;
        checklists: typeof filteredRows;
      }
    >();

    filteredRows.forEach((row) => {
      const existing = groups.get(row.taskId);
      if (existing) {
        existing.checklists.push(row);
      } else {
        groups.set(row.taskId, {
          taskId: row.taskId,
          taskName: row.taskName,
          assignees: row.assignees,
          checklists: [row],
        });
      }
    });

    return Array.from(groups.values());
  }, [filteredRows]);

  const selectedTasks = useMemo(
    () =>
      selectedTaskId === "all"
        ? tasks
        : tasks.filter((task) => task.id === selectedTaskId),
    [tasks, selectedTaskId]
  );

  const selectedMainTask = selectedTaskId === "all" ? null : selectedTasks[0] ?? null;

  const subMainTaskCount = useMemo(
    () => selectedTasks.reduce((sum, task) => sum + (task.checklists?.length ?? 0), 0),
    [selectedTasks]
  );

  const subTaskCount = useMemo(
    () =>
      selectedTasks.reduce(
        (sum, task) =>
          sum +
          (task.checklists ?? []).reduce(
            (listSum, list) => listSum + (list.items?.length ?? 0),
            0
          ),
        0
      ),
    [selectedTasks]
  );


  const deliverySummary = useMemo(() => {
    const summarize = (keyword: string) => {
      const matchedTasks = tasks.filter((task) =>
        task.name.toLowerCase().includes(keyword)
      );
      const items = matchedTasks.map((task) => {
        const totalItems = (task.checklists ?? []).reduce(
          (sum, list) => sum + (list.items?.length ?? 0),
          0
        );
        const resolvedItems = (task.checklists ?? []).reduce(
          (sum, list) =>
            sum + (list.items ?? []).filter((item) => item.resolved).length,
          0
        );

        return {
          id: task.id,
          name: getClientFirstName(task.name, keyword),
          totalItems,
          resolvedItems,
          isComplete: totalItems > 0 && resolvedItems >= totalItems,
        };
      });

      const totalCount = items.reduce((sum, item) => sum + item.totalItems, 0);
      const resolvedCount = items.reduce(
        (sum, item) => sum + item.resolvedItems,
        0
      );

      return {
        totalCount,
        resolvedCount,
        items,
      };
    };

    return {
      monthly: summarize(MONTHLY_KEY),
      weekly: summarize(WEEKLY_KEY),
    };
  }, [tasks]);

  return (
    <>
      <PageMeta
        title="ClickUp Tasks Table | TailAdmin"
        description="ClickUp tasks with search and progress table"
      />
      <PageBreadcrumb pageTitle="ClickUp Tasks Table" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
                Monthly delivery sign-off
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {deliverySummary.monthly.resolvedCount}/{
                  deliverySummary.monthly.totalCount
                } completed
              </p>
            </div>
            <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              MT {deliverySummary.monthly.resolvedCount}/
              {deliverySummary.monthly.totalCount}
            </span>
          </div>
          <ul className="mt-4 space-y-2">
            {deliverySummary.monthly.items.map((item, index) => (
              <li
                key={item.id}
                className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300"
              >
                <span className="text-xs text-gray-400">{index + 1}</span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    item.isComplete ? "bg-emerald-500" : "bg-rose-400"
                  }`}
                />
                <span className="font-medium text-gray-700 dark:text-gray-100">
                  {item.name || "Unnamed"}
                </span>
              </li>
            ))}
            {deliverySummary.monthly.items.length === 0 && (
              <li className="text-xs text-gray-500 dark:text-gray-400">
                No monthly delivery tasks found.
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
                Weekly delivery sign-off
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {deliverySummary.weekly.resolvedCount}/{
                  deliverySummary.weekly.totalCount
                } completed
              </p>
            </div>
            <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              WT {deliverySummary.weekly.resolvedCount}/
              {deliverySummary.weekly.totalCount}
            </span>
          </div>
          <ul className="mt-4 space-y-2">
            {deliverySummary.weekly.items.map((item, index) => (
              <li
                key={item.id}
                className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300"
              >
                <span className="text-xs text-gray-400">{index + 1}</span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    item.isComplete ? "bg-emerald-500" : "bg-rose-400"
                  }`}
                />
                <span className="font-medium text-gray-700 dark:text-gray-100">
                  {item.name || "Unnamed"}
                </span>
              </li>
            ))}
            {deliverySummary.weekly.items.length === 0 && (
              <li className="text-xs text-gray-500 dark:text-gray-400">
                No weekly delivery tasks found.
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800">
            <TaskIcon className="size-6 text-gray-800 dark:text-white/90" />
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Main Task</span>
          <h4 className="mt-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            {selectedMainTask?.name ?? "All Main Tasks"}
          </h4>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {selectedTasks.length} main task{selectedTasks.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800">
            <ListIcon className="size-6 text-gray-800 dark:text-white/90" />
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Main-Sub Tasks</span>
          <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
            {subMainTaskCount}
          </h4>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Total main-sub tasks
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800">
            <CheckCircleIcon className="size-6 text-gray-800 dark:text-white/90" />
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Sub Tasks</span>
          <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
            {subTaskCount}
          </h4>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Total sub tasks
          </p>
        </div>
      </div>

      <ComponentCard
        title="ClickUp Task Details"
        desc="Search by assignee, task name, sub main task, or sub task."
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full flex-col gap-3 md:flex-row">
            <div className="w-full max-w-sm">
              <select
                value={selectedTaskId}
                onChange={(event) => setSelectedTaskId(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-200"
              >
                <option value="all">All Main Tasks</option>
                {taskOptions.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full max-w-md">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by assignee, task, or sub task..."
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-200"
              />
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {totalRowCount} rows
          </div>
        </div>
        {isLoading && (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
            Loading ClickUp tasks...
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600 dark:border-rose-500/30 dark:bg-rose-950">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-start text-xs font-semibold uppercase text-gray-500"
                    >
                      Main Task
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-start text-xs font-semibold uppercase text-gray-500"
                    >
                      Assigned To
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-start text-xs font-semibold uppercase text-gray-500"
                    >
                      Main-Sub Task
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-start text-xs font-semibold uppercase text-gray-500"
                    >
                      Sub Tasks
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-start text-xs font-semibold uppercase text-gray-500"
                    >
                      Progress
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {groupedRows.flatMap((group) => {
                    const taskRowSpan = group.checklists.reduce(
                      (sum, checklist) => sum + Math.max(checklist.subTasks.length, 1),
                      0
                    );

                    return group.checklists.flatMap((checklist, checklistIndex) => {
                      const checklistRowSpan = Math.max(checklist.subTasks.length, 1);

                      const checklistRow = (
                        <TableRow key={checklist.id}>
                          {checklistIndex === 0 && (
                            <>
                              <TableCell
                                className="px-4 py-4 text-sm font-semibold text-gray-800 dark:text-gray-100"
                                rowSpan={taskRowSpan}
                              >
                                {group.taskName}
                              </TableCell>
                              <TableCell
                                className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300"
                                rowSpan={taskRowSpan}
                              >
                                {group.assignees}
                              </TableCell>
                            </>
                          )}
                          <TableCell
                            className="px-4 py-4 text-sm text-gray-700 dark:text-gray-200"
                            rowSpan={checklistRowSpan}
                          >
                            {checklist.checklistName}
                            <div className="mt-1 text-xs text-gray-400">
                              {checklist.subTasks.length} sub tasks
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4 text-xs text-gray-500 dark:text-gray-400">
                            {checklist.subTasks.length === 0 ? "No sub tasks" : "Sub tasks below"}
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-32 rounded-full bg-gray-200 dark:bg-gray-800">
                                <div
                                  className={`h-2 rounded-full ${getProgressColor(checklist.progress.percent)}`}
                                  style={{ width: `${checklist.progress.percent}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                                {checklist.progress.resolvedItems}/{checklist.progress.totalItems}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );

                      const itemRows = checklist.subTasks.map((item) => (
                        <TableRow key={`${checklist.id}-${item.id}`}>
                          <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  item.resolved
                                    ? "bg-emerald-500"
                                    : "bg-gray-300 dark:bg-gray-600"
                                }`}
                              />
                              <span>{item.name}</span>
                            </div>
                            <div className="mt-1 text-xs text-gray-400">
                              {item.assignee?.username ?? "Unassigned"}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                            {item.resolved ? "Done" : "In progress"}
                          </TableCell>
                        </TableRow>
                      ));

                      return [checklistRow, ...itemRows];
                    });
                  })}
                  {filteredRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="px-4 py-6 text-sm text-gray-500">
                        No tasks match your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </ComponentCard>
    </>
  );
}
