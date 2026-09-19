"use client";

import { forwardRef, useImperativeHandle, useRef, useMemo, useState, useEffect } from "react";
import { Stage, Layer, Rect, Text, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import type Konva from "konva";
import { getFlyerTemplate } from "@/server/flyer/templates";
import { formatInEventTimezone } from "@/lib/timezone";

export interface FlyerCanvasHandle {
  exportPng: () => string | null;
}

/**
 * Greedy word-wrap simulation (matches how Konva/canvas text wraps) so we
 * can reserve the right amount of vertical space for the title *before*
 * rendering, instead of finding out after the fact that a long title
 * wrapped to two lines and ran into the subtitle below it.
 */
function estimateWrappedLineCount(text: string, fontSize: number, fontFamily: string, maxWidth: number): number {
  if (typeof document === "undefined") return 1;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return 1;

  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 1;

  const spaceWidth = ctx.measureText(" ").width;
  let lines = 1;
  let currentLineWidth = 0;
  for (const word of words) {
    const wordWidth = ctx.measureText(word).width;
    const additional = currentLineWidth === 0 ? wordWidth : spaceWidth + wordWidth;
    if (currentLineWidth + additional > maxWidth && currentLineWidth > 0) {
      lines += 1;
      currentLineWidth = wordWidth;
    } else {
      currentLineWidth += additional;
    }
  }
  return lines;
}

/** CSS `object-fit: cover`-equivalent placement: fills the target box, cropping overflow, no distortion. */
function coverFit(sourceWidth: number, sourceHeight: number, targetWidth: number, targetHeight: number) {
  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  return { x: (targetWidth - width) / 2, y: (targetHeight - height) / 2, width, height };
}

export interface FlyerCanvasData {
  name: string;
  startsAt: Date;
  timezone: string;
  locationLabel: string;
  qrCodeUrl: string;
  titleOverride?: string;
  subtitleOverride?: string;
  /** Data URL from an upload or the procedural generator — replaces the template's solid/gradient fill. */
  customBackgroundUrl?: string;
}

interface FlyerCanvasProps {
  templateKey: string;
  data: FlyerCanvasData;
  displayScale?: number;
}

export const FlyerCanvas = forwardRef<FlyerCanvasHandle, FlyerCanvasProps>(function FlyerCanvas(
  { templateKey, data, displayScale = 0.4 },
  ref,
) {
  const template = useMemo(() => getFlyerTemplate(templateKey), [templateKey]);
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [qrImage] = useImage(data.qrCodeUrl, "anonymous");
  const [customBgImage] = useImage(data.customBackgroundUrl ?? "", "anonymous");

  useImperativeHandle(ref, () => ({
    exportPng: () => stageRef.current?.toDataURL({ pixelRatio: 2 }) ?? null,
  }));

  // Shrinks to fit narrow (mobile) screens instead of overflowing them —
  // `displayScale` is the max/desktop size, never exceeded even on wide screens.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = containerWidth ? Math.min(displayScale, containerWidth / template.width) : displayScale;

  const title = data.titleOverride?.trim() || data.name;
  const subtitle =
    data.subtitleOverride?.trim() || formatInEventTimezone(data.startsAt, data.timezone, "EEEE, MMMM d · h:mm a zzz");

  // Reserve extra vertical space when the title wraps, so it never runs
  // into the subtitle below it. Capped at one extra line (max 2 total) —
  // anything longer is truncated with an ellipsis instead of pushing the
  // rest of the flyer further down toward (or past) the canvas edge.
  const titleAreaWidth = template.width - 120;
  const titleLineHeight = template.title.fontSize * 1.2;
  const titleLines = Math.min(2, estimateWrappedLineCount(title, template.title.fontSize, template.fontFamily, titleAreaWidth));
  const titleBoxHeight = titleLineHeight * titleLines;
  const titleShift = titleLineHeight * (titleLines - 1);

  const [bgFrom, bgTo] = template.background.colors;
  const gradientProps =
    template.background.type === "gradient"
      ? {
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: template.width, y: template.height },
          fillLinearGradientColorStops: [0, bgFrom ?? "#000000", 1, bgTo ?? bgFrom ?? "#000000"],
        }
      : { fill: bgFrom ?? "#000000" };

  return (
    <div ref={containerRef} style={{ width: "100%", maxWidth: template.width * displayScale }}>
      <div
        style={{
          width: template.width * scale,
          height: template.height * scale,
          overflow: "hidden",
          borderRadius: 12,
          border: "1px solid hsl(var(--border))",
          margin: "0 auto",
        }}
      >
        <Stage ref={stageRef} width={template.width} height={template.height} scaleX={scale} scaleY={scale}>
          <Layer>
            {customBgImage ? (
              <>
                <KonvaImage
                  image={customBgImage}
                  {...coverFit(customBgImage.width, customBgImage.height, template.width, template.height)}
                />
                {/* Scrim so title/date/location stay legible over an arbitrary photo or generated pattern. */}
                <Rect x={0} y={0} width={template.width} height={template.height} fill="#000000" opacity={0.4} />
              </>
            ) : (
              <Rect x={0} y={0} width={template.width} height={template.height} {...gradientProps} />
            )}

            <Text
              x={60}
              y={template.title.y}
              width={titleAreaWidth}
              height={titleBoxHeight}
              text={title}
              fontSize={template.title.fontSize}
              fontFamily={template.fontFamily}
              fontStyle="bold"
              fill={template.textColor}
              align="center"
              wrap="word"
              ellipsis
            />
            <Text
              x={60}
              y={template.subtitle.y + titleShift}
              width={template.width - 120}
              text={subtitle}
              fontSize={template.subtitle.fontSize}
              fontFamily={template.fontFamily}
              fill={template.accentColor}
              align="center"
            />
            <Text
              x={60}
              y={template.meta.y + titleShift}
              width={template.width - 120}
              text={data.locationLabel}
              fontSize={template.meta.fontSize}
              fontFamily={template.fontFamily}
              fill={template.textColor}
              align="center"
              opacity={0.85}
            />

            {template.showQr && qrImage && (
              <KonvaImage
                image={qrImage}
                x={template.width / 2 - 110}
                y={template.cta.y - 260 + titleShift}
                width={220}
                height={220}
              />
            )}

            <Text
              x={60}
              y={template.cta.y + titleShift}
              width={template.width - 120}
              text={template.cta.text}
              fontSize={template.cta.fontSize}
              fontFamily={template.fontFamily}
              fontStyle="bold"
              fill={template.accentColor}
              align="center"
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
});
