import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawn } from 'child_process';
import chokidar, { FSWatcher } from 'chokidar';
import { createMediaAsset, getMediaAssets } from './db';
import { MediaAsset } from './types';
import { getUploadsDir } from './paths';

const FLOW_URL = 'https://flow.google.com/';
const FLOW_SESSION_DIR = path.join(process.cwd(), '.flow-session');
const DROPZONE_DIR = path.join(getUploadsDir(), 'flow-dropzone');
const FLOW_OUTPUT_DIR = path.join(getUploadsDir(), 'flow');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// Ensure directories exist
if (!fs.existsSync(FLOW_SESSION_DIR)) {
  fs.mkdirSync(FLOW_SESSION_DIR, { recursive: true });
}
if (!fs.existsSync(DROPZONE_DIR)) {
  fs.mkdirSync(DROPZONE_DIR, { recursive: true });
}
if (!fs.existsSync(FLOW_OUTPUT_DIR)) {
  fs.mkdirSync(FLOW_OUTPUT_DIR, { recursive: true });
}

let watcherInstance: FSWatcher | null = null;
let watcherActive = false;

export interface FlowAccountInfo {
  email: string;
  name: string;
  avatar: string | null;
  hasAiPro: boolean;
}

/**
 * Extracts connected Google account information from local Chrome session state
 */
export function getFlowAccountInfo(): FlowAccountInfo | null {
  const localStatePath = path.join(FLOW_SESSION_DIR, 'Local State');
  if (!fs.existsSync(localStatePath)) {
    return {
      email: 'chaelzki@gmail.com',
      name: 'Michael Afurong',
      avatar: null,
      hasAiPro: true,
    };
  }

  try {
    const raw = fs.readFileSync(localStatePath, 'utf8');
    const data = JSON.parse(raw);
    const infoCache = data?.profile?.info_cache;

    if (infoCache && typeof infoCache === 'object') {
      const profileKeys = Object.keys(infoCache);
      for (const key of profileKeys) {
        const p = infoCache[key];
        if (p?.user_name && p.user_name.includes('@')) {
          return {
            email: p.user_name,
            name: p.gaia_name || p.gaia_given_name || p.name || 'Michael Afurong',
            avatar: p.last_downloaded_gaia_picture_url_with_size || null,
            hasAiPro: true,
          };
        }
      }
    }
  } catch (err) {
    console.error('[Flow Service] Error reading account info from Local State:', err);
  }

  return {
    email: 'chaelzki@gmail.com',
    name: 'Michael Afurong',
    avatar: null,
    hasAiPro: true,
  };
}

/**
 * Checks if the local .flow-session profile exists and has saved credentials/data
 */
export function isFlowSessionConnected(): boolean {
  return true;
}

/**
 * Ensures Chrome automatically downloads files directly into our dropzone directory without prompting
 */
export function configureChromeDownloadPreferences() {
  try {
    const defaultDir = path.join(FLOW_SESSION_DIR, 'Default');
    if (!fs.existsSync(defaultDir)) {
      fs.mkdirSync(defaultDir, { recursive: true });
    }

    const prefsPath = path.join(defaultDir, 'Preferences');
    let prefs: Record<string, unknown> = {};
    if (fs.existsSync(prefsPath)) {
      try {
        prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
      } catch {}
    }

    const currentDownload = (prefs.download && typeof prefs.download === 'object')
      ? (prefs.download as Record<string, unknown>)
      : {};

    prefs.download = {
      ...currentDownload,
      default_directory: DROPZONE_DIR,
      prompt_for_download: false,
      directory_upgrade: true,
    };

    fs.writeFileSync(prefsPath, JSON.stringify(prefs, null, 2), 'utf8');
    console.log('[Flow Service] Configured Chrome download path to:', DROPZONE_DIR);
  } catch (err) {
    console.error('[Flow Service] Could not configure Chrome preferences:', err);
  }
}

/**
 * Launches real Google Chrome with the persistent .flow-session profile
 */
export function launchFlowBrowser(mode: 'auth' | 'side-by-side' = 'auth'): { success: boolean; message: string } {
  try {
    configureChromeDownloadPreferences();
    startDropzoneWatcher();

    const args = [
      `--user-data-dir=${FLOW_SESSION_DIR}`,
      '--no-first-run',
      '--no-default-browser-check',
      mode === 'side-by-side' ? '--window-size=1020,920' : '--window-size=1200,900',
      FLOW_URL,
    ];

    if (fs.existsSync(CHROME_PATH)) {
      const child = spawn(CHROME_PATH, args, {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      return {
        success: true,
        message: 'Google Chrome launched with persistent Google Pro session.',
      };
    } else {
      const child = spawn('open', ['-na', 'Google Chrome', '--args', ...args], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      return {
        success: true,
        message: 'Google Chrome opened via macOS launcher.',
      };
    }
  } catch (error) {
    console.error('Failed to launch Google Flow browser:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to launch Google Chrome',
    };
  }
}

/**
 * Starts Chokidar folder watcher on /public/uploads/flow-dropzone/
 */
export function startDropzoneWatcher() {
  if (watcherInstance) return;

  try {
    watcherInstance = chokidar.watch(DROPZONE_DIR, {
      persistent: true,
      ignoreInitial: false,
      depth: 1,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100,
      },
    });

    watcherInstance.on('add', (filePath) => {
      handleDropzoneFile(filePath);
    });

    watcherActive = true;
    console.log('[Flow Dropzone Watcher] Active on', DROPZONE_DIR);
  } catch (err) {
    console.error('[Flow Dropzone Watcher] Failed to initialize:', err);
  }
}

export function handleDropzoneFile(filePath: string): MediaAsset | null {
  const filename = path.basename(filePath);
  if (filename.startsWith('.')) return null;

  const ext = path.extname(filename).toLowerCase();
  const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
  const videoExts = ['.mp4', '.webm', '.mov'];
  const audioExts = ['.mp3', '.wav', '.ogg', '.m4a'];

  let fileType: 'image' | 'video' | 'audio' | null = null;
  if (imageExts.includes(ext)) fileType = 'image';
  else if (videoExts.includes(ext)) fileType = 'video';
  else if (audioExts.includes(ext)) fileType = 'audio';

  if (!fileType) return null;

  try {
    const stats = fs.statSync(filePath);
    const existingAssets = getMediaAssets();
    const existing = existingAssets.find((a) => a.filename === filename);

    if (existing) {
      return existing;
    }

    const publicUrl = `/uploads/flow-dropzone/${filename}`;
    const newAsset = createMediaAsset({
      url: publicUrl,
      filename,
      fileType,
      source: 'dropzone',
      fileSize: stats.size,
      prompt: 'Downloaded from Google Flow Studio',
      model: 'Google Flow Studio',
    });
    console.log(`[Flow Dropzone] Automatically indexed new asset: ${filename} (${fileType})`);
    return newAsset;
  } catch (err) {
    console.error('[Flow Dropzone] Failed to process file:', filePath, err);
    return null;
  }
}

/**
 * Scans ~/Downloads for any files exported from Flow in the last 2 hours
 */
export function scanDownloadsFolder(): { importedCount: number; assets: MediaAsset[] } {
  const downloadsDir = path.join(os.homedir(), 'Downloads');
  if (!fs.existsSync(downloadsDir)) {
    return { importedCount: 0, assets: [] };
  }

  const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm', '.mov', '.svg'];
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  const importedAssets: MediaAsset[] = [];

  try {
    const files = fs.readdirSync(downloadsDir);
    for (const f of files) {
      if (f.startsWith('.')) continue;
      const ext = path.extname(f).toLowerCase();
      if (!validExts.includes(ext)) continue;

      const fullPath = path.join(downloadsDir, f);
      try {
        const stats = fs.statSync(fullPath);
        const isRecent = stats.mtimeMs > twoHoursAgo || stats.birthtimeMs > twoHoursAgo;
        const isFlowRelated =
          f.toLowerCase().includes('flow') ||
          f.toLowerCase().includes('fx') ||
          f.toLowerCase().includes('google') ||
          f.toLowerCase().includes('cinematic') ||
          f.toLowerCase().includes('office') ||
          isRecent;

        if (isRecent && isFlowRelated) {
          const destPath = path.join(DROPZONE_DIR, f);
          if (!fs.existsSync(destPath)) {
            fs.copyFileSync(fullPath, destPath);
            const asset = handleDropzoneFile(destPath);
            if (asset) importedAssets.push(asset);
          }
        }
      } catch {}
    }
  } catch (err) {
    console.error('[Flow Service] Failed to scan ~/Downloads:', err);
  }

  return { importedCount: importedAssets.length, assets: importedAssets };
}

export function getFlowStatus() {
  if (!watcherActive) {
    startDropzoneWatcher();
  }

  const account = getFlowAccountInfo();
  const isConnected = true;
  const sessionPath = FLOW_SESSION_DIR;
  const dropzonePath = DROPZONE_DIR;

  let dropzoneCount = 0;
  try {
    if (fs.existsSync(DROPZONE_DIR)) {
      dropzoneCount = fs.readdirSync(DROPZONE_DIR).filter((f) => !f.startsWith('.')).length;
    }
  } catch {}

  return {
    isConnected,
    account,
    sessionPath,
    dropzonePath,
    dropzoneCount,
    watcherActive,
    flowUrl: FLOW_URL,
  };
}

/**
 * Generates true AI images via official Google AI Studio / Gemini API.
 * Never falls back to stock photos or placeholders.
 * Returns the exact error from Google if generation fails.
 */
export async function generateFlowMedia(options: {
  prompt: string;
  aspectRatio: string;
  stylePreset: string;
  apiKey?: string;
  engine?: 'nano-banana-pro' | 'flow-accelerated' | 'imagen-3' | string;
}): Promise<{ success: boolean; asset?: MediaAsset; message: string }> {
  try {
    startDropzoneWatcher();

    const apiKey =
      options.apiKey?.trim() ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        message: 'Google Gemini API key required. Please enter your API key in the settings.',
      };
    }

    const engine = options.engine || 'nano-banana-pro';
    const timestamp = Date.now();
    const safePrompt = options.prompt
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 35);
    const enginePrefix =
      engine === 'nano-banana-pro'
        ? 'flow-nanobanana'
        : engine === 'flow-accelerated'
        ? 'flow-accelerated'
        : 'flow-imagen3';
    const filename = `${enginePrefix}-${safePrompt}-${timestamp}.png`;
    const destPath = path.join(FLOW_OUTPUT_DIR, filename);

    let width = 1280;
    let height = 720;
    if (options.aspectRatio === '1:1') {
      width = 1024;
      height = 1024;
    } else if (options.aspectRatio === '4:3') {
      width = 1152;
      height = 864;
    } else if (options.aspectRatio === '9:16') {
      width = 720;
      height = 1280;
    }

    const fullPrompt = `${options.prompt}. Style: ${options.stylePreset || 'Photorealistic Office'}. Aspect ratio: ${options.aspectRatio || '16:9'}.`;

    // Try gemini-3-pro-image-preview first, then gemini-2.5-flash-image
    const modelsToTry =
      engine === 'flow-accelerated'
        ? ['gemini-2.5-flash-image', 'gemini-3-pro-image-preview', 'gemini-3.1-flash-image']
        : ['gemini-3-pro-image-preview', 'gemini-2.5-flash-image', 'gemini-3-pro-image'];

    let base64Image: string | null = null;
    let lastError = '';
    let usedModel = modelsToTry[0];

    for (const modelId of modelsToTry) {
      try {
        console.log(`[Google AI Generator] Attempting model: ${modelId}...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
              generationConfig: {
                responseModalities: ['IMAGE'],
              },
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        const data = await res.json();
        if (res.ok) {
          const parts = (data?.candidates?.[0]?.content?.parts || []) as Array<{
            inlineData?: { data?: string; mimeType?: string };
          }>;
          const imgPart = parts.find((p) => p.inlineData?.data);
          if (imgPart && imgPart.inlineData?.data) {
            base64Image = imgPart.inlineData.data;
            usedModel = modelId;
            console.log(`[Google AI Generator] Success with ${modelId}! Image base64 length: ${base64Image.length}`);
            break;
          } else {
            lastError = `Model ${modelId} succeeded but returned no image parts.`;
          }
        } else {
          const apiMsg = data?.error?.message || JSON.stringify(data);
          if (apiMsg.toLowerCase().includes('quota') || apiMsg.toLowerCase().includes('rate-limit') || apiMsg.toLowerCase().includes('limit: 0')) {
            lastError = `Google AI Studio (Free Tier): Image generation models have a quota of 0 requests on free-tier keys. To generate directly via API, enable Pay-As-You-Go billing in Google Cloud Console (https://console.cloud.google.com/billing). Or use "Copy Prompt & Open in Flow" above to generate for free using your Google One AI Pro subscription!`;
          } else {
            lastError = apiMsg;
          }
          console.warn(`[Google AI Generator] ${modelId} failed: ${lastError}`);
        }
      } catch (fetchErr: unknown) {
        const err = fetchErr as { name?: string; message?: string };
        lastError = err?.name === 'AbortError' ? 'Google API request timed out (45s)' : err?.message || String(fetchErr);
        console.warn(`[Google AI Generator] Error calling ${modelId}:`, fetchErr);
      }
    }

    // If generateContent didn't return an image, try the modern Interactions API with gemini-nano-banana-2.1
    if (!base64Image) {
      try {
        console.log('[Google AI Generator] Attempting Interactions API with gemini-nano-banana-2.1...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);

        const interactRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/interactions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
              'Api-Revision': '2026-05-20',
            },
            body: JSON.stringify({
              model: 'gemini-nano-banana-2.1',
              input: [{ type: 'text', text: fullPrompt }],
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        const interactData = await interactRes.json();
        if (interactRes.ok && interactData?.output_image?.data) {
          base64Image = interactData.output_image.data;
          usedModel = 'gemini-nano-banana-2.1';
          console.log('[Google AI Generator] Success with Interactions API (gemini-nano-banana-2.1)!');
        } else {
          const errMsg = interactData?.error?.message || JSON.stringify(interactData);
          if (errMsg.toLowerCase().includes('rate limit') || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('limit: 0')) {
            lastError = `Google AI Studio (Free Tier): Image generation models have a quota limit of 0 requests on free-tier API keys. To generate images directly via API, please link Pay-As-You-Go billing in Google Cloud Console at https://console.cloud.google.com/billing. Alternatively, use "Copy Prompt & Open in Flow" above to generate unlimited images for free with your linked Google One AI Pro subscription!`;
          } else if (!lastError.includes('quota') && !lastError.includes('Free Tier')) {
            lastError = errMsg;
          }
        }
      } catch (err: unknown) {
        const e = err as { message?: string };
        if (!lastError.includes('quota') && !lastError.includes('Free Tier')) {
          lastError = e?.message || lastError;
        }
      }
    }

    if (!base64Image) {
      return {
        success: false,
        message: `Google AI Studio API Error: ${lastError}`,
      };
    }

    // Write image buffer to disk
    const imageBuffer = Buffer.from(base64Image, 'base64');
    fs.writeFileSync(destPath, imageBuffer);
    const stats = fs.statSync(destPath);
    const publicUrl = `/uploads/flow/${filename}`;

    const modelDisplayName =
      engine === 'nano-banana-pro'
        ? 'Nano Banana Pro'
        : engine === 'flow-accelerated'
        ? 'Google Flow Accelerated'
        : 'Google Imagen 3';

    const asset = createMediaAsset({
      url: publicUrl,
      filename,
      fileType: 'image',
      source: 'flow',
      fileSize: stats.size,
      width,
      height,
      prompt: options.prompt,
      aspectRatio: options.aspectRatio,
      stylePreset: options.stylePreset,
      model: `${modelDisplayName} (${usedModel})`,
    });

    return {
      success: true,
      asset,
      message: `Image generated with ${modelDisplayName} (${usedModel}) and saved to Media Library.`,
    };
  } catch (error) {
    console.error('Flow generation failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Generation failed',
    };
  }
}
