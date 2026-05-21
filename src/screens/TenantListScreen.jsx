import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { TenantCard } from "../components/TenantCard";
import { ChevronDownIcon, PlusIcon, SearchIcon } from "../components/icons";
import { useAppContext } from "../context/AppContext";

export function TenantListScreen() {
  const navigate = useNavigate();
  const { hostels, selectedHostel, selectedHostelId, selectHostel, tenants, logout } = useAppContext();
  const [query, setQuery] = useState("");
  const pendingCount = filteredCount(tenants);

  const filteredTenants = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    if (!lowerQuery) {
      return tenants;
    }

    return tenants.filter(
      (tenant) =>
        tenant.name.toLowerCase().includes(lowerQuery) ||
        tenant.roomNumber.toLowerCase().includes(lowerQuery)
    );
  }, [tenants, query]);

  return (
    <div className="pb-28">
      <div className="top-app-bar">
        <div className="flex items-center gap-2">
          <span className="top-app-bar-title">HostelPay</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-rose-500 px-2 py-1 text-[11px] font-semibold text-white">
            Pending {pendingCount}
          </span>
          <button
            type="button"
            onClick={logout}
            className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="screen-pad">
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

        <label className="subtle-panel mb-4 flex items-center gap-3 px-3 py-2.5">
          <SearchIcon className="h-4 w-4 text-muted" />
          <input
            className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
            placeholder="Search name or room"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        {filteredTenants.length === 0 ? (
          <EmptyState
            title="No tenants yet"
            text="Add a tenant to start rent tracking."
            actionLabel="+ Add New Tenant"
            onAction={() => navigate("/tenants/new")}
          />
        ) : (
          <div className="space-y-2.5">
            {filteredTenants.map((tenant) => (
              <TenantCard
                key={tenant.id}
                tenant={tenant}
                onClick={() => navigate(`/tenants/${tenant.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate("/tenants/new")}
        className="fixed bottom-5 right-6 z-30 flex h-10 items-center justify-center gap-2 rounded-full bg-brand px-3.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-deep"
        aria-label="Add New Tenant"
      >
        <PlusIcon className="h-4 w-4" />
        Add New
      </button>
    </div>
  );
}

function filteredCount(tenants) {
  return tenants.filter((tenant) =>
    tenant.months.some((month) => month.paid < month.rentDue)
  ).length;
}
