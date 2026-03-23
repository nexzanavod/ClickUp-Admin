import { useEffect, useState } from "react";
import { Link } from "react-router";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { fetchClickUpListTasks } from "../../dashboard/actions/clickup";

const WEEKLY_KEY = "weekly delivery sign off";
const MONTHLY_KEY = "monthly delivery sign off";

const normalizeTitle = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

interface ClientConfig {
  name: string;
  listId: string;
  path: string;
}

interface ChecklistItem {
  id: string;
  name: string;
  resolved: boolean;
  assignee: string;
}

interface ClientProgress {
  percent: number;
  done: number;
  total: number;
  items: ChecklistItem[];
}

interface ClientStatus {
  name: string;
  path: string;
  weekly: ClientProgress | null;
  monthly: ClientProgress | null;
  loading: boolean;
  error: boolean;
}

const CLIENTS: ClientConfig[] = [
  {
    name: "PRD Clarence Valley – Benny Holder",
    listId: import.meta.env.VITE_CLICKUP_BENNY_LIST_ID,
    path: "/clientbenny",
  },
  {
    name: "Huhme Project",
    listId: import.meta.env.VITE_CLICKUP_HUHME_LIST_ID,
    path: "/clienthuhme",
  },
  {
    name: "Viking Mortgages",
    listId: import.meta.env.VITE_CLICKUP_VIKING_LIST_ID,
    path: "/clientvikingmortgages",
  },
  {
    name: "Five Star Stays",
    listId: import.meta.env.VITE_CLICKUP_FIVESTAY_LIST_ID,
    path: "/clientfivestay",
  },
  {
    name: "Phillis Real Estate",
    listId: import.meta.env.VITE_CLICKUP_PHILLIS_LIST_ID,
    path: "/clientphillis",
  },
  {
    name: "Finance Connect",
    listId: import.meta.env.VITE_CLICKUP_FINANCE_LIST_ID,
    path: "/clientfinance",
  },
  {
    name: "PRD Northern Beaches",
    listId: import.meta.env.VITE_CLICKUP_NORTHERN_BEACHES_LIST_ID,
    path: "/clientnorthernbeaches",
  },
  {
    name: "PRD Tweed Coast",
    listId: import.meta.env.VITE_CLICKUP_TWEED_COAST_LIST_ID,
    path: "/clienttweedcoast",
  },
  {
    name: "Elders Real Estate – Benny Holder",
    listId: import.meta.env.VITE_CLICKUP_BENNY_LIST_ID,
    path: "/clientelders",
  },
];

function calcProgress(
  tasks: { name: string; checklists?: { items?: { id?: string; name?: string; resolved?: boolean; assignee?: { username?: string } | null }[] }[] }[],
  keyword: string
): ClientProgress | null {
  const task = tasks.find((t) =>
    normalizeTitle(t.name).includes(normalizeTitle(keyword))
  );
  if (!task) return null;

  const checklists = task.checklists ?? [];
  const allItems: ChecklistItem[] = checklists.flatMap((l) =>
    (l.items ?? []).map((i) => ({
      id: i.id ?? Math.random().toString(),
      name: i.name ?? "Untitled",
      resolved: i.resolved ?? false,
      assignee: i.assignee?.username ?? "Unassigned",
    }))
  );
  const total = allItems.length;
  const done = allItems.filter((i) => i.resolved).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  return { percent, done, total, items: allItems };
}

function ProgressBar({ percent }: { percent: number }) {
  const is100 = percent === 100;
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            is100 ? "bg-emerald-500" : "bg-rose-500"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span
        className={`min-w-[42px] text-right text-sm font-bold tabular-nums ${
          is100
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-rose-600 dark:text-rose-400"
        }`}
      >
        {percent}%
      </span>
    </div>
  );
}

export default function WeeklyStatusBoard() {
  const [statuses, setStatuses] = useState<ClientStatus[]>(
    CLIENTS.map((c) => ({
      name: c.name,
      path: c.path,
      weekly: null,
      monthly: null,
      loading: true,
      error: false,
    }))
  );

  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [activeChart, setActiveChart] = useState<"weekly" | "monthly">("weekly");
  const [activeList, setActiveList] = useState<"weekly" | "monthly">("weekly");

  const load = async () => {
    setRefreshing(true);
    setStatuses((prev) => prev.map((s) => ({ ...s, loading: true, error: false })));

    const results = await Promise.allSettled(
      CLIENTS.map((c) => fetchClickUpListTasks(c.listId))
    );

    setStatuses(
      CLIENTS.map((c, i) => {
        const result = results[i];
        if (result.status === "rejected") {
          return { name: c.name, path: c.path, weekly: null, monthly: null, loading: false, error: true };
        }
        const tasks = result.value.tasks ?? [];
        return {
          name: c.name,
          path: c.path,
          weekly: calcProgress(tasks, WEEKLY_KEY),
          monthly: calcProgress(tasks, MONTHLY_KEY),
          loading: false,
          error: false,
        };
      })
    );

    setLastRefreshed(new Date());
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, []);

  const formatted = lastRefreshed.toLocaleString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Short client name labels for chart x-axis
  const shortNames = statuses.map((s) =>
    s.name
      .replace("PRD ", "")
      .replace(" – Benny Holder", "")
      .replace(" Project", "")
      .replace(" Real Estate", "")
      .replace(" Mortgages", "")
  );

  const loaded = statuses.every((s) => !s.loading);

  const chartDone = statuses.map((s) => (activeChart === "weekly" ? (s.weekly?.done ?? 0) : (s.monthly?.done ?? 0)));
  const chartRemaining = statuses.map((s) => {
    const d = activeChart === "weekly" ? s.weekly : s.monthly;
    if (!d) return 0;
    return Math.max(d.total - d.done, 0);
  });

  const barChartOptions: ApexOptions = {
    chart: {
      type: "bar",
      stacked: true,
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
      background: "transparent",
    },
    colors: ["#10B981", "#F43F5E"],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 6,
        borderRadiusApplication: "end",
        columnWidth: "55%",
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: shortNames,
      labels: {
        style: { fontSize: "11px", colors: "#94a3b8" },
        rotate: -30,
        trim: true,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { fontSize: "11px", colors: "#94a3b8" },
        formatter: (v) => String(Math.round(v)),
      },
      title: {
        text: "Tasks",
        style: { fontSize: "11px", color: "#94a3b8" },
      },
    },
    grid: {
      borderColor: "#e2e8f0",
      strokeDashArray: 4,
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      fontSize: "12px",
      labels: { colors: "#64748b" },
      markers: { size: 7 },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: { formatter: (v) => `${v} tasks` },
    },
    fill: { opacity: 1 },
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Weekly Status Snapshot
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Live delivery progress across all clients · as of {formatted}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <svg
            className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Bar Chart Section */}
      <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
        {/* Chart toggle */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Done vs Remaining — All Clients
          </h3>
          <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveChart("weekly")}
              className={`px-4 py-1.5 text-xs font-semibold transition ${
                activeChart === "weekly"
                  ? "bg-brand-500 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setActiveChart("monthly")}
              className={`px-4 py-1.5 text-xs font-semibold transition ${
                activeChart === "monthly"
                  ? "bg-brand-500 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {!loaded ? (
          <div className="flex h-52 items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-xs">Loading chart data…</span>
            </div>
          </div>
        ) : (
          <Chart
            options={barChartOptions}
            series={[
              { name: "Done", data: chartDone },
              { name: "Remaining", data: chartRemaining },
            ]}
            type="bar"
            height={260}
          />
        )}
      </div>

      {/* Client-grouped Done / Pending Breakdown */}
      {loaded && (
        <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Client Breakdown — Done &amp; Pending
            </h3>
            <div className="flex overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveList("weekly")}
                className={`px-4 py-1.5 text-xs font-semibold transition ${
                  activeList === "weekly"
                    ? "bg-brand-500 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setActiveList("monthly")}
                className={`px-4 py-1.5 text-xs font-semibold transition ${
                  activeList === "monthly"
                    ? "bg-brand-500 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {statuses.map((client) => {
              const prog = activeList === "weekly" ? client.weekly : client.monthly;
              const items = prog?.items ?? [];
              const doneItems = items.filter((i) => i.resolved);
              const pendingItems = items.filter((i) => !i.resolved);
              const percent = prog?.percent ?? 0;
              const is100 = percent === 100;
              const noData = !prog;

              return (
                <Link
                  key={client.path}
                  to={client.path}
                  className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
                >
                  {/* Client name + status badge */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-600 dark:text-slate-100">
                      {client.name.replace(" – Benny Holder", "").replace(" Project", "")}
                    </p>
                    {noData ? (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        No data
                      </span>
                    ) : is100 ? (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                        ✓ Complete
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                        {pendingItems.length} pending
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {!noData && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full ${is100 ? "bg-emerald-500" : "bg-rose-500"}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold tabular-nums ${is100 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {percent}%
                      </span>
                    </div>
                  )}

                  {/* Done / Pending pill counts */}
                  {!noData && (
                    <div className="mt-3 flex gap-2">
                      <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 dark:bg-emerald-500/10">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          {doneItems.length} done
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 dark:bg-rose-500/10">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                          {pendingItems.length} pending
                        </span>
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_180px_180px] gap-4 border-b border-slate-100 px-6 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
        <span>Client</span>
        <span>Weekly</span>
        <span>Monthly</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {statuses.map((client) => (
          <Link
            key={client.path}
            to={client.path}
            className="grid grid-cols-[1fr_180px_180px] items-center gap-4 px-6 py-3.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
              {client.name}
            </span>

            {/* Weekly */}
            <div>
              {client.loading ? (
                <div className="h-4 w-full animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
              ) : client.error ? (
                <span className="text-xs text-rose-500">Error</span>
              ) : client.weekly ? (
                <ProgressBar percent={client.weekly.percent} />
              ) : (
                <span className="text-xs text-slate-400">No data</span>
              )}
            </div>

            {/* Monthly */}
            <div>
              {client.loading ? (
                <div className="h-4 w-full animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
              ) : client.error ? (
                <span className="text-xs text-rose-500">Error</span>
              ) : client.monthly ? (
                <ProgressBar percent={client.monthly.percent} />
              ) : (
                <span className="text-xs text-slate-400">No data</span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 px-6 py-3 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
          100% complete
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500" />
          Needs attention
        </div>
        <p className="ml-auto text-xs text-slate-400 dark:text-slate-500">
          Click any row to open the client dashboard
        </p>
      </div>
    </div>
  );
}
