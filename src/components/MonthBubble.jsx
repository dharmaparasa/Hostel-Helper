import { formatCurrency, formatDate, formatMonth } from "../lib/format";
import { WhatsAppIcon } from "./icons";

export function MonthBubble({ month, onAddPayment, onSendReminder, paymentValue, onPaymentChange }) {
  const remaining = Math.max(month.rentDue - month.paid, 0);
  const isClosed = remaining === 0;

  return (
    <div className={`flex ${isClosed ? "justify-start" : "justify-end"}`}>
      <div
        className={`relative w-[88%] rounded-[18px] px-4 py-3 shadow-[0_2px_8px_rgba(16,36,33,0.06)] ${
          isClosed ? "bg-white text-ink" : "bg-[#e7f7ef] text-ink"
        }`}
      >
        <div
          className={`absolute top-0 h-4 w-4 rotate-45 ${
            isClosed ? "-left-1 bg-white" : "-right-1 bg-[#e7f7ef]"
          }`}
        />
        <p className="relative text-[15px] font-bold text-ink">{formatMonth(month.monthKey)}</p>

        {isClosed ? (
          <div className="relative">
            <div className="mt-2 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#daf4ea]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-7 w-7 text-[#14856f]"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="m5 12 4.2 4.2L19 6.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[#157a6e]">{`Paid ${formatCurrency(month.rentDue)}`}</p>
                <p className="mt-1 text-xs text-muted">
                  {`Paid on ${formatDate(month.closedOn || new Date().toISOString())}`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <p className="mt-2 text-[15px] font-semibold text-ink">
              {`${formatCurrency(month.paid)} / ${formatCurrency(month.rentDue)} paid`}
            </p>
            <p className="mt-1 text-xs text-muted">{`Remaining ${formatCurrency(remaining)}`}</p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/90">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${Math.max(6, (month.paid / month.rentDue) * 100)}%` }}
              />
            </div>
            <input
              className="input-base mt-3 h-9 bg-white px-3 text-sm"
              value={paymentValue}
              onChange={onPaymentChange}
              inputMode="numeric"
              placeholder="Enter payment"
            />
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={onAddPayment} className="secondary-button h-9 flex-1 text-[13px]">
                Add Payment
              </button>
              <button
                type="button"
                onClick={onSendReminder}
                className="secondary-button h-9 gap-1.5 px-3 text-[13px]"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Reminder
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
