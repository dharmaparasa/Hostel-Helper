import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LogoutButton } from "../components/LogoutButton";
import { BackIcon, WhatsAppIcon } from "../components/icons";
import { useAppContext } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { formatCurrency, formatDate, formatMonth } from "../lib/format";

const PAYMENT_COLORS = [
  "#2563eb",
  "#45a91a",
  "#7e57c2",
  "#d97706",
  "#0891b2",
  "#be4667",
  "#4f7f54",
  "#8b5a2b"
];

function parseDateValue(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function formatInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addMonthsPreserveDay(date, amount) {
  const year = date.getFullYear();
  const month = date.getMonth() + amount;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const day = Math.min(date.getDate(), lastDay);
  return new Date(year, month, day);
}

function getMonthDateRange(month) {
  const start = parseDateValue(month.startDate);
  const end = parseDateValue(month.endDate);

  if (start && end) {
    return `${formatDate(start)} - ${formatDate(end)}`;
  }

  const [year, monthValue] = month.monthKey.split("-").map(Number);
  const fallbackStart = new Date(year, monthValue - 1, 1);
  const fallbackEnd = new Date(year, monthValue, 0);

  return `${formatDate(fallbackStart)} - ${formatDate(fallbackEnd)}`;
}

function buildBillingMonths(tenant) {
  const startDate = parseDateValue(tenant.rentEffectiveFrom || tenant.entryDate) || new Date();
  const today = new Date();
  const monthlyRent = Number(tenant.monthlyRent || 0);
  const additionalFees = Number(tenant.additionalFees || 0);
  const rentDue = monthlyRent + additionalFees;
  const existingMonths = new Map((tenant.months || []).map((month) => [month.monthKey, month]));
  const months = [];
  let current = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  while (current <= today) {
    const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
    const existingMonth = existingMonths.get(monthKey);
    const startValue = formatInputDate(current);
    const endValue = formatInputDate(addMonthsPreserveDay(current, 1));

    months.push({
      id: existingMonth?.id || `${tenant.id}-${monthKey}`,
      rentTermId: tenant.rentId || existingMonth?.id || null,
      monthKey,
      rentDue,
      paid: Math.min(Number(existingMonth?.paid || 0), rentDue),
      dueDate: `${monthKey}-${String(startDate.getDate()).padStart(2, "0")}`,
      closedOn: existingMonth?.closedOn || null,
      payments: existingMonth?.payments || [],
      startDate: startValue,
      endDate: endValue
    });

    current = addMonthsPreserveDay(current, 1);
  }

  return months;
}

function normalizePayment(payment, month, index) {
  const amount = Number(payment?.amount || 0);

  return {
    id: payment?.id || `${month.id}-payment-${index}`,
    amount,
    paymentDate: payment?.payment_date || payment?.paymentDate || month.closedOn || month.dueDate,
    sourceMonthId: month.id
  };
}

function getTenantPayments(sortedMonths) {
  const realPayments = sortedMonths.flatMap((month) =>
    (month.payments || [])
      .map((payment, index) => normalizePayment(payment, month, index))
      .filter((payment) => payment.amount > 0)
  );

  if (realPayments.length > 0) {
    return realPayments;
  }

  return sortedMonths
    .filter((month) => Number(month.paid || 0) > 0)
    .map((month, index) => ({
      id: `${month.id}-recorded-payment`,
      amount: Number(month.paid || 0),
      paymentDate: month.closedOn || month.dueDate,
      sourceMonthId: month.id,
      inferred: true,
      inferredIndex: index
    }))
    .sort((a, b) => {
      const dateOrder = String(a.paymentDate || "").localeCompare(String(b.paymentDate || ""));
      return dateOrder || a.inferredIndex - b.inferredIndex;
    });
}

function buildBillingFlow(sortedMonths) {
  const paymentMeta = new Map();
  const cycleMap = new Map(
    sortedMonths.map((month) => [
      month.id,
      {
        month,
        paid: 0,
        allocations: []
      }
    ])
  );

  getTenantPayments(sortedMonths).forEach((payment, index) => {
    let remainingPayment = payment.amount;
    const color = PAYMENT_COLORS[index % PAYMENT_COLORS.length];
    paymentMeta.set(payment.id, {
      ...payment,
      color
    });

    sortedMonths.forEach((month) => {
      if (remainingPayment <= 0) {
        return;
      }

      const cycle = cycleMap.get(month.id);
      const due = Number(month.rentDue || 0);
      const roomLeft = Math.max(due - cycle.paid, 0);
      const applied = Math.min(roomLeft, remainingPayment);

      if (applied > 0) {
        cycle.paid += applied;
        cycle.allocations.push({
          paymentId: payment.id,
          amount: applied
        });
        remainingPayment -= applied;
      }
    });
  });

  return sortedMonths.map((month) => {
    const cycle = cycleMap.get(month.id);
    const rentDue = Number(month.rentDue || 0);
    const paid = Math.min(cycle.paid, rentDue);
    const remaining = Math.max(rentDue - paid, 0);

    return {
      ...cycle,
      paid,
      remaining,
      percentPaid: rentDue > 0 ? Math.min((paid / rentDue) * 100, 100) : 0,
      allocations: cycle.allocations.map((allocation) => ({
        ...allocation,
        payment: paymentMeta.get(allocation.paymentId)
      }))
    };
  });
}

export function TenantDetailScreen() {
  const navigate = useNavigate();
  const { tenantId } = useParams();
  const { allTenants, addPayment } = useAppContext();
  const { showToast } = useToast();
  const [paymentValue, setPaymentValue] = useState("1000");
  const [savingPaymentId, setSavingPaymentId] = useState("");
  const tenant = allTenants.find((item) => item.id === tenantId);

  if (!tenant) {
    return (
      <div className="panel p-6 text-center">
        <p className="text-xl font-semibold">Tenant not found</p>
        <button type="button" onClick={() => navigate("/tenants")} className="primary-button mt-4">
          Back to list
        </button>
      </div>
    );
  }

  const sortedMonths = [...buildBillingMonths(tenant)].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const billingCycles = buildBillingFlow(sortedMonths);
  const totalDue = billingCycles.reduce((sum, cycle) => sum + cycle.remaining, 0);

  const paymentTargetCycle = billingCycles.find((cycle) => cycle.remaining > 0) ?? billingCycles.at(-1) ?? null;
  const paymentTargetMonth = paymentTargetCycle?.month ?? null;

  const handleAddPayment = async (month) => {
    const amount = Number(paymentValue || 0);
    if (!amount || !month) {
      showToast("Enter payment amount first");
      return;
    }

    setSavingPaymentId(month.id);
    try {
      await addPayment(tenant.id, month.rentTermId || month.id, amount);
      setPaymentValue("1000");
      showToast("Payment added");
    } catch (error) {
      console.error("Add payment failed:", error);
      showToast(error?.message || "Unable to add payment");
    } finally {
      setSavingPaymentId("");
    }
  };

  const handleReminder = (month) => {
    const cycle = month ? billingCycles.find((item) => item.month.id === month.id) : paymentTargetCycle;
    const remaining = Math.max(cycle?.remaining ?? (month?.rentDue ?? 0), 0);
    const text = encodeURIComponent(
      `Hello ${tenant.name}, this is a friendly reminder for your room ${tenant.roomNumber}. Pending amount: ${formatCurrency(remaining)}. Please send when possible.`
    );

    if (!tenant.mobile) {
      showToast("No mobile number recorded for this tenant");
      return;
    }

    window.open(`https://wa.me/${tenant.mobile.replace(/\D/g, "")}?text=${text}`, "_blank");
  };

  return (
    <div className="animate-[slide-in_220ms_ease-out] min-h-[100dvh] bg-brand-soft">
      <style>{`@keyframes slide-in { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }`}</style>
      <div className="top-app-bar flex-none">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15"
          >
            <BackIcon className="h-5 w-5 text-white" />
          </button>
          <div>
            <p className="text-sm font-semibold text-white">{tenant.name}</p>
            <p className="text-xs text-white/80">{`Room ${tenant.roomNumber}`}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-rose-500 px-3 py-1.5 text-[13px] font-bold text-white">
            Due {formatCurrency(totalDue)}
          </span>
          <LogoutButton />
        </div>
      </div>

      <div className="screen-pad pb-28 pt-4">
        <div className="relative">
          {billingCycles.map((cycle) => {
            const { month, paid, remaining, allocations } = cycle;
            const isClosed = remaining === 0;
            const progressColor = allocations.at(-1)?.payment?.color || "#45a91a";
            const paidSegments = allocations.map((allocation) => ({
              ...allocation,
              width: (allocation.amount / Math.max(month.rentDue, 1)) * 100
            }));

            return (
              <div key={month.id} className="grid min-h-[33svh] grid-cols-[10%_90%]">
                <div className="relative flex justify-center">
                  <div className="absolute bottom-0 top-0 w-3.5 overflow-hidden bg-[#e4e7e2]">
                    {allocations.map((allocation) => (
                      <div
                        key={`${month.id}-${allocation.paymentId}`}
                        className="w-full"
                        style={{
                          height: `${(allocation.amount / Math.max(month.rentDue, 1)) * 100}%`,
                          backgroundColor: allocation.payment.color
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end py-3 pl-3">
                  <section className="w-full rounded-[22px] border border-[#e4e8e3] bg-white p-5 shadow-[0_7px_20px_rgba(42,49,45,0.08)]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-2xl font-bold leading-tight text-ink">
                          {formatMonth(month.monthKey)}
                        </p>
                        <p className="mt-1 text-[15px] font-medium text-muted">
                          {getMonthDateRange(month)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-muted">Total rent</p>
                        <p className="text-2xl font-bold text-ink">{formatCurrency(month.rentDue)}</p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-semibold text-muted">Amount paid</p>
                        <p className="mt-1 text-xl font-bold" style={{ color: progressColor }}>
                          {formatCurrency(paid)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-muted">Remaining</p>
                        <p className={`mt-1 text-xl font-bold ${isClosed ? "text-emerald-700" : "text-rose-600"}`}>
                          {formatCurrency(remaining)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-[#e9ece8]">
                      {paidSegments.map((segment) => (
                        <div
                          key={`${month.id}-progress-${segment.paymentId}`}
                          className="h-full min-w-[3px] transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                          style={{
                            width: `${segment.width}%`,
                            backgroundColor: segment.payment.color
                          }}
                        />
                      ))}
                    </div>

                    <div className="mt-5 border-t border-[#e5e8e4] pt-4">
                      <p className="text-base font-bold text-ink">Payments</p>
                      <div className="mt-3 space-y-3">
                        {allocations.length > 0 ? (
                          allocations.map((allocation) => (
                            <div
                              key={`${month.id}-ledger-${allocation.paymentId}`}
                              className="flex items-center justify-between gap-3 text-[15px] text-ink"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <span
                                  className="h-3.5 w-3.5 shrink-0 rounded-full shadow-sm"
                                  style={{ backgroundColor: allocation.payment.color }}
                                />
                                <span className="truncate font-semibold">
                                  {formatCurrency(allocation.amount)}
                                  <span className="font-medium text-muted">
                                    {` / ${formatCurrency(allocation.payment.amount)}`}
                                  </span>
                                </span>
                              </div>
                              <span className="shrink-0 font-medium text-muted">
                                {formatDate(allocation.payment.paymentDate, { year: "numeric" })}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-[15px] font-medium text-muted">No payment recorded yet</p>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {paymentTargetMonth && totalDue > 0 ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md rounded-[28px] border-t border-white/80 bg-white/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_34px_rgba(18,46,42,0.16)] backdrop-blur">
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center rounded-full px-4 ring-1 ring-[#dbe9e5] focus-within:ring-2 focus-within:ring-brand/25">
              <span className="pr-2 text-sm font-bold text-brand">Rs</span>
              <input
                className="h-11 min-w-0 flex-1 text-base font-semibold text-ink outline-none placeholder:text-muted"
                value={paymentValue}
                onChange={(event) => setPaymentValue(event.target.value)}
                inputMode="numeric"
                placeholder="Amount"
              />
            </div>
            <button
              type="button"
              onClick={() => handleAddPayment(paymentTargetMonth)}
              className="h-11 rounded-full bg-brand px-5 text-[14px] font-bold text-white shadow-[0_6px_14px_rgba(12,90,81,0.22)] transition hover:bg-brand-deep focus:outline-none focus:ring-4 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={savingPaymentId === paymentTargetMonth.id}
            >
              {savingPaymentId === paymentTargetMonth.id ? "Adding" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => handleReminder(paymentTargetMonth)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-[#25d366]/25 bg-[#e7f8ee] text-[#128c4a] shadow-[0_6px_14px_rgba(18,140,74,0.12)] transition hover:bg-[#d9f4e5] focus:outline-none focus:ring-4 focus:ring-[#25d366]/15"
              aria-label="Send reminder"
            >
              <WhatsAppIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
