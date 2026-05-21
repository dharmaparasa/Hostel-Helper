import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { FormField } from "../components/FormField";
import { useAppContext } from "../context/AppContext";
import { useToast } from "../context/ToastContext";

export function LoginScreen() {
  const navigate = useNavigate();
  const { sendLoginEmail, startDemoSession, hostels } = useAppContext();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const demoAvailable =
    !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
  const nextPath = hostels.length === 0 ? "/hostels" : "/tenants";

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await sendLoginEmail(email);
      if (result?.demo) {
        startDemoSession(email);
        showToast("Demo opened");
      } else {
        showToast("Check your email for a login link");
      }
      navigate(nextPath, { replace: true });
    } catch (error) {
      showToast("Could not send login link");
    } finally {
      setLoading(false);
    }
  };

  const openDemo = () => {
    startDemoSession("demo@hostelpay.com");
    showToast("Demo opened");
    navigate(nextPath, { replace: true });
  };

  return (
    <div className="app-shell min-h-screen">
      <div className="phone-frame">
        <div className="top-app-bar">
          <span className="top-app-bar-title">HostelPay</span>
        </div>
        <div className="screen-pad pt-6">
          <Header
            title="Please Sign In"
            subtitle="Use your email to access your app"
          />
          <div className="panel p-4">
            <FormField
              label="Email Address"
              hint="First-time owners can start here"
            >
              <input
                className="input-base"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="owner@example.com"
                inputMode="email"
                type="email"
              />
            </FormField>
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading || !email.includes("@")}
              className="primary-button mt-6 w-full"
            >
              {loading ? "Please wait..." : "Send Login Link"}
            </button>
            {demoAvailable ? (
              <button type="button" onClick={openDemo} className="secondary-button mt-3 w-full">
                Open Demo
              </button>
            ) : null}
            <p className="mt-4 text-sm text-muted">
              Existing owners go back to the tenant list after login.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
