import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { FormField } from "../components/FormField";
import { useAppContext } from "../context/AppContext";
import { useToast } from "../context/ToastContext";

export function LoginScreen() {
  const navigate = useNavigate();
  const { sendLoginEmail, signInWithGoogleProvider, startDemoSession, hostels } = useAppContext();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const demoAvailable =
    !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
  const nextPath = hostels.length === 0 ? "/hostels" : "/tenants";
  const googleButtonDisabled = demoAvailable || oauthLoading;

  const handleLogin = async () => {
    setErrorMessage("");
    setLoading(true);
    try {
      const result = await sendLoginEmail(email);
      if (result?.demo) {
        startDemoSession(email);
        showToast("Demo opened");
        navigate(nextPath, { replace: true });
      } else {
        navigate("/check-email", {
          replace: true,
          state: {
            title: "Check your inbox",
            message: "We sent a login link to your email. Open it to continue.",
            email
          }
        });
      }
    } catch (error) {
      console.error("Login error", error);
      const message = error?.message || "Could not send login link.";
      setErrorMessage(
        message + " If this fails, try signing in with Google instead."
      );
      showToast(message);
    } finally {
      setLoading(false);
    }
  };

  const openDemo = () => {
    startDemoSession("demo@hostelpay.com");
    showToast("Demo opened");
    navigate(nextPath, { replace: true });
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage("");
    setOauthLoading(true);
    try {
      await signInWithGoogleProvider();
    } catch (error) {
      console.error("Google sign in error", error);
      const message = error?.message || "Google sign in failed.";
      setErrorMessage(message);
      showToast(message);
      setOauthLoading(false);
    }
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
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleButtonDisabled}
              className="secondary-button mt-3 w-full"
            >
              {oauthLoading ? "Redirecting to Google..." : "Continue with Google"}
            </button>
            {demoAvailable ? (
              <button type="button" onClick={openDemo} className="secondary-button mt-3 w-full">
                Open Demo
              </button>
            ) : null}
            <button type="button" onClick={() => navigate('/signup')} className="tertiary-button mt-3 w-full">
              Create account
            </button>
            {errorMessage ? (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {errorMessage}
              </p>
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
