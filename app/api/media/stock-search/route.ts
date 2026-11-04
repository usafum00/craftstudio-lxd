import { NextRequest, NextResponse } from 'next/server';
import { StockSearchResult } from '@/lib/types';

// Curated high-resolution stock assets for instant zero-latency loading across common ID topics
const CURATED_ID_STOCKS: Record<string, StockSearchResult[]> = {
  'corporate office': [
    {
      id: 'curated-off-1',
      title: 'Modern Glass Corporate Headquarters & Collaboration Space',
      url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
      source: 'unsplash',
      width: 1600,
      height: 1067,
      author: 'Alesia Kazantceva',
      license: 'Free for commercial use',
    },
    {
      id: 'curated-off-2',
      title: 'Open Plan Creative Office with Sunlight & Ergonomic Desks',
      url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1600&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80',
      source: 'unsplash',
      width: 1600,
      height: 1067,
      author: 'Benjamin Child',
      license: 'Free for commercial use',
    },
    {
      id: 'curated-off-3',
      title: 'Corporate Meeting Boardroom with Panoramic Window',
      url: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1600&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80',
      source: 'unsplash',
      width: 1600,
      height: 1067,
      author: 'Nastuh Abootalebi',
      license: 'Free for commercial use',
    },
  ],
  'coaching & meeting': [
    {
      id: 'curated-coach-1',
      title: 'One-on-One Executive Coaching & Constructive Feedback Discussion',
      url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1600&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
      source: 'unsplash',
      width: 1600,
      height: 1067,
      author: 'Christina @ wocintechchat.com',
      license: 'Free for commercial use',
    },
    {
      id: 'curated-coach-2',
      title: 'Team Workshop & Strategy Alignment Around Whiteboard',
      url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
      source: 'unsplash',
      width: 1600,
      height: 1067,
      author: 'Annie Spratt',
      license: 'Free for commercial use',
    },
    {
      id: 'curated-coach-3',
      title: 'Collaborative Problem Solving & Peer Mentorship',
      url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1600&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80',
      source: 'unsplash',
      width: 1600,
      height: 1067,
      author: 'Christina @ wocintechchat.com',
      license: 'Free for commercial use',
    },
  ],
  cybersecurity: [
    {
      id: 'curated-sec-1',
      title: 'Security Operations Center (SOC) Digital Defense Wall',
      url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80',
      source: 'unsplash',
      width: 1600,
      height: 1067,
      author: 'Robynne Hu',
      license: 'Free for commercial use',
    },
    {
      id: 'curated-sec-2',
      title: 'Network Encryption & Threat Monitoring Visual',
      url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1600&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
      source: 'unsplash',
      width: 1600,
      height: 1067,
      author: 'FLY:D',
      license: 'Free for commercial use',
    },
  ],
  technology: [
    {
      id: 'curated-tech-1',
      title: 'Software Developer Working on Cloud Architecture & Code',
      url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1600&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
      source: 'unsplash',
      width: 1600,
      height: 1067,
      author: 'Clément Hélardot',
      license: 'Free for commercial use',
    },
    {
      id: 'curated-tech-2',
      title: 'Artificial Intelligence & Neural Network Data Streams',
      url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1600&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80',
      source: 'unsplash',
      width: 1600,
      height: 1067,
      author: 'DeepMind',
      license: 'Free for commercial use',
    },
  ],
  healthcare: [
    {
      id: 'curated-health-1',
      title: 'Clinical Team Reviewing Patient Health Diagnostics',
      url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1600&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
      source: 'unsplash',
      width: 1600,
      height: 1067,
      author: 'National Cancer Institute',
      license: 'Free for commercial use',
    },
  ],
  'customer service': [
    {
      id: 'curated-cs-1',
      title: 'Support Specialist Assisting Client with Active Listening',
      url: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&w=1600&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&w=600&q=80',
      source: 'unsplash',
      width: 1600,
      height: 1067,
      author: 'LinkedIn Sales Navigator',
      license: 'Free for commercial use',
    },
  ],
  'flat illustrations': [
    {
      id: 'curated-flat-1',
      title: 'Isometric Agile Sprint & Learning Workflow Vectors',
      url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1600&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80',
      source: 'unsplash',
      width: 1600,
      height: 1067,
      author: 'Austin Distel',
      license: 'Free for commercial use',
    },
  ],
  backgrounds: [
    {
      id: 'curated-bg-1',
      title: 'Subtle Geometric Teal & Neutral Minimal Gradient Texture',
      url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1600&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=80',
      source: 'unsplash',
      width: 1600,
      height: 1067,
      author: 'Eva Blue',
      license: 'Free for commercial use',
    },
    {
      id: 'curated-bg-2',
      title: 'Clean Architectural Concrete & Warm Sunlight Abstract',
      url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
      source: 'unsplash',
      width: 1600,
      height: 1067,
      author: 'Sean Pollock',
      license: 'Free for commercial use',
    },
  ],
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || 'corporate office').trim();
  const pixabayKey = searchParams.get('pixabayKey') || process.env.PIXABAY_API_KEY || '';
  const unsplashKey = searchParams.get('unsplashKey') || process.env.UNSPLASH_ACCESS_KEY || '';

  const results: StockSearchResult[] = [];
  const sourcesUsed: string[] = [];

  // Match curated list first if category query matches
  const normQ = q.toLowerCase();
  for (const [key, items] of Object.entries(CURATED_ID_STOCKS)) {
    if (normQ.includes(key) || key.includes(normQ)) {
      results.push(...items);
      if (!sourcesUsed.includes('curated')) sourcesUsed.push('curated');
    }
  }

  // 1. Query Wikimedia Commons API (Fast, Free, No API Key, Millions of Images)
  const wikimediaPromise = (async () => {
    try {
      const wmUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
        q
      )}&gsrnamespace=6&gsrlimit=24&prop=imageinfo&iiprop=url|dimensions|extmetadata&iiurlwidth=600&format=json&origin=*`;
      const res = await fetch(wmUrl, {
        headers: { 'User-Agent': 'LearnByCraftAuthoring/1.0 (contact@learnbycraft.com)' },
      });
      if (res.ok) {
        const data = await res.json();
        const pages = Object.values(data.query?.pages || {}) as Array<{
          title: string;
          imageinfo?: Array<{
            url: string;
            thumburl?: string;
            width?: number;
            height?: number;
            extmetadata?: Record<string, { value: string }>;
          }>;
        }>;

        const wmItems: StockSearchResult[] = [];
        for (const p of pages) {
          const info = p.imageinfo?.[0];
          if (info && info.url) {
            // Filter out svgs that may fail to render or huge audio/video files
            const isImage = /\.(jpg|jpeg|png|webp|svg)$/i.test(info.url);
            if (isImage) {
              const cleanTitle = p.title.replace(/^File:/, '').replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
              wmItems.push({
                id: `wm-${Math.random().toString(36).substring(2, 9)}`,
                title: cleanTitle,
                url: info.url,
                thumbnailUrl: info.thumburl || info.url,
                source: 'wikimedia',
                width: info.width || 1200,
                height: info.height || 800,
                author: info.extmetadata?.Artist?.value || 'Wikimedia Commons Contributor',
                license: info.extmetadata?.LicenseShortName?.value || 'Creative Commons',
              });
            }
          }
        }
        return wmItems;
      }
    } catch (err) {
      console.warn('Wikimedia Commons search warning:', err);
    }
    return [];
  })();

  // 2. Query Openverse Public API with a fast 2.5s timeout
  const openversePromise = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    try {
      const ovUrl = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=20`;
      const res = await fetch(ovUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'LearnByCraftAuthoring/1.0 (contact@learnbycraft.com)' },
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        const ovResults = (data.results || []) as Array<{
          id: string;
          title: string;
          url: string;
          thumbnail?: string;
          width?: number;
          height?: number;
          creator?: string;
          license?: string;
        }>;

        return ovResults.map((item) => ({
          id: `ov-${item.id}`,
          title: item.title || 'Instructional Stock Graphic',
          url: item.url,
          thumbnailUrl: item.thumbnail || item.url,
          source: 'openverse' as const,
          width: item.width || 1200,
          height: item.height || 800,
          author: item.creator || 'Openverse CC',
          license: item.license || 'CC0 / Public Domain',
        }));
      }
    } catch {
      // Openverse timed out or 504 - fail gracefully without blocking Wikimedia
    } finally {
      clearTimeout(timeout);
    }
    return [];
  })();

  // 3. Optional Pixabay API (if key provided)
  const pixabayPromise = (async () => {
    if (!pixabayKey.trim()) return [];
    try {
      const pUrl = `https://pixabay.com/api/?key=${encodeURIComponent(
        pixabayKey.trim()
      )}&q=${encodeURIComponent(q)}&image_type=all&per_page=24&safesearch=true`;
      const res = await fetch(pUrl);
      if (res.ok) {
        const data = await res.json();
        return (data.hits || []).map((hit: {
          id: number;
          largeImageURL: string;
          webformatURL: string;
          imageWidth: number;
          imageHeight: number;
          user: string;
          tags: string;
        }) => ({
          id: `pixabay-${hit.id}`,
          title: hit.tags || 'Pixabay Stock',
          url: hit.largeImageURL,
          thumbnailUrl: hit.webformatURL,
          source: 'pixabay' as const,
          width: hit.imageWidth,
          height: hit.imageHeight,
          author: hit.user || 'Pixabay Artist',
          license: 'Pixabay Free License',
        }));
      }
    } catch (err) {
      console.warn('Pixabay error:', err);
    }
    return [];
  })();

  // 4. Optional Unsplash API (if access key provided)
  const unsplashPromise = (async () => {
    if (!unsplashKey.trim()) return [];
    try {
      const uUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        q
      )}&per_page=24&client_id=${encodeURIComponent(unsplashKey.trim())}`;
      const res = await fetch(uUrl);
      if (res.ok) {
        const data = await res.json();
        return (data.results || []).map((photo: {
          id: string;
          urls: { regular: string; small: string };
          alt_description?: string;
          width: number;
          height: number;
          user: { name: string };
        }) => ({
          id: `unsplash-${photo.id}`,
          title: photo.alt_description || 'Unsplash Photo',
          url: photo.urls.regular,
          thumbnailUrl: photo.urls.small,
          source: 'unsplash' as const,
          width: photo.width,
          height: photo.height,
          author: photo.user?.name || 'Unsplash Photographer',
          license: 'Unsplash Free License',
        }));
      }
    } catch (err) {
      console.warn('Unsplash error:', err);
    }
    return [];
  })();

  // Execute all sources in parallel
  const [wmResults, ovResults, pixResults, unsplashResults] = await Promise.all([
    wikimediaPromise,
    openversePromise,
    pixabayPromise,
    unsplashPromise,
  ]);

  if (wmResults.length > 0) {
    sourcesUsed.push('wikimedia');
    results.push(...wmResults);
  }
  if (ovResults.length > 0) {
    sourcesUsed.push('openverse');
    results.push(...ovResults);
  }
  if (pixResults.length > 0) {
    sourcesUsed.push('pixabay');
    results.push(...pixResults);
  }
  if (unsplashResults.length > 0) {
    sourcesUsed.push('unsplash');
    results.push(...unsplashResults);
  }

  // Deduplicate by URL
  const seenUrls = new Set<string>();
  const uniqueResults = results.filter((item) => {
    if (seenUrls.has(item.url)) return false;
    seenUrls.add(item.url);
    return true;
  });

  return NextResponse.json({
    results: uniqueResults,
    total: uniqueResults.length,
    sourcesUsed,
    query: q,
  });
}
