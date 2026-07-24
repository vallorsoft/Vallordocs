import {
  evaluateQuality,
  type QualityMetrics,
  type QualityResult,
} from '@/modules/documents/quality';

/**
 * On-device photo quality assessment (PRD 3./4. fejezet – Fotó
 * minőségellenőrzés: feltöltés előtt helyben). Measures what a browser canvas
 * can compute — resolution, average brightness and a cheap sharpness proxy —
 * then defers the accept/reject decision to the shared {@link evaluateQuality}
 * gate so the client and server judge identical metrics.
 */

/** Loads a `File` into an `HTMLImageElement` via an object URL. */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image_decode_failed'));
    };
    image.src = url;
  });
}

/**
 * Computes {@link QualityMetrics} from a captured image file. Brightness is the
 * mean luma over a downscaled sample; sharpness is the normalised mean absolute
 * luma gradient between neighbouring pixels — low on blurry/flat photos, higher
 * on crisp ones. Both run on a small canvas to stay fast on phones.
 */
export async function measureImageQuality(file: File): Promise<QualityMetrics> {
  const image = await loadImage(file);
  const widthPx = image.naturalWidth;
  const heightPx = image.naturalHeight;

  // Downscale to a small working buffer; quality signals are scale-invariant
  // enough and this keeps the per-pixel loop cheap.
  const maxSide = 256;
  const scale = Math.min(1, maxSide / Math.max(widthPx, heightPx || 1));
  const w = Math.max(1, Math.round(widthPx * scale));
  const h = Math.max(1, Math.round(heightPx * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    // Without a 2D context we can still judge resolution; assume mid values.
    return { widthPx, heightPx, sharpness: 1, brightness: 0.5 };
  }
  ctx.drawImage(image, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  // Per-pixel luma (Rec. 601), plus a horizontal gradient for sharpness.
  const luma = new Float32Array(w * h);
  let sum = 0;
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const value = 0.299 * r + 0.587 * g + 0.114 * b;
    luma[p] = value;
    sum += value;
  }
  const brightness = sum / (w * h) / 255;

  let gradientSum = 0;
  let gradientCount = 0;
  for (let y = 0; y < h; y += 1) {
    for (let x = 1; x < w; x += 1) {
      const idx = y * w + x;
      gradientSum += Math.abs((luma[idx] ?? 0) - (luma[idx - 1] ?? 0));
      gradientCount += 1;
    }
  }
  // Normalise: a mean gradient of ~25/255 already reads as sharp; clamp to 1.
  const meanGradient = gradientCount > 0 ? gradientSum / gradientCount : 0;
  const sharpness = Math.min(1, meanGradient / 25);

  return { widthPx, heightPx, sharpness, brightness };
}

/** Measures then evaluates a captured photo against the default thresholds. */
export async function assessPhoto(file: File): Promise<QualityResult> {
  const metrics = await measureImageQuality(file);
  return evaluateQuality(metrics);
}
