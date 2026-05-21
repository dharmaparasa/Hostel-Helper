export function EmptyState({ title, actionLabel, onAction, text }) {
  return (
    <div className="panel mt-10 p-8 text-center">
      <h2 className="text-2xl font-bold text-ink">{title}</h2>
      <p className="mt-3 text-base text-muted">{text}</p>
      <button type="button" onClick={onAction} className="primary-button mt-6 w-full">
        {actionLabel}
      </button>
    </div>
  );
}
