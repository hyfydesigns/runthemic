"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function NotificationPrefsPanel({ initialEmailOnNewRsvp }: { initialEmailOnNewRsvp: boolean }) {
  const [emailOnNewRsvp, setEmailOnNewRsvp] = useState(initialEmailOnNewRsvp);
  const [saving, setSaving] = useState(false);

  async function toggle(value: boolean) {
    setEmailOnNewRsvp(value);
    setSaving(true);
    await fetch("/api/settings/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOnNewRsvp: value }),
    });
    setSaving(false);
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor="email-on-rsvp" className="flex flex-col gap-0.5">
        <span>Email me on new RSVPs</span>
        <span className="text-xs font-normal text-muted-foreground">
          Get an email whenever a guest RSVPs to one of your events.
        </span>
      </Label>
      <Switch id="email-on-rsvp" checked={emailOnNewRsvp} onCheckedChange={toggle} disabled={saving} />
    </div>
  );
}
