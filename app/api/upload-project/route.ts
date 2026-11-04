import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { getUploadsDir } from '@/lib/paths';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('rise_author_session')?.value;
    if (sessionCookie !== 'lxd_authenticated_2026') {
      return NextResponse.json({ error: 'Unauthorized: Author passcode required' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const customBlockId = formData.get('blockId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.zip')) {
      return NextResponse.json({ error: 'Only .zip files are supported for project packages' }, { status: 400 });
    }

    const blockId = customBlockId || `proj-${Date.now()}`;
    const targetDir = path.join(getUploadsDir(), 'projects', blockId);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract zip
    const zip = new AdmZip(buffer);
    zip.extractAllTo(targetDir, true);

    // Find index.html or first html file in extracted files
    const entries = zip.getEntries();
    let entryFile = 'index.html';

    const hasRootIndex = entries.some(
      (e) => !e.isDirectory && (e.entryName.toLowerCase() === 'index.html' || e.entryName.toLowerCase().endsWith('/index.html'))
    );

    if (hasRootIndex) {
      const match = entries.find(
        (e) => !e.isDirectory && (e.entryName.toLowerCase() === 'index.html' || e.entryName.toLowerCase().endsWith('/index.html'))
      );
      if (match) entryFile = match.entryName;
    } else {
      const firstHtml = entries.find((e) => !e.isDirectory && e.entryName.toLowerCase().endsWith('.html'));
      if (firstHtml) {
        entryFile = firstHtml.entryName;
      }
    }

    const publicUrl = `/uploads/projects/${blockId}/${entryFile}`;

    return NextResponse.json({
      success: true,
      blockId,
      url: publicUrl,
      fileName: file.name,
      entryFile,
      filesCount: entries.filter((e) => !e.isDirectory).length,
    });
  } catch (error) {
    console.error('Error extracting zip project:', error);
    return NextResponse.json(
      { error: 'Failed to extract project package: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
