import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { seedData } from "../data/seed";
import { sendEmailLogin, signUpUser, signInWithGoogle, signInWithPassword as supabaseSignInWithPassword, getSupabaseClient, loadSession, signOut } from "../lib/supabase";
import {
  persistDemoSession,
  persistState,
  restoreDemoSession,
  restoreState
} from "../lib/storage";

const AppContext = createContext(null);

function buildInitialState() {
  const stored = restoreState();
  if (stored) {
    return stored;
  }

  return seedData;
}

export function AppProvider({ children }) {
  const [appState, setAppState] = useState(buildInitialState);
  const [session, setSession] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    persistState(appState);
  }, [appState]);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const activeSession = (await loadSession()) || restoreDemoSession();
      if (mounted) {
        setSession(activeSession);
        setIsReady(true);
      }
    }

    bootstrap();

    const supabase = getSupabaseClient();
    if (!supabase) {
      return () => {
        mounted = false;
      };
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const selectedHostel = appState.hostels.find(
    (hostel) => hostel.id === appState.selectedHostelId
  );

  const tenants =
    appState.selectedHostelId === "all"
      ? appState.tenants
      : appState.tenants.filter(
          (tenant) => tenant.hostelId === appState.selectedHostelId
        );

  const addHostel = (name) => {
    const hostel = {
      id: crypto.randomUUID(),
      name,
      totalRooms: "",
      location: ""
    };

    setAppState((current) => ({
      ...current,
      hostels: [...current.hostels, hostel],
      selectedHostelId: hostel.id
    }));
  };

  const updateHostel = (hostelId, updates) => {
    setAppState((current) => ({
      ...current,
      hostels: current.hostels.map((hostel) =>
        hostel.id === hostelId ? { ...hostel, ...updates } : hostel
      )
    }));
  };

  const removeHostel = (hostelId) => {
    setAppState((current) => {
      const nextHostels = current.hostels.filter((hostel) => hostel.id !== hostelId);
      const nextTenants = current.tenants.filter((tenant) => tenant.hostelId !== hostelId);
      const nextSelected =
        current.selectedHostelId === hostelId
          ? nextHostels[0]?.id || "all"
          : current.selectedHostelId;

      return {
        ...current,
        hostels: nextHostels,
        tenants: nextTenants,
        selectedHostelId: nextSelected
      };
    });
  };

  const selectHostel = (hostelId) => {
    setAppState((current) => ({
      ...current,
      selectedHostelId: hostelId
    }));
  };

  const addTenant = (tenantInput) => {
    const tenant = {
      id: crypto.randomUUID(),
      ...tenantInput
    };

    setAppState((current) => ({
      ...current,
      tenants: [tenant, ...current.tenants]
    }));

    return tenant;
  };

  const addPayment = (tenantId, monthId, amount) => {
    setAppState((current) => ({
      ...current,
      tenants: current.tenants.map((tenant) => {
        if (tenant.id !== tenantId) {
          return tenant;
        }

        return {
          ...tenant,
          months: tenant.months.map((month) => {
            if (month.id !== monthId) {
              return month;
            }

            const nextPaid = Math.min(month.paid + amount, month.rentDue);
            return {
              ...month,
              paid: nextPaid,
              closedOn: nextPaid >= month.rentDue ? new Date().toISOString() : null
            };
          })
        };
      })
    }));
  };

  const sendLoginEmail = async (email) => sendEmailLogin(email);

  const signUp = async (email, password, name = "") => signUpUser(email, password, name);
  const signInWithGoogleProvider = async () => {
    const result = await signInWithGoogle();
    if (result?.demo) {
      startDemoSession("demo@hostelpay.com");
    }
    return result;
  };

  const startDemoSession = (email) => {
    const nextSession = {
      user: {
        id: "demo-user",
        email: email
      }
    };

    persistDemoSession(nextSession);
    setSession(nextSession);
  };

  const signInWithPassword = async (email, password) => {
    const result = await supabaseSignInWithPassword(email, password);
    if (result?.demo) {
      startDemoSession(email || "demo@hostelpay.com");
    }
    return result;
  };

  const logout = async () => {
    await signOut();
    persistDemoSession(null);
    setSession(null);
  };

  const value = useMemo(
    () => ({
      ...appState,
      allTenants: appState.tenants,
      selectedHostel,
      tenants,
      session,
      isReady,
      addHostel,
      updateHostel,
      removeHostel,
      selectHostel,
      addTenant,
      addPayment,
      sendLoginEmail,
      signUp,
      signInWithPassword,
      signInWithGoogleProvider,
      startDemoSession,
      logout
    }),
    [appState, selectedHostel, tenants, session, isReady]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider");
  }

  return context;
}
