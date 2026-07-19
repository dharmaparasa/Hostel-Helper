import { useNavigate } from "react-router-dom";
import { ChevronDownIcon } from "./icons";
import { useAppContext } from "../context/AppContext";

export function HostelFilter() {
  const navigate = useNavigate();
  const { hostels, selectedHostelId, selectHostel } = useAppContext();

  return (
    <div className="mb-3 flex gap-2">
      <div className="subtle-panel flex flex-1 items-center gap-2 px-3 py-2">
        <select
          className="h-6 flex-1 appearance-none bg-transparent text-[13px] font-semibold text-ink outline-none"
          value={selectedHostelId}
          onChange={(event) => selectHostel(event.target.value)}
        >
          <option value="all">All Hostels</option>
          {hostels.map((hostel) => (
            <option key={hostel.id} value={hostel.id}>
              {hostel.name}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="h-4 w-4 text-muted" />
      </div>
      <button
        type="button"
        onClick={() => navigate("/hostels")}
        className="rounded-xl border border-brand/20 bg-white px-3 py-2 text-[11px] font-semibold text-brand"
      >
        Hostels
      </button>
    </div>
  );
}
