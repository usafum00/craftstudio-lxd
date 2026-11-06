import React from 'react';

/**
 * CSS waist-fade feather mask matching Articulate Rise:
 * Softly blends the lower waist of half-body character cutouts
 * so they melt into backgrounds, stages, and cards without harsh edges.
 */
export const WAIST_FADE_MASK_STYLE: React.CSSProperties = {
  maskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)',
  WebkitMaskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)',
};

/**
 * Client-side AI background removal using @imgly/background-removal (ONNX/WASM)
 */
export async function removeBackgroundClient(
  imageSource: string | File | Blob,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  if (typeof window === 'undefined') {
    throw new Error('removeBackgroundClient must be called in a browser environment');
  }

  try {
    const { removeBackground } = await import('@imgly/background-removal');
    const resultBlob = await removeBackground(imageSource, {
      progress: (key, current, total) => {
        if (onProgress && total > 0) {
          onProgress(Math.round((current / total) * 100));
        }
      },
      output: {
        format: 'image/png',
        quality: 0.95,
      },
    });
    return resultBlob;
  } catch (error) {
    console.warn('imgly background removal failed or cancelled, falling back to server route', error);
    // Fallback to server background removal endpoint
    const formData = new FormData();
    if (typeof imageSource === 'string') {
      formData.append('imageUrl', imageSource);
    } else {
      formData.append('file', imageSource);
    }

    const res = await fetch('/api/characters/remove-bg', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Server background removal failed');
    }

    return await res.blob();
  }
}
