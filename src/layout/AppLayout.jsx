import { Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <div className="app-shell">
      <div className="phone-frame">
        <Outlet />
      </div>
    </div>
  );
}
