"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

interface Member {
  id: string;
  role: string;
  user: { id: string; name: string | null; email: string | null };
}

const ROLE_LABELS: Record<string, string> = {
  COHOST_FULL: "Full access",
  COHOST_SONGS: "Manage songs",
  COHOST_RSVPS: "Manage RSVPs",
};

export function CoHostsPanel({ eventId }: { eventId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("COHOST_SONGS");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function refetch() {
    const res = await fetch(`/api/events/${eventId}/co-hosts`);
    if (res.ok) setMembers((await res.json()).members);
  }

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}/co-hosts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }
    setEmail("");
    refetch();
  }

  async function remove(memberId: string) {
    await fetch(`/api/events/${eventId}/co-hosts/${memberId}`, { method: "DELETE" });
    refetch();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invite a co-host</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={invite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label>Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cohost@example.com" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Inviting..." : "Invite"}
            </Button>
          </form>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          <p className="mt-2 text-xs text-muted-foreground">
            They&apos;ll need an existing RunTheMic account with this email.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {members.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No co-hosts yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{m.user.name ?? m.user.email}</p>
                    <p className="text-xs text-muted-foreground">{ROLE_LABELS[m.role] ?? m.role}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => remove(m.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
