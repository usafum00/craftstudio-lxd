import { BlockSettings } from './types';

/**
 * Determines whether a block's background (solid color or photo + overlay) is dark.
 * When dark, direct foreground text (headings, paragraphs, statements, quotes)
 * automatically renders in crisp white with high contrast, while inner interactive
 * cards (accordions, tabs, flashcards, knowledge checks, dialogue cards) remain
 * crisp opaque white.
 */
export function isBlockDark(settings?: BlockSettings): boolean {
  if (!settings) return false;
  const bg = settings.backgroundColor;
  
  if (bg === 'dark' || bg === 'black') return true;
  if (bg === 'theme') return true; // Brand accent is typically saturated/vibrant
  
  if (bg === 'image') {
    const overlayColor =
      (settings.bgOverlayColor as string) ||
      (settings.bgOverlay === 'light' ? 'white' : 'black');
    const opacity =
      typeof settings.bgOverlayOpacity === 'number' ? settings.bgOverlayOpacity : 40;
    
    // Black overlay at 25%+ opacity makes text on photos readable with white text
    if (overlayColor === 'black' && opacity >= 25) return true;
    if (overlayColor === 'theme' && opacity >= 40) return true;
    return false;
  }
  
  if (bg === 'custom' && typeof settings.customBgColor === 'string') {
    const hex = settings.customBgColor.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance < 0.5;
    }
  }
  
  return false;
}
