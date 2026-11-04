import { QuizQuestion, QuizSettings } from './types';

/**
 * Normalizes any block or quiz question payload into the canonical QuizQuestion schema.
 * Handles both the modern direct QuizQuestion format and legacy knowledge check block structures.
 */
export function normalizeQuizQuestion(b: unknown, idx: number): QuizQuestion {
  if (!b || typeof b !== 'object') {
    return {
      id: `q-${idx}`,
      type: 'multiple_choice',
      title: `Question ${idx + 1}`,
      points: 10,
      options: [],
    };
  }

  const raw = b as Record<string, unknown>;
  const content = (raw.content && typeof raw.content === 'object' ? raw.content : {}) as Record<string, unknown>;

  const isDirect = typeof raw.title === 'string' || Array.isArray(raw.options) || typeof raw.type === 'string';

  const id = typeof raw.id === 'string' ? raw.id : `q-${idx}`;
  const rawType = (isDirect ? raw.type : raw.subtype) || content.subtype || 'multiple_choice';
  const type = (
    rawType === 'multiple_select' ? 'multiple_response' : rawType
  ) as QuizQuestion['type'];

  const title = (
    (typeof raw.title === 'string' && raw.title.trim() ? raw.title : null) ||
    (typeof content.question === 'string' && content.question.trim() ? content.question : null) ||
    (typeof content.stem === 'string' && content.stem.trim() ? content.stem : null) ||
    `Question ${idx + 1}`
  );

  const points = typeof raw.points === 'number'
    ? raw.points
    : typeof content.points === 'number'
    ? content.points
    : 10;

  // Extract raw options from any source
  let rawOptions: unknown[] = [];
  if (Array.isArray(raw.options)) {
    rawOptions = raw.options;
  } else if (Array.isArray(content.options)) {
    rawOptions = content.options;
  } else if (Array.isArray(content.choices)) {
    rawOptions = content.choices;
  }

  const options: Array<{ id: string; text: string; isCorrect: boolean }> = rawOptions.map((opt, optIdx) => {
    if (typeof opt === 'string') {
      return {
        id: `opt-${id}-${optIdx}`,
        text: opt,
        isCorrect: optIdx === 0,
      };
    }
    const o = (opt && typeof opt === 'object' ? opt : {}) as Record<string, unknown>;
    const text = typeof o.text === 'string' ? o.text : typeof o.label === 'string' ? o.label : `Option ${optIdx + 1}`;
    const optId = typeof o.id === 'string' ? o.id : `opt-${id}-${optIdx}`;
    const isCorrect = Boolean(o.isCorrect || o.correct);
    return {
      id: optId,
      text,
      isCorrect,
    };
  });

  // Fill in the blank
  const sentence = typeof raw.sentence === 'string'
    ? raw.sentence
    : typeof content.sentence === 'string'
    ? content.sentence
    : '';

  let acceptedAnswers: string[] = [];
  if (Array.isArray(raw.acceptedAnswers)) {
    acceptedAnswers = raw.acceptedAnswers.map((s) => String(s).trim()).filter(Boolean);
  } else if (Array.isArray(content.acceptedAnswers)) {
    acceptedAnswers = content.acceptedAnswers.map((s) => String(s).trim()).filter(Boolean);
  }

  const caseSensitive = Boolean(raw.caseSensitive ?? content.caseSensitive ?? false);

  // Matching
  let matchingPairs: Array<{ id: string; left: string; right: string }> = [];
  if (Array.isArray(raw.matchingPairs)) {
    matchingPairs = (raw.matchingPairs as Array<Record<string, unknown>>).map((p, pIdx) => ({
      id: typeof p?.id === 'string' ? p.id : `m-${id}-${pIdx}`,
      left: typeof p?.left === 'string' ? p.left : '',
      right: typeof p?.right === 'string' ? p.right : '',
    }));
  } else if (Array.isArray(content.matchingPairs)) {
    matchingPairs = (content.matchingPairs as Array<Record<string, unknown>>).map((p, pIdx) => ({
      id: typeof p?.id === 'string' ? p.id : `m-${id}-${pIdx}`,
      left: typeof p?.left === 'string' ? p.left : '',
      right: typeof p?.right === 'string' ? p.right : '',
    }));
  }

  // Feedback
  let feedback = {
    correct: 'Correct! Excellent job.',
    incorrect: 'Incorrect, please review the learning material.',
  };
  if (raw.feedback && typeof raw.feedback === 'object') {
    const f = raw.feedback as Record<string, unknown>;
    feedback = {
      correct: typeof f.correct === 'string' ? f.correct : feedback.correct,
      incorrect: typeof f.incorrect === 'string' ? f.incorrect : feedback.incorrect,
    };
  } else if (content.feedback && typeof content.feedback === 'object') {
    const f = content.feedback as Record<string, unknown>;
    feedback = {
      correct: typeof f.correct === 'string' ? f.correct : feedback.correct,
      incorrect: typeof f.incorrect === 'string' ? f.incorrect : feedback.incorrect,
    };
  } else if (typeof content.explanation === 'string' && content.explanation.trim()) {
    feedback = {
      correct: content.explanation,
      incorrect: content.explanation,
    };
  }

  return {
    id,
    type,
    title,
    points,
    options,
    sentence,
    acceptedAnswers,
    caseSensitive,
    matchingPairs,
    feedback,
  };
}

/**
 * Normalizes an array of blocks/questions into canonical QuizQuestion[]
 */
export function normalizeQuizQuestions(blocks: unknown[]): QuizQuestion[] {
  if (!Array.isArray(blocks)) return [];
  return blocks.map((b, idx) => normalizeQuizQuestion(b, idx));
}

/**
 * Determines whether a question has been answered by the learner.
 */
export function isQuestionAnswered(q: QuizQuestion, answer: unknown): boolean {
  if (answer === undefined || answer === null) return false;

  if (q.type === 'multiple_response') {
    if (Array.isArray(answer)) {
      return answer.length > 0;
    }
    if (typeof answer === 'object') {
      const map = answer as Record<string, boolean>;
      return Object.values(map).some(Boolean);
    }
    return false;
  }

  if (q.type === 'fill_in_blank') {
    return typeof answer === 'string' && answer.trim().length > 0;
  }

  if (q.type === 'matching') {
    if (!q.matchingPairs || q.matchingPairs.length === 0) return true;
    const matches = (typeof answer === 'object' && answer !== null ? answer : {}) as Record<string, string>;
    // Learner must match all pairs
    return q.matchingPairs.every((pair) => typeof matches[pair.id] === 'string' && matches[pair.id].length > 0);
  }

  // multiple_choice
  return typeof answer === 'string' && answer.trim().length > 0;
}

/**
 * Calculates learner score across all questions in canonical assessment format.
 */
export function calculateQuizScore(
  questions: QuizQuestion[],
  answers: Record<string, unknown>,
  passingScore: number = 80
): { earned: number; total: number; percent: number; passed: boolean } {
  let earned = 0;
  let total = 0;

  for (const q of questions) {
    const qPoints = q.points || 10;
    total += qPoints;
    const ans = answers[q.id];

    if (!isQuestionAnswered(q, ans)) {
      continue; // Unanswered questions award zero points
    }

    if (q.type === 'multiple_choice') {
      const correctOpt = (q.options || []).find((o) => o.isCorrect);
      if (correctOpt) {
        if (ans === correctOpt.id || ans === correctOpt.text) {
          earned += qPoints;
        }
      }
    } else if (q.type === 'multiple_response') {
      const correctOptionIds = (q.options || []).filter((o) => o.isCorrect).map((o) => o.id);
      let selectedOptionIds: string[] = [];

      if (Array.isArray(ans)) {
        selectedOptionIds = ans as string[];
      } else if (typeof ans === 'object' && ans !== null) {
        const map = ans as Record<string, boolean>;
        selectedOptionIds = Object.keys(map).filter((k) => map[k]);
      }

      // Must select ALL correct options and ZERO incorrect options
      const hasAllCorrect =
        correctOptionIds.length > 0 &&
        correctOptionIds.length === selectedOptionIds.length &&
        correctOptionIds.every((id) => selectedOptionIds.includes(id));

      if (hasAllCorrect) {
        earned += qPoints;
      }
    } else if (q.type === 'fill_in_blank') {
      const text = ((ans as string) || '').trim();
      const matches = (q.acceptedAnswers || []).some((expected) =>
        q.caseSensitive ? text === expected.trim() : text.toLowerCase() === expected.trim().toLowerCase()
      );
      if (matches) {
        earned += qPoints;
      }
    } else if (q.type === 'matching') {
      const matchesMap = (typeof ans === 'object' && ans !== null ? ans : {}) as Record<string, string>;
      const isAllMatched =
        q.matchingPairs &&
        q.matchingPairs.length > 0 &&
        q.matchingPairs.every((pair) => matchesMap[pair.id] === pair.id || matchesMap[pair.id] === pair.right);
      if (isAllMatched) {
        earned += qPoints;
      }
    }
  }

  const percent = total > 0 ? Math.round((earned / total) * 100) : 0;
  const passed = percent >= passingScore;

  return { earned, total, percent, passed };
}
