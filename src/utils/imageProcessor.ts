import type { ProcessingOptions, ImageFile } from '../types';

/**
 * Maps the user-facing quality slider (1–100) to an effective toBlob quality
 * value. The Canvas API at quality 1.0 produces near-lossless output that is
 * often *larger* than the original - especially for WebP. We cap the effective
 * range to values that are visually indistinguishable from the source.
 */
function effectiveQuality(
  sliderValue: number,
  mimeType: string,
): number | undefined {
  // PNG is always lossless - quality param is ignored by browsers
  if (mimeType === 'image/png') return undefined;

  const t = sliderValue / 100; // normalise to 0–1

  if (mimeType === 'image/webp') {
    // WebP: map 1–100% → 0.01–0.92  (0.92 is visually lossless)
    return 0.01 + t * 0.91;
  }

  // JPEG (and fallback): map 1–100% → 0.01–0.95
  return 0.01 + t * 0.94;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function getMimeType(format: string, originalType: string): string {
  switch (format) {
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return originalType || 'image/png';
  }
}

function getExtension(format: string, originalName: string): string {
  switch (format) {
    case 'jpeg':
      return 'jpg';
    case 'png':
      return 'png';
    case 'webp':
      return 'webp';
    default: {
      const ext = originalName.split('.').pop();
      return ext || 'png';
    }
  }
}

export async function processImage(
  imageFile: ImageFile,
  options: ProcessingOptions,
): Promise<{ blob: Blob; filename: string }> {
  const img = await loadImage(imageFile.originalUrl);

  // Start with the full image
  let sourceX = 0;
  let sourceY = 0;
  let sourceW = img.naturalWidth;
  let sourceH = img.naturalHeight;

  // Apply crop (coordinates are in pixels relative to original image)
  if (options.crop.enabled) {
    sourceX = Math.round(options.crop.x);
    sourceY = Math.round(options.crop.y);
    sourceW = Math.round(options.crop.width);
    sourceH = Math.round(options.crop.height);

    // Clamp to image bounds
    sourceX = Math.max(0, Math.min(sourceX, img.naturalWidth));
    sourceY = Math.max(0, Math.min(sourceY, img.naturalHeight));
    sourceW = Math.max(1, Math.min(sourceW, img.naturalWidth - sourceX));
    sourceH = Math.max(1, Math.min(sourceH, img.naturalHeight - sourceY));
  }

  // Calculate target dimensions
  let targetW = sourceW;
  let targetH = sourceH;

  if (options.resize.enabled) {
    if (options.resize.maintainAspectRatio) {
      const ratio = Math.min(
        options.resize.width / sourceW,
        options.resize.height / sourceH,
      );
      targetW = Math.round(sourceW * ratio);
      targetH = Math.round(sourceH * ratio);
    } else {
      targetW = options.resize.width;
      targetH = options.resize.height;
    }
  }

  // Handle rotation: swap canvas dimensions for 90/270
  const rotation = ((options.rotation % 360) + 360) % 360;
  const swapDimensions = rotation === 90 || rotation === 270;
  const canvasW = swapDimensions ? targetH : targetW;
  const canvasH = swapDimensions ? targetW : targetH;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d')!;

  // White background for JPEG (no alpha)
  const mimeType = getMimeType(options.format, imageFile.type);
  if (mimeType === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  // Apply transforms
  ctx.save();
  ctx.translate(canvasW / 2, canvasH / 2);

  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180);
  }
  if (options.flipH) ctx.scale(-1, 1);
  if (options.flipV) ctx.scale(1, -1);

  // Draw image centered
  ctx.drawImage(
    img,
    sourceX,
    sourceY,
    sourceW,
    sourceH,
    -targetW / 2,
    -targetH / 2,
    targetW,
    targetH,
  );

  ctx.restore();

  // Export with quality - use effective mapping to avoid bloated output
  const quality = effectiveQuality(options.quality, mimeType);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to create blob'));
      },
      mimeType,
      quality,
    );
  });

  // Build filename
  const baseName = imageFile.name.replace(/\.[^.]+$/, '');
  const ext = getExtension(options.format, imageFile.name);
  const filename = `${baseName}_processed.${ext}`;

  return { blob, filename };
}

export async function getImageDimensions(
  url: string,
): Promise<{ width: number; height: number }> {
  const img = await loadImage(url);
  return { width: img.naturalWidth, height: img.naturalHeight };
}

export function generatePreviewUrl(
  imageFile: ImageFile,
  options: ProcessingOptions,
): Promise<string> {
  return processImage(imageFile, options).then(({ blob }) =>
    URL.createObjectURL(blob),
  );
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export async function estimateOutputSize(
  imageFile: ImageFile,
  options: ProcessingOptions,
): Promise<number> {
  const { blob } = await processImage(imageFile, options);
  return blob.size;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
