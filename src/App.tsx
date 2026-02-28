import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import JSZip from 'jszip';

import Header from './components/Header';
import DropZone from './components/DropZone';
import ImageSidebar from './components/ImageSidebar';
import ImagePreview from './components/ImagePreview';
import ToolPanel from './components/ToolPanel';

import {
  processImage,
  generateId,
  getImageDimensions,
} from './utils/imageProcessor';
import type { ImageFile, ProcessingOptions } from './types';
import { DEFAULT_OPTIONS } from './types';

export default function App() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [options, setOptions] = useState<ProcessingOptions>({ ...DEFAULT_OPTIONS });
  const [processing, setProcessing] = useState(false);

  const activeImage = images.find((i) => i.id === activeId) ?? null;
  const selectedImages = images.filter((i) => i.selected);
  const selectedCount = selectedImages.length;

  // ---- File handling ----
  const handleFiles = useCallback(
    async (files: File[]) => {
      const newImages: ImageFile[] = [];

      for (const file of files) {
        const url = URL.createObjectURL(file);
        try {
          const dims = await getImageDimensions(url);
          const id = generateId();
          newImages.push({
            id,
            file,
            name: file.name,
            originalUrl: url,
            width: dims.width,
            height: dims.height,
            size: file.size,
            type: file.type,
            selected: true,
          });
        } catch {
          URL.revokeObjectURL(url);
        }
      }

      if (newImages.length > 0) {
        setImages((prev) => [...prev, ...newImages]);
        if (!activeId) {
          setActiveId(newImages[0].id);
          setOptions((o) => ({
            ...o,
            resize: {
              ...o.resize,
              width: newImages[0].width,
              height: newImages[0].height,
            },
            crop: {
              ...o.crop,
              width: newImages[0].width,
              height: newImages[0].height,
            },
          }));
        }
      }
    },
    [activeId],
  );

  const handleSelect = useCallback(
    (id: string) => {
      setActiveId(id);
      const img = images.find((i) => i.id === id);
      if (img) {
        setOptions((o) => ({
          ...o,
          resize: { ...o.resize, width: img.width, height: img.height },
          crop: { ...o.crop, x: 0, y: 0, width: img.width, height: img.height },
        }));
      }
    },
    [images],
  );

  const handleRemove = useCallback(
    (id: string) => {
      setImages((prev) => {
        const newList = prev.filter((i) => i.id !== id);
        if (activeId === id) {
          setActiveId(newList.length > 0 ? newList[0].id : null);
        }
        return newList;
      });
    },
    [activeId],
  );

  const handleSelectAll = useCallback(() => {
    setImages((prev) => prev.map((i) => ({ ...i, selected: true })));
  }, []);

  const handleDeselectAll = useCallback(() => {
    setImages((prev) => prev.map((i) => ({ ...i, selected: false })));
  }, []);

  const handleToggleSelect = useCallback((id: string) => {
    setImages((prev) =>
      prev.map((i) => (i.id === id ? { ...i, selected: !i.selected } : i)),
    );
  }, []);

  const handleCropChange = useCallback(
    (x: number, y: number, w: number, h: number) => {
      setOptions((o) => ({
        ...o,
        crop: { ...o.crop, x, y, width: w, height: h },
      }));
    },
    [],
  );

  // ---- Processing ----
  const download = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleProcess = useCallback(async () => {
    setProcessing(true);
    try {
      const targets = selectedCount > 0 ? selectedImages : activeImage ? [activeImage] : [];

      if (targets.length === 1) {
        const result = await processImage(targets[0], options);
        download(result.blob, result.filename);
      } else if (targets.length > 1) {
        for (const img of targets) {
          const result = await processImage(img, options);
          download(result.blob, result.filename);
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    } catch (err) {
      console.error('Processing failed:', err);
    } finally {
      setProcessing(false);
    }
  }, [selectedCount, selectedImages, activeImage, options]);

  const handleDownloadZip = useCallback(async () => {
    setProcessing(true);
    try {
      const zip = new JSZip();
      const targets = selectedCount > 0 ? selectedImages : images;

      for (const img of targets) {
        const result = await processImage(img, options);
        zip.file(result.filename, result.blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      download(zipBlob, 'imgtools_batch.zip');
    } catch (err) {
      console.error('ZIP generation failed:', err);
    } finally {
      setProcessing(false);
    }
  }, [selectedCount, selectedImages, images, options]);

  // ---- View ----
  const hasImages = images.length > 0;

  return (
    <div className="flex h-screen flex-col bg-[#08080A] text-stone-200">
      <Header imageCount={images.length} />

      <main className="flex flex-1 overflow-hidden pt-14">
        <AnimatePresence mode="wait">
          {!hasImages ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 flex-col"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="pt-12 text-center sm:pt-16"
              >
                <h1 className="font-display text-4xl font-extrabold tracking-tight text-stone-100 sm:text-5xl lg:text-6xl">
                  Image manipulation,
                  <br />
                  <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                    right in your browser.
                  </span>
                </h1>
                <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-stone-500 sm:text-base">
                  Convert, compress, resize, crop, rotate - process single images or
                  entire batches. No uploads, no servers, 100% private.
                </p>
              </motion.div>

              <DropZone onFiles={handleFiles} />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex flex-wrap items-center justify-center gap-6 pb-8 text-[11px] text-stone-600"
              >
                {[
                  'Format conversion',
                  'Quality control',
                  'Batch processing',
                  'Resize & crop',
                  'Rotate & flip',
                  'ZIP export',
                ].map((feat) => (
                  <span key={feat} className="flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-orange-500/40" />
                    {feat}
                  </span>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 overflow-hidden"
            >
              <div className="w-64 shrink-0 border-r border-white/[0.06] bg-[#0A0A0C] xl:w-72">
                <ImageSidebar
                  images={images}
                  selectedId={activeId}
                  onSelect={handleSelect}
                  onRemove={handleRemove}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  onToggleSelect={handleToggleSelect}
                />
                <div className="border-t border-white/[0.06] p-3">
                  <DropZone onFiles={handleFiles} compact />
                </div>
              </div>

              <div className="flex flex-1 flex-col overflow-hidden">
                {activeImage ? (
                  <ImagePreview
                    image={activeImage}
                    options={options}
                    onCropChange={handleCropChange}
                  />
                ) : (
                  <div className="flex flex-1 items-center justify-center text-sm text-stone-600">
                    Select an image to preview
                  </div>
                )}
              </div>

              <div className="w-72 shrink-0 border-l border-white/[0.06] bg-[#0A0A0C] xl:w-80">
                <ToolPanel
                  options={options}
                  setOptions={setOptions}
                  selectedImage={activeImage}
                  selectedCount={selectedCount}
                  onProcess={handleProcess}
                  onDownloadAll={handleDownloadZip}
                  processing={processing}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
