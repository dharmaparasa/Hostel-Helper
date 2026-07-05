import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { LogoutButton } from "../components/LogoutButton";
import { PendingRequests } from "../components/PendingRequests";
import { TenantCard } from "../components/TenantCard";
import {
  BedIcon,
  ChevronDownIcon,
  ClipboardIcon,
  PlusIcon,
  SearchIcon,
  UsersIcon
} from "../components/icons";
import { useAppContext } from "../context/AppContext";

function BottomNavItem({ icon: Icon, label, active, badgeCount = 0, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition ${
        active ? "bg-brand-soft text-brand" : "text-muted hover:bg-[#F7FBFA] hover:text-ink"
      }`}
    >
      <span className="relative">
        <Icon className="h-5 w-5" />
        {badgeCount > 0 ? (
          <span className="absolute -right-2 -top-2 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        ) : null}
      </span>
      <span>{label}</span>
    </button>
  );
}

function RoomVacancies({ hostels, tenants, selectedHostelId }) {
  const visibleHostels =
    selectedHostelId === "all"
      ? hostels
      : hostels.filter((hostel) => hostel.id === selectedHostelId);

  return (
    <div className="space-y-3">
      {visibleHostels.map((hostel) => {
        const hostelTenants = tenants.filter((tenant) => tenant.hostelId === hostel.id);
        const occupiedRooms = new Set(hostelTenants.map((tenant) => tenant.roomNumber)).size;
        const totalRooms = Number(hostel.totalRooms || 0);
        const vacantRooms = totalRooms > 0 ? Math.max(totalRooms - occupiedRooms, 0) : null;
        const occupancyPercent =
          totalRooms > 0 ? Math.min(Math.round((occupiedRooms / totalRooms) * 100), 100) : 100;

        return (
          <section key={hostel.id} className="subtle-panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-ink">{hostel.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {totalRooms > 0
                    ? `${vacantRooms} vacant of ${totalRooms} rooms`
                    : `${occupiedRooms} occupied rooms tracked`}
                </p>
              </div>
              <span
                className={`chip ${
                  vacantRooms === 0 && totalRooms > 0
                    ? "bg-rose-100 text-rose-700"
                    : "bg-brand-soft text-brand"
                }`}
              >
                {vacantRooms === null ? "--" : vacantRooms}
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E7F3F1]">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out"
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {hostelTenants.slice(0, 6).map((tenant) => (
                <span key={tenant.id} className="rounded-full bg-[#F7FBFA] px-2.5 py-1 text-xs font-semibold text-muted">
                  Room {tenant.roomNumber}
                </span>
              ))}
              {hostelTenants.length === 0 ? (
                <span className="rounded-full bg-[#F7FBFA] px-2.5 py-1 text-xs font-semibold text-muted">
                  No occupied rooms yet
                </span>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function TenantListScreen() {
  const navigate = useNavigate();
  const { hostels, selectedHostelId, selectHostel, tenants, allTenants, tenantRequests } =
    useAppContext();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("tenants");
  const pendingRequestCount = tenantRequests.filter((request) => request.status === "PENDING").length;

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
    <div className="pb-32">
      <div className="top-app-bar">
        <div className="flex items-center gap-2">
          <span className="top-app-bar-title">HostelPay</span>
        </div>
        <div className="flex items-center gap-2">
          <LogoutButton />
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

        {activeTab === "tenants" ? (
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
          </>
        ) : null}

        {activeTab === "onboardings" ? <PendingRequests /> : null}

        {activeTab === "vacancies" ? (
          <RoomVacancies hostels={hostels} tenants={allTenants} selectedHostelId={selectedHostelId} />
        ) : null}
      </div>

      {activeTab === "tenants" ? (
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
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/60 bg-white/95 px-3 pt-2 backdrop-blur-sm"
        style={{ paddingBottom: "calc(0.65rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-md gap-1.5">
          <BottomNavItem
            icon={UsersIcon}
            label="Tenants"
            active={activeTab === "tenants"}
            onClick={() => setActiveTab("tenants")}
          />
          <BottomNavItem
            icon={ClipboardIcon}
            label="Onboardings"
            active={activeTab === "onboardings"}
            badgeCount={pendingRequestCount}
            onClick={() => setActiveTab("onboardings")}
          />
          <BottomNavItem
            icon={BedIcon}
            label="Vacancies"
            active={activeTab === "vacancies"}
            onClick={() => setActiveTab("vacancies")}
          />
        </div>
      </nav>
    </div>
  );
}
