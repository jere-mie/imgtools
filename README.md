# imgtools

A free, browser-based image manipulation toolkit. Convert, compress, resize, crop, rotate, and batch-process images instantly — no uploads, no servers, 100% private.

**[Live Demo →](https://jere-mie.github.io/imgtools)**

## Features

- **Format conversion** — JPEG, PNG, WebP (with more input formats: GIF, SVG, AVIF, BMP, TIFF)
- **Quality / compression** — adjustable slider with smart per-format mapping
- **Resize** — custom dimensions with aspect ratio lock + quick presets (HD, FHD, 4K, 512, 256, etc.)
- **Crop** — interactive drag-to-crop overlay with corner/edge handles and rule-of-thirds grid
- **Rotate & flip** — 0°/90°/180°/270° rotation, horizontal/vertical flip
- **Batch processing** — load multiple images, select which to process, download individually or as a ZIP
- **Live output estimate** — see the estimated file size before downloading
- **100% client-side** — all processing happens in your browser via the Canvas API. Nothing is uploaded anywhere.

## Tech Stack

- [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Motion](https://motion.dev) (animations)
- [Lucide React](https://lucide.dev) (icons)
- [JSZip](https://stuk.github.io/jszip/) (batch ZIP downloads)

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build
```

## License

[MIT](LICENSE)
