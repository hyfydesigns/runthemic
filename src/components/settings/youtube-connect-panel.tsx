"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function YoutubeConnectPanel({ connected, configured }: { connected: boolean; configured: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function disconnect() {
    setLoading(true);
    await fetch("/api/youtube/disconnect", { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  if (connected) {
    return (
      <Button variant="outline" onClick={disconnect} disabled={loading}>
        {loading ? "Disconnecting..." : "Disconnect YouTube"}
      </Button>
    );
  }

  return (
    <Button asChild disabled={!configured}>
      <a href="/api/youtube/connect">Connect YouTube</a>
    </Button>
  );
}
