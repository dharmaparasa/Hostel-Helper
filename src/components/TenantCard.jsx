import { formatCurrency, getDueMeta } from "../lib/format";

function getMonthProgress(month) {
  const rentDue = Number(month?.rentDue || 0);
  const paid = Math.max(0, Number(month?.paid || 0));
  const remaining = Math.max(rentDue - paid, 0);
  const percent = rentDue > 0 ? Math.min(100, Math.round((paid / rentDue) * 100)) : 0;

  return {
    month,
    rentDue,
    paid,
    remaining,
    percent
  };
}

function getDisplayMonth(tenant) {
  const months = tenant.months || [];
  return (
    months.find((month) => Number(month.paid || 0) < Number(month.rentDue || 0)) ||
    months.at(-1) ||
    months[0] ||
    null
  );
}

export function getTenantPaidDayCoverage(tenant) {
  const activeMonth = getDisplayMonth(tenant);
  const progress = getMonthProgress(activeMonth);
  const label =
    progress.rentDue > 0
      ? `${formatCurrency(progress.paid)} paid of ${formatCurrency(progress.rentDue)}`
      : "No rent set";

  return {
    activeCycle: activeMonth ? { month: activeMonth } : null,
    cycleDays: 0,
    daysLeft: progress.percent,
    percent: progress.percent,
    paid: progress.paid,
    rentDue: progress.rentDue,
    remaining: progress.remaining,
    label
  };
}

function getCoverageMeta(coverage) {
  if (coverage.remaining > 0 && coverage.percent < 50) {
    return {
      percent: coverage.percent > 0 ? Math.max(coverage.percent, 8) : 0,
      color: "#ef4444",
      shadow: "rgba(239,68,68,0.16)",
      label: coverage.label
    };
  }

  if (coverage.remaining > 0 && coverage.percent < 100) {
    return {
      percent: Math.max(coverage.percent, 8),
      color: "#f59e0b",
      shadow: "rgba(245,158,11,0.18)",
      label: coverage.label
    };
  }

  return {
    percent: coverage.percent,
    color: "#10b981",
    shadow: "rgba(16,185,129,0.16)",
    label: coverage.label
  };
}

export function TenantCard({ tenant, onClick }) {
  const months = tenant.months || [];
  const coverage = getTenantPaidDayCoverage(tenant);
  const openMonth =
    coverage.activeCycle?.month ||
    months.find((month) => Number(month.paid || 0) < Number(month.rentDue || 0)) ||
    months.at(-1) ||
    months[0];
  const dueAmount = months.reduce(
    (sum, month) => sum + Math.max(Number(month.rentDue || 0) - Number(month.paid || 0), 0),
    0
  );
  const dueMeta = getDueMeta(openMonth);
  const initials = tenant.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const coverageMeta = getCoverageMeta(coverage);

  return (
    <button
      type="button"
      onClick={onClick}
      className="subtle-panel relative flex w-full items-center gap-3 overflow-hidden p-3 pt-4 text-left"
    >
      <div
        className="absolute left-3 right-3 top-2 h-[3px] overflow-hidden rounded-full bg-[#E7F3F1]"
        aria-label={coverageMeta.label}
        title={coverageMeta.label}
      >
        <div
          className="h-full rounded-full transition-[width,background-color,box-shadow] duration-700 ease-out"
          style={{
            width: `${coverageMeta.percent}%`,
            backgroundColor: coverageMeta.color,
            boxShadow: `0 0 10px ${coverageMeta.shadow}`
          }}
        />
      </div>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-ink">{tenant.name}</h3>
            <p className="mt-1 text-xs text-muted">{`Room ${tenant.roomNumber}`}</p>
            <p className="mt-1 text-[11px] text-[#7f8c88]">{coverageMeta.label}</p>
          </div>
          <div className="shrink-0 text-right">
            <p
              className={`text-[13px] font-semibold ${
                dueAmount > 0 ? "text-[#ef7d33]" : "text-emerald-600"
              }`}
            >
              {dueAmount > 0 ? formatCurrency(dueAmount) : "Paid"}
            </p>
            <span
              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                dueMeta.tone === "late"
                  ? "bg-rose-100 text-rose-700"
                  : dueMeta.tone === "paid"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
              }`}
            >
              {dueMeta.tone === "late" ? "Due" : dueMeta.tone === "paid" ? "Done" : "Soon"}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
