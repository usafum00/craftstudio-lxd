import { NextRequest, NextResponse } from 'next/server';
import { getCourses, createCourse } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const filter = searchParams.get('filter') || undefined;
    const sort = searchParams.get('sort') || undefined;

    const courses = getCourses(search, filter, sort);
    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Failed to get courses:', error);
    return NextResponse.json({ error: 'Failed to retrieve courses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const course = createCourse(body);
    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error('Failed to create course:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
