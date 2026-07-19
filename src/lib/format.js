export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDate(dateValue, options = {}) {
  const date = new Date(dateValue);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    ...options
  }).format(date);
}

export function formatMonth(monthKey) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric"
  }).format(date);
}

export function getDueMeta(month) {
  if (!month) {
    return { label: "No data", tone: "paid" };
  }

  const remaining = Math.max((month.rentDue || 0) - (month.paid || 0), 0);

  if (remaining === 0) {
    return {
      label: `Paid on ${formatDate(month.closedOn || new Date().toISOString())}`,
      tone: "paid"
    };
  }

  const dueDate = new Date(month.dueDate || `${month.monthKey}-05`);
  const today = new Date();
  const monthGap =
    (today.getFullYear() - dueDate.getFullYear()) * 12 +
    (today.getMonth() - dueDate.getMonth());
  const dayGap = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

  if (monthGap > 0 || dayGap > 30) {
    const overdueMonths = Math.max(
      1,
      monthGap + (today.getDate() >= dueDate.getDate() ? 0 : 0)
    );
    return {
      label: `${overdueMonths} month${overdueMonths > 1 ? "s" : ""} overdue`,
      tone: "late"
    };
  }

  if (dayGap === 0) {
    return {
      label: "Due today",
      tone: "due"
    };
  }

  return {
    label: "Due this month",
    tone: "due"
  };
}
