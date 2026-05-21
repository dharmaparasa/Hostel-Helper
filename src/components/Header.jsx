export function Header({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        {/* <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">HostelPay</p> */}
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle ? <p className="mt-2 text-base text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
