import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { fetchClickUpListTasks } from "../../dashboard/actions/clickup";
import type { ClickUpTask } from "../../dashboard/types/clickup";
import MonthlyTarget from "../ecommerce/MonthlyTarget";
const MONTHLY_KEY = "monthly delivery sign off";
const WEEKLY_KEY = "weekly delivery sign off";

const normalizeTitle = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const buildAssigneeDonutOptions = (
  percent: number,
  done: number,
  total: number
): ApexOptions => ({
  chart: {
    type: "donut",
    fontFamily: "Outfit, sans-serif",
  },
  labels: ["Done", "Remaining"],
  colors: ["#10B981", "#E2E8F0"],
  legend: { show: false },
  dataLabels: { enabled: false },
  stroke: { width: 0 },
  plotOptions: {
    pie: {
      donut: {
        size: "70%",
        labels: {
          show: true,
          name: { show: false },
          value: {
            show: true,
            fontSize: "16px",
            fontWeight: 600,
            formatter: () => `${percent}%`,
          },
          total: {
            show: true,
            label: "Done",
            fontSize: "10px",
            formatter: () => `${done}/${total}`,
          },
        },
      },
    },
  },
});

export default function ClickUpTasks() {
  const [tasks, setTasks] = useState<ClickUpTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deliveryType, setDeliveryType] = useState<"monthly" | "weekly">(
    "weekly"
  );
  const [selectedAssignee, setSelectedAssignee] = useState("all");

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

  const deliveryTasks = useMemo(() => {
    const findTask = (keyword: string) =>
      tasks.find((task) =>
        normalizeTitle(task.name).includes(normalizeTitle(keyword))
      ) ?? null;

    return {
      monthly: findTask(MONTHLY_KEY),
      weekly: findTask(WEEKLY_KEY),
    };
  }, [tasks]);

  const selectedDeliveryTask =
    deliveryType === "monthly" ? deliveryTasks.monthly : deliveryTasks.weekly;

  const buildSummary = (task: ClickUpTask | null) => {
    if (!task) {
      return {
        resolvedItems: 0,
        totalItems: 0,
        subTasks: [],
        checklistGroups: [],
        percent: 0,
      };
    }

    const checklists = task.checklists ?? [];
    const subTasks = checklists.flatMap((list) => list.items ?? []);
    const checklistGroups = checklists.map((list) => ({
      id: list.id,
      name: list.name,
      items: list.items ?? [],
    }));
    const totalItems = checklists.reduce(
      (sum, list) => sum + (list.items?.length ?? 0),
      0
    );
    const resolvedItems = checklists.reduce(
      (sum, list) =>
        sum + (list.items ?? []).filter((item) => item.resolved).length,
      0
    );
    const percent = totalItems ? Math.round((resolvedItems / totalItems) * 100) : 0;

    return {
      resolvedItems,
      totalItems,
      subTasks,
      checklistGroups,
      percent,
    };
  };

  const monthlySummary = useMemo(
    () => buildSummary(deliveryTasks.monthly),
    [deliveryTasks.monthly]
  );

  const weeklySummary = useMemo(
    () => buildSummary(deliveryTasks.weekly),
    [deliveryTasks.weekly]
  );

  const selectedSummary =
    deliveryType === "monthly" ? monthlySummary : weeklySummary;

  const assigneeStats = useMemo(() => {
    const stats = new Map<string, { name: string; done: number; total: number }>();

    selectedSummary.subTasks.forEach((item) => {
      const assigneeName = item.assignee?.username ?? "Unassigned";
      const current = stats.get(assigneeName) ?? {
        name: assigneeName,
        done: 0,
        total: 0,
      };

      const resolved = item.resolved ?? false;
      stats.set(assigneeName, {
        name: assigneeName,
        done: current.done + (resolved ? 1 : 0),
        total: current.total + 1,
      });
    });

    return Array.from(stats.values());
  }, [selectedSummary.subTasks]);

  const visibleAssignees = useMemo(() => {
    if (selectedAssignee === "all") {
      return assigneeStats;
    }

    return assigneeStats.filter((assignee) => assignee.name === selectedAssignee);
  }, [assigneeStats, selectedAssignee]);


  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {!isLoading && !error && (deliveryTasks.monthly || deliveryTasks.weekly) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <MonthlyTarget
            percent={monthlySummary.percent}
            resolved={monthlySummary.resolvedItems}
            total={monthlySummary.totalItems}
            title="Monthly Delivery"
            subtitle="Monthly delivery sign-off progress"
            color="#10B981"
          />
          <MonthlyTarget
            percent={weeklySummary.percent}
            resolved={weeklySummary.resolvedItems}
            total={weeklySummary.totalItems}
            title="Weekly Delivery"
            subtitle="Weekly delivery sign-off progress"
            color="#10B981"
          />
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Delivery Sign-Off
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Choose monthly or weekly and view the checklist tasks below.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setDeliveryType("monthly")}
            className={`rounded-2xl px-6 py-4 text-sm font-semibold transition-colors ${
              deliveryType === "monthly"
                ? "bg-brand-500 text-white"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setDeliveryType("weekly")}
            className={`rounded-2xl px-6 py-4 text-sm font-semibold transition-colors ${
              deliveryType === "weekly"
                ? "bg-brand-500 text-white"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {!isLoading && !error && selectedDeliveryTask && (
        <div className="mt-6 grid grid-cols-1 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sub Tasks
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
              {selectedSummary.totalItems}
            </p>
            <div className="mt-3">
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-2 rounded-full bg-emerald-500"
                  style={{ width: `${selectedSummary.percent}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {selectedSummary.percent}% done
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {isLoading && (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950">
            Loading ClickUp tasks...
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600 dark:border-rose-500/30 dark:bg-rose-950">
            {error}
          </div>
        )}
        {!isLoading && !error && !selectedDeliveryTask && (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950">
            No {deliveryType} delivery sign-off task found.
          </div>
        )}

        {!isLoading && !error && selectedDeliveryTask && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {selectedDeliveryTask.name}
                </h3>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                  {(selectedDeliveryTask.assignees ?? []).length > 0 ? (
                    selectedDeliveryTask.assignees?.map((assignee) => (
                      <span
                        key={assignee.id}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {assignee.username}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      Unassigned
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedSummary.resolvedItems}/{selectedSummary.totalItems} completed
                </p>
              </div>
              <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {deliveryType === "monthly" ? "MT" : "WT"} {" "}
                {selectedSummary.resolvedItems}/{selectedSummary.totalItems}
              </span>
            </div>

            <div className="mt-4 space-y-4">
              {selectedSummary.checklistGroups.map((group) => (
                <div key={group.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {group.name}
                    </p>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {group.items.length} task{group.items.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
                        item.resolved
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-500/10 dark:text-emerald-200"
                          : "border-slate-100 text-slate-600 dark:border-slate-800 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            item.resolved ? "bg-emerald-500" : "bg-rose-400"
                          }`}
                        />
                        <div>
                          <span>{item.name}</span>
                          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {item.assignee?.username ?? "Unassigned"}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {item.resolved ? "Done" : "Pending"}
                      </span>
                    </div>
                  ))}
                  {group.items.length === 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No sub tasks found for this checklist.
                    </p>
                  )}
                </div>
              ))}
              {selectedSummary.checklistGroups.length === 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No sub tasks found for this delivery type.
                </p>
              )}
            </div>
          </div>
        )}

        {!isLoading && !error && selectedDeliveryTask && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Assignee Progress Cards
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Donut chart per assignee with done vs remaining.
                </p>
              </div>
              <div className="w-full max-w-[260px]">
                <select
                  value={selectedAssignee}
                  onChange={(event) => setSelectedAssignee(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="all">All Assignees</option>
                  {assigneeStats.map((assignee) => (
                    <option key={assignee.name} value={assignee.name}>
                      {assignee.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleAssignees.map((assignee) => {
                const done = assignee.done;
                const total = assignee.total;
                const remaining = Math.max(total - done, 0);
                const percent = total ? Math.round((done / total) * 100) : 0;

                return (
                  <div
                    key={assignee.name}
                    className="rounded-lg border border-slate-100 p-4 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {assignee.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {done}/{total} done
                        </p>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {remaining} remaining
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-center">
                      <Chart
                        options={buildAssigneeDonutOptions(percent, done, total)}
                        series={[done, remaining]}
                        type="donut"
                        height={180}
                      />
                    </div>
                  </div>
                );
              })}
              {visibleAssignees.length === 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No assignees found.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
