import type { CSSProperties } from 'react';
import type { CatalogImageCrop } from '../types';

export const DEFAULT_CATALOG_IMAGE_CROP: CatalogImageCrop = {
  x: 50,
  y: 50,
  zoom: 1,
};

export function normalizeCatalogImageCrop(
  crop?: Partial<CatalogImageCrop> | null
): CatalogImageCrop {
  return {
    x: clamp(crop?.x, 0, 100, DEFAULT_CATALOG_IMAGE_CROP.x),
    y: clamp(crop?.y, 0, 100, DEFAULT_CATALOG_IMAGE_CROP.y),
    zoom: clamp(crop?.zoom, 1, 2.5, DEFAULT_CATALOG_IMAGE_CROP.zoom),
  };
}

export function getCatalogImageCropStyle(crop?: Partial<CatalogImageCrop> | null): CSSProperties {
  const normalized = normalizeCatalogImageCrop(crop);
  return {
    objectPosition: `${normalized.x}% ${normalized.y}%`,
    transform: `scale(${normalized.zoom})`,
  };
}

function clamp(value: number | undefined, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}
