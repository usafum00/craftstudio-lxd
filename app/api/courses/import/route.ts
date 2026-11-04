import { NextRequest, NextResponse } from 'next/server';
import { getDb, getCourseById } from '@/lib/db';
import { Course, Lesson } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data.title) {
      return NextResponse.json({ error: 'Invalid course JSON: title missing' }, { status: 400 });
    }

    const db = getDb();
    const newCourseId = `course-imported-${Date.now()}`;
    const now = new Date().toISOString();

    const title = `${data.title} (Imported)`;
    const description = data.description || '';
    const type = data.type || 'course';
    const status = 'draft';
    const authorName = data.authorName || 'Mike Afurong';
    const authorAvatar = data.authorAvatar || 'MA';
    const coverImage = data.coverImage || null;
    const themeSettings = JSON.stringify(data.themeSettings || {});
    const publishSettings = JSON.stringify(data.publishSettings || {});

    const transaction = db.transaction(() => {
      // Insert course
      db.prepare(`
        INSERT INTO courses (id, title, description, type, status, author_name, author_avatar, cover_image, theme_settings, publish_settings, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newCourseId,
        title,
        description,
        type,
        status,
        authorName,
        authorAvatar,
        coverImage,
        themeSettings,
        publishSettings,
        now,
        now
      );

      // Insert lessons
      const insertLesson = db.prepare(`
        INSERT INTO lessons (id, course_id, title, type, sort_order, blocks, quiz_settings, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const [idx, lesson] of (data.lessons || []).entries()) {
        const lessonId = `lesson-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
        insertLesson.run(
          lessonId,
          newCourseId,
          lesson.title || `Lesson ${idx + 1}`,
          lesson.type || 'lesson',
          idx,
          JSON.stringify(lesson.blocks || []),
          JSON.stringify(lesson.quizSettings || {}),
          now,
          now
        );
      }
    });

    transaction();

    const createdCourse = getCourseById(newCourseId);
    return NextResponse.json({ course: createdCourse }, { status: 201 });
  } catch (error) {
    console.error('Failed to import course JSON:', error);
    return NextResponse.json(
      { error: 'Failed to import course JSON', details: String(error) },
      { status: 500 }
    );
  }
}
