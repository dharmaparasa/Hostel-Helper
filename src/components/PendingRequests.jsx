import { useEffect, useState } from "react";
import { FormField } from "./FormField";
import { useAppContext } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { formatCurrency } from "../lib/format";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function PendingRequests() {
  const {
    hostels,
    tenantRequests,
    rejectTenantRequest,
    activateTenantRequest,
    refreshTenantRequests
  } = useAppContext();
  const { showToast } = useToast();
  const [activeRequest, setActiveRequest] = useState(null);
  const [form, setForm] = useState({
    hostelId: hostels[0]?.id || "",
    roomNumber: "",
    entryDate: today(),
    monthlyRent: "",
    deposit: ""
  });
  const [busyId, setBusyId] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const pendingRequests = tenantRequests.filter((request) => request.status === "PENDING");

  useEffect(() => {
    let mounted = true;

    async function refresh() {
      setRefreshing(true);
      try {
        await refreshTenantRequests();
      } catch (error) {
        console.error("Refresh tenant requests failed:", error);
      } finally {
        if (mounted) {
          setRefreshing(false);
        }
      }
    }

    refresh();

    return () => {
      mounted = false;
    };
  }, []);

  const openActivation = (request) => {
    setActiveRequest(request);
    setForm({
      hostelId: hostels[0]?.id || "",
      roomNumber: request.room_preference || "",
      entryDate: request.move_in_date || today(),
      monthlyRent: "",
      deposit: ""
    });
  };

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleReject = async (request) => {
    setBusyId(request.id);
    try {
      await rejectTenantRequest(request.id);
      showToast("Request rejected");
    } catch (error) {
      console.error("Reject request failed:", error);
      showToast("Unable to reject request");
    } finally {
      setBusyId("");
    }
  };

  const handleActivate = async (event) => {
    event.preventDefault();
    if (!form.hostelId || !form.roomNumber.trim() || !form.monthlyRent) {
      showToast("Assign hostel, room, and rent first");
      return;
    }

    setBusyId(activeRequest.id);
    try {
      await activateTenantRequest(activeRequest, form);
      await refreshTenantRequests();
      setActiveRequest(null);
      showToast("Tenant activated");
    } catch (error) {
      console.error("Activate request failed:", error);
      showToast("Unable to activate tenant");
    } finally {
      setBusyId("");
    }
  };

  if (tenantRequests.length === 0) {
    return (
      <section className="mb-4 subtle-panel p-4">
        <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-ink">Pending Requests</h2>
          <p className="mt-1 text-sm text-muted">
            {refreshing ? "Checking QR submissions..." : "New QR submissions will appear here."}
          </p>
          </div>
          <span className="chip bg-brand-soft text-brand">0</span>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-4 subtle-panel p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-ink">Pending Requests</h2>
          <p className="mt-1 text-sm text-muted">
            {refreshing ? "Checking QR submissions..." : "Review QR onboarding submissions."}
          </p>
        </div>
        <span className="chip bg-brand-soft text-brand">{pendingRequests.length}</span>
      </div>

      {pendingRequests.length === 0 ? (
        <p className="rounded-xl bg-[#E3F6F4] p-3 text-sm font-medium text-muted">
          All tenant requests are handled.
        </p>
      ) : (
        <div className="space-y-3">
          {pendingRequests.map((request) => (
            <article key={request.id} className="rounded-xl border border-line bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{request.full_name}</p>
                  <p className="mt-1 text-sm text-muted">{request.phone}</p>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-700">
                  PENDING
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
                <span>Move-in: {request.move_in_date || "Not set"}</span>
                <span>Room: {request.room_preference || "Flexible"}</span>
                <span className="col-span-2">
                  Hostel: {request.preferred_hostel || "Owner to assign"}
                </span>
              </div>
              {request.notes ? (
                <p className="mt-3 rounded-lg bg-[#F7FBFA] p-2 text-sm text-ink">{request.notes}</p>
              ) : null}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="secondary-button h-10 px-3 text-sm"
                  disabled={busyId === request.id}
                  onClick={() => handleReject(request)}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="primary-button h-10 px-3 text-sm"
                  disabled={busyId === request.id}
                  onClick={() => openActivation(request)}
                >
                  Approve
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {activeRequest ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/30 px-4 py-6 backdrop-blur-sm sm:items-center"
          onClick={() => setActiveRequest(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-5 shadow-[0_24px_48px_rgba(16,36,33,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-bold text-ink">Activate Tenant</p>
                <p className="mt-1 text-sm text-muted">{activeRequest.full_name}</p>
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-muted"
                onClick={() => setActiveRequest(null)}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleActivate} className="grid gap-3">
              <FormField label="Hostel">
                <select className="input-base" value={form.hostelId} onChange={updateField("hostelId")}>
                  {hostels.map((hostel) => (
                    <option key={hostel.id} value={hostel.id}>
                      {hostel.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Room">
                <input className="input-base" value={form.roomNumber} onChange={updateField("roomNumber")} placeholder="Room number" />
              </FormField>
              <FormField label="Move-in date">
                <input className="input-base" type="date" value={form.entryDate} onChange={updateField("entryDate")} />
              </FormField>
              <FormField label="Monthly rent">
                <input className="input-base" value={form.monthlyRent} onChange={updateField("monthlyRent")} placeholder="5000" inputMode="numeric" />
              </FormField>
              <FormField label="Deposit">
                <input className="input-base" value={form.deposit} onChange={updateField("deposit")} placeholder="0" inputMode="numeric" />
              </FormField>
              <p className="rounded-xl bg-[#E3F6F4] p-3 text-sm font-semibold text-ink">
                First amount due: {formatCurrency(Number(form.monthlyRent || 0) + Number(form.deposit || 0))}
              </p>
              <button type="submit" className="primary-button w-full" disabled={busyId === activeRequest.id}>
                {busyId === activeRequest.id ? "Activating..." : "Activate tenant"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
