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

function getMonthDateRange(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  return `${formatDate(start)} - ${formatDate(end)}`;
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
    return realPayments.sort((a, b) => {
      const dateOrder = String(a.paymentDate || "").localeCompare(String(b.paymentDate || ""));
      return dateOrder || a.id.localeCompare(b.id);
    });
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

  const sortedMonths = [...tenant.months].sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  const billingCycles = buildBillingFlow(sortedMonths);
  const totalDue = billingCycles.reduce((sum, cycle) => sum + cycle.remaining, 0);
  const uniquePayments = billingCycles
    .flatMap((cycle) => cycle.allocations.map((allocation) => allocation.payment))
    .filter(
      (payment, index, list) =>
        payment && list.findIndex((item) => item?.id === payment.id) === index
    );

  const handleAddPayment = async (monthId) => {
    const amount = Number(paymentValue || 0);
    if (!amount) {
      showToast("Enter payment amount first");
      return;
    }

    setSavingPaymentId(monthId);
    try {
      await addPayment(tenant.id, monthId, amount);
      showToast("Payment added");
    } catch (error) {
      console.error("Add payment failed:", error);
      showToast(error?.message || "Unable to add payment");
    } finally {
      setSavingPaymentId("");
    }
  };

  const handleReminder = (month) => {
    const cycle = billingCycles.find((item) => item.month.id === month.id);
    const remaining = Math.max(cycle?.remaining ?? month.rentDue - month.paid, 0);
    const text = encodeURIComponent(
      `Hello ${tenant.name}, this is a friendly reminder for your room ${tenant.roomNumber}. Pending amount: ${formatCurrency(remaining)}. Please send when possible.`
    );
    window.open(`https://wa.me/${tenant.mobile.replace(/\D/g, "")}?text=${text}`, "_blank");
  };

  return (
    <div className="animate-[slide-in_220ms_ease-out] -mb-24 pb-0">
      <style>{`@keyframes slide-in { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }`}</style>
      <div className="top-app-bar">
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

      <div className="screen-pad min-h-[calc(100svh-84px)] bg-[#f7f8f6] pb-6 pt-4">
        <div className="mb-4 rounded-2xl bg-white px-4 py-3 shadow-[0_3px_14px_rgba(36,44,40,0.06)]">
          <p className="text-[13px] font-semibold text-muted">Payment flow</p>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
            {uniquePayments.length > 0 ? (
              uniquePayments.map((payment) => (
                <div key={payment.id} className="flex items-center gap-2 text-sm text-ink">
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full shadow-sm"
                    style={{ backgroundColor: payment.color }}
                  />
                  <span className="font-bold">{formatCurrency(payment.amount)}</span>
                  <span className="text-muted">{formatDate(payment.paymentDate)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm font-medium text-muted">No payment recorded yet</p>
            )}
          </div>
        </div>

        <div className="relative">
          {billingCycles.map((cycle) => {
            const { month, paid, remaining, percentPaid, allocations } = cycle;
            const isClosed = remaining === 0;
            const progressColor = allocations.at(-1)?.payment?.color || "#45a91a";

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
                          {getMonthDateRange(month.monthKey)}
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

                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#e9ece8]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentPaid}%`,
                          backgroundColor: progressColor
                        }}
                      />
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

                    {!isClosed ? (
                      <div className="mt-5 grid grid-cols-[1fr_auto_auto] gap-2">
                        <input
                          className="input-base h-11 bg-[#f8faf8] px-3 text-base"
                          value={paymentValue}
                          onChange={(event) => setPaymentValue(event.target.value)}
                          inputMode="numeric"
                          placeholder="Amount"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddPayment(month.id)}
                          className="secondary-button h-11 px-4 text-[14px]"
                          disabled={savingPaymentId === month.id}
                        >
                          {savingPaymentId === month.id ? "Adding" : "Add"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReminder(month)}
                          className="secondary-button h-11 px-3"
                          aria-label="Send reminder"
                        >
                          <WhatsAppIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ) : null}
                  </section>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
