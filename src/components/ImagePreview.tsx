import { motion } from 'motion/react';
import type { ImageFile, ProcessingOptions } from '../types';
import { formatBytes } from '../utils/imageProcessor';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';

/* ------------------------------------------------------------------ */
/*  Interactive crop overlay                                          */
/* ------------------------------------------------------------------ */

type HandlePos =
  | 'nw' | 'n' | 'ne'
  | 'w' | 'e'
  | 'sw' | 's' | 'se';

interface CropOverlayProps {
  /** Image dimensions in CSS px on screen */
  imgW: number;
  imgH: number;
  /** Crop rect in *original image* px */
  cropX: number;
  cropY: number;
  cropW: number;
  cropH: number;
  /** Original image dimensions */
  naturalW: number;
  naturalH: number;
  onChange: (x: number, y: number, w: number, h: number) => void;
}

function CropOverlay({
  imgW, imgH,
  cropX, cropY, cropW, cropH,
  naturalW, naturalH,
  onChange,
}: CropOverlayProps) {
  const dragging = useRef<{
    type: 'move' | HandlePos;
    startMx: number;
    startMy: number;
    startRect: { x: number; y: number; w: number; h: number };
  } | null>(null);

  // Convert original-px → screen-px
  const scaleX = imgW / naturalW;
  const scaleY = imgH / naturalH;

  const screenRect = {
    x: cropX * scaleX,
    y: cropY * scaleY,
    w: cropW * scaleX,
    h: cropH * scaleY,
  };

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  const handlePointerDown = useCallback(
    (type: 'move' | HandlePos, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragging.current = {
        type,
        startMx: e.clientX,
        startMy: e.clientY,
        startRect: { x: cropX, y: cropY, w: cropW, h: cropH },
      };
    },
    [cropX, cropY, cropW, cropH],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      e.preventDefault();

      const dx = (e.clientX - dragging.current.startMx) / scaleX;
      const dy = (e.clientY - dragging.current.startMy) / scaleY;
      const s = dragging.current.startRect;
      const minSize = 10; // minimum crop size in original px

      let nx = s.x, ny = s.y, nw = s.w, nh = s.h;

      if (dragging.current.type === 'move') {
        nx = clamp(s.x + dx, 0, naturalW - s.w);
        ny = clamp(s.y + dy, 0, naturalH - s.h);
      } else {
        const t = dragging.current.type;

        // Horizontal
        if (t.includes('w')) {
          const newX = clamp(s.x + dx, 0, s.x + s.w - minSize);
          nw = s.w - (newX - s.x);
          nx = newX;
        } else if (t.includes('e')) {
          nw = clamp(s.w + dx, minSize, naturalW - s.x);
        }

        // Vertical
        if (t.startsWith('n')) {
          const newY = clamp(s.y + dy, 0, s.y + s.h - minSize);
          nh = s.h - (newY - s.y);
          ny = newY;
        } else if (t.startsWith('s')) {
          nh = clamp(s.h + dy, minSize, naturalH - s.y);
        }
      }

      onChange(Math.round(nx), Math.round(ny), Math.round(nw), Math.round(nh));
    },
    [scaleX, scaleY, naturalW, naturalH, onChange],
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = null;
  }, []);

  const handles: { pos: HandlePos; cursor: string; x: number; y: number }[] = [
    { pos: 'nw', cursor: 'nwse-resize', x: screenRect.x, y: screenRect.y },
    { pos: 'n', cursor: 'ns-resize', x: screenRect.x + screenRect.w / 2, y: screenRect.y },
    { pos: 'ne', cursor: 'nesw-resize', x: screenRect.x + screenRect.w, y: screenRect.y },
    { pos: 'w', cursor: 'ew-resize', x: screenRect.x, y: screenRect.y + screenRect.h / 2 },
    { pos: 'e', cursor: 'ew-resize', x: screenRect.x + screenRect.w, y: screenRect.y + screenRect.h / 2 },
    { pos: 'sw', cursor: 'nesw-resize', x: screenRect.x, y: screenRect.y + screenRect.h },
    { pos: 's', cursor: 'ns-resize', x: screenRect.x + screenRect.w / 2, y: screenRect.y + screenRect.h },
    { pos: 'se', cursor: 'nwse-resize', x: screenRect.x + screenRect.w, y: screenRect.y + screenRect.h },
  ];

  return (
    <div
      className="absolute inset-0"
      style={{ touchAction: 'none' }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Dark overlay outside crop */}
      <svg className="absolute inset-0 h-full w-full">
        <defs>
          <mask id="cropMask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={screenRect.x}
              y={screenRect.y}
              width={screenRect.w}
              height={screenRect.h}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(0,0,0,0.55)"
          mask="url(#cropMask)"
        />
      </svg>

      {/* Crop border */}
      <div
        className="absolute border-2 border-orange-400"
        style={{
          left: screenRect.x,
          top: screenRect.y,
          width: screenRect.w,
          height: screenRect.h,
        }}
      >
        {/* Rule-of-thirds grid */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 right-0 left-0 h-px bg-orange-400/20" />
          <div className="absolute top-2/3 right-0 left-0 h-px bg-orange-400/20" />
          <div className="absolute top-0 bottom-0 left-1/3 w-px bg-orange-400/20" />
          <div className="absolute top-0 bottom-0 left-2/3 w-px bg-orange-400/20" />
        </div>

        {/* Move handle (whole area) */}
        <div
          className="absolute inset-0 cursor-move"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => handlePointerDown('move', e)}
        />

        {/* Size label */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-black/70 px-2 py-0.5 font-mono text-[10px] text-orange-300 whitespace-nowrap backdrop-blur-sm">
          {Math.round(cropW)} × {Math.round(cropH)}
        </div>
      </div>

      {/* Resize handles */}
      {handles.map((h) => (
        <div
          key={h.pos}
          className="absolute z-10 flex items-center justify-center"
          style={{
            left: h.x - 22,
            top: h.y - 22,
            width: 44,
            height: 44,
            cursor: h.cursor,
            touchAction: 'none',
          }}
          onPointerDown={(e) => handlePointerDown(h.pos, e)}
        >
          <div className="h-3.5 w-3.5 rounded-sm border-2 border-orange-400 bg-white shadow-md" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Image Preview                                                     */
/* ------------------------------------------------------------------ */

interface ImagePreviewProps {
  image: ImageFile;
  options: ProcessingOptions;
  onCropChange?: (x: number, y: number, w: number, h: number) => void;
}

export default function ImagePreview({ image, options, onCropChange }: ImagePreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const panningRef = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  const updateSize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ w: rect.width, h: rect.height });
    }
  }, []);

  useEffect(() => {
    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [updateSize]);

  // Reset zoom and pan when image changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [image.id]);

  // Calculate effective output dimensions for the info bar
  let displayW = image.width;
  let displayH = image.height;

  if (options.crop.enabled) {
    displayW = options.crop.width;
    displayH = options.crop.height;
  }

  if (options.resize.enabled) {
    if (options.resize.maintainAspectRatio) {
      const ratio = Math.min(
        options.resize.width / displayW,
        options.resize.height / displayH,
      );
      displayW = Math.round(displayW * ratio);
      displayH = Math.round(displayH * ratio);
    } else {
      displayW = options.resize.width;
      displayH = options.resize.height;
    }
  }

  const swapDims = options.rotation === 90 || options.rotation === 270;
  if (swapDims) [displayW, displayH] = [displayH, displayW];

  // Fit image to fill the available canvas with comfortable padding
  const padding = 64;
  const availW = Math.max(containerSize.w - padding, 1);
  const availH = Math.max(containerSize.h - padding, 1);
  const fitScale =
    containerSize.w > 0
      ? Math.min(availW / image.width, availH / image.height)
      : 0.5;

  // The rendered size of the image on screen
  const renderedW = image.width * fitScale * zoom;
  const renderedH = image.height * fitScale * zoom;

  // Pan clamping — keep the image edge reachable but no further
  const maxPanX = Math.max(0, (renderedW - containerSize.w) / 2);
  const maxPanY = Math.max(0, (renderedH - containerSize.h) / 2);
  const clampedPan = {
    x: Math.max(-maxPanX, Math.min(maxPanX, pan.x)),
    y: Math.max(-maxPanY, Math.min(maxPanY, pan.y)),
  };

  const canPan = maxPanX > 0 || maxPanY > 0;

  const handleContainerPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      if (!canPan) return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      panningRef.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
      setIsDragging(true);
    },
    [pan, canPan],
  );

  const handleContainerPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!panningRef.current) return;
      const dx = e.clientX - panningRef.current.mx;
      const dy = e.clientY - panningRef.current.my;
      const newX = panningRef.current.px + dx;
      const newY = panningRef.current.py + dy;
      setPan({
        x: Math.max(-maxPanX, Math.min(maxPanX, newX)),
        y: Math.max(-maxPanY, Math.min(maxPanY, newY)),
      });
    },
    [maxPanX, maxPanY],
  );

  const handleContainerPointerUp = useCallback(() => {
    panningRef.current = null;
    setIsDragging(false);
  }, []);

  const rotation = options.rotation || 0;
  const scaleX = options.flipH ? -1 : 1;
  const scaleY = options.flipV ? -1 : 1;

  const handleCropChange = useCallback(
    (x: number, y: number, w: number, h: number) => {
      onCropChange?.(x, y, w, h);
    },
    [onCropChange],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Info bar */}
      <div className="flex flex-col gap-0.5 border-b border-white/[0.06] px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-xs font-medium text-stone-300 sm:text-sm">
            {image.name}
          </span>
          <span className="shrink-0 rounded-md bg-white/[0.05] px-2 py-0.5 font-mono text-[10px] text-stone-500">
            {image.width}×{image.height}
          </span>
          <span className="hidden font-mono text-[10px] text-stone-600 sm:inline">
            {formatBytes(image.size)}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-stone-500">
          <span className="font-mono text-[10px]">
            Out: {displayW}×{displayH} · {formatBytes(image.size)}
          </span>
        </div>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#0C0C0E]"
        onPointerDown={handleContainerPointerDown}
        onPointerMove={handleContainerPointerMove}
        onPointerUp={handleContainerPointerUp}
        onPointerCancel={handleContainerPointerUp}
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(249,115,22,0.02) 0%, transparent 70%)',
          cursor: isDragging ? 'grabbing' : canPan ? 'grab' : 'default',
          touchAction: canPan ? 'none' : 'auto',
        }}
      >
        {/* Checkerboard pattern for transparency */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(45deg, #fff 25%, transparent 25%),
              linear-gradient(-45deg, #fff 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #fff 75%),
              linear-gradient(-45deg, transparent 75%, #fff 75%)
            `,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          }}
        />

        {/* Image + crop wrapper - pan translation applied here */}
        <div
          style={{
            transform: `translate(${clampedPan.x}px, ${clampedPan.y}px)`,
            flexShrink: 0,
          }}
        >
        <motion.div
          key={image.id}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative"
          style={{
            width: renderedW,
            height: renderedH,
          }}
        >
          <img
            src={image.originalUrl}
            alt={image.name}
            className="block select-none shadow-2xl shadow-black/50"
            draggable={false}
            style={{
              width: renderedW,
              height: renderedH,
              transform: `rotate(${rotation}deg) scaleX(${scaleX}) scaleY(${scaleY})`,
              transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />

          {/* Interactive crop overlay */}
          {options.crop.enabled && onCropChange && (
            <CropOverlay
              imgW={renderedW}
              imgH={renderedH}
              cropX={options.crop.x}
              cropY={options.crop.y}
              cropW={options.crop.width}
              cropH={options.crop.height}
              naturalW={image.width}
              naturalH={image.height}
              onChange={handleCropChange}
            />
          )}
        </motion.div>
        </div>

        {/* Zoom controls */}
        <div
          className="absolute right-3 bottom-3 flex items-center gap-1 rounded-xl bg-black/70 p-1 backdrop-blur-sm"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setZoom((z) => Math.max(0.1, z - 0.25))}
            className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-white/[0.08] hover:text-white active:bg-white/[0.12]"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[3rem] text-center font-mono text-xs text-stone-400">
            {Math.round(fitScale * zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(5, z + 0.25))}
            className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-white/[0.08] hover:text-white active:bg-white/[0.12]"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-white/[0.08] hover:text-white active:bg-white/[0.12]"
            title="Fit to view"
          >
            <Maximize className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
