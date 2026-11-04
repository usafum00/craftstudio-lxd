import { NextRequest, NextResponse } from 'next/server';
import { getCourseSnapshots, createCourseSnapshot } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const snapshots = getCourseSnapshots(courseId);
    return NextResponse.json({ snapshots });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch snapshots', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const body = await request.json().catch(() => ({}));
    const name = body.name || `Checkpoint ${new Date().toLocaleDateString()}`;

    const snapshot = createCourseSnapshot(courseId, name);
    if (!snapshot) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ snapshot }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create snapshot', details: String(error) },
      { status: 500 }
    );
  }
}
