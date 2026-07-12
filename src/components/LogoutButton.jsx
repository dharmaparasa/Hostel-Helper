import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

export function LogoutButton({ className = "", showOwnerOnboardingQr = false }) {
  const navigate = useNavigate();
  const { logout } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  const handleOwnerOnboardingQr = () => {
    setIsOpen(false);
    navigate("/owner/onboarding-qr", { replace: false });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg font-semibold text-white ${className}`}
        aria-label="Open options"
      >
        <span aria-hidden="true">⋮</span>
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_12px_30px_rgba(15,23,42,0.16)]">
          {showOwnerOnboardingQr ? (
            <button
              type="button"
              onClick={handleOwnerOnboardingQr}
              className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-semibold text-ink hover:bg-[#F7FBFA]"
            >
              Onboarding QR
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-semibold text-ink hover:bg-[#F7FBFA]"
          >
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
