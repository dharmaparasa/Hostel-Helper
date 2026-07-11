import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { seedData } from "../data/seed";
import { sendEmailLogin, signUpUser, signInWithGoogle, signInWithPassword as supabaseSignInWithPassword, getSupabaseClient, loadSession, signOut } from "../lib/supabase";
import {
  createHostel,
  deleteHostel,
  fetchHostels,
  isUserVerified,
  updateHostel as updateHostelRemote
} from "../lib/supabase/hostels";
import { ensureCurrentOwnerProfile, fetchCurrentOwner } from "../lib/supabase/owners";
import {
  fetchTenantRequests,
  updateTenantRequestStatus
} from "../lib/supabase/tenantRequests";
import {
  createTenantPayment,
  createTenantWithRoomAndRent,
  fetchTenants
} from "../lib/supabase/tenants";
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

  const hasSupabase = Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  if (hasSupabase) {
    return {
      selectedHostelId: "all",
      hostels: [],
      tenants: []
    };
  }

  return seedData;
}

export function AppProvider({ children }) {
  const [appState, setAppState] = useState(buildInitialState);
  const [session, setSession] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [tenantRequests, setTenantRequests] = useState([]);

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

  useEffect(() => {
    let mounted = true;

    async function loadRemoteData() {
      if (!session || !getSupabaseClient() || !isUserVerified(session.user)) {
        return;
      }

      try {
        const [remoteHostels, remoteOwner, remoteRequests, remoteTenants] = await Promise.all([
          fetchHostels(),
          fetchCurrentOwner(),
          fetchTenantRequests(),
          fetchTenants()
        ]);
        if (mounted) {
          setOwnerProfile(remoteOwner);
          setTenantRequests(remoteRequests);
          setAppState((current) => {
            const nextSelected =
              remoteHostels.find((item) => item.id === current.selectedHostelId)?.id ||
              remoteHostels[0]?.id ||
              "all";

            return {
              ...current,
              hostels: remoteHostels,
              tenants: remoteTenants,
              selectedHostelId: nextSelected
            };
          });
        }
      } catch (error) {
        console.error("Failed to load remote data for user:", error);
      }
    }

    loadRemoteData();

    return () => {
      mounted = false;
    };
  }, [session]);

  const selectedHostel = appState.hostels.find(
    (hostel) => hostel.id === appState.selectedHostelId
  );

  const tenants =
    appState.selectedHostelId === "all"
      ? appState.tenants
      : appState.tenants.filter(
          (tenant) => tenant.hostelId === appState.selectedHostelId
        );

  const addHostel = async (name) => {
    if (session && getSupabaseClient() && isUserVerified(session.user)) {
      try {
        const owner = await ensureCurrentOwnerProfile();
        setOwnerProfile(owner);
        const hostel = await createHostel(name);
        if (hostel) {
          setAppState((current) => ({
            ...current,
            hostels: [...current.hostels, hostel],
            selectedHostelId: hostel.id
          }));
          return hostel;
        }
      } catch (error) {
        console.error("Create hostel failed:", error);
        throw error;
      }
    }

    const hostel = {
      id: crypto.randomUUID(),
      name,
      totalRooms: "",
      location: ""
    };

    setOwnerProfile((current) =>
      current || {
        id: "demo-owner",
        owner_name: session?.user?.email?.split("@")[0] || "Hostel owner",
        onboarding_token: "own_DEMO12345"
      }
    );

    setAppState((current) => ({
      ...current,
      hostels: [...current.hostels, hostel],
      selectedHostelId: hostel.id
    }));

    return hostel;
  };

  const updateHostel = async (hostelId, updates) => {
    if (session && getSupabaseClient() && isUserVerified(session.user)) {
      try {
        await updateHostelRemote(hostelId, updates);
      } catch (error) {
        console.error("Update hostel failed:", error);
      }
    }

    setAppState((current) => ({
      ...current,
      hostels: current.hostels.map((hostel) =>
        hostel.id === hostelId ? { ...hostel, ...updates } : hostel
      )
    }));
  };

  const removeHostel = async (hostelId) => {
    if (session && getSupabaseClient() && isUserVerified(session.user)) {
      try {
        await deleteHostel(hostelId);
      } catch (error) {
        console.error("Delete hostel failed:", error);
      }
    }

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

  const addTenant = async (tenantInput) => {
    if (session && getSupabaseClient() && isUserVerified(session.user)) {
      try {
        const tenantId = await createTenantWithRoomAndRent(tenantInput);
        const remoteTenants = await fetchTenants();
        const savedTenant = remoteTenants.find((tenant) => tenant.id === tenantId);

        setAppState((current) => ({
          ...current,
          tenants: remoteTenants
        }));

        return savedTenant || { id: tenantId, ...tenantInput };
      } catch (error) {
        console.error("Create tenant failed:", error);
        throw error;
      }
    }

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

  const refreshTenantRequests = async () => {
    if (!session || !getSupabaseClient() || !isUserVerified(session.user)) {
      return [];
    }

    const requests = await fetchTenantRequests();
    setTenantRequests(requests);
    return requests;
  };

  const ensureOwnerProfile = async () => {
    if (!session || !getSupabaseClient() || !isUserVerified(session.user)) {
      const demoOwner =
        ownerProfile || {
          id: "demo-owner",
          owner_name: session?.user?.email?.split("@")[0] || "Hostel owner",
          onboarding_token: "own_DEMO12345"
        };
      setOwnerProfile(demoOwner);
      return demoOwner;
    }

    const owner = await ensureCurrentOwnerProfile();
    setOwnerProfile(owner);
    return owner;
  };

  const rejectTenantRequest = async (requestId) => {
    if (session && getSupabaseClient() && isUserVerified(session.user)) {
      const updated = await updateTenantRequestStatus(requestId, "REJECTED");
      setTenantRequests((current) =>
        current.map((request) => (request.id === requestId ? updated : request))
      );
      return updated;
    }

    setTenantRequests((current) =>
      current.map((request) =>
        request.id === requestId ? { ...request, status: "REJECTED" } : request
      )
    );
    return null;
  };

  const activateTenantRequest = async (request, activationInput) => {
    const monthKey = (activationInput.entryDate || new Date().toISOString().slice(0, 10)).slice(0, 7);
    const rentAmount = Number(activationInput.monthlyRent || 0);
    const depositAmount = Number(activationInput.deposit || 0);
    const tenantInput = {
      name: request.full_name.trim(),
      age: "",
      mobile: request.phone.trim(),
      hostelId: activationInput.hostelId,
      roomNumber: activationInput.roomNumber.trim(),
      entryDate: activationInput.entryDate,
      monthlyRent: rentAmount,
      additionalFees: depositAmount,
      purposeOfStay: request.notes || "QR onboarding",
      months: [
        {
          id: `${monthKey}-${request.full_name.toLowerCase().replaceAll(" ", "-")}`,
          monthKey,
          rentDue: rentAmount + depositAmount,
          paid: 0,
          dueDate: `${monthKey}-05`,
          closedOn: null
        }
      ]
    };

    if (session && getSupabaseClient() && isUserVerified(session.user)) {
      const updated = await updateTenantRequestStatus(request.id, "ACTIVATED");
      setTenantRequests((current) =>
        current.map((item) => (item.id === request.id ? updated : item))
      );
    } else {
      setTenantRequests((current) =>
        current.map((item) =>
          item.id === request.id ? { ...item, status: "ACTIVATED" } : item
        )
      );
    }

    const tenant = await addTenant(tenantInput);
    return tenant;
  };

  const addPayment = async (tenantId, monthId, amount) => {
    if (session && getSupabaseClient() && isUserVerified(session.user)) {
      try {
        await createTenantPayment({
          tenantId,
          rentTermId: monthId,
          amount,
          paymentDate: new Date().toISOString().slice(0, 10)
        });
        const remoteTenants = await fetchTenants();
        setAppState((current) => ({
          ...current,
          tenants: remoteTenants
        }));
        return;
      } catch (error) {
        console.error("Create payment failed:", error);
        throw error;
      }
    }

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

            const paymentDate = new Date().toISOString().slice(0, 10);
            const nextPaid = Math.min(month.paid + amount, month.rentDue);
            return {
              ...month,
              paid: nextPaid,
              closedOn: nextPaid >= month.rentDue ? paymentDate : null,
              payments: [
                ...(month.payments || []),
                {
                  id: crypto.randomUUID(),
                  amount,
                  payment_date: paymentDate,
                  status: "PAID"
                }
              ]
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
      ownerProfile,
      tenantRequests,
      addHostel,
      updateHostel,
      removeHostel,
      selectHostel,
      addTenant,
      addPayment,
      refreshTenantRequests,
      ensureOwnerProfile,
      rejectTenantRequest,
      activateTenantRequest,
      sendLoginEmail,
      signUp,
      signInWithPassword,
      signInWithGoogleProvider,
      startDemoSession,
      logout
    }),
    [appState, selectedHostel, tenants, session, isReady, ownerProfile, tenantRequests]
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
