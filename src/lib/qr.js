import QRCode from "qrcode";

export async function createQrDataUrl(value) {
  if (!value) {
    return "";
  }

  return QRCode.toDataURL(value, {
    width: 360,
    margin: 2,
    color: {
      dark: "#15302b",
      light: "#ffffff"
    }
  });
}
