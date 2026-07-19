import { Navigate, Route, Routes } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";
import { ToastProvider } from "./context/ToastContext";
import { AppLayout } from "./layout/AppLayout";

import { LoginScreen } from "./screens/LoginScreen";
import { SignupScreen } from "./screens/SignupScreen";
import { CheckEmailScreen } from "./screens/CheckEmailScreen";

import { HostelSelectionScreen } from "./screens/HostelSelectionScreen";
import { MainAppScreen } from "./screens/MainAppScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { TenantListScreen } from "./screens/TenantListScreen";
import { RoomListScreen } from "./screens/RoomListScreen";
import { PaymentsScreen } from "./screens/PaymentsScreen";
import { AddTenantScreen } from "./screens/AddTenantScreen";
import { TenantDetailScreen } from "./screens/TenantDetailScreen";
import { OwnerOnboardingQrScreen } from "./screens/OwnerOnboardingQrScreen";
import { PublicJoinScreen } from "./screens/PublicJoinScreen";

function AppRoutes() {
  const { isReady, session, hostels } = useAppContext();

  const hasHostels = hostels.length > 0;
  const homePath = hasHostels ? "/rooms" : "/hostels";

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
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          session ? <Navigate to={homePath} replace /> : <LoginScreen />
        }
      />

      <Route
        path="/signup"
        element={
          session ? <Navigate to={homePath} replace /> : <SignupScreen />
        }
      />

      <Route path="/check-email" element={<CheckEmailScreen />} />
      <Route path="/join/:token" element={<PublicJoinScreen />} />

      {/* Protected Routes */}
      <Route
        element={
          session ? <AppLayout /> : <Navigate to="/login" replace />
        }
      >
        {/* Root Redirect */}
        <Route path="/" element={<Navigate to={homePath} replace />} />

        {/* Hostel Setup */}
        <Route path="/hostels" element={<HostelSelectionScreen />} />

        {/* Owner onboarding */}
        <Route
          path="/owner/onboarding-qr"
          element={
            hasHostels ? (
              <OwnerOnboardingQrScreen />
            ) : (
              <Navigate to="/hostels" replace />
            )
          }
        />

        {/* Main app sections */}
        <Route
          element={
            hasHostels ? (
              <MainAppScreen />
            ) : (
              <Navigate to="/hostels" replace />
            )
          }
        >
          <Route path="/dashboard" element={<DashboardScreen />} />
          <Route path="/tenants" element={<TenantListScreen />} />
          <Route path="/rooms" element={<RoomListScreen />} />
          <Route path="/payments" element={<PaymentsScreen />} />
        </Route>

        {/* Tenant routes */}
        <Route
          path="/tenants/new"
          element={
            hasHostels ? (
              <AddTenantScreen />
            ) : (
              <Navigate to="/hostels" replace />
            )
          }
        />

        <Route
          path="/tenants/:tenantId"
          element={
            hasHostels ? (
              <TenantDetailScreen />
            ) : (
              <Navigate to="/hostels" replace />
            )
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
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
