import { customAlphabet } from "nanoid";

// Lowercase alphanumeric, no ambiguous characters (0/O, 1/l/I) — reads well on a flyer or scanned from a QR code.
const nanoid = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 8);

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export function generateEventSlug(name: string): string {
  const base = slugify(name) || "karaoke-night";
  return `${base}-${nanoid()}`;
}
