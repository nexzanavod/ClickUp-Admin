import { useRef, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import ClientBenny from "../../components/dashboard/ClientBenny";
import {
  downloadDashboardPDF,
  type PrintDeliveryType,
} from "../../utils/print";

export default function ClientBennyPage() {
  const clientName = "Benny Holder";
  const projectName = "PRD Clarence Valley";
  const [deliveryType, setDeliveryType] = useState<PrintDeliveryType>("weekly");
  const [isPrinting, setIsPrinting] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const handlePrint = async (type: PrintDeliveryType) => {
    if (!pdfRef.current) return;
    setIsPrinting(true);
    setDeliveryType(type);

    // Give React a tick to re-render with the new deliveryType
    await new Promise((r) => setTimeout(r, 300));

    const label = type === "weekly" ? "Weekly" : "Monthly";
    try {
      await downloadDashboardPDF(
        pdfRef.current,
        `${clientName} - ${label} Delivery`
      );
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Client Benny Dashboard | TailAdmin"
        description="Client Benny delivery sign-off dashboard"
      />

      {/* Download buttons — outside the PDF capture area */}
      <div className="mb-4 flex flex-wrap justify-end gap-3 md:mb-6">
        <button
          type="button"
          onClick={() => handlePrint("weekly")}
          disabled={isPrinting}
          className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {isPrinting && deliveryType === "weekly" ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating…
            </span>
          ) : (
            "Download Weekly PDF"
          )}
        </button>
        <button
          type="button"
          onClick={() => handlePrint("monthly")}
          disabled={isPrinting}
          className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {isPrinting && deliveryType === "monthly" ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating…
            </span>
          ) : (
            "Download Monthly PDF"
          )}
        </button>
      </div>

      {/* ── Everything inside this div goes into the PDF ── */}
      <div ref={pdfRef}>
        {/* Header card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Delivery Client
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {projectName} - {clientName}
            </h2>
          </div>
        </div>

        {/* Dashboard */}
        <div className="mt-4 md:mt-6">
          <ClientBenny
            deliveryType={deliveryType}
            onDeliveryTypeChange={setDeliveryType}
          />
        </div>
      </div>
    </>
  );
}
