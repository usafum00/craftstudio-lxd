import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { createMediaAsset } from '@/lib/db';
import { getUploadsDir } from '@/lib/paths';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Allow 2 minutes for large uploads

export async function POST(req: NextRequest) {
  try {
    // Verify author session security
    const sessionCookie = req.cookies.get('rise_author_session')?.value;
    const isAuthed = sessionCookie === 'lxd_authenticated_2026';
    if (!isAuthed) {
      return NextResponse.json(
        { error: 'Unauthorized: Author passcode required to upload assets' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided in request' }, { status: 400 });
    }

    const uploadDir = getUploadsDir();
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Detect file category and subfolder
    const ext = path.extname(file.name) || '.bin';
    const cleanExt = ext.toLowerCase().replace(/[^a-z0-9.]/g, '');
    const mime = file.type || '';
    const isVideo = mime.startsWith('video') || ['.mp4', '.webm', '.mov', '.m4v', '.ogg', '.mkv', '.avi'].includes(cleanExt);
    const isAudio = mime.startsWith('audio') || ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'].includes(cleanExt);

    let targetDir = uploadDir;
    let urlPrefix = '/uploads';

    if (isVideo) {
      targetDir = path.join(uploadDir, 'videos');
      urlPrefix = '/uploads/videos';
    } else if (isAudio) {
      targetDir = path.join(uploadDir, 'audio');
      urlPrefix = '/uploads/audio';
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const prefix = isVideo ? 'video' : isAudio ? 'audio' : 'media';
    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${cleanExt}`;
    const filePath = path.join(targetDir, filename);

    // Stream writing to disk to handle small and large files (up to 1GB+) without high memory spikes
    let fileSize = file.size;
    try {
      if (typeof file.stream === 'function') {
        const nodeStream = Readable.fromWeb(file.stream() as import('stream/web').ReadableStream<Uint8Array>);
        const fileWriteStream = fs.createWriteStream(filePath);
        await pipeline(nodeStream, fileWriteStream);
        fileSize = fs.statSync(filePath).size;
      } else {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        fs.writeFileSync(filePath, buffer);
        fileSize = buffer.length;
      }
    } catch (writeErr) {
      console.warn('Stream write fallback to arrayBuffer:', writeErr);
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      fs.writeFileSync(filePath, buffer);
      fileSize = buffer.length;
    }

    const publicUrl = `${urlPrefix}/${filename}`;

    // Index into media library
    const fileType = isVideo ? 'video' : isAudio ? 'audio' : 'image';
    try {
      createMediaAsset({
        url: publicUrl,
        filename: file.name || filename,
        fileType,
        source: 'upload',
        fileSize,
      });
    } catch (e) {
      console.warn('Failed to index media asset in db:', e);
    }

    return NextResponse.json({
      url: publicUrl,
      filename: file.name || filename,
      fileSize,
      success: true,
    });
  } catch (error) {
    console.error('Failed to upload file:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload file';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
