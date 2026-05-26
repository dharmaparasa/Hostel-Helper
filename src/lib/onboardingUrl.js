export function buildOnboardingUrl(token) {
  if (!token) {
    return "";
  }

  const origin =
    typeof window === "undefined" ? "" : window.location.origin;

  return `${origin}/join/${token}`;
}

export function buildWhatsAppShareUrl(onboardingUrl, ownerName) {
  const message = [
    `Tenant onboarding link for ${ownerName || "our hostel"}:`,
    onboardingUrl,
    "",
    "New tenants can scan or open this link and submit their joining request."
  ].join("\n");

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
