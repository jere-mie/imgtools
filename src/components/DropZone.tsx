import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, ImagePlus, MousePointerClick } from 'lucide-react';

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  compact?: boolean;
}

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
  'image/avif',
  'image/ico',
  'image/x-icon',
];

const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.tiff,.tif,.avif,.ico';

export default function DropZone({ onFiles, compact = false }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files).filter(
        (f) => f.type.startsWith('image/') || ACCEPTED_TYPES.includes(f.type),
      );
      if (files.length > 0) onFiles(files);
    },
    [onFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) onFiles(files);
    e.target.value = '';
  };

  if (compact) {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          multiple
          className="hidden"
          onChange={handleChange}
        />
        <button
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`group flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-3 text-sm font-medium transition-all duration-200 ${
            isDragOver
              ? 'border-orange-400 bg-orange-500/10 text-orange-300'
              : 'border-white/[0.08] text-stone-500 hover:border-white/[0.15] hover:text-stone-400'
          }`}
        >
          <ImagePlus className="h-4 w-4" />
          Add or paste images
        </button>
      </>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        multiple
        className="hidden"
        onChange={handleChange}
      />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-1 items-center justify-center p-8"
      >
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className="relative w-full max-w-2xl cursor-pointer"
        >
          {/* Ambient glow */}
          <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 blur-xl" />

          <AnimatePresence mode="wait">
            <motion.div
              key={isDragOver ? 'active' : 'idle'}
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`relative flex flex-col items-center gap-6 rounded-2xl border-2 border-dashed p-12 transition-colors duration-300 sm:p-16 ${
                isDragOver
                  ? 'border-orange-400/60 bg-orange-500/[0.06]'
                  : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.03]'
              }`}
            >
              {/* Icon */}
              <motion.div
                animate={isDragOver ? { scale: 1.15, y: -5 } : { scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`flex h-20 w-20 items-center justify-center rounded-2xl ${
                  isDragOver
                    ? 'bg-orange-500/20 shadow-lg shadow-orange-500/10'
                    : 'bg-white/[0.05]'
                }`}
              >
                <Upload
                  className={`h-8 w-8 transition-colors ${
                    isDragOver ? 'text-orange-400' : 'text-stone-500'
                  }`}
                  strokeWidth={1.5}
                />
              </motion.div>

              {/* Text */}
              <div className="text-center">
                <h2 className="font-display text-2xl font-bold text-stone-200 sm:text-3xl">
                  {isDragOver ? 'Drop to upload' : 'Drop your images here'}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-stone-500 sm:text-base">
                  or{' '}
                  <span className="inline-flex items-center gap-1 text-orange-400/80">
                    <MousePointerClick className="h-3.5 w-3.5" /> click to browse
                  </span>
                  <span className="text-stone-600">, or paste from clipboard</span>
                </p>
              </div>

              {/* Format tags */}
              <div className="flex flex-wrap justify-center gap-2">
                {['JPG', 'PNG', 'WebP', 'GIF', 'SVG', 'AVIF', 'BMP', 'TIFF'].map(
                  (fmt, i) => (
                    <motion.span
                      key={fmt}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="rounded-md bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] font-medium tracking-wider text-stone-500"
                    >
                      {fmt}
                    </motion.span>
                  ),
                )}
              </div>

              {/* Hint */}
              <p className="text-xs text-stone-600">
                Batch processing supported - drop, browse, or paste multiple images
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
