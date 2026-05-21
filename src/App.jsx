import { Navigate, Route, Routes } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";
import { ToastProvider } from "./context/ToastContext";
import { AppLayout } from "./layout/AppLayout";
import { LoginScreen } from "./screens/LoginScreen";
import { SignupScreen } from "./screens/SignupScreen";
import { CheckEmailScreen } from "./screens/CheckEmailScreen";
import { HostelSelectionScreen } from "./screens/HostelSelectionScreen";
import { TenantListScreen } from "./screens/TenantListScreen";
import { AddTenantScreen } from "./screens/AddTenantScreen";
import { TenantDetailScreen } from "./screens/TenantDetailScreen";

function AppRoutes() {
  const { isReady, session, hostels } = useAppContext();
  const homePath = hostels.length === 0 ? "/hostels" : "/tenants";

  if (!isReady) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-6">
        <div className="panel w-full max-w-sm p-6 text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-pulse rounded-full bg-brand-soft" />
          <p className="text-lg font-semibold">Opening HostelPay...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/signup"
        element={session ? <Navigate to={homePath} replace /> : <SignupScreen />}
      />
      <Route
        path="/login"
        element={session ? <Navigate to={homePath} replace /> : <LoginScreen />}
      />
      <Route path="/check-email" element={<CheckEmailScreen />} />
      <Route
        element={session ? <AppLayout /> : <Navigate to="/login" replace />}
      >
        <Route path="/" element={<Navigate to={homePath} replace />} />
        <Route path="/hostels" element={<HostelSelectionScreen />} />
        <Route path="/tenants" element={<TenantListScreen />} />
        <Route path="/tenants/new" element={<AddTenantScreen />} />
        <Route path="/tenants/:tenantId" element={<TenantDetailScreen />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </ToastProvider>
  );
}
