import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";

export function PaymentsScreen() {
  const navigate = useNavigate();

  return (
    <EmptyState
      title="Payments"
      text="Open a tenant profile to record and review payments."
      actionLabel="View Tenants"
      onAction={() => navigate("/tenants")}
    />
  );
}
