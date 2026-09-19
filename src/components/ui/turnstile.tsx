"use client";

import { useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: { sitekey: string; callback: (token: string) => void; "expired-callback"?: () => void }) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

/** Renders nothing if NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't set — forms work unprotected until a site key is configured. */
export function Turnstile({ onVerify }: { onVerify: (token: string | null) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const elementId = useId();

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    function render() {
      if (!containerRef.current || !window.turnstile) return;
      widgetId.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey!,
        callback: (token) => onVerify(token),
        "expired-callback": () => onVerify(null),
      });
    }

    if (window.turnstile) {
      render();
    } else {
      const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
      const script = existing ?? document.createElement("script");
      if (!existing) {
        script.setAttribute("src", SCRIPT_SRC);
        script.setAttribute("async", "true");
        document.head.appendChild(script);
      }
      script.addEventListener("load", render, { once: true });
    }

    return () => {
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (!siteKey) return null;

  return <div ref={containerRef} id={`turnstile-${elementId}`} />;
}
