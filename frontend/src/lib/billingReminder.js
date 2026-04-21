/**
 * Show monthly billing reminder when the due date falls in this calendar month or is already overdue.
 */
export function shouldShowBillingReminder(paymentDueDate) {
  if (!paymentDueDate) return false;
  const due = new Date(paymentDueDate);
  if (Number.isNaN(due.getTime())) return false;
  const now = new Date();
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sameMonth =
    due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth();
  const overdue = dueDay < today;
  return sameMonth || overdue;
}

/** Days from start of today to due date (negative if overdue) */
export function daysUntilDueDate(paymentDueDate) {
  if (!paymentDueDate) return null;
  const due = new Date(paymentDueDate);
  const now = new Date();
  const dueT = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const todayT = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((dueT - todayT) / (24 * 60 * 60 * 1000));
}

export function billingReminderTone(days) {
  if (days == null) return 'info';
  if (days < 0) return 'danger';
  if (days <= 7) return 'warning';
  return 'info';
}
