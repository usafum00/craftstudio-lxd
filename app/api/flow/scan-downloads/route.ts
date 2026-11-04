import { NextResponse } from 'next/server';
import { scanDownloadsFolder } from '@/lib/flow-service';

export async function POST() {
  try {
    const result = scanDownloadsFolder();
    return NextResponse.json({
      success: true,
      importedCount: result.importedCount,
      assets: result.assets,
      message:
        result.importedCount > 0
          ? `Successfully imported ${result.importedCount} new asset(s) from Downloads.`
          : 'No new Flow assets found in Downloads folder.',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Scan failed', details: String(error) },
      { status: 500 }
    );
  }
}
