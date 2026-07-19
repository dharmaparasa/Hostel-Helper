import { formatCurrency, getDueMeta } from "../lib/format";

const DAY_MS = 1000 * 60 * 60 * 24;

function parseLocalDate(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function addMonths(date, count) {
  return new Date(date.getFullYear(), date.getMonth() + count, date.getDate());
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getCycleDate(monthKey, anchorDate) {
  const [year, month] = String(monthKey).split("-").map(Number);
  if (!year || !month || !anchorDate) {
    return null;
  }

  const lastDay = new Date(year, month, 0).getDate();
  const day = Math.min(anchorDate.getDate(), lastDay);
  return new Date(year, month - 1, day);
}

function getCycleRange(month, tenant) {
  const dueDay = Number(tenant.rentDueDay || 5);
  const fallbackMonthKey = month?.monthKey || new Date().toISOString().slice(0, 7);
  const fallbackDueDate = `${fallbackMonthKey}-${String(dueDay).padStart(2, "0")}`;
  const anchorDate = parseLocalDate(tenant.rentEffectiveFrom) || parseLocalDate(tenant.entryDate);
  const cycleStart =
    parseLocalDate(month?.startDate) ||
    getCycleDate(fallbackMonthKey, anchorDate) ||
    parseLocalDate(month?.dueDate) ||
    parseLocalDate(fallbackDueDate);
  const cycleEnd = parseLocalDate(month?.endDate) || addMonths(cycleStart, 1);

  return { cycleStart, cycleEnd };
}

function getActiveRentCycle(tenant) {
  const months = tenant.months || [];
  const today = startOfDay(new Date());

  const cycles = months
    .map((month) => ({
      month,
      ...getCycleRange(month, tenant)
    }))
    .filter((cycle) => cycle.cycleStart && cycle.cycleEnd)
    .sort((a, b) => a.cycleStart - b.cycleStart);

  return (
    cycles.find((cycle) => today >= cycle.cycleStart && today < cycle.cycleEnd) ||
    cycles.find((cycle) => cycle.month.paid < cycle.month.rentDue) ||
    cycles.at(-1) ||
    null
  );
}

export function getTenantPaidDayCoverage(tenant) {
  const activeCycle = getActiveRentCycle(tenant);
  const monthlyRent = Number(tenant.monthlyRent || activeCycle?.month?.rentDue || 0);
  const paid = Number(activeCycle?.month?.paid || 0);

  if (!activeCycle || monthlyRent <= 0) {
    return {
      activeCycle,
      cycleDays: 0,
      daysLeft: 0,
      percent: 0,
      label: "No paid days left"
    };
  }

  const today = startOfDay(new Date());
  const { cycleStart, cycleEnd } = activeCycle;
  const cycleDays = Math.max(1, Math.ceil((cycleEnd - cycleStart) / DAY_MS));
  const elapsedDays = Math.min(cycleDays, Math.max(0, Math.floor((today - cycleStart) / DAY_MS)));
  const perDayRate = monthlyRent / cycleDays;
  const paidDays = Math.min(cycleDays, Math.floor(paid / perDayRate));
  const daysLeft = Math.max(paidDays - elapsedDays, 0);
  const percent = Math.min(100, Math.max(0, Math.round((daysLeft / cycleDays) * 100)));
  const label = daysLeft === 1 ? "1 paid day left" : `${daysLeft} paid days left`;

  return {
    activeCycle,
    cycleDays,
    daysLeft,
    percent,
    label
  };
}

function getCoverageMeta(coverage) {
  if (coverage.daysLeft <= 0) {
    return {
      percent: coverage.percent,
      color: "#ef4444",
      shadow: "rgba(239,68,68,0.16)",
      label: coverage.label
    };
  }

  if (coverage.daysLeft <= 7) {
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
  const openMonth = coverage.activeCycle?.month || months.find((month) => month.paid < month.rentDue) || months[0];
  const dueAmount = months.reduce(
    (sum, month) => sum + Math.max(month.rentDue - month.paid, 0),
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
