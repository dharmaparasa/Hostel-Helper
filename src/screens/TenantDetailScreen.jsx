import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MonthBubble } from "../components/MonthBubble";
import { LogoutButton } from "../components/LogoutButton";
import { BackIcon } from "../components/icons";
import { useAppContext } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { formatCurrency } from "../lib/format";

export function TenantDetailScreen() {
  const navigate = useNavigate();
  const { tenantId } = useParams();
  const { allTenants, addPayment } = useAppContext();
  const { showToast } = useToast();
  const [paymentValue, setPaymentValue] = useState("1000");
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

  const totalDue = tenant.months.reduce(
    (sum, month) => sum + Math.max(month.rentDue - month.paid, 0),
    0
  );

  const sortedMonths = [...tenant.months].sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  const handleAddPayment = (monthId, remaining) => {
    const amount = Math.min(Number(paymentValue || 0), remaining);
    if (!amount) {
      showToast("Enter payment amount first");
      return;
    }

    addPayment(tenant.id, monthId, amount);
    showToast("Payment added");
  };

  const handleReminder = (month) => {
    const remaining = Math.max(month.rentDue - month.paid, 0);
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

      <div className="screen-pad flex min-h-[calc(100svh-84px)] flex-col justify-end pb-6">
        <div className="space-y-3">
          {sortedMonths.map((month) => {
            const remaining = Math.max(month.rentDue - month.paid, 0);
            return (
              <MonthBubble
                key={month.id}
                month={month}
                onAddPayment={() => handleAddPayment(month.id, remaining)}
                onSendReminder={() => handleReminder(month)}
                paymentValue={paymentValue}
                onPaymentChange={(event) => setPaymentValue(event.target.value)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
