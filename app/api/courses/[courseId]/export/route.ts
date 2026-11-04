import { NextRequest, NextResponse } from 'next/server';
import { getCourseById, updateCourse } from '@/lib/db';
import { buildScormZipArchive, ScormExportOptions } from '@/lib/scorm-generator';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const course = getCourseById(courseId);

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const options: ScormExportOptions = {
      format: body.format || 'scorm12',
      trackingMode: body.trackingMode || 'completion',
      completionPercentage: body.completionPercentage ?? 100,
      quizId: body.quizId || undefined,
      reportingStatus: body.reportingStatus || 'passed_incomplete',
      includeExitLink: Boolean(body.includeExitLink),
    };

    // Update course status to published
    try {
      updateCourse(courseId, { status: 'published' });
    } catch (e) {
      console.warn('Failed to update course status to published', e);
    }

    // Build offline zip archive
    const zipBuffer = await buildScormZipArchive(course, options);

    const safeTitle = (course.title || 'course')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const filename = `${safeTitle}-${options.format}.zip`;

    // Convert Buffer to Uint8Array for Next.js / Web Response
    const uint8Array = new Uint8Array(zipBuffer);

    return new Response(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': uint8Array.byteLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Export SCORM/Web package failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate package', details: String(error) },
      { status: 500 }
    );
  }
}
