import { Link, useLocation } from "react-router-dom";
import { Header } from "../components/Header";

export function CheckEmailScreen() {
  const location = useLocation();
  const state = location.state || {};
  const title = state.title || "Check your email";
  const message =
    state.message ||
    "We sent an email with a confirmation link. Open it to continue into HostelPay.";
  const email = state.email;

  return (
    <div className="app-shell min-h-screen">
      <div className="phone-frame">
        <div className="top-app-bar">
          <span className="top-app-bar-title">HostelPay</span>
        </div>
        <div className="screen-pad pt-6">
          <Header title={title} subtitle="Confirm your address to continue" />
          <div className="panel p-4">
            {email ? (
              <p className="mb-4 text-sm text-muted">
                Confirmation sent to <strong>{email}</strong>.
              </p>
            ) : null}
            <p className="mb-6 text-base leading-7">{message}</p>
            <div className="space-y-3">
              <Link to="/login" className="secondary-button block w-full text-center">
                Back to Login
              </Link>
              <p className="text-sm text-muted">
                If you do not receive the email, check your spam folder or try again.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckEmailScreen;
