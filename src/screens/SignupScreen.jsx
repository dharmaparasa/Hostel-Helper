import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { FormField } from "../components/FormField";
import { useAppContext } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { validatePassword, isPasswordValid, validateName, isNameValid as validateNameCheck } from "../lib/passwordValidator";

export function SignupScreen() {
  const navigate = useNavigate();
  const { signUp, startDemoSession, hostels } = useAppContext();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const demoAvailable = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
  const nextPath = hostels.length === 0 ? "/hostels" : "/tenants";

  // Validation state
  const trimmedName = name.trim();
  const nameValidation = validateName(name);
  const isNameValid = validateNameCheck(name);
  const isEmailValid = email.includes("@") && email.trim().toLowerCase().endsWith(".com"); // require basic @ and .com
  const passwordValidation = validatePassword(password);
  const isPasswordValidated = isPasswordValid(password);
  const isFormValid = isNameValid && isEmailValid && isPasswordValidated && !loading;

  // Debug logs when user is interacting with the form
  if (password || email || name) {
    console.log("Form validation debug:", {
      name: trimmedName,
      isNameValid,
      email,
      isEmailValid,
      password,
      passwordValidation,
      isPasswordValidated,
      isFormValid,
      buttonDisabled: !isFormValid
    });
  }

  const handleSignup = async () => {
    setLoading(true);
    try {
      const result = await signUp(email, password, name);
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
            <FormField label="Full Name" hint="Your hostel business name or personal name">
              <input
                className="input-base"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Srinivasa Rao"
                type="text"
              />
              {name && !isNameValid && (
                <div className="mt-2 space-y-1 text-sm text-danger">
                  {!nameValidation.minLength && (
                    <div>Name must be at least 4 characters</div>
                  )}
                  {!nameValidation.startsWithLetters && (
                    <div>First 4 characters must be letters only</div>
                  )}
                  {!nameValidation.onlyLettersAndSpaces && (
                    <div>Only letters and spaces are allowed</div>
                  )}
                </div>
              )}
            </FormField>

            <FormField label="Email Address" hint="We'll send a confirmation email" className="mt-4">
              <input
                className="input-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@example.com"
                inputMode="email"
                type="email"
              />
              {email && !isEmailValid && (
                <div className="mt-2 text-sm text-danger">Please provide a valid .com email address</div>
              )}
            </FormField>

            <FormField label="Password" hint="Choose a strong password" className="mt-4">
              <input
                className="input-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
              />
              {password && (
                <div className="mt-3 space-y-2 text-sm">
                  <div className={`flex items-center gap-2 ${passwordValidation.minLength ? "text-green-400" : "text-red-500"}`}>
                    <span>{passwordValidation.minLength ? "✓" : "○"}</span>
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasLowerCase ? "text-green-400" : "text-red-500"}`}>
                    <span>{passwordValidation.hasLowerCase ? "✓" : "○"}</span>
                    <span>Contains a letter (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasNumber ? "text-green-400" : "text-red-500"}`}>
                    <span>{passwordValidation.hasNumber ? "✓" : "○"}</span>
                    <span>Contains a number (0-9)</span>
                  </div>
                </div>
              )}
            </FormField>

            <button
              type="button"
              onClick={handleSignup}
              disabled={!isFormValid}
              className="primary-button mt-6 w-full"
              title={!isFormValid ? "Please fill in all required fields" : ""}
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
