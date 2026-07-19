import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PlusIcon } from "../components/icons";
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

export function RoomListScreen() {
  const navigate = useNavigate();
  const { hostels, selectedHostelId, allTenants } = useAppContext();
  const rooms = useMemo(
    () => buildRooms(hostels, allTenants, selectedHostelId),
    [hostels, allTenants, selectedHostelId]
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
        onClick={() => navigate("/hostels")}
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
