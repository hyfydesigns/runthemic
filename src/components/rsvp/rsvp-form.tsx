"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Turnstile } from "@/components/ui/turnstile";
import { cn } from "@/lib/utils";

interface RsvpFormProps {
  eventId: string;
  eventSlug: string;
  initialValues?: { displayName: string; email: string; note: string; rsvpStatus: "GOING" | "MAYBE" | "CANT_GO" };
}

const STATUS_OPTIONS = [
  { value: "GOING", label: "Going" },
  { value: "MAYBE", label: "Maybe" },
  { value: "CANT_GO", label: "Can't go" },
] as const;

export function RsvpForm({ eventId, eventSlug, initialValues }: RsvpFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialValues?.displayName ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [note, setNote] = useState(initialValues?.note ?? "");
  const [status, setStatus] = useState<"GOING" | "MAYBE" | "CANT_GO">(initialValues?.rsvpStatus ?? "GOING");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/events/${eventId}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, email, note, rsvpStatus: status, turnstileToken }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }

    router.push(`/e/${eventSlug}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">Your name</Label>
        <Input id="displayName" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email (optional)</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="For a confirmation — never shared with anyone else"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Will you make it?</Label>
        <div className="grid grid-cols-3 gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={cn(
                "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                status === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Bringing a +1, dietary notes, etc." />
      </div>

      {!initialValues && <Turnstile onVerify={setTurnstileToken} />}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading} size="lg">
        {loading ? "Saving..." : "Confirm RSVP"}
      </Button>
    </form>
  );
}
