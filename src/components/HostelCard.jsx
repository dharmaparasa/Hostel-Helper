import { BuildingIcon, PencilIcon, TrashIcon } from "./icons";

export function HostelCard({
  hostel,
  selected,
  onClick,
  isGhost = false,
  onEdit,
  onDelete,
  deleteDisabled = false,
  helperText
}) {
  const baseClasses = isGhost
    ? "rounded-xl border border-slate-200 bg-slate-50/80 text-slate-500 shadow-none opacity-80 p-4"
    : "rounded-xl border p-4 text-left shadow-[0_2px_8px_rgba(16,36,33,0.06)]";

  return (
    <div
      className={`relative w-full ${baseClasses} ${
        selected && !isGhost ? "border-brand bg-brand-soft" : "border-transparent bg-white"
      }`}
    >
      {!isGhost ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete?.();
          }}
          disabled={deleteDisabled}
          className={`absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-muted shadow-sm transition ${
            deleteDisabled ? "cursor-not-allowed opacity-40" : "hover:bg-white"
          }`}
          aria-label="Delete hostel"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      ) : null}
      {!isGhost && onEdit ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-muted shadow-sm"
          aria-label="Rename hostel"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onClick}
        disabled={isGhost}
        className={`flex min-h-44 w-full flex-col items-center justify-between text-center ${
          isGhost ? "cursor-default" : ""
        }`}
      >
        <div className="mt-5 flex w-full justify-center text-brand">
          <BuildingIcon className="h-16 w-16" />
        </div>
        <div className="mt-5">
          <p className={`text-[15px] font-semibold ${isGhost ? "text-slate-600" : "text-ink"}`}>
            {hostel.name}
          </p>
          <p className="mt-2 text-sm text-muted">
            {isGhost ? "Example reference card" : "Manage hostel details"}
          </p>
        </div>
      </button>
      {helperText ? (
        <p className="mt-4 text-xs leading-5 text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
