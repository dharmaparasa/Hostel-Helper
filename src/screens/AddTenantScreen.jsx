import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomBar } from "../components/BottomBar";
import { FormField } from "../components/FormField";
import { BackIcon } from "../components/icons";
import { useAppContext } from "../context/AppContext";
import { useToast } from "../context/ToastContext";

function buildToday() {
  return new Date().toISOString().slice(0, 10);
}

export function AddTenantScreen() {
  const navigate = useNavigate();
  const { hostels, selectedHostelId, addTenant, selectHostel } = useAppContext();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: "",
    age: "",
    mobile: "+91",
    hostelId:
      selectedHostelId === "all" ? hostels[0]?.id || "" : selectedHostelId,
    roomNumber: "",
    entryDate: buildToday(),
    monthlyRent: "",
    additionalFees: "",
    purposeOfStay: ""
  });

  const rentPreview = useMemo(
    () => Number(form.monthlyRent || 0) + Number(form.additionalFees || 0),
    [form.monthlyRent, form.additionalFees]
  );

  const updateField = (field) => (event) =>
    setForm((current) => ({
      ...current,
      [field]: event.target.value
    }));

  const handleSave = () => {
    if (!form.name.trim() || !form.roomNumber.trim() || !form.monthlyRent) {
      showToast("Please fill name, room, and rent");
      return;
    }

    const monthKey = form.entryDate.slice(0, 7);
    const totalRent = Number(form.monthlyRent) + Number(form.additionalFees || 0);

    const tenant = addTenant({
      name: form.name.trim(),
      age: form.age.trim(),
      mobile: form.mobile.trim(),
      hostelId: form.hostelId,
      roomNumber: form.roomNumber.trim(),
      entryDate: form.entryDate,
      monthlyRent: Number(form.monthlyRent),
      additionalFees: Number(form.additionalFees || 0),
      purposeOfStay: form.purposeOfStay.trim(),
      months: [
        {
          id: `${monthKey}-${form.name.toLowerCase().replaceAll(" ", "-")}`,
          monthKey,
          rentDue: totalRent,
          paid: 0,
          dueDate: `${monthKey}-05`,
          closedOn: null
        }
      ]
    });

    selectHostel(form.hostelId);
    showToast("Tenant saved");
    navigate(`/tenants/${tenant.id}`, { replace: true });
  };

  return (
    <>
      <div className="top-app-bar">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15"
          >
            <BackIcon className="h-5 w-5 text-white" />
          </button>
          <span className="top-app-bar-title">Add New Tenant</span>
        </div>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
          Form
        </span>
      </div>
      <div className="screen-pad space-y-4 pb-36">
        <div className="subtle-panel grid gap-4 p-4">
          <FormField label="Name">
            <input className="input-base" value={form.name} onChange={updateField("name")} placeholder="Tenant name" />
          </FormField>
          <FormField label="Age">
            <input className="input-base" value={form.age} onChange={updateField("age")} placeholder="Age" inputMode="numeric" />
          </FormField>
          <FormField label="Mobile Number">
            <input className="input-base" value={form.mobile} onChange={updateField("mobile")} placeholder="+91 98765 43210" inputMode="tel" />
          </FormField>
          <FormField label="Hostel">
            <select className="input-base appearance-none" value={form.hostelId} onChange={updateField("hostelId")}>
              {hostels.map((hostel) => (
                <option key={hostel.id} value={hostel.id}>
                  {hostel.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Room Number">
            <input className="input-base" value={form.roomNumber} onChange={updateField("roomNumber")} placeholder="Room number" />
          </FormField>
          <FormField label="Date of Entry">
            <input className="input-base" type="date" value={form.entryDate} onChange={updateField("entryDate")} />
          </FormField>
          <FormField label="Monthly Rent">
            <input className="input-base" value={form.monthlyRent} onChange={updateField("monthlyRent")} placeholder="5000" inputMode="numeric" />
          </FormField>
          <FormField label="Additional Fees">
            <input className="input-base" value={form.additionalFees} onChange={updateField("additionalFees")} placeholder="0" inputMode="numeric" />
          </FormField>
          <FormField label="Purpose of Stay">
            <input className="input-base" value={form.purposeOfStay} onChange={updateField("purposeOfStay")} placeholder="Job, study, family stay" />
          </FormField>
        </div>

        <div className="subtle-panel p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">First Month Due</p>
          <p className="mt-2 text-3xl font-bold text-brand">{`₹${rentPreview || 0}`}</p>
        </div>
      </div>

      <BottomBar>
        <button type="button" onClick={handleSave} className="primary-button w-full">
          Save Tenant
        </button>
      </BottomBar>
    </>
  );
}
