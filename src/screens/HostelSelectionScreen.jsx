import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { HostelCard } from "../components/HostelCard";
import { FormField } from "../components/FormField";
import { BuildingIcon, PlusIcon, ShieldIcon } from "../components/icons";
import { useAppContext } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { getTenantCountForHostel } from "../lib/supabase/hostels";

export function HostelSelectionScreen() {
  const navigate = useNavigate();
  const {
    hostels,
    addHostel,
    updateHostel,
    removeHostel
  } = useAppContext();
  const { showToast } = useToast();
  const [newHostel, setNewHostel] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingHostelId, setEditingHostelId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hostelTenantCounts, setHostelTenantCounts] = useState({});
  const [loadingCounts, setLoadingCounts] = useState(false);
  const previewEmpty =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("preview") === "empty";
  const visibleHostels = previewEmpty ? [] : hostels;
  const isEmpty = visibleHostels.length === 0;
  const canContinue = !isEmpty;
  const modalTitle = editingHostelId ? "Rename Hostel" : "Add Hostel";
  const modalSubtitle = editingHostelId
    ? "Update the hostel name."
    : "Add a new hostel to begin tracking rooms and tenants.";

  const handleAddHostel = async (event) => {
    event?.preventDefault();

    if (!newHostel.trim()) {
      setShowForm(true);
      return;
    }

    setErrorMessage("");
    setSubmitting(true);

    try {
      if (editingHostelId) {
        await updateHostel(editingHostelId, { name: newHostel.trim() });
        showToast("Hostel updated successfully");
        setEditingHostelId(null);
      } else {
        await addHostel(newHostel.trim());
        showToast("Hostel added successfully");
      }
      setNewHostel("");
      setShowForm(false);
    } catch (error) {
      console.error("Hostel save failed:", error);
      setErrorMessage(error?.message || "Unable to save hostel. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const openRenameForm = (hostel) => {
    setEditingHostelId(hostel.id);
    setNewHostel(hostel.name);
    setShowForm(true);
  };

  const handleRemoveHostel = async (hostel) => {
    const confirmed = window.confirm(
      `Remove "${hostel.name}" and its tenants from this demo?`
    );
    if (!confirmed) {
      return;
    }

    try {
      await removeHostel(hostel.id);
      showToast("Hostel removed");
      if (editingHostelId === hostel.id) {
        setEditingHostelId(null);
        setNewHostel("");
        setShowForm(false);
      }
    } catch (error) {
      console.error("Remove hostel failed:", error);
      setErrorMessage(error?.message || "Unable to remove hostel. Please try again.");
    }
  };

  useEffect(() => {
    let mounted = true;

    async function loadTenantCounts() {
      if (visibleHostels.length === 0) {
        setHostelTenantCounts({});
        return;
      }
      setLoadingCounts(true);
      const nextCounts = {};

      for (const hostel of visibleHostels) {
        try {
          nextCounts[hostel.id] = await getTenantCountForHostel(hostel.id);
        } catch (error) {
          console.error("Failed to fetch tenant count for hostel:", error);
          nextCounts[hostel.id] = undefined;
        }
      }

      if (mounted) {
        setHostelTenantCounts(nextCounts);
        setLoadingCounts(false);
      }
    }

    loadTenantCounts();

    return () => {
      mounted = false;
    };
  }, [visibleHostels]);

  return (
    <>
      <div className="top-app-bar">
        <span className="top-app-bar-title">HostelPay</span>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
          Setup
        </span>
      </div>
      <div className="screen-pad pb-28">
        <Header
          title={isEmpty ? "Add Your Hostels" : "Your Hostels"}
          subtitle={
            isEmpty
              ? "Create and manage the hostels you oversee"
              : "Manage your hostels and add tenants to them"
          }
        />

        {isEmpty ? (
          <div className="space-y-6 pb-10">
            <div className="grid grid-cols-2 gap-3">
              <HostelCard hostel={{ name: "Example hostel" }} isGhost />
            </div>
          </div>
        ) : (
          <div className="space-y-6 pb-10">
            <div className="grid grid-cols-2 gap-3">
              {visibleHostels.map((hostel) => {
                const tenantCount = hostelTenantCounts[hostel.id];
                const deleteDisabled = tenantCount === undefined || tenantCount > 0;
                const helperText = tenantCount > 0
                  ? "Hostel can only be deleted when no tenants are assigned."
                  : tenantCount === undefined && loadingCounts
                  ? "Checking tenant assignments..."
                  : undefined;

                return (
                  <HostelCard
                    key={hostel.id}
                    hostel={hostel}
                    onClick={() => openRenameForm(hostel)}
                    onEdit={() => openRenameForm(hostel)}
                    onDelete={() => handleRemoveHostel(hostel)}
                    deleteDisabled={deleteDisabled}
                    helperText={helperText}
                  />
                );
              })}
              </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          setEditingHostelId(null);
          setNewHostel("");
          setErrorMessage("");
          setShowForm(true);
        }}
        className="fixed right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-[0_18px_45px_rgba(51,197,142,0.18)] transition duration-200 hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand/40"
        style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))", right: "calc(1.5rem + env(safe-area-inset-right))" }}
        aria-label="Add hostel"
      >
        <PlusIcon className="h-6 w-6" />
      </button>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/60 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-6">
        <button
          type="button"
          onClick={() => navigate("/tenants")}
          disabled={!canContinue}
          className={`w-full ${canContinue ? "primary-button" : "inline-flex h-12 items-center justify-center rounded-xl bg-[#dfe5e4] px-6 text-base font-semibold text-[#8d9996]"}`}
        >
          Continue
        </button>
      </div>

      {showForm ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/30 backdrop-blur-sm px-4 py-6 sm:items-center"
          onClick={() => setShowForm(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-white/95 p-6 shadow-[0_24px_48px_rgba(16,36,33,0.18)] backdrop-blur-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-semibold text-ink">{modalTitle}</p>
                <p className="mt-2 text-sm text-muted">{modalSubtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm font-semibold text-slate-500 transition hover:text-ink"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddHostel}>
              <FormField label="Hostel name">
                <input
                  autoFocus
                  className="input-base"
                  value={newHostel}
                  onChange={(event) => setNewHostel(event.target.value)}
                  placeholder="Enter hostel name"
                />
              </FormField>

              {errorMessage ? (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {errorMessage}
                </p>
              ) : null}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={submitting || !newHostel.trim()}
                  className="primary-button flex-1"
                >
                  {submitting ? "Saving..." : editingHostelId ? "Save name" : "Add hostel"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingHostelId(null);
                    setNewHostel("");
                    setErrorMessage("");
                  }}
                  className="secondary-button flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
