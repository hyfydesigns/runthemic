"use client";

import { useRef, useState } from "react";
import { FlyerCanvas, type FlyerCanvasHandle } from "@/components/flyer/flyer-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FLYER_TEMPLATES } from "@/lib/constants";
import { FLYER_WIDTH, FLYER_HEIGHT } from "@/server/flyer/templates";
import { generateProceduralBackground } from "@/lib/flyer/generate-background";
import { resizeImageToDataUrl } from "@/lib/flyer/resize-image";
import { Download, Upload, Sparkles, RotateCcw } from "lucide-react";

interface FlyerEditorProps {
  eventId: string;
  eventName: string;
  startsAt: string; // ISO
  timezone: string;
  locationLabel: string;
  qrCodeUrl: string;
  initialTemplateKey: string;
  initialTitleOverride: string;
  initialSubtitleOverride: string;
  initialCustomBackgroundUrl: string;
}

export function FlyerEditor({
  eventId,
  eventName,
  startsAt,
  timezone,
  locationLabel,
  qrCodeUrl,
  initialTemplateKey,
  initialTitleOverride,
  initialSubtitleOverride,
  initialCustomBackgroundUrl,
}: FlyerEditorProps) {
  const [templateKey, setTemplateKey] = useState(initialTemplateKey);
  const [titleOverride, setTitleOverride] = useState(initialTitleOverride);
  const [subtitleOverride, setSubtitleOverride] = useState(initialSubtitleOverride);
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState(initialCustomBackgroundUrl);
  const [bgBusy, setBgBusy] = useState(false);
  const [bgError, setBgError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const canvasRef = useRef<FlyerCanvasHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function save(overrides?: { customBackgroundUrl?: string }) {
    setSaving(true);
    const bg = overrides?.customBackgroundUrl ?? customBackgroundUrl;
    await fetch(`/api/events/${eventId}/flyer`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateKey,
        fieldOverrides: { titleOverride, subtitleOverride, customBackgroundUrl: bg },
      }),
    });
    setSaving(false);
    setSavedAt(Date.now());
  }

  function generateBackground() {
    setBgError(null);
    const dataUrl = generateProceduralBackground(FLYER_WIDTH, FLYER_HEIGHT);
    if (!dataUrl) {
      setBgError("Couldn't generate a background — try again.");
      return;
    }
    setCustomBackgroundUrl(dataUrl);
    save({ customBackgroundUrl: dataUrl });
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setBgError("Please choose an image file.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setBgError("That image is too large — please choose one under 15MB.");
      return;
    }

    setBgError(null);
    setBgBusy(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file, FLYER_WIDTH, FLYER_HEIGHT * 1.2);
      setCustomBackgroundUrl(dataUrl);
      await save({ customBackgroundUrl: dataUrl });
    } catch {
      setBgError("Couldn't process that image — try a different file.");
    } finally {
      setBgBusy(false);
    }
  }

  function removeBackground() {
    setCustomBackgroundUrl("");
    save({ customBackgroundUrl: "" });
  }

  function exportPng() {
    const dataUrl = canvasRef.current?.exportPng();
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${eventName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-flyer.png`;
    a.click();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <Card className="flex items-center justify-center overflow-auto p-6">
        <FlyerCanvas
          ref={canvasRef}
          templateKey={templateKey}
          data={{
            name: eventName,
            startsAt: new Date(startsAt),
            timezone,
            locationLabel,
            qrCodeUrl,
            titleOverride,
            subtitleOverride,
            customBackgroundUrl: customBackgroundUrl || undefined,
          }}
        />
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Template</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {FLYER_TEMPLATES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTemplateKey(t.value)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-md border p-3 text-left text-sm transition-colors",
                  templateKey === t.value ? "border-primary bg-primary/10" : "border-border hover:bg-accent",
                )}
              >
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.accent }} />
                {t.label}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Background</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={generateBackground} disabled={bgBusy}>
                <Sparkles className="h-4 w-4" />
                Generate
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={bgBusy}
              >
                <Upload className="h-4 w-4" />
                {bgBusy ? "Uploading..." : "Upload"}
              </Button>
            </div>
            {customBackgroundUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={removeBackground} disabled={bgBusy}>
                <RotateCcw className="h-4 w-4" />
                Remove — use template background
              </Button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />
            {bgError && <p className="text-sm text-destructive">{bgError}</p>}
            <p className="text-xs text-muted-foreground">
              Generate an abstract background, or upload your own photo or artwork. Either way it replaces the
              template&apos;s default background for this event.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Text overrides</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Title (defaults to event name)</Label>
              <Input value={titleOverride} onChange={(e) => setTitleOverride(e.target.value)} placeholder={eventName} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Subtitle (defaults to date/time)</Label>
              <Input value={subtitleOverride} onChange={(e) => setSubtitleOverride(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button onClick={() => save()} disabled={saving} variant="outline" className="flex-1">
            {saving ? "Saving..." : savedAt ? "Saved" : "Save"}
          </Button>
          <Button onClick={exportPng} className="flex-1">
            <Download className="h-4 w-4" />
            Export PNG
          </Button>
        </div>
      </div>
    </div>
  );
}
