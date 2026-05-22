export function Header({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="rounded-lg bg-[#E3F6F4] px-4 py-3">
        <h1 className="mt-0 text-3xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle ? <p className="mt-1 text-base text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
