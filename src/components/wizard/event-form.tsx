"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PRIVACY_OPTIONS, AGE_RESTRICTION_OPTIONS } from "@/lib/constants";
import { getBrowserTimezone, getTimezoneOptions } from "@/lib/timezone";
import type { EventPrivacy } from "@prisma/client";

export interface EventFormValues {
  name: string;
  description: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  isVirtual: boolean;
  locationName: string;
  locationAddress: string;
  virtualLink: string;
  capacity: string;
  privacy: EventPrivacy;
  coverImageUrl: string;
  themeColor: string;
  ticketPriceCents: string;
  donationLinkUrl: string;
  dressCode: string;
  ageRestriction: string;
  byobNotes: string;
  autoApproveRequests: boolean;
}

const EMPTY_VALUES: EventFormValues = {
  name: "",
  description: "",
  startsAt: "",
  endsAt: "",
  timezone: "",
  isVirtual: false,
  locationName: "",
  locationAddress: "",
  virtualLink: "",
  capacity: "",
  privacy: "LINK_ONLY",
  coverImageUrl: "",
  themeColor: "#ff2fb0",
  ticketPriceCents: "",
  donationLinkUrl: "",
  dressCode: "",
  ageRestriction: "",
  byobNotes: "",
  autoApproveRequests: false,
};

const STEPS = ["Basics", "Location & capacity", "Extras", "Review"] as const;

interface EventFormProps {
  mode: "create" | "edit";
  eventId?: string;
  initialValues?: Partial<EventFormValues>;
}

export function EventForm({ mode, eventId, initialValues }: EventFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<EventFormValues>({ ...EMPTY_VALUES, ...initialValues });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const timezoneOptions = useMemo(() => getTimezoneOptions(), []);

  function set<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  // Detected client-side only (and only once, when creating) so server- and
  // client-rendered HTML match on first paint — the organizer's timezone
  // isn't knowable during SSR.
  useEffect(() => {
    if (mode === "create" && !initialValues?.timezone) {
      set("timezone", getBrowserTimezone());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validateStep(): string | null {
    if (step === 0) {
      if (!values.name.trim()) return "Give your event a name";
      if (!values.startsAt) return "Pick a date and time";
      if (!values.timezone.trim()) return "Timezone is required";
    }
    if (step === 1) {
      if (!values.isVirtual && !values.locationName.trim()) return "Add a location, or mark this virtual";
      if (values.isVirtual && !values.virtualLink.trim()) return "Add a virtual link, or turn off virtual";
    }
    return null;
  }

  function next() {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);

    const payload = {
      name: values.name,
      description: values.description,
      startsAt: values.startsAt,
      endsAt: values.endsAt,
      timezone: values.timezone,
      isVirtual: values.isVirtual,
      locationName: values.locationName,
      locationAddress: values.locationAddress,
      virtualLink: values.virtualLink,
      capacity: values.capacity ? Number(values.capacity) : null,
      privacy: values.privacy,
      coverImageUrl: values.coverImageUrl,
      themeColor: values.themeColor,
      ticketPriceCents: values.ticketPriceCents ? Math.round(Number(values.ticketPriceCents) * 100) : null,
      donationLinkUrl: values.donationLinkUrl,
      dressCode: values.dressCode,
      ageRestriction: values.ageRestriction,
      byobNotes: values.byobNotes,
      autoApproveRequests: values.autoApproveRequests,
    };

    const url = mode === "create" ? "/api/events" : `/api/events/${eventId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    const data = await res.json();
    router.push(`/events/${data.event.id}`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {i + 1}
            </div>
            <span className={cn("hidden text-xs sm:inline", i === step ? "text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
          {step === 0 && <CardDescription>What&apos;s the event, and when?</CardDescription>}
          {step === 1 && <CardDescription>Where should guests show up?</CardDescription>}
          {step === 2 && <CardDescription>Optional details for your flyer and RSVP page.</CardDescription>}
          {step === 3 && <CardDescription>Review before you create the event.</CardDescription>}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {step === 0 && (
            <>
              <Field label="Event name">
                <Input value={values.name} onChange={(e) => set("name", e.target.value)} placeholder="Friday Night Karaoke" />
              </Field>
              <Field label="Description">
                <Textarea
                  value={values.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="What should guests know before they come?"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Starts at">
                  <Input
                    type="datetime-local"
                    value={values.startsAt}
                    onChange={(e) => set("startsAt", e.target.value)}
                  />
                </Field>
                <Field label="Ends at (optional)">
                  <Input type="datetime-local" value={values.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
                </Field>
              </div>
              <Field label="Timezone">
                <Select value={values.timezone} onValueChange={(v) => set("timezone", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezoneOptions.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Detected from your browser. All guests will see times in this timezone.
                </p>
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Virtual event</p>
                  <p className="text-xs text-muted-foreground">Toggle on for an online karaoke night</p>
                </div>
                <Switch checked={values.isVirtual} onCheckedChange={(v) => set("isVirtual", v)} />
              </div>

              {values.isVirtual ? (
                <Field label="Virtual link">
                  <Input
                    value={values.virtualLink}
                    onChange={(e) => set("virtualLink", e.target.value)}
                    placeholder="https://zoom.us/..."
                  />
                </Field>
              ) : (
                <>
                  <Field label="Venue / location name">
                    <Input
                      value={values.locationName}
                      onChange={(e) => set("locationName", e.target.value)}
                      placeholder="The Blue Note Bar"
                    />
                  </Field>
                  <Field label="Address (optional)">
                    <Input
                      value={values.locationAddress}
                      onChange={(e) => set("locationAddress", e.target.value)}
                      placeholder="123 Main St, City"
                    />
                  </Field>
                </>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Capacity (optional)">
                  <Input
                    type="number"
                    min={1}
                    value={values.capacity}
                    onChange={(e) => set("capacity", e.target.value)}
                    placeholder="No limit"
                  />
                </Field>
                <Field label="Privacy">
                  <Select value={values.privacy} onValueChange={(v) => set("privacy", v as EventPrivacy)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIVACY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Cover image URL (optional)">
                <Input
                  value={values.coverImageUrl}
                  onChange={(e) => set("coverImageUrl", e.target.value)}
                  placeholder="https://..."
                />
              </Field>
              <Field label="Theme color">
                <Input type="color" value={values.themeColor} onChange={(e) => set("themeColor", e.target.value)} className="h-11 w-20 p-1" />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Ticket price, $ (optional)">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={values.ticketPriceCents}
                    onChange={(e) => set("ticketPriceCents", e.target.value)}
                    placeholder="Free"
                  />
                </Field>
                <Field label="Donation link (optional)">
                  <Input
                    value={values.donationLinkUrl}
                    onChange={(e) => set("donationLinkUrl", e.target.value)}
                    placeholder="https://venmo.com/..."
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Dress code (optional)">
                  <Input value={values.dressCode} onChange={(e) => set("dressCode", e.target.value)} placeholder="Casual, come as you are" />
                </Field>
                <Field label="Age restriction">
                  <Select
                    value={values.ageRestriction || "none"}
                    onValueChange={(v) => set("ageRestriction", v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No restriction" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_RESTRICTION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.label} value={opt.value || "none"}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="BYOB / other notes (optional)">
                <Textarea value={values.byobNotes} onChange={(e) => set("byobNotes", e.target.value)} placeholder="BYOB, snacks provided, etc." />
              </Field>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Auto-approve song requests</p>
                  <p className="text-xs text-muted-foreground">Skip manual approval — requests join the queue immediately</p>
                </div>
                <Switch checked={values.autoApproveRequests} onCheckedChange={(v) => set("autoApproveRequests", v)} />
              </div>
            </>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-2 text-sm">
              <ReviewRow label="Name" value={values.name} />
              <ReviewRow
                label="Starts"
                value={values.startsAt ? `${new Date(values.startsAt).toLocaleString()} (${values.timezone})` : "—"}
              />
              <ReviewRow label="Where" value={values.isVirtual ? values.virtualLink || "Virtual" : values.locationName || "TBD"} />
              <ReviewRow label="Capacity" value={values.capacity || "No limit"} />
              <ReviewRow label="Privacy" value={PRIVACY_OPTIONS.find((p) => p.value === values.privacy)?.label ?? values.privacy} />
              <ReviewRow label="Ticket" value={values.ticketPriceCents ? `$${values.ticketPriceCents}` : "Free"} />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-between pt-2">
            <Button type="button" variant="outline" onClick={back} disabled={step === 0}>
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={next}>
                Continue
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={loading}>
                {loading ? "Saving..." : mode === "create" ? "Create event" : "Save changes"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/60 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
