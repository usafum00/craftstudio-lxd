import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { removeSolidBackground } from '@/lib/server-bg-removal';
import { ensurePersistentStorageDirs } from '@/lib/paths';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    ensurePersistentStorageDirs();
    const contentType = request.headers.get('content-type') || '';
    let buffer: Buffer;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      const body = await request.json();
      if (!body.imageUrl) {
        return NextResponse.json({ error: 'imageUrl or file required' }, { status: 400 });
      }

      if (body.imageUrl.startsWith('data:image/')) {
        const base64Data = body.imageUrl.split(',')[1];
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        const res = await fetch(body.imageUrl);
        const arrayBuffer = await res.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      }
    }

    const transparentBuffer = await removeSolidBackground(buffer, 36);

    const uploadsDir = path.join(process.cwd(), 'public/uploads/characters');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `cutout-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.png`;
    const targetPath = path.join(uploadsDir, filename);
    fs.writeFileSync(targetPath, transparentBuffer);

    const url = `/uploads/characters/${filename}`;
    return NextResponse.json({ url, success: true });
  } catch (error) {
    console.error('Failed to remove background:', error);
    return NextResponse.json({ error: 'Background removal failed' }, { status: 500 });
  }
}
