import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FormField } from "../components/FormField";
import { resolveOnboardingOwner } from "../lib/supabase/owners";
import { submitTenantRequest } from "../lib/supabase/tenantRequests";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function PublicJoinScreen() {
  const { token } = useParams();
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    phone: "+91",
    email: "",
    emergencyContact: "",
    moveInDate: today(),
    roomPreference: "",
    preferredHostel: "",
    notes: ""
  });

  useEffect(() => {
    let mounted = true;

    async function loadOwner() {
      setLoading(true);
      setErrorMessage("");
      try {
        const resolvedOwner =
          token === "own_DEMO12345"
            ? { owner_name: "Hostel owner" }
            : await resolveOnboardingOwner(token);

        if (mounted) {
          if (!resolvedOwner) {
            setErrorMessage("This onboarding link is invalid or no longer available.");
          }
          setOwner(resolvedOwner);
        }
      } catch (error) {
        console.error("Resolve onboarding owner failed:", error);
        if (mounted) {
          setErrorMessage("Unable to open this onboarding form. Please ask the owner to check the onboarding link.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadOwner();

    return () => {
      mounted = false;
    };
  }, [token]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim()) {
      setErrorMessage("Please enter your full name and phone number.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    try {
      await submitTenantRequest(token, form);
      setSubmitted(true);
    } catch (error) {
      console.error("Submit tenant request failed:", error);
      setErrorMessage("Unable to submit your request right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="phone-frame pb-10">
        <div className="top-app-bar">
          <span className="top-app-bar-title">HostelPay Joining</span>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
            Tenant
          </span>
        </div>

        <main className="screen-pad space-y-4">
          <section className="panel p-5">
            <h1 className="text-2xl font-black text-ink">
              {submitted ? "Request Submitted" : "Tenant Onboarding Request"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              {submitted
                ? "The owner will verify your details and contact you before assigning a hostel or room."
                : `Share your details with ${owner?.owner_name || "the hostel owner"}.`}
            </p>
          </section>

          {loading ? (
            <div className="subtle-panel p-6 text-center font-semibold text-muted">
              Opening onboarding form...
            </div>
          ) : errorMessage && !owner ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
              {errorMessage}
            </div>
          ) : submitted ? (
            <div className="subtle-panel p-5 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl font-black text-white">
                OK
              </div>
              <p className="font-semibold text-ink">Your request is pending owner approval.</p>
              <p className="mt-2 text-sm text-muted">
                No room has been assigned yet. Please complete verification and payment with the owner.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="subtle-panel grid gap-4 p-4">
              <FormField label="Full name">
                <input className="input-base" value={form.fullName} onChange={updateField("fullName")} placeholder="Your full name" />
              </FormField>
              <FormField label="Phone">
                <input className="input-base" value={form.phone} onChange={updateField("phone")} placeholder="+91 98765 43210" inputMode="tel" />
              </FormField>
              <FormField label="Email">
                <input className="input-base" type="email" value={form.email} onChange={updateField("email")} placeholder="you@example.com" />
              </FormField>
              <FormField label="Emergency contact">
                <input className="input-base" value={form.emergencyContact} onChange={updateField("emergencyContact")} placeholder="Family contact number" inputMode="tel" />
              </FormField>
              <FormField label="Move-in date">
                <input className="input-base" type="date" value={form.moveInDate} onChange={updateField("moveInDate")} />
              </FormField>
              <FormField label="Room preference">
                <input className="input-base" value={form.roomPreference} onChange={updateField("roomPreference")} placeholder="Single, sharing, or room number" />
              </FormField>
              <FormField label="Preferred hostel">
                <input className="input-base" value={form.preferredHostel} onChange={updateField("preferredHostel")} placeholder="Optional" />
              </FormField>
              <FormField label="Notes">
                <textarea
                  className="min-h-24 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink outline-none transition placeholder:text-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
                  value={form.notes}
                  onChange={updateField("notes")}
                  placeholder="Work, study, timing, ID details, or other notes"
                />
              </FormField>

              {errorMessage ? (
                <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {errorMessage}
                </p>
              ) : null}

              <button type="submit" className="primary-button w-full" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit request"}
              </button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
