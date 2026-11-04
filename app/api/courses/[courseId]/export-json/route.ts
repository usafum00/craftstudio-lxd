import { NextRequest, NextResponse } from 'next/server';
import { getCourseById } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const course = getCourseById(courseId);

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const safeTitle = (course.title || 'course')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const filename = `${safeTitle}-backup.json`;

    const jsonString = JSON.stringify(course, null, 2);

    return new Response(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to export course JSON', details: String(error) },
      { status: 500 }
    );
  }
}
