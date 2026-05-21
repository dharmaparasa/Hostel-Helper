export function FormField({ label, children, hint }) {
  return (
    <label className="block">
      <span className="label-text">{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-sm text-muted">{hint}</span> : null}
    </label>
  );
}
