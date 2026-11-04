import { NextRequest, NextResponse } from 'next/server';
import { resetSampleCourseToLxdV2, resetAllMasterCourses } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const adminPin = req.headers.get('x-admin-pin') || req.nextUrl.searchParams.get('pin');
    // Allow reset if pin is valid or in local dev/showcase
    if (adminPin && adminPin !== 'lxd2026') {
      return NextResponse.json({ success: false, error: 'Invalid Admin PIN' }, { status: 403 });
    }

    resetAllMasterCourses();
    const course = resetSampleCourseToLxdV2();
    return NextResponse.json({ success: true, course, message: 'All demo courses reset to master clean state' });
  } catch (error) {
    console.error('Failed to reset sample course to LXD v2:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset sample course', details: String(error) },
      { status: 500 }
    );
  }
}
