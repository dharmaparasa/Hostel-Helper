import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function downloadOnboardingQrPdf(element, ownerName) {
  if (!element) {
    throw new Error("Printable QR content is not ready.");
  }

  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imageWidth = pageWidth - 24;
  const imageHeight = (canvas.height * imageWidth) / canvas.width;
  const top = Math.max(10, (pageHeight - imageHeight) / 2);

  pdf.addImage(
    canvas.toDataURL("image/png"),
    "PNG",
    12,
    top,
    imageWidth,
    Math.min(imageHeight, pageHeight - 20)
  );

  const safeOwnerName = (ownerName || "tenant-onboarding")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  pdf.save(`${safeOwnerName || "tenant-onboarding"}-qr.pdf`);
}
