import QRCode from "qrcode";

export async function generateQrCodePngDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    margin: 1,
    width: 512,
    color: { dark: "#0d0620", light: "#ffffff" },
  });
}

export async function generateQrCodePngBuffer(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    margin: 1,
    width: 512,
    color: { dark: "#0d0620", light: "#ffffff" },
  });
}

export function getEventPublicUrl(slug: string): string {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/e/${slug}`;
}
