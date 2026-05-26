import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

export function LogoutButton({ className = "" }) {
  const navigate = useNavigate();
  const { logout } = useAppContext();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white ${className}`}
    >
      Logout
    </button>
  );
}
