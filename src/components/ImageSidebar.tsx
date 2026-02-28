import { motion, AnimatePresence } from 'motion/react';
import { X, Check, FileImage } from 'lucide-react';
import type { ImageFile } from '../types';
import { formatBytes } from '../utils/imageProcessor';

interface ImageSidebarProps {
  images: ImageFile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleSelect: (id: string) => void;
}

export default function ImageSidebar({
  images,
  selectedId,
  onSelect,
  onRemove,
  onSelectAll,
  onDeselectAll,
  onToggleSelect,
}: ImageSidebarProps) {
  const selectedCount = images.filter((i) => i.selected).length;
  const allSelected = selectedCount === images.length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <span className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
          Images ({images.length})
        </span>
        <button
          onClick={allSelected ? onDeselectAll : onSelectAll}
          className="text-[11px] font-medium text-orange-400/70 transition-colors hover:text-orange-400"
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      {/* Batch info */}
      {selectedCount > 0 && (
        <div className="border-b border-white/[0.06] bg-orange-500/[0.04] px-4 py-2">
          <span className="text-[11px] font-medium text-orange-400/80">
            {selectedCount} selected for batch processing
          </span>
        </div>
      )}

      {/* Image list */}
      <div className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-2">
        <AnimatePresence mode="popLayout">
          {images.map((img, index) => (
            <motion.div
              key={img.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20, scale: 0.9 }}
              transition={{ delay: index * 0.03, duration: 0.25 }}
              onClick={() => onSelect(img.id)}
              className={`group relative flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-all duration-150 ${selectedId === img.id
                  ? 'bg-white/[0.08] ring-1 ring-orange-500/30'
                  : 'hover:bg-white/[0.04]'
                }`}
            >
              {/* Selection checkbox */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(img.id);
                }}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${img.selected
                    ? 'border-orange-500 bg-orange-500 text-white'
                    : 'border-white/[0.12] bg-white/[0.03] group-hover:border-white/[0.2]'
                  }`}
              >
                {img.selected && <Check className="h-3 w-3" strokeWidth={3} />}
              </button>

              {/* Thumbnail */}
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white/[0.04]">
                <img
                  src={img.originalUrl}
                  alt={img.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-stone-300">
                  {img.name}
                </p>
                <p className="mt-0.5 flex items-center gap-2 text-[11px] text-stone-600">
                  <FileImage className="h-3 w-3" />
                  {img.width}×{img.height} · {formatBytes(img.size)}
                </p>
              </div>

              {/* Remove */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(img.id);
                }}
                className="shrink-0 rounded-md p-1.5 text-stone-600 opacity-40 transition-all hover:bg-white/[0.06] hover:text-red-400 hover:opacity-100 active:bg-red-500/20 active:text-red-400 active:opacity-100 md:opacity-0 md:group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
