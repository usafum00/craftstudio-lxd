/**
 * Video & Web Embed URL Parser Utility
 * Converts YouTube, Vimeo, and web embed URLs into valid, sandboxed iframe embed URLs.
 */

export interface ParsedEmbed {
  type: 'youtube' | 'vimeo' | 'direct_video' | 'generic_iframe';
  embedUrl: string;
  originalUrl: string;
  videoId?: string;
  isEmbeddable: boolean;
}

export function parseEmbedUrl(inputUrl: string): ParsedEmbed {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return {
      type: 'generic_iframe',
      embedUrl: '',
      originalUrl: '',
      isEmbeddable: false,
    };
  }

  let clean = inputUrl.trim();

  // If user pasted full iframe snippet, e.g. <iframe src="https://..."></iframe>
  const iframeMatch = clean.match(/src=["']([^"']+)["']/i);
  if (iframeMatch && iframeMatch[1]) {
    clean = iframeMatch[1].trim();
  }

  // Check for Direct Video file extensions
  const directVideoRegex = /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i;
  if (directVideoRegex.test(clean) || clean.startsWith('/uploads/videos/')) {
    return {
      type: 'direct_video',
      embedUrl: clean,
      originalUrl: inputUrl,
      isEmbeddable: false,
    };
  }

  // 1. YouTube Variations:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/live/VIDEO_ID
  const ytWatchMatch = clean.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytWatchMatch && ytWatchMatch[1]) {
    const videoId = ytWatchMatch[1];
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`,
      originalUrl: inputUrl,
      videoId,
      isEmbeddable: true,
    };
  }

  // 2. Vimeo Variations:
  // - https://vimeo.com/123456789
  // - https://player.vimeo.com/video/123456789
  const vimeoMatch = clean.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`,
      originalUrl: inputUrl,
      videoId,
      isEmbeddable: true,
    };
  }

  // 3. Generic Embed / URL
  // Ensure https protocol
  let formattedUrl = clean;
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://') && !formattedUrl.startsWith('//')) {
    formattedUrl = `https://${formattedUrl}`;
  }

  return {
    type: 'generic_iframe',
    embedUrl: formattedUrl,
    originalUrl: inputUrl,
    isEmbeddable: true,
  };
}
