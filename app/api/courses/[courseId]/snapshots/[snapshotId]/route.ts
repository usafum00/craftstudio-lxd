import { NextRequest, NextResponse } from 'next/server';
import { restoreCourseSnapshot, deleteCourseSnapshot } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; snapshotId: string }> }
) {
  try {
    const { snapshotId } = await params;
    const restoredCourse = restoreCourseSnapshot(snapshotId);

    if (!restoredCourse) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
    }

    return NextResponse.json({ course: restoredCourse });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to restore snapshot', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; snapshotId: string }> }
) {
  try {
    const { snapshotId } = await params;
    const success = deleteCourseSnapshot(snapshotId);

    if (!success) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete snapshot', details: String(error) },
      { status: 500 }
    );
  }
}
