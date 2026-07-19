import {
  BedIcon,
  UsersIcon
} from "./icons";

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

export function AppBottomNavigation({ activeTab, pendingRequestCount, onNavigate }) {
  return (
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
          onClick={() => onNavigate("/dashboard")}
        />
        <BottomNavItem
          icon={UsersIcon}
          label="Tenants"
          active={activeTab === "tenants"}
          onClick={() => onNavigate("/tenants")}
        />
        <BottomNavItem
          icon={BedIcon}
          label="Rooms"
          active={activeTab === "rooms"}
          onClick={() => onNavigate("/rooms")}
        />
        <BottomNavItem
          icon={PaymentsIcon}
          label="Payments"
          active={activeTab === "payments"}
          onClick={() => onNavigate("/payments")}
        />
      </div>
    </nav>
  );
}
