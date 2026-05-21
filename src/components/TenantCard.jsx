import { formatCurrency, getDueMeta } from "../lib/format";

export function TenantCard({ tenant, onClick }) {
  const openMonth = tenant.months.find((month) => month.paid < month.rentDue) || tenant.months[0];
  const dueAmount = tenant.months.reduce(
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

  return (
    <button
      type="button"
      onClick={onClick}
      className="subtle-panel flex w-full items-center gap-3 p-3 text-left"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-ink">{tenant.name}</h3>
            <p className="mt-1 text-xs text-muted">{`Room ${tenant.roomNumber}`}</p>
            <p className="mt-1 text-[11px] text-[#7f8c88]">{dueMeta.label}</p>
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
