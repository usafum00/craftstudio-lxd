import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'rise.db');
const db = new Database(dbPath);

console.log('--- Starting Quiz Schema Normalization ---');

const lessons = db.prepare('SELECT id, course_id, title, type, blocks, quiz_settings FROM lessons').all() as Array<{
  id: string;
  course_id: string;
  title: string;
  type: string;
  blocks: string;
  quiz_settings: string;
}>;

let updatedLessonsCount = 0;

const updateStmt = db.prepare('UPDATE lessons SET blocks = ?, quiz_settings = ? WHERE id = ?');

for (const lesson of lessons) {
  let isModified = false;
  let parsedBlocks: any[] = [];
  try {
    parsedBlocks = lesson.blocks ? JSON.parse(lesson.blocks) : [];
  } catch (e) {
    console.error(`Failed to parse blocks for lesson ${lesson.id}`);
    continue;
  }

  if (lesson.type === 'quiz' || lesson.id.includes('quiz')) {
    // Standalone quiz questions normalization
    const normalizedQuestions = parsedBlocks.map((q: any, idx: number) => {
      const qId = q.id || `q-${lesson.id}-${idx + 1}`;
      const qType = q.type || q.subtype || 'multiple_choice';
      const prompt = q.prompt || q.title || `Question ${idx + 1}`;
      const points = typeof q.points === 'number' ? q.points : 10;
      
      let options: Array<{ id: string; text: string; isCorrect: boolean }> = [];
      if (Array.isArray(q.options)) {
        options = q.options.map((opt: any, optIdx: number) => {
          if (typeof opt === 'string') {
            return {
              id: `opt-${qId}-${optIdx + 1}`,
              text: opt,
              isCorrect: optIdx === 0,
            };
          }
          return {
            id: opt.id || `opt-${qId}-${optIdx + 1}`,
            text: opt.text || opt.label || `Choice ${optIdx + 1}`,
            isCorrect: Boolean(opt.isCorrect || opt.correct),
          };
        });
      }

      const feedback = {
        correct: q.feedback?.correct || q.feedbackCorrect || 'Correct! Well done.',
        incorrect: q.feedback?.incorrect || q.feedbackIncorrect || 'Incorrect, please review the learning materials.',
      };

      return {
        id: qId,
        category: 'knowledge_check',
        type: qType,
        variant: qType,
        title: prompt,
        prompt: prompt,
        points: points,
        options: options,
        sentence: q.sentence || '',
        acceptedAnswers: Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers : [],
        caseSensitive: Boolean(q.caseSensitive),
        matchingPairs: Array.isArray(q.matchingPairs) ? q.matchingPairs : [],
        feedback: feedback,
        feedbackCorrect: feedback.correct,
        feedbackIncorrect: feedback.incorrect,
      };
    });

    const newBlocksJson = JSON.stringify(normalizedQuestions);
    if (newBlocksJson !== lesson.blocks) {
      updateStmt.run(newBlocksJson, lesson.quiz_settings || '{}', lesson.id);
      updatedLessonsCount++;
      console.log(`Normalized quiz lesson: ${lesson.id} (${lesson.title}) with ${normalizedQuestions.length} questions`);
    }
  } else {
    // Normal lesson: check for knowledge_check blocks inside normal lessons
    const normalizedBlocks = parsedBlocks.map((blk: any, idx: number) => {
      if (blk.category === 'knowledge_check') {
        const c = blk.content || {};
        const qPrompt = c.question || c.prompt || c.title || 'Knowledge Check';
        let options = Array.isArray(c.options) ? c.options : [];
        options = options.map((opt: any, optIdx: number) => {
          if (typeof opt === 'string') {
            return { id: `opt-${blk.id}-${optIdx}`, text: opt, isCorrect: optIdx === 0 };
          }
          return {
            id: opt.id || `opt-${blk.id}-${optIdx}`,
            text: opt.text || opt.label || `Choice ${optIdx + 1}`,
            isCorrect: Boolean(opt.isCorrect || opt.correct),
          };
        });

        const feedback = {
          correct: c.feedback?.correct || c.correctFeedback || c.feedbackCorrect || 'Correct! Well done.',
          incorrect: c.feedback?.incorrect || c.incorrectFeedback || c.feedbackIncorrect || 'Incorrect, please review the learning materials.',
        };

        return {
          ...blk,
          content: {
            ...c,
            prompt: qPrompt,
            question: qPrompt,
            options,
            points: typeof c.points === 'number' ? c.points : 10,
            feedback,
            correctFeedback: feedback.correct,
            incorrectFeedback: feedback.incorrect,
          },
        };
      }
      return blk;
    });

    const newBlocksJson = JSON.stringify(normalizedBlocks);
    if (newBlocksJson !== lesson.blocks) {
      updateStmt.run(newBlocksJson, lesson.quiz_settings || '{}', lesson.id);
      updatedLessonsCount++;
      console.log(`Normalized blocks in lesson: ${lesson.id} (${lesson.title})`);
    }
  }
}

console.log(`--- Schema Normalization Finished! Total updated: ${updatedLessonsCount} ---`);
