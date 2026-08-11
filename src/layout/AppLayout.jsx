import { Outlet, useLocation } from "react-router-dom";

export function AppLayout() {
  const location = useLocation();
  const isTenantDetail = /^\/tenants\/[^/]+$/.test(location.pathname);

  return (
    <div className={isTenantDetail ? "fixed inset-0 overflow-hidden overscroll-none bg-white" : "app-shell"}>
      <div
        className={
          isTenantDetail
            ? "mx-auto h-full w-full max-w-md overflow-hidden overscroll-none bg-[#E3F6F4] px-0 pb-0 pt-0"
            : "phone-frame"
        }
      >
        <Outlet />
      </div>
    </div>
  );
}

