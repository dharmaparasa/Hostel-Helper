import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { FormField } from "../components/FormField";
import { useAppContext } from "../context/AppContext";
import { useToast } from "../context/ToastContext";

export function LoginScreen() {
  const navigate = useNavigate();
  const { signInWithPassword, signInWithGoogleProvider, startDemoSession, hostels } = useAppContext();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const demoAvailable =
    !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
  const nextPath = hostels.length === 0 ? "/hostels" : "/tenants";
  const googleButtonDisabled = demoAvailable || oauthLoading;

  const handlePasswordSignIn = async () => {
    setErrorMessage("");
    setLoading(true);
    try {
      await signInWithPassword(email, password);
      showToast("Welcome back!");
      navigate(nextPath, { replace: true });
    } catch (error) {
      console.error("Sign in error", error);
      const message = error?.message || "Unable to sign in. Please check your credentials.";
      setErrorMessage(message);
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
            title="Welcome Back"
            subtitle="Sign in to manage your hostels"
          />
          <div className="panel p-6">
            <FormField label="Email Address">
              <input
                className="input-base"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="owner@example.com"
                inputMode="email"
                type="email"
              />
            </FormField>
            
            <FormField label="Password" className="mt-5">
              <div className="relative">
                <input
                  className="input-base pr-12"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transform text-muted hover:text-ink"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </FormField>

            <button
              type="button"
              onClick={handlePasswordSignIn}
              disabled={loading || !email.includes("@") || password.length < 6}
              className="primary-button mt-6 w-full"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            <div className="relative my-6 flex items-center">
              <div className="flex-grow border-t border-line" />
              <span className="mx-3 text-xs font-semibold uppercase text-muted">or</span>
              <div className="flex-grow border-t border-line" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleButtonDisabled}
              className="secondary-button w-full flex items-center justify-center gap-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                className="w-5 h-5"
              >
                <path
                  fill="#FFC107"
                  d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.215 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.176 35.091 26.715 36 24 36c-5.196 0-9.623-3.327-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611 20.083H42V20H24v8h11.303c-1.058 3.087-3.279 5.548-6.084 7.071l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                />
              </svg>

              {oauthLoading ? "Redirecting..." : "Continue with Google"}
            </button>

            {demoAvailable ? (
              <button type="button" onClick={openDemo} className="secondary-button mt-3 w-full">
                Open Demo
              </button>
            ) : null}

            <button 
              type="button" 
              onClick={() => navigate('/signup')} 
              className="mt-4 w-full py-3 text-base font-semibold text-brand hover:text-brand-deep transition"
            >
              Don't have an account? Create one
            </button>

            {errorMessage ? (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {errorMessage}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
