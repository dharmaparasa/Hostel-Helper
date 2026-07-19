import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { TenantCard } from "../components/TenantCard";
import { PlusIcon, SearchIcon } from "../components/icons";
import { useAppContext } from "../context/AppContext";

export function TenantListScreen() {
  const navigate = useNavigate();
  const { tenants } = useAppContext();
  const [query, setQuery] = useState("");

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
    <>
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

      <button
        type="button"
        onClick={() => navigate("/tenants/new")}
        className="fixed right-6 z-30 flex h-10 items-center justify-center gap-2 rounded-full bg-brand px-3.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-deep"
        style={{ bottom: "calc(5.75rem + env(safe-area-inset-bottom))" }}
        aria-label="Add New Tenant"
      >
        <PlusIcon className="h-4 w-4" />
        Add New
      </button>
    </>
  );
}
