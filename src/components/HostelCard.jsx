import { BuildingIcon, PencilIcon } from "./icons";

export function HostelCard({
  hostel,
  selected,
  onClick,
  isAddCard = false,
  onEdit,
  onDelete
}) {
  return (
    <div
      className={`relative w-full rounded-xl border p-4 text-left shadow-[0_2px_8px_rgba(16,36,33,0.06)] ${
        selected ? "border-brand bg-brand-soft" : "border-transparent bg-white"
      } ${isAddCard ? "border-dashed border-brand/40" : ""}`}
    >
      {!isAddCard && onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-muted shadow-sm"
          aria-label="Edit hostel"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-44 w-full flex-col items-center justify-between text-center"
      >
        <div className="mt-5 flex w-full justify-center text-brand">
          <BuildingIcon className="h-16 w-16" />
        </div>
        <div className="mt-5">
          <p className="text-[15px] font-semibold text-ink">{hostel.name}</p>
          <p className="mt-2 text-sm text-muted">
            {isAddCard ? "Tap here to add a new hostel" : "Open tenant list"}
          </p>
        </div>
      </button>
    </div>
  );
}
