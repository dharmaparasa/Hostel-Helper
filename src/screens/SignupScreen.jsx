import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { FormField } from "../components/FormField";
import { useAppContext } from "../context/AppContext";
import { useToast } from "../context/ToastContext";

export function SignupScreen() {
  const navigate = useNavigate();
  const { signUp, startDemoSession, hostels } = useAppContext();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const demoAvailable = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
  const nextPath = hostels.length === 0 ? "/hostels" : "/tenants";

  const handleSignup = async () => {
    setLoading(true);
    try {
      const result = await signUp(email, password);
      if (result?.demo) {
        // For demo mode, create a demo session and navigate in
        startDemoSession(email);
        showToast("Demo account created");
        navigate(nextPath, { replace: true });
      } else {
        navigate("/check-email", {
          replace: true,
          state: {
            title: "Confirm your email",
            message:
              "A confirmation email has been sent. Open it to finish account setup.",
            email
          }
        });
      }
    } catch (err) {
      console.error("Signup error", err);
      showToast(err?.message || "Could not create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell min-h-screen">
      <div className="phone-frame">
        <div className="top-app-bar">
          <span className="top-app-bar-title">HostelPay</span>
        </div>
        <div className="screen-pad pt-6">
          <Header title="Create Account" subtitle="Register with email and password" />
          <div className="panel p-4">
            <FormField label="Email Address" hint="We'll send a confirmation email">
              <input
                className="input-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@example.com"
                inputMode="email"
                type="email"
              />
            </FormField>

            <FormField label="Password" hint="Choose a strong password">
              <input
                className="input-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
              />
            </FormField>

            <button
              type="button"
              onClick={handleSignup}
              disabled={loading || !email.includes("@") || password.length < 6}
              className="primary-button mt-6 w-full"
            >
              {loading ? "Please wait..." : "Create Account"}
            </button>

            {demoAvailable ? (
              <button type="button" onClick={() => { startDemoSession(email); showToast('Demo opened'); navigate(nextPath, { replace: true }); }} className="secondary-button mt-3 w-full">
                Open Demo
              </button>
            ) : null}

            <p className="mt-4 text-sm text-muted">After confirming your email you'll be redirected to the app.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupScreen;
