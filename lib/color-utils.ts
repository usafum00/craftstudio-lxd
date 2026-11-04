export function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function getContrastTextColor(hex: string): string {
  const lum = getLuminance(hex);
  return lum > 165 ? '#18181b' : '#ffffff';
}

export function getContrastSubtextColor(hex: string): string {
  const lum = getLuminance(hex);
  return lum > 165 ? '#52525b' : 'rgba(255, 255, 255, 0.82)';
}
