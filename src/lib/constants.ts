export const PRIVACY_OPTIONS = [
  { value: "LINK_ONLY", label: "Link only", description: "Anyone with the link can view and RSVP" },
  { value: "PUBLIC", label: "Public", description: "Discoverable (discovery page coming later)" },
  { value: "PRIVATE", label: "Private", description: "Only reachable via the direct link" },
] as const;

export const AGE_RESTRICTION_OPTIONS = [
  { value: "", label: "No restriction" },
  { value: "all-ages", label: "All ages" },
  { value: "18+", label: "18+" },
  { value: "21+", label: "21+" },
] as const;

export const FLYER_TEMPLATES = [
  { value: "NEON", label: "Neon", accent: "#ff2fb0" },
  { value: "RETRO", label: "Retro", accent: "#ffb703" },
  { value: "MODERN_MINIMAL", label: "Modern minimal", accent: "#111827" },
  { value: "PARTY", label: "Party", accent: "#7c3aed" },
  { value: "ELEGANT", label: "Elegant", accent: "#c9a227" },
] as const;

export const RSVP_STATUS_LABELS: Record<string, string> = {
  GOING: "Going",
  MAYBE: "Maybe",
  CANT_GO: "Can't go",
  WAITLISTED: "Waitlisted",
};
