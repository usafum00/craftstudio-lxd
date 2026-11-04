import { NextRequest, NextResponse } from 'next/server';
import { getCourseById, updateCourse, deleteCourse } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const course = getCourseById(courseId);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    return NextResponse.json({ course });
  } catch (error) {
    console.error('Failed to get course:', error);
    return NextResponse.json({ error: 'Failed to retrieve course' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const body = await req.json();
    const updated = updateCourse(courseId, body);
    if (!updated) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    return NextResponse.json({ course: updated });
  } catch (error) {
    console.error('Failed to update course:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;

    // Check if course is a protected master seed course
    const { isMasterCourse } = await import('@/lib/db');
    if (isMasterCourse(courseId)) {
      // Check admin authorization header or query param
      const adminPin = req.headers.get('x-admin-pin') || req.nextUrl.searchParams.get('pin');
      if (adminPin !== 'lxd2026') {
        return NextResponse.json(
          {
            error: 'Protected Master Course',
            message:
              'Master showcase courses are protected from public deletion. Duplicate this course to your sandbox to modify or delete freely, or unlock Admin Mode with your PIN.',
            isProtected: true,
          },
          { status: 403 }
        );
      }
    }

    const success = deleteCourse(courseId);
    if (!success) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete course:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
