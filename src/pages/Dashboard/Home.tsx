import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";

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
                  Choose a client dashboard to view delivery progress.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                Available dashboards
              </span>
            </div>
          </div>
        </div>

        <div className="col-span-12">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Link
              to="/clientbenny"
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-300">
                    Active Client
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                    PRD Clarence Valley - Benny Holder
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Monthly + weekly delivery sign-off
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                  Open
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                Go to dashboard
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>

            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <p className="text-xs font-semibold uppercase text-slate-400">Coming Soon</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-700 dark:text-slate-300">
                Add another client dashboard
              </h2>
              <p className="mt-1 text-sm">Create a new client view when ready.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
