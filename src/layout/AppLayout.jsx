import { Outlet, useLocation } from "react-router-dom";

export function AppLayout() {
  const location = useLocation();
  const isTenantDetail = /^\/tenants\/[^/]+$/.test(location.pathname);

  return (
    <div className={isTenantDetail ? "app-shell h-[100dvh] overflow-hidden" : "app-shell"}>
      <div
        className={
          isTenantDetail
            ? "mx-auto h-[100dvh] w-full max-w-md overflow-hidden bg-[#E3F6F4] px-0 pb-0 pt-0"
            : "phone-frame"
        }
      >
        <Outlet />
      </div>
    </div>
  );
}
