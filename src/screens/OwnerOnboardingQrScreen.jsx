import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackIcon, WhatsAppIcon } from "../components/icons";
import { useAppContext } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { buildOnboardingUrl, buildWhatsAppShareUrl } from "../lib/onboardingUrl";
import { downloadOnboardingQrPdf } from "../lib/qrPdf";
import { createQrDataUrl } from "../lib/qr";

export function OwnerOnboardingQrScreen() {
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const { ownerProfile, ensureOwnerProfile } = useAppContext();
  const { showToast } = useToast();
  const [owner, setOwner] = useState(ownerProfile);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onboardingUrl = useMemo(
    () => buildOnboardingUrl(owner?.onboarding_token),
    [owner?.onboarding_token]
  );

  useEffect(() => {
    let mounted = true;

    async function loadOwnerQr() {
      setLoading(true);
      setErrorMessage("");
      try {
        const nextOwner = await ensureOwnerProfile();
        const nextUrl = buildOnboardingUrl(nextOwner?.onboarding_token);
        const nextQr = await createQrDataUrl(nextUrl);
        if (mounted) {
          setOwner(nextOwner);
          setQrDataUrl(nextQr);
        }
      } catch (error) {
        console.error("Load onboarding QR failed:", error);
        if (mounted) {
          setErrorMessage("Unable to prepare your QR right now. Please try again.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadOwnerQr();

    return () => {
      mounted = false;
    };
  }, []);

  const completeQrFlow = () => {
    if (owner?.onboarding_token) {
      window.localStorage.setItem(`owner-qr-seen:${owner.onboarding_token}`, "true");
    }
    window.localStorage.setItem("owner-qr-introduced", "true");
    navigate("/tenants", { replace: true });
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadOnboardingQrPdf(printableRef.current, owner?.owner_name);
      showToast("QR PDF downloaded");
    } catch (error) {
      console.error("QR PDF download failed:", error);
      showToast("Unable to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleWhatsApp = () => {
    window.open(buildWhatsAppShareUrl(onboardingUrl, owner?.owner_name), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="pb-28">
      <div className="top-app-bar">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15"
            aria-label="Go back"
          >
            <BackIcon className="h-5 w-5 text-white" />
          </button>
          <span className="top-app-bar-title">Tenant QR</span>
        </div>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
          Ready
        </span>
      </div>

      <div className="screen-pad space-y-4">
        <section className="panel overflow-hidden p-5 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl font-black text-brand">
            QR
          </div>
          <h1 className="text-2xl font-black leading-tight text-ink">
            Your Tenant Onboarding QR is Ready
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Print and paste this QR near your hostel entrance or reception for easy tenant onboarding.
          </p>
        </section>

        {loading ? (
          <div className="subtle-panel p-6 text-center">
            <div className="mx-auto mb-4 h-52 w-52 animate-pulse rounded-2xl bg-[#E3F6F4]" />
            <p className="font-semibold text-muted">Preparing your QR...</p>
          </div>
        ) : errorMessage ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {errorMessage}
          </div>
        ) : (
          <>
            <section className="subtle-panel p-5">
              <div ref={printableRef} className="bg-white p-6 text-center">
                <p className="text-sm font-bold uppercase tracking-[0.1em] text-brand">HostelPay</p>
                <h2 className="mt-2 text-2xl font-black text-ink">Scan to Join</h2>
                <p className="mt-1 text-sm text-muted">{owner?.owner_name}</p>
                <div className="mx-auto my-6 flex h-64 w-64 items-center justify-center rounded-2xl border border-line bg-white p-4">
                  <img src={qrDataUrl} alt="Tenant onboarding QR code" className="h-full w-full" />
                </div>
                <p className="break-all rounded-xl bg-[#F7FBFA] p-3 text-xs font-semibold text-ink">
                  {onboardingUrl}
                </p>
                <p className="mt-4 text-sm font-semibold text-ink">
                  Paste this QR in a visible close-proximity area where new tenants can easily scan it.
                </p>
              </div>
            </section>

            <div className="grid gap-3">
              <button type="button" className="primary-button w-full" onClick={handleDownload} disabled={downloading}>
                {downloading ? "Preparing PDF..." : "Download QR PDF"}
              </button>
              <button type="button" className="secondary-button w-full gap-2" onClick={handleWhatsApp}>
                <WhatsAppIcon className="h-5 w-5" />
                Send QR to My WhatsApp
              </button>
              <button type="button" className="secondary-button w-full" onClick={completeQrFlow}>
                Continue to tenants
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
