import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppBottomNavigation } from "../components/AppBottomNavigation";
import { HostelFilter } from "../components/HostelFilter";
import { LogoutButton } from "../components/LogoutButton";
import { SearchIcon } from "../components/icons";
import { useAppContext } from "../context/AppContext";

const TAB_BY_PATH = {
  "/dashboard": "dashboard",
  "/tenants": "tenants",
  "/onboardings": "onboardings",
  "/rooms": "rooms",
  "/payments": "payments"
};

const TITLE_BY_TAB = {
  dashboard: "Dashboard",
  tenants: "Tenants",
  onboardings: "Onboardings",
  rooms: "Rooms",
  payments: "Payments"
};

export function MainAppScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantRequests } = useAppContext();
  const activeTab = TAB_BY_PATH[location.pathname] || "tenants";
  const pendingRequestCount = tenantRequests.filter((request) => request.status === "PENDING").length;

  return (
    <div className="pb-32">
      <div className="top-app-bar">
        <div className="flex items-center gap-2">
          <span className="top-app-bar-title">{TITLE_BY_TAB[activeTab]}</span>
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
        <HostelFilter />
        <Outlet />
      </div>

      <AppBottomNavigation
        activeTab={activeTab}
        pendingRequestCount={pendingRequestCount}
        onNavigate={navigate}
      />
    </div>
  );
}
