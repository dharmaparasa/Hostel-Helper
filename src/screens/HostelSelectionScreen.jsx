import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { HostelCard } from "../components/HostelCard";
import { FormField } from "../components/FormField";
import { BuildingIcon, PlusIcon, ShieldIcon } from "../components/icons";
import { useAppContext } from "../context/AppContext";

export function HostelSelectionScreen() {
  const navigate = useNavigate();
  const {
    hostels,
    selectedHostelId,
    selectHostel,
    addHostel,
    updateHostel,
    removeHostel
  } = useAppContext();
  const [newHostel, setNewHostel] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingHostelId, setEditingHostelId] = useState(null);
  const previewEmpty =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("preview") === "empty";
  const visibleHostels = previewEmpty ? [] : hostels;
  const canContinue = visibleHostels.length > 0;
  const guideSlots = Math.max(0, 2 - visibleHostels.length);

  const handleAddHostel = () => {
    if (!newHostel.trim()) {
      setShowForm(true);
      return;
    }

    if (editingHostelId) {
      updateHostel(editingHostelId, { name: newHostel.trim() });
      setEditingHostelId(null);
    } else {
      addHostel(newHostel.trim());
    }

    setNewHostel("");
    setShowForm(false);
  };

  const openRenameForm = (hostel) => {
    setEditingHostelId(hostel.id);
    setNewHostel(hostel.name);
    setShowForm(true);
  };

  const handleRemoveHostel = (hostel) => {
    const confirmed = window.confirm(
      `Remove "${hostel.name}" and its tenants from this demo?`
    );
    if (confirmed) {
      removeHostel(hostel.id);
      if (editingHostelId === hostel.id) {
        setEditingHostelId(null);
        setNewHostel("");
        setShowForm(false);
      }
    }
  };

  return (
    <>
      <div className="top-app-bar">
        <span className="top-app-bar-title">HostelPay</span>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
          Setup
        </span>
      </div>
      <div className="screen-pad">
        <Header
          title={visibleHostels.length === 0 ? "Add Your Hostels" : "Your Hostels"}
          subtitle={
            visibleHostels.length === 0
              ? "Add the hostels you manage"
              : "Pick one hostel to see tenants"
          }
        />
        {visibleHostels.length === 0 ? (
          <div className="space-y-3 pb-10">
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="panel flex min-h-28 flex-col items-center justify-center gap-2 px-4 py-5 text-center text-[#c9cfce] shadow-soft"
                >
                  <BuildingIcon className="h-8 w-8" />
                  <p className="text-base font-semibold leading-snug">
                    Your Hostels
                    <br />
                    will appear here
                  </p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="panel flex w-full flex-col items-center justify-center gap-3 px-6 py-7 text-center shadow-soft"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
                <PlusIcon className="h-7 w-7" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">Add Your First Hostel</p>
                <p className="mt-2 text-base text-muted">
                  Tap here to add the first hostel.
                </p>
              </div>
            </button>
            {showForm ? (
              <div className="panel p-4">
                <FormField label={editingHostelId ? "Rename Hostel" : "Hostel Name"}>
                  <input
                    className="input-base"
                    value={newHostel}
                    onChange={(event) => setNewHostel(event.target.value)}
                    placeholder="Enter hostel name"
                  />
                </FormField>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={handleAddHostel} className="primary-button flex-1">
                    {editingHostelId ? "Save Name" : "Save Hostel"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingHostelId(null);
                      setNewHostel("");
                    }}
                    className="secondary-button flex-1"
                  >
                    Cancel
                  </button>
                </div>
                {editingHostelId ? (
                  <button
                    type="button"
                    onClick={() => {
                      const hostel = hostels.find((item) => item.id === editingHostelId);
                      if (hostel) {
                        handleRemoveHostel(hostel);
                      }
                    }}
                    className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#fff1f2] px-4 text-sm font-semibold text-[#be123c]"
                  >
                    Remove Hostel
                  </button>
                ) : null}
              </div>
            ) : null}
            {!showForm ? (
              <div className="pt-8">
                <button
                  type="button"
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#dfe5e4] px-6 text-base font-semibold text-[#8d9996]"
                  disabled
                >
                  Continue
                </button>
                <div className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-[#8d9996]">
                  <ShieldIcon className="h-4 w-4" />
                  Your data is safe and secure
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3 pb-10">
            <div className="grid grid-cols-2 gap-3">
              {visibleHostels.map((hostel) => (
                <HostelCard
                  key={hostel.id}
                  hostel={hostel}
                  selected={selectedHostelId === hostel.id}
                  onClick={() => selectHostel(hostel.id)}
                  onEdit={() => openRenameForm(hostel)}
                  onDelete={() => handleRemoveHostel(hostel)}
                />
              ))}
              {Array.from({ length: guideSlots }).map((_, index) => (
                <div
                  key={`guide-slot-${index}`}
                  className="panel flex min-h-28 flex-col items-center justify-center gap-2 px-4 py-5 text-center text-[#c9cfce] shadow-soft"
                >
                  <BuildingIcon className="h-8 w-8" />
                  <p className="text-base font-semibold leading-snug">
                    Your Hostels
                    <br />
                    will appear here
                  </p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowForm((current) => !current)}
              className="panel flex w-full flex-col items-center justify-center gap-3 border border-dashed border-brand/35 px-6 py-7 text-center shadow-soft"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
                <PlusIcon className="h-7 w-7" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">Add Hostel</p>
                <p className="mt-2 text-base text-muted">
                  New hostels will appear in the cards above.
                </p>
              </div>
            </button>
            {showForm ? (
              <div className="panel p-4">
                <FormField label={editingHostelId ? "Rename Hostel" : "Hostel Name"}>
                  <input
                    className="input-base"
                    value={newHostel}
                    onChange={(event) => setNewHostel(event.target.value)}
                    placeholder="Enter hostel name"
                  />
                </FormField>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={handleAddHostel} className="primary-button flex-1">
                    {editingHostelId ? "Save Name" : "Save Hostel"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingHostelId(null);
                      setNewHostel("");
                    }}
                    className="secondary-button flex-1"
                  >
                    Cancel
                  </button>
                </div>
                {editingHostelId ? (
                  <button
                    type="button"
                    onClick={() => {
                      const hostel = hostels.find((item) => item.id === editingHostelId);
                      if (hostel) {
                        handleRemoveHostel(hostel);
                      }
                    }}
                    className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#fff1f2] px-4 text-sm font-semibold text-[#be123c]"
                  >
                    Remove Hostel
                  </button>
                ) : null}
              </div>
            ) : null}
            <div className="pt-8">
              <button
                type="button"
                className={`w-full ${canContinue ? "primary-button" : "inline-flex h-12 items-center justify-center rounded-xl bg-[#dfe5e4] px-6 text-base font-semibold text-[#8d9996]"}`}
                onClick={() => navigate("/tenants")}
                disabled={!canContinue}
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
