import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Image as ImageIcon,
  Maximize2,
  Crop,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Download,
  Loader2,
  Settings2,
  Sparkles,
  ArrowDownToLine,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import type { ImageFile, ProcessingOptions } from '../types';
import { estimateOutputSize, formatBytes } from '../utils/imageProcessor';

interface ToolPanelProps {
  options: ProcessingOptions;
  setOptions: (opts: ProcessingOptions) => void;
  selectedImage: ImageFile | null;
  selectedCount: number;
  onProcess: () => void;
  onDownloadAll: () => void;
  processing: boolean;
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-orange-400/60" />
      <span className="text-[11px] font-bold tracking-wider text-stone-500 uppercase">
        {title}
      </span>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-stone-400">{label}</span>
        <span className="font-mono text-xs text-stone-500">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider-input w-full"
      />
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min = 1,
  max = 99999,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-1">
      <span className="text-[11px] text-stone-500">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
        className="input-field w-full"
      />
    </div>
  );
}

export default function ToolPanel({
  options,
  setOptions,
  selectedImage,
  selectedCount,
  onProcess,
  onDownloadAll,
  processing,
}: ToolPanelProps) {
  // ---- Estimated output size ----
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);
  const estimateTimer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    // Debounce estimation so we don't re-encode on every slider tick
    if (estimateTimer.current) clearTimeout(estimateTimer.current);
    setEstimating(true);

    if (!selectedImage) {
      setEstimatedSize(null);
      setEstimating(false);
      return;
    }

    estimateTimer.current = setTimeout(() => {
      estimateOutputSize(selectedImage, options)
        .then((size) => {
          setEstimatedSize(size);
          setEstimating(false);
        })
        .catch(() => {
          setEstimatedSize(null);
          setEstimating(false);
        });
    }, 300);

    return () => {
      if (estimateTimer.current) clearTimeout(estimateTimer.current);
    };
  }, [selectedImage, options]);

  const update = <K extends keyof ProcessingOptions>(
    key: K,
    value: ProcessingOptions[K],
  ) => {
    setOptions({ ...options, [key]: value });
  };

  const updateResize = (patch: Partial<ProcessingOptions['resize']>) => {
    const newResize = { ...options.resize, ...patch };

    // Auto-calc other dimension if aspect ratio locked
    if (
      newResize.maintainAspectRatio &&
      selectedImage &&
      patch.width !== undefined
    ) {
      newResize.height = Math.round(
        (patch.width / selectedImage.width) * selectedImage.height,
      );
    }
    if (
      newResize.maintainAspectRatio &&
      selectedImage &&
      patch.height !== undefined
    ) {
      newResize.width = Math.round(
        (patch.height / selectedImage.height) * selectedImage.width,
      );
    }

    update('resize', newResize);
  };

  const updateCrop = (patch: Partial<ProcessingOptions['crop']>) => {
    update('crop', { ...options.crop, ...patch });
  };

  return (
    <motion.div
      initial={{ x: 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col"
    >
      <div className="border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-orange-400/60" />
          <span className="text-xs font-bold tracking-wider text-stone-400 uppercase">
            Operations
          </span>
        </div>
        {selectedCount > 1 && (
          <p className="mt-1 text-[11px] text-orange-400/60">
            Applied to {selectedCount} selected images
          </p>
        )}
      </div>

      {/* Scrollable tools */}
      <div className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto p-4">
        {/* FORMAT */}
        <section className="tool-section">
          <SectionHeader icon={ImageIcon} title="Format" />
          <div className="grid grid-cols-4 gap-1.5">
            {(['original', 'jpeg', 'png', 'webp'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => update('format', fmt)}
                className={`rounded-lg px-2 py-2 text-center font-mono text-[11px] font-medium transition-all ${
                  options.format === fmt
                    ? 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/40'
                    : 'bg-white/[0.03] text-stone-500 hover:bg-white/[0.06] hover:text-stone-400'
                }`}
              >
                {fmt === 'original' ? 'Orig' : fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        {/* QUALITY */}
        <section className="tool-section">
          <SectionHeader icon={Sparkles} title="Quality" />
          <Slider
            label="Compression"
            value={options.quality}
            min={1}
            max={100}
            unit="%"
            onChange={(v) => update('quality', v)}
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-stone-600">Smaller file</span>
            <span className="text-[10px] text-stone-600">Better quality</span>
          </div>
        </section>

        {/* RESIZE */}
        <section className="tool-section">
          <SectionHeader icon={Maximize2} title="Resize" />
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={options.resize.enabled}
              onChange={(e) => updateResize({ enabled: e.target.checked })}
              className="toggle-checkbox"
            />
            <span className="text-xs text-stone-400">Enable resize</span>
          </label>
          {options.resize.enabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-3 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <NumberInput
                  label="Width"
                  value={options.resize.width}
                  onChange={(v) => updateResize({ width: v })}
                />
                <NumberInput
                  label="Height"
                  value={options.resize.height}
                  onChange={(v) => updateResize({ height: v })}
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.resize.maintainAspectRatio}
                  onChange={(e) =>
                    updateResize({ maintainAspectRatio: e.target.checked })
                  }
                  className="toggle-checkbox"
                />
                <span className="text-[11px] text-stone-500">Lock aspect ratio</span>
              </label>
              {/* Quick presets */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'HD', w: 1280, h: 720 },
                  { label: 'FHD', w: 1920, h: 1080 },
                  { label: '4K', w: 3840, h: 2160 },
                  { label: '1024', w: 1024, h: 1024 },
                  { label: '512', w: 512, h: 512 },
                  { label: '256', w: 256, h: 256 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() =>
                      updateResize({
                        width: preset.w,
                        height: preset.h,
                      })
                    }
                    className="rounded-md bg-white/[0.04] px-2 py-1 font-mono text-[10px] text-stone-500 transition-colors hover:bg-white/[0.08] hover:text-stone-300"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </section>

        {/* CROP */}
        <section className="tool-section">
          <SectionHeader icon={Crop} title="Crop" />
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={options.crop.enabled}
              onChange={(e) => updateCrop({ enabled: e.target.checked })}
              className="toggle-checkbox"
            />
            <span className="text-xs text-stone-400">Enable crop</span>
          </label>
          {options.crop.enabled && selectedImage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-3 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <NumberInput
                  label="X (px)"
                  value={options.crop.x}
                  onChange={(v) => updateCrop({ x: v })}
                  min={0}
                  max={selectedImage.width - 1}
                />
                <NumberInput
                  label="Y (px)"
                  value={options.crop.y}
                  onChange={(v) => updateCrop({ y: v })}
                  min={0}
                  max={selectedImage.height - 1}
                />
                <NumberInput
                  label="Width"
                  value={options.crop.width}
                  onChange={(v) => updateCrop({ width: v })}
                  min={1}
                  max={selectedImage.width - options.crop.x}
                />
                <NumberInput
                  label="Height"
                  value={options.crop.height}
                  onChange={(v) => updateCrop({ height: v })}
                  min={1}
                  max={selectedImage.height - options.crop.y}
                />
              </div>
              {/* Ratio presets */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Free', fn: () => {} },
                  {
                    label: '1:1',
                    fn: () => {
                      const s = Math.min(selectedImage.width, selectedImage.height);
                      updateCrop({ x: 0, y: 0, width: s, height: s });
                    },
                  },
                  {
                    label: '4:3',
                    fn: () => {
                      const w = selectedImage.width;
                      const h = Math.round(w * (3 / 4));
                      updateCrop({
                        x: 0,
                        y: 0,
                        width: w,
                        height: Math.min(h, selectedImage.height),
                      });
                    },
                  },
                  {
                    label: '16:9',
                    fn: () => {
                      const w = selectedImage.width;
                      const h = Math.round(w * (9 / 16));
                      updateCrop({
                        x: 0,
                        y: 0,
                        width: w,
                        height: Math.min(h, selectedImage.height),
                      });
                    },
                  },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={p.fn}
                    className="rounded-md bg-white/[0.04] px-2 py-1 font-mono text-[10px] text-stone-500 transition-colors hover:bg-white/[0.08] hover:text-stone-300"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </section>

        {/* ROTATE */}
        <section className="tool-section">
          <SectionHeader icon={RotateCw} title="Rotate" />
          <div className="grid grid-cols-4 gap-1.5">
            {[0, 90, 180, 270].map((deg) => (
              <button
                key={deg}
                onClick={() => update('rotation', deg)}
                className={`rounded-lg py-2 text-center font-mono text-[11px] font-medium transition-all ${
                  options.rotation === deg
                    ? 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/40'
                    : 'bg-white/[0.03] text-stone-500 hover:bg-white/[0.06] hover:text-stone-400'
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </section>

        {/* FLIP */}
        <section className="tool-section">
          <SectionHeader icon={FlipHorizontal} title="Flip" />
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => update('flipH', !options.flipH)}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium transition-all ${
                options.flipH
                  ? 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/40'
                  : 'bg-white/[0.03] text-stone-500 hover:bg-white/[0.06] hover:text-stone-400'
              }`}
            >
              <FlipHorizontal className="h-3.5 w-3.5" /> Horizontal
            </button>
            <button
              onClick={() => update('flipV', !options.flipV)}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium transition-all ${
                options.flipV
                  ? 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/40'
                  : 'bg-white/[0.03] text-stone-500 hover:bg-white/[0.06] hover:text-stone-400'
              }`}
            >
              <FlipVertical className="h-3.5 w-3.5" /> Vertical
            </button>
          </div>
        </section>
      </div>

      {/* Estimated size + Action buttons */}
      <div className="space-y-2 border-t border-white/[0.06] p-4">
        {/* Output estimate */}
        {selectedImage && (
          <div className="mb-1 rounded-lg bg-white/[0.03] px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-stone-500">Original</span>
              <span className="font-mono text-[11px] text-stone-400">
                {formatBytes(selectedImage.size)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[11px] text-stone-500">Estimated output</span>
              {estimating ? (
                <span className="font-mono text-[11px] text-stone-600">calculating…</span>
              ) : estimatedSize !== null ? (
                <span className="flex items-center gap-1.5 font-mono text-[11px] font-medium">
                  {estimatedSize < selectedImage.size ? (
                    <TrendingDown className="h-3 w-3 text-emerald-400" />
                  ) : estimatedSize > selectedImage.size ? (
                    <TrendingUp className="h-3 w-3 text-amber-400" />
                  ) : (
                    <Minus className="h-3 w-3 text-stone-500" />
                  )}
                  <span
                    className={
                      estimatedSize < selectedImage.size
                        ? 'text-emerald-400'
                        : estimatedSize > selectedImage.size * 1.1
                          ? 'text-amber-400'
                          : 'text-stone-400'
                    }
                  >
                    {formatBytes(estimatedSize)}
                  </span>
                  <span className="text-stone-600">
                    ({estimatedSize < selectedImage.size ? '' : '+'}
                    {Math.round(
                      ((estimatedSize - selectedImage.size) / selectedImage.size) * 100,
                    )}
                    %)
                  </span>
                </span>
              ) : (
                <span className="font-mono text-[11px] text-stone-600">—</span>
              )}
            </div>
          </div>
        )}
        <button
          onClick={onProcess}
          disabled={processing || (selectedCount === 0 && !selectedImage)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:shadow-orange-500/30 disabled:opacity-40 disabled:shadow-none"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Process{selectedCount > 1 ? ` & Download ${selectedCount}` : ' & Download'}
            </>
          )}
        </button>
        {selectedCount > 1 && (
          <button
            onClick={onDownloadAll}
            disabled={processing}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-stone-400 transition-all hover:bg-white/[0.07] hover:text-stone-300 disabled:opacity-40"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            Download as ZIP
          </button>
        )}
      </div>
    </motion.div>
  );
}
