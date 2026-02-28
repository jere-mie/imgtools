export interface ImageFile {
  id: string;
  file: File;
  name: string;
  originalUrl: string;
  processedUrl?: string;
  width: number;
  height: number;
  size: number;
  type: string;
  selected: boolean;
}

export interface ProcessingOptions {
  format: 'original' | 'jpeg' | 'png' | 'webp';
  quality: number;
  resize: {
    enabled: boolean;
    width: number;
    height: number;
    maintainAspectRatio: boolean;
  };
  crop: {
    enabled: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

export const DEFAULT_OPTIONS: ProcessingOptions = {
  format: 'original',
  quality: 85,
  resize: {
    enabled: false,
    width: 1920,
    height: 1080,
    maintainAspectRatio: true,
  },
  crop: {
    enabled: false,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  },
  rotation: 0,
  flipH: false,
  flipV: false,
};

export type AppView = 'upload' | 'workspace';
