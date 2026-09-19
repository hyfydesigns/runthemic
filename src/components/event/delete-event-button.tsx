"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteEventButton({ eventId, eventName }: { eventId: string; eventName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    const confirmed = window.confirm(
      `Delete "${eventName}"? This permanently removes the event, its RSVPs, and its song queue. This can't be undone.`,
    );
    if (!confirmed) return;

    setLoading(true);
    const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
    if (!res.ok) {
      setLoading(false);
      window.alert("Couldn't delete this event. Please try again.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
      {loading ? "Deleting..." : "Delete"}
    </Button>
  );
}
