import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { LogoutButton } from "../components/LogoutButton";
import { PendingRequests } from "../components/PendingRequests";
import { TenantCard } from "../components/TenantCard";
import {
  BedIcon,
  ChevronDownIcon,
  PlusIcon,
  SearchIcon,
  UsersIcon
} from "../components/icons";
import { useAppContext } from "../context/AppContext";

function MoreIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

function DashboardIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2">
      <path d="M4 4h7v7H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 13h7v7H4z" strokeLinejoin="round" />
    </svg>
  );
}

function PaymentsIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16v10H4z" strokeLinejoin="round" />
      <path d="M7 11h4M17 14h.01" strokeLinecap="round" />
    </svg>
  );
}

function BottomNavItem({ icon: Icon, label, active, badgeCount = 0, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2 text-[10px] font-semibold transition ${
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

const ROOM_CAPACITY_PATTERN = [4, 2, 6, 1, 3, 8, 5, 7];

function getRoomSortValue(roomNumber) {
  const numericPart = String(roomNumber).match(/\d+/)?.[0];
  return numericPart ? Number(numericPart) : Number.MAX_SAFE_INTEGER;
}

function buildRooms(hostels, tenants, selectedHostelId) {
  const visibleHostels =
    selectedHostelId === "all"
      ? hostels
      : hostels.filter((hostel) => hostel.id === selectedHostelId);

  return visibleHostels.flatMap((hostel, hostelIndex) => {
    const hostelTenants = tenants.filter((tenant) => tenant.hostelId === hostel.id);
    const occupiedRoomNumbers = [...new Set(hostelTenants.map((tenant) => tenant.roomNumber).filter(Boolean))].sort(
      (a, b) => getRoomSortValue(a) - getRoomSortValue(b) || String(a).localeCompare(String(b))
    );
    const totalRooms = Math.max(Number(hostel.totalRooms || 0), occupiedRoomNumbers.length, 6);
    const occupiedSet = new Set(occupiedRoomNumbers);
    const rooms = occupiedRoomNumbers.map((roomNumber, index) => {
      const occupiedBeds = hostelTenants.filter((tenant) => tenant.roomNumber === roomNumber).length;

      return {
        id: `${hostel.id}-${roomNumber}`,
        hostelName: hostel.name,
        roomNumber,
        occupiedBeds,
        capacity: Math.min(
          8,
          Math.max(occupiedBeds, ROOM_CAPACITY_PATTERN[(index + hostelIndex) % ROOM_CAPACITY_PATTERN.length])
        )
      };
    });

    let nextRoomNumber = 101;
    while (rooms.length < totalRooms) {
      const candidate = String(nextRoomNumber);
      nextRoomNumber += 1;
      if (occupiedSet.has(candidate)) {
        continue;
      }

      const index = rooms.length;
      rooms.push({
        id: `${hostel.id}-${candidate}`,
        hostelName: hostel.name,
        roomNumber: candidate,
        occupiedBeds: 0,
        capacity: ROOM_CAPACITY_PATTERN[(index + hostelIndex) % ROOM_CAPACITY_PATTERN.length]
      });
    }

    return rooms;
  });
}

function BedShape({ occupied, orientation = "vertical" }) {
  const isVertical = orientation === "vertical";
  const colorClasses = occupied
    ? "border-[#25A55F] bg-[#F8FFFB]"
    : "border-[#E89191] bg-[#FFF8F8]";
  const pillowClasses = occupied ? "bg-[#D6F2E2]" : "bg-[#F8DCDC]";

  return (
    <div
      className={`relative shrink-0 rounded-[9px] border-2 ${colorClasses} ${
        isVertical ? "h-[64px] w-[32px]" : "h-[32px] w-[64px]"
      }`}
    >
      <span
        className={`absolute rounded ${pillowClasses} ${
          isVertical ? "left-[7px] top-[7px] h-[12px] w-[18px]" : "left-[7px] top-[7px] h-[18px] w-[12px]"
        }`}
      />
    </div>
  );
}

function getBedRows(capacity) {
  if (capacity <= 0) {
    return [];
  }

  if (capacity === 1) {
    return [["vertical"]];
  }

  if (capacity <= 4) {
    const rows = [];
    let remainingBeds = capacity;

    while (remainingBeds >= 2) {
      rows.push(["vertical", "vertical"]);
      remainingBeds -= 2;
    }

    if (remainingBeds === 1) {
      rows.push(["horizontal"]);
    }

    return rows;
  }

  if (capacity === 5) {
    return [["vertical", "vertical"], ["horizontal", "horizontal"], ["horizontal"]];
  }

  const rows = [];
  let remainingBeds = capacity;

  while (remainingBeds > 0) {
    const bedsInRow = Math.min(2, remainingBeds);
    rows.push(Array.from({ length: bedsInRow }, () => "horizontal"));
    remainingBeds -= bedsInRow;
  }

  return rows;
}

function RoomBedLayout({ capacity, occupiedBeds }) {
  let bedIndex = 0;

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      {getBedRows(capacity).map((row, rowIndex) => (
        <div
          key={`${capacity}-${rowIndex}`}
          className={`flex items-center justify-center ${row.some((orientation) => orientation === "horizontal") ? "gap-2.5" : "gap-7"}`}
        >
          {row.map((orientation) => {
            const currentBedIndex = bedIndex;
            bedIndex += 1;

            return (
              <BedShape
                key={currentBedIndex}
                orientation={orientation}
                occupied={currentBedIndex < occupiedBeds}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function RoomCard({ room }) {
  return (
    <article className="mb-3 inline-block w-full break-inside-avoid rounded-[22px] bg-white p-3 shadow-[0_5px_18px_rgba(24,39,36,0.08)] ring-1 ring-slate-900/[0.04]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-bold leading-tight text-ink">Room {room.roomNumber}</h2>
          <p className="mt-1 text-xs font-semibold text-muted">{room.capacity} Sharing</p>
        </div>
        <button
          type="button"
          className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-[#F1F6F5] hover:text-ink"
          aria-label={`Room ${room.roomNumber} options`}
        >
          <MoreIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4">
        <RoomBedLayout capacity={room.capacity} occupiedBeds={room.occupiedBeds} />
      </div>
    </article>
  );
}

function RoomsScreen({ hostels, tenants, selectedHostelId, onAddRoom }) {
  const rooms = useMemo(
    () => buildRooms(hostels, tenants, selectedHostelId),
    [hostels, tenants, selectedHostelId]
  );
  const totalBeds = rooms.reduce((sum, room) => sum + room.capacity, 0);
  const occupiedBeds = rooms.reduce((sum, room) => sum + Math.min(room.occupiedBeds, room.capacity), 0);
  const vacantBeds = Math.max(totalBeds - occupiedBeds, 0);

  return (
    <>
      <section className="mb-4 rounded-[24px] bg-white p-4 shadow-[0_6px_20px_rgba(24,39,36,0.08)] ring-1 ring-slate-900/[0.04]">
        <div className="grid grid-cols-3 divide-x divide-slate-100 text-center">
          <div>
            <p className="text-[11px] font-semibold text-muted">Total Rooms</p>
            <p className="mt-1 text-xl font-bold text-ink">{rooms.length}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted">Occupied Beds</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">{occupiedBeds}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted">Vacant Beds</p>
            <p className="mt-1 text-xl font-bold text-rose-600">{vacantBeds}</p>
          </div>
        </div>
      </section>

      <div className="columns-2 gap-3">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>

      <button
        type="button"
        onClick={onAddRoom}
        className="fixed right-6 z-30 flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand px-4 text-sm font-bold text-white shadow-[0_14px_32px_rgba(18,140,126,0.28)] transition hover:bg-brand-deep"
        style={{ bottom: "calc(5.75rem + env(safe-area-inset-bottom))" }}
        aria-label="Add Room"
      >
        <PlusIcon className="h-5 w-5" />
        Add Room
      </button>
    </>
  );
}

export function TenantListScreen() {
  const navigate = useNavigate();
  const { hostels, selectedHostelId, selectHostel, tenants, allTenants, tenantRequests } =
    useAppContext();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("rooms");
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

  const title =
    activeTab === "rooms"
      ? "Rooms"
      : activeTab === "tenants"
        ? "Tenants"
        : activeTab === "dashboard"
          ? "Dashboard"
          : "Payments";

  return (
    <div className="pb-32">
      <div className="top-app-bar">
        <div className="flex items-center gap-2">
          <span className="top-app-bar-title">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "rooms" ? (
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white"
              aria-label="Search rooms"
            >
              <SearchIcon className="h-5 w-5" />
            </button>
          ) : null}
          <LogoutButton showOwnerOnboardingQr={activeTab === "dashboard"} />
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

        {activeTab === "dashboard" ? <PendingRequests /> : null}

        {activeTab === "rooms" ? (
          <RoomsScreen
            hostels={hostels}
            tenants={allTenants}
            selectedHostelId={selectedHostelId}
            onAddRoom={() => navigate("/hostels")}
          />
        ) : null}

        {activeTab === "payments" ? (
          <EmptyState
            title="Payments"
            text="Open a tenant profile to record and review payments."
            actionLabel="View Tenants"
            onAction={() => setActiveTab("tenants")}
          />
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
            icon={DashboardIcon}
            label="Dashboard"
            active={activeTab === "dashboard"}
            badgeCount={pendingRequestCount}
            onClick={() => setActiveTab("dashboard")}
          />
          <BottomNavItem
            icon={UsersIcon}
            label="Tenants"
            active={activeTab === "tenants"}
            onClick={() => setActiveTab("tenants")}
          />
          <BottomNavItem
            icon={BedIcon}
            label="Rooms"
            active={activeTab === "rooms"}
            onClick={() => setActiveTab("rooms")}
          />
          <BottomNavItem
            icon={PaymentsIcon}
            label="Payments"
            active={activeTab === "payments"}
            onClick={() => setActiveTab("payments")}
          />
        </div>
      </nav>
    </div>
  );
}
