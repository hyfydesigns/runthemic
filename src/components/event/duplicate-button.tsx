"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

export function DuplicateButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}/duplicate`, { method: "POST" });
    setLoading(false);
    if (!res.ok) return;
    const data = await res.json();
    router.push(`/events/${data.event.id}/edit`);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={loading}>
      <Copy className="h-4 w-4" />
      {loading ? "Duplicating..." : "Duplicate"}
    </Button>
  );
}
