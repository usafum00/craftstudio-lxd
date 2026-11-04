export type CourseType = 'course' | 'microlearning';
export type CourseStatus = 'draft' | 'published';
export type NavigationMode = 'free' | 'restricted';
export type CoverPageLayout = 'split' | 'overlay' | 'card' | 'minimal' | 'center';
export type CoverLayout = CoverPageLayout;
export type ThemePreset = 'rise' | 'apex' | 'horizon' | 'craft';
export type SidebarState = 'open' | 'closed' | 'disabled';
export type HeaderStyle = 'plain' | 'brand' | 'image' | 'overlay';
export type HeaderHeight = 'small' | 'medium' | 'large';

export interface ThemeSettings {
  preset?: ThemePreset;
  accentColor: string; // e.g. #ff5722
  coverLayout: CoverPageLayout;
  overlayOpacity?: number; // 0 - 100
  fontPairing: string;
  fontHeading: string;
  fontBody: string;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  // Navigation settings within theme
  sidebarState?: SidebarState;
  showPrevNextButtons?: boolean;
  showLessonNumbers?: boolean;
  // Lesson Headers
  headerStyle?: HeaderStyle;
  headerHeight?: HeaderHeight;
  // Blocks
  blockAnimations?: boolean;
  buttonStyle?: 'pill' | 'rounded';
}

export interface PublishSettings {
  navigationMode: NavigationMode;
  showLessonNumbers: boolean;
  allowSearch: boolean;
  completionCriteria: 'all_lessons' | 'quiz_pass' | 'percentage';
  passingScore: number;
  scormVersion: '1.2' | '2004_4th_edition';
  exportFormat?: 'web' | 'scorm12' | 'scorm2004';
  // Canonical LMS & Publishing Settings
  scormStandard?: 'scorm12' | 'scorm2004';
  trackingType?: 'completion' | 'quiz';
  completionPercentage?: number;
  selectedQuizId?: string;
  reportingStatus?: 'passed_incomplete' | 'passed_failed' | 'completed_incomplete' | 'completed_failed';
  includeExitLink?: boolean;
  showPrevNextButtons?: boolean;
  sidebarState?: SidebarState;
}

export type BlockCategory =
  | 'text'
  | 'statement'
  | 'quote'
  | 'list'
  | 'image'
  | 'gallery'
  | 'multimedia'
  | 'interactive'
  | 'knowledge_check'
  | 'survey'
  | 'chart'
  | 'divider'
  | 'code'
  | 'block_templates';

export interface BlockSettings {
  paddingTop?: 'small' | 'medium' | 'large' | number;
  paddingBottom?: 'small' | 'medium' | 'large' | number;
  backgroundColor?: 'white' | 'gray' | 'dark' | 'brand' | string;
  imageWidth?: '25' | '50' | '75';
  imagePosition?: 'left' | 'right';
  altText?: string;
  completionRequirement?: 'none' | 'block_above' | 'all_above';
  buttonText?: string;
  spacerHeight?: number;
  keepOpen?: boolean; // accordion: keep open or open one at a time
  [key: string]: unknown;
}

export interface Block {
  id: string;
  category: BlockCategory;
  subtype: string;
  content: Record<string, unknown>;
  settings?: BlockSettings;
}

export type LessonType = 'lesson' | 'quiz' | 'section';

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  type: LessonType;
  sortOrder: number;
  blocks: Block[];
  quizSettings?: QuizSettings;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  type: CourseType;
  status: CourseStatus;
  authorName: string;
  authorAvatar: string;
  coverImage?: string | null;
  themeSettings: ThemeSettings;
  publishSettings: PublishSettings;
  createdAt: string;
  updatedAt: string;
  isPublished?: boolean;
  lastPublishedAt?: string | null;
  hasUnpublishedChanges?: boolean;
  lessons?: Lesson[];
  lessonCount?: number;
}

// Block Templates
export interface BlockTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  blocks: Block[];
  createdAt: string;
}

// Standalone Quiz & Question Banks
export type QuestionType = 'multiple_choice' | 'multiple_response' | 'fill_in_blank' | 'matching';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  title: string;
  points: number;
  feedback?: {
    correct?: string;
    incorrect?: string;
  };
  // Multiple Choice / Multiple Response
  options?: Array<{ id: string; text: string; isCorrect: boolean }>;
  // Fill in the Blank
  sentence?: string; // e.g. "The sky is the color [blank] on a sunny day."
  acceptedAnswers?: string[];
  caseSensitive?: boolean;
  // Matching
  matchingPairs?: Array<{ id: string; left: string; right: string }>;
}

export interface QuizSettings {
  passingScore: number; // default 80
  retries: 'unlimited' | number; // 'unlimited' | 3 | 5
  requirePassingScore: boolean;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  revealAnswers: boolean;
  mode?: 'graded' | 'practice'; // Graded Assessment vs Ungraded Practice Mode
}

export interface QuestionBank {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface MediaAsset {
  id: string;
  url: string;
  filename: string;
  title?: string;
  tags?: string[];
  category?: string;
  isFavorite?: boolean;
  fileType: 'image' | 'video' | 'audio';
  source: 'upload' | 'flow' | 'dropzone' | 'library' | 'stock' | 'ai';
  fileSize?: number;
  width?: number;
  height?: number;
  prompt?: string;
  aspectRatio?: string;
  stylePreset?: string;
  model?: string;
  createdAt: string;
}

export interface StockSearchResult {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  source: 'openverse' | 'wikimedia' | 'pixabay' | 'unsplash';
  width?: number;
  height?: number;
  author?: string;
  license?: string;
}

export interface CourseSnapshot {
  id: string;
  courseId: string;
  name: string;
  data: Course & { lessons: Lesson[] };
  createdAt: string;
}

export type ReviewCommentCategory = 'comment' | 'suggestion' | 'correction' | 'praise';
export type ReviewCommentStatus = 'open' | 'resolved';

export interface ReviewComment {
  id: string;
  courseId: string;
  lessonId?: string | null;
  lessonTitle?: string | null;
  blockId?: string | null;
  authorName: string;
  content: string;
  category: ReviewCommentCategory;
  status: ReviewCommentStatus;
  createdAt: string;
  updatedAt: string;
}


