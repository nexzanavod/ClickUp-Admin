import PageMeta from "../../components/common/PageMeta";
import WeeklyStatusBoard from "../../components/dashboard/WeeklyStatusBoard";

export default function Home() {
  return (
    <>
      <PageMeta
        title="React.js Ecommerce Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Ecommerce Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  Delivery Dashboards
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Live delivery progress across all clients.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                All clients
              </span>
            </div>
          </div>
        </div>

        <div className="col-span-12">
          <WeeklyStatusBoard />
        </div>
      </div>
    </>
  );
}

