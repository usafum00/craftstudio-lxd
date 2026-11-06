import sharp from 'sharp';

/**
 * Remove solid/near-white/near-border background from an image buffer using sharp
 * Samples corner pixels to detect the background color and applies smooth alpha thresholding.
 */
export async function removeSolidBackground(inputBuffer: Buffer, tolerance = 32): Promise<Buffer> {
  const image = sharp(inputBuffer).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Sample top-left, top-right, bottom-left, bottom-right corners
  const sampleCorners = [
    0, // Top-left
    (width - 1) * channels, // Top-right
    (height - 1) * width * channels, // Bottom-left
    ((height - 1) * width + (width - 1)) * channels, // Bottom-right
  ];

  let bgR = 255;
  let bgG = 255;
  let bgB = 255;

  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  for (const idx of sampleCorners) {
    rSum += data[idx];
    gSum += data[idx + 1];
    bSum += data[idx + 2];
    count++;
  }
  bgR = Math.round(rSum / count);
  bgG = Math.round(gSum / count);
  bgB = Math.round(bSum / count);

  // If corner is already transparent, default to near-white
  if (data[3] === 0) {
    bgR = 255;
    bgG = 255;
    bgB = 255;
  }

  const out = Buffer.from(data);

  // Euclidean color distance helper
  for (let i = 0; i < out.length; i += channels) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];

    const dist = Math.sqrt(
      Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
    );

    if (dist < tolerance) {
      out[i + 3] = 0; // Fully transparent
    } else if (dist < tolerance * 1.5) {
      // Soft antialiased feathered edge
      const featherRatio = (dist - tolerance) / (tolerance * 0.5);
      out[i + 3] = Math.round(255 * featherRatio);
    }
  }

  return sharp(out, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();
}
