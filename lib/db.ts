import Database from 'better-sqlite3';
import { getDbPath, ensurePersistentStorageDirs } from './paths';
import {
  Course,
  Lesson,
  ThemeSettings,
  PublishSettings,
  Block,
  QuizQuestion,
  QuestionBank,
  MediaAsset,
  CourseSnapshot,
  ReviewComment,
  ReviewCommentCategory,
  ReviewCommentStatus,
  CharacterItem,
  CharacterPose,
} from './types';

// Master seeded course IDs that are protected from deletion in public showcase mode
export const MASTER_SEEDED_COURSE_IDS = [
  'course-social-eng',
  'course-conflict',
  'course-ask-boss',
  'course-perf',
  'micro-spot-phish',
  'micro-better-naps',
  'course-articulate-ai',
];

export function isMasterCourse(courseId: string): boolean {
  return MASTER_SEEDED_COURSE_IDS.includes(courseId);
}

export function resetAllMasterCourses(): void {
  const db = getDb();
  // 1. Reset the primary showcase course to LXD v2 specification
  resetSampleCourseToLxdV2();

  // 2. Ensure all other seed courses exist; if not, re-seed
  for (const masterId of MASTER_SEEDED_COURSE_IDS) {
    const exists = db.prepare('SELECT id FROM courses WHERE id = ?').get(masterId);
    if (!exists) {
      seedDb(db);
      break;
    }
  }
}

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    ensurePersistentStorageDirs();
    const dbPath = getDbPath();
    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    initDb(dbInstance);
  }
  return dbInstance;
}

function initDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      type TEXT NOT NULL DEFAULT 'course',
      status TEXT NOT NULL DEFAULT 'draft',
      author_name TEXT NOT NULL DEFAULT 'Mike Afurong',
      author_avatar TEXT NOT NULL DEFAULT 'MA',
      cover_image TEXT,
      theme_settings TEXT NOT NULL,
      publish_settings TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'lesson',
      sort_order INTEGER NOT NULL DEFAULT 0,
      blocks TEXT NOT NULL DEFAULT '[]',
      quiz_settings TEXT DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS block_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT 'custom',
      blocks TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS question_banks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      questions TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS media_assets (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_type TEXT NOT NULL DEFAULT 'image',
      source TEXT NOT NULL DEFAULT 'upload',
      file_size INTEGER DEFAULT 0,
      width INTEGER DEFAULT 0,
      height INTEGER DEFAULT 0,
      prompt TEXT DEFAULT '',
      aspect_ratio TEXT DEFAULT '',
      style_preset TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS course_snapshots (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      name TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS review_comments (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      lesson_id TEXT,
      lesson_title TEXT,
      block_id TEXT,
      author_name TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'comment',
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workspace_credits (
      id TEXT PRIMARY KEY DEFAULT 'default',
      total_credits INTEGER NOT NULL DEFAULT 25000,
      used_credits INTEGER NOT NULL DEFAULT 0,
      plan_tier TEXT NOT NULL DEFAULT 'PRO_STUDIO',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS credit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      credits_cost INTEGER NOT NULL,
      model_used TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      gender TEXT NOT NULL,
      clothing TEXT NOT NULL,
      age_group TEXT NOT NULL,
      style TEXT NOT NULL DEFAULT 'illustrated',
      crop TEXT NOT NULL DEFAULT 'half_body',
      ethnicity TEXT,
      role TEXT,
      transparent_png_url TEXT NOT NULL,
      expressions TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_lessons_course_order ON lessons(course_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_snapshots_course ON course_snapshots(course_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_media_type_created ON media_assets(file_type, created_at);
    CREATE INDEX IF NOT EXISTS idx_review_comments_course ON review_comments(course_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_credit_logs_created ON credit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_characters_filters ON characters(clothing, gender, age_group, style);
  `);

  // Ensure default row in workspace_credits
  try {
    const credRow = db.prepare('SELECT id FROM workspace_credits WHERE id = ?').get('default');
    if (!credRow) {
      db.prepare(`
        INSERT INTO workspace_credits (id, total_credits, used_credits, plan_tier, updated_at)
        VALUES ('default', 25000, 0, 'PRO_STUDIO', ?)
      `).run(new Date().toISOString());
    }
  } catch (err) {
    console.warn('Workspace credits init note:', err);
  }

  // Safe migrations for newly added columns
  try {
    db.prepare("ALTER TABLE lessons ADD COLUMN quiz_settings TEXT DEFAULT '{}'").run();
  } catch {
    // column already exists
  }

  try {
    db.prepare("ALTER TABLE media_assets ADD COLUMN model TEXT DEFAULT ''").run();
  } catch {
    // column already exists
  }

  try {
    db.prepare("ALTER TABLE media_assets ADD COLUMN title TEXT DEFAULT ''").run();
  } catch {
    // column already exists
  }

  try {
    db.prepare("ALTER TABLE media_assets ADD COLUMN tags TEXT DEFAULT '[]'").run();
  } catch {
    // column already exists
  }

  try {
    db.prepare("ALTER TABLE media_assets ADD COLUMN category TEXT DEFAULT ''").run();
  } catch {
    // column already exists
  }

  try {
    db.prepare("ALTER TABLE media_assets ADD COLUMN is_favorite INTEGER DEFAULT 0").run();
  } catch {
    // column already exists
  }

  try {
    db.prepare("ALTER TABLE courses ADD COLUMN last_published_at TEXT").run();
  } catch {
    // column already exists
  }

  try {
    db.prepare("ALTER TABLE courses ADD COLUMN has_unpublished_changes INTEGER DEFAULT 0").run();
  } catch {
    // column already exists
  }

  // Automatic Migration: Scrub copyrighted Articulate sample names and apply CraftStudio original titles
  try {
    db.prepare(`
      UPDATE courses
      SET title = 'Cyber Defense: Outsmarting Modern Phishing & Vishing'
      WHERE id = 'course-social-eng' OR title LIKE '%Defending Against Social Engineering%'
    `).run();

    db.prepare(`
      UPDATE courses
      SET title = 'High-Stakes Conversations: Leading Through Team Friction'
      WHERE id = 'course-conflict' OR title LIKE '%Resolving Conflict With Coworkers%'
    `).run();

    db.prepare(`
      UPDATE courses
      SET title = 'The Deal Desk: Mastering B2B Pricing & Margin Defense',
          description = 'Master pricing discipline, defend software profit margins, and structure enterprise SaaS deal approval workflows.'
      WHERE id = 'course-articulate-ai' OR title LIKE '%Articulate%' OR title LIKE '%Get to Know Articulate%'
    `).run();

    db.prepare(`
      UPDATE courses
      SET title = 'Peak Cognitive Performance for Remote Teams',
          description = 'Science-backed strategies to optimize midday rest, recharge cognitive energy, and sustain high output.'
      WHERE id = 'micro-better-naps' OR title LIKE '%5 Tips for Better Naps%'
    `).run();

    db.prepare(`
      UPDATE courses
      SET title = 'Zero-Trust Security: 3-Minute Threat Drill',
          description = 'A fast, high-stakes microlearning simulation testing immediate threat triage and incident reporting.'
      WHERE id = 'micro-spot-phish' OR title LIKE '%Spot the Phish%'
    `).run();

    // Scrub any remaining mentions of Articulate Rise in lessons or descriptions
    db.prepare(`
      UPDATE courses
      SET description = REPLACE(REPLACE(description, 'Articulate 360', 'CraftStudio'), 'Articulate Rise', 'CraftStudio')
      WHERE description LIKE '%Articulate%'
    `).run();
  } catch (e) {
    console.warn('Title migration note:', e);
  }

  // Check if seeded
  const count = db.prepare('SELECT COUNT(*) as count FROM courses').get() as { count: number };
  if (count.count === 0) {
    seedDb(db);
  }

  const tmplCount = db.prepare('SELECT COUNT(*) as count FROM block_templates').get() as { count: number };
  if (tmplCount.count === 0) {
    seedTemplatesAndBanks(db);
  }

  // Check if media assets seeded
  const mediaCount = db.prepare('SELECT COUNT(*) as count FROM media_assets').get() as { count: number };
  if (mediaCount.count === 0) {
    seedMediaAssets(db);
  }

  // Check if characters seeded (ensure exactly our 8 clean flagship characters)
  try {
    const charCount = db.prepare('SELECT COUNT(*) as count FROM characters').get() as { count: number };
    const invalidChar = db.prepare("SELECT COUNT(*) as count FROM characters WHERE id NOT IN ('char-jet', 'char-terri', 'char-jeremy', 'char-elena', 'char-marcus', 'char-maya', 'char-arthur', 'char-sarah')").get() as { count: number };
    if (charCount.count !== 8 || invalidChar.count > 0) {
      seedInitialCharacters(db);
    }
  } catch (err) {
    console.warn('Character seeding check error:', err);
  }
}

export function seedTemplatesAndBanks(db: Database.Database) {
  const now = new Date();
  const insertTemplate = db.prepare(`
    INSERT INTO block_templates (id, name, description, category, blocks, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertTemplate.run(
    'tmpl-callout-objective',
    'Standard Learning Objective Callout',
    'Key takeaway statement with accent bar paired with an instructional note callout.',
    'Objectives & Summaries',
    JSON.stringify([
      {
        id: 'tb-1',
        category: 'statement',
        subtype: 'note',
        content: {
          statement: 'Operational Objective',
          subtext: 'Learn how to detect deceptive pretexts in under 30 seconds before replying.',
        },
      },
      {
        id: 'tb-2',
        category: 'statement',
        subtype: 'statement_b',
        content: {
          statement: 'Zero Trust begins at the human keyboard.',
          subtext: 'Verify every unsolicited request out-of-band.',
        },
      },
    ]),
    now.toISOString()
  );

  insertTemplate.run(
    'tmpl-case-study',
    'Executive Case Study Trio',
    'Two-column threat breakdown followed by an expert citation.',
    'Case Studies',
    JSON.stringify([
      {
        id: 'tb-3',
        category: 'text',
        subtype: 'two_column',
        content: {
          columnLeft: '<p><strong>The Incident:</strong> Finance received an urgent email purportedly from the CEO requesting wire details for an offshore acquisition.</p>',
          columnRight: '<p><strong>The Safeguard:</strong> The controller placed an internal voice call to the CEO executive assistant to confirm the transfer before approval.</p>',
        },
      },
      {
        id: 'tb-4',
        category: 'quote',
        subtype: 'quote_a',
        content: {
          quote: 'Verification takes seconds; recovering from a fraudulent wire transfer is nearly impossible.',
          author: 'Chief Financial Officer',
        },
      },
    ]),
    now.toISOString()
  );

  const insertQB = db.prepare(`
    INSERT INTO question_banks (id, title, description, questions, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertQB.run(
    'qb-social-eng',
    'Enterprise Cybersecurity Awareness Bank',
    'Validated question items covering phishing, vishing, MFA fatigue, and quishing.',
    JSON.stringify([
      {
        id: 'q-bank-1',
        type: 'multiple_choice',
        title: 'Spotting Phishing Domain Anomalies',
        points: 10,
        options: [
          { id: 'opt-1', text: 'Checking the display name only', isCorrect: false },
          { id: 'opt-2', text: 'Inspecting the actual SMTP sender domain and SPF/DKIM headers', isCorrect: true },
          { id: 'opt-3', text: 'Clicking the link to see if the browser blocks it', isCorrect: false },
        ],
        feedback: {
          correct: 'Excellent. Attackers spoof display names, but cannot easily forge verified domain headers.',
          incorrect: 'Display names are easily spoofed. Always inspect the underlying domain.',
        },
      },
      {
        id: 'q-bank-2',
        type: 'multiple_response',
        title: 'Signals of a Voice Phishing (Vishing) Attack',
        points: 10,
        options: [
          { id: 'opt-2-1', text: 'Caller claims to be IT and demands your one-time 2FA password', isCorrect: true },
          { id: 'opt-2-2', text: 'Artificial urgency claiming your laptop will be wiped in 10 minutes', isCorrect: true },
          { id: 'opt-2-3', text: 'Caller speaks with a neutral polite tone', isCorrect: false },
          { id: 'opt-2-4', text: 'Caller asks you to approve an authenticator push prompt', isCorrect: true },
        ],
        feedback: {
          correct: 'Correct! Legitimate IT support will never request your 2FA codes or unsolicited prompt approvals.',
          incorrect: 'Review the key indicators of telephone deception.',
        },
      },
      {
        id: 'q-bank-3',
        type: 'fill_in_blank',
        title: 'Defensive Out-of-Band Verification',
        points: 10,
        sentence: 'When an urgent call requests confidential access, verify the caller through an [blank] channel.',
        acceptedAnswers: ['out-of-band', 'internal', 'official', 'secondary', 'alternative'],
        caseSensitive: false,
        feedback: {
          correct: 'Spot on! Out-of-band verification ensures you never communicate on the attacker’s terms.',
          incorrect: 'The recommended term is out-of-band (or official internal channel).',
        },
      },
      {
        id: 'q-bank-4',
        type: 'matching',
        title: 'Social Engineering Vector Matching',
        points: 10,
        matchingPairs: [
          { id: 'm-1', left: 'Smishing', right: 'SMS Text Message Phishing' },
          { id: 'm-2', left: 'Vishing', right: 'Voice Phone Call Deception' },
          { id: 'm-3', left: 'Quishing', right: 'Malicious QR Code Traps' },
          { id: 'm-4', left: 'Baiting', right: 'Infected USB Drives Left in Public' },
        ],
        feedback: {
          correct: 'All attack vectors matched accurately!',
          incorrect: 'Review the standard taxonomy of social manipulation.',
        },
      },
    ]),
    now.toISOString()
  );
}

function seedDb(db: Database.Database) {
  const defaultTheme: ThemeSettings = {
    preset: 'craft',
    accentColor: '#115E59',
    coverLayout: 'split',
    overlayOpacity: 50,
    fontPairing: 'Plus Jakarta Sans / Inter',
    fontHeading: 'Plus Jakarta Sans',
    fontBody: 'Inter',
    logoUrl: null,
    coverImageUrl: '/thumbnails/social-engineering.svg',
    sidebarState: 'open',
    showPrevNextButtons: true,
    showLessonNumbers: true,
    headerStyle: 'plain',
    headerHeight: 'medium',
    blockAnimations: true,
    buttonStyle: 'pill',
  };

  const defaultPublish: PublishSettings = {
    navigationMode: 'free',
    showLessonNumbers: true,
    allowSearch: true,
    completionCriteria: 'all_lessons',
    passingScore: 80,
    scormVersion: '1.2',
    exportFormat: 'web',
  };

  const insertCourse = db.prepare(`
    INSERT INTO courses (id, title, description, type, status, author_name, author_avatar, cover_image, theme_settings, publish_settings, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertLesson = db.prepare(`
    INSERT INTO lessons (id, course_id, title, type, sort_order, blocks, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const h16Ago = new Date(now.getTime() - 16 * 3600 * 1000).toISOString();
  const h17Ago = new Date(now.getTime() - 17 * 3600 * 1000).toISOString();
  const d1Ago = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();

  // 1. Defending Against Social Engineering (Sample Course with 4 lessons + 1 quiz)
  const socialEngBlocksL1: Block[] = [
    {
      id: 'b-1-img',
      category: 'image',
      subtype: 'image_full_width',
      content: {
        url: '/thumbnails/social-engineering.svg',
        caption: 'Enter some text',
        alt: 'Office workspace overview showing cybersecurity alert',
      },
      settings: {
        paddingTop: 'small',
        paddingBottom: 'medium',
        backgroundColor: 'white',
      },
    },
    {
      id: 'b-1-heading-p',
      category: 'text',
      subtype: 'paragraph_heading',
      content: {
        heading: 'Understanding Phishing and Manipulative Pretexts',
        body: '<p>Social engineering relies on human psychology rather than software vulnerabilities. Attackers exploit trust, curiosity, urgency, and fear to convince employees to bypass security protocols.</p>',
      },
      settings: {
        paddingTop: 'medium',
        paddingBottom: 'medium',
        backgroundColor: 'white',
      },
    },
    {
      id: 'b-1-1',
      category: 'statement',
      subtype: 'statement_b',
      content: {
        statement: 'Cybercriminals do not hack systems when they can simply hack humans.',
        subtext: 'Over 85% of corporate cybersecurity breaches begin through deceptive social engineering techniques.',
      },
      settings: {
        paddingTop: 'medium',
        paddingBottom: 'medium',
        backgroundColor: 'white',
      },
    },
    {
      id: 'b-1-quote',
      category: 'quote',
      subtype: 'quote_a',
      content: {
        quote: 'The weakest link in any computer system is the person sitting in front of the keyboard.',
        author: 'Kevin Mitnick',
      },
      settings: {
        paddingTop: 'medium',
        paddingBottom: 'medium',
        backgroundColor: 'white',
      },
    },
    {
      id: 'b-1-list',
      category: 'list',
      subtype: 'numbered_list',
      content: {
        title: 'Core Principles Exploited by Attackers',
        items: [
          'Authority: Pretending to be an executive, auditor, or IT administrator.',
          'Scarcity & Urgency: Fabricating an emergency that demands immediate compliance.',
          'Social Proof: "Your team lead has already approved this access request."',
          'Likability & Reciprocity: Offering assistance before requesting credentials.',
        ],
      },
      settings: {
        paddingTop: 'medium',
        paddingBottom: 'medium',
        backgroundColor: 'white',
      },
    },
    {
      id: 'b-1-continue',
      category: 'divider',
      subtype: 'continue_button',
      content: {
        label: 'Continue',
      },
      settings: {
        buttonText: 'Continue',
        completionRequirement: 'none',
        paddingTop: 'medium',
        paddingBottom: 'large',
      },
    },
  ];

  const socialEngBlocksL2: Block[] = [
    {
      id: 'b-2-1',
      category: 'statement',
      subtype: 'statement_warning',
      content: {
        statement: 'A single misdirected click can jeopardize an entire corporate infrastructure.',
        subtext: 'Spear phishing uses personal research to craft believable, tailored lures.',
      },
    },
    {
      id: 'b-2-2',
      category: 'interactive',
      subtype: 'accordion',
      content: {
        title: 'Email Red Flags to Always Inspect',
        items: [
          {
            title: 'Mismatched Domains & Typosquatting',
            content: 'Check the real email address behind the display name (e.g., support@ingram-mlcro.com instead of support@ingrammicro.com).',
          },
          {
            title: 'Urgent Demands for Financial Action',
            content: 'Requests to change supplier bank wire details or purchase gift cards for a company event must always be validated over phone or face-to-face.',
          },
          {
            title: 'Suspicious Attachments & QR Codes (Quishing)',
            content: 'Never scan an unexpected QR code or open zipped macro-enabled files (.docm, .xlsm, .exe).',
          },
        ],
      },
    },
  ];

  const socialEngBlocksL3: Block[] = [
    {
      id: 'b-3-1',
      category: 'text',
      subtype: 'paragraph',
      content: {
        heading: 'Vishing (Voice Phishing) & Helpdesk Impersonation',
        body: '<p>Voice phishing attacks often occur late on Friday afternoons or early mornings when IT staff shifts change. Attackers impersonate remote employees locked out of their multi-factor authentication (MFA) devices.</p>',
      },
    },
    {
      id: 'b-3-2',
      category: 'interactive',
      subtype: 'flashcards',
      content: {
        title: 'Common Vishing Scenarios',
        cards: [
          {
            front: 'Scenario 1: IT Helpdesk Calling You',
            back: 'Caller claims your VPN token expired and asks you to approve an authenticator push notification. Response: Deny and call the official IT Helpdesk extension.',
          },
          {
            front: 'Scenario 2: The Executive Assistant',
            back: 'Caller says the VP needs immediate customer database access for an unscheduled board meeting. Response: Follow standard authorization protocols; no exceptions.',
          },
        ],
      },
    },
  ];

  const socialEngBlocksL4: Block[] = [
    {
      id: 'b-4-1',
      category: 'statement',
      subtype: 'statement_accent',
      content: {
        statement: 'Defensive Protocol: When in doubt, verify out-of-band.',
        subtext: 'Never use the phone number or link provided in the suspicious message.',
      },
    },
    {
      id: 'b-4-2',
      category: 'list',
      subtype: 'numbered_list',
      content: {
        title: 'The 4-Step Incident Response Protocol',
        items: [
          'Do NOT click links, download attachments, or reply to the sender.',
          'Click the "Report Phishing" button in your Outlook toolbar.',
          'Notify your Information Security Operations Center (SOC) immediately.',
          'If credentials were entered accidentally, disconnect network Wi-Fi and change passwords from another device.',
        ],
      },
    },
  ];

  const socialEngBlocksL5: Block[] = [
    {
      id: 'b-5-1',
      category: 'knowledge_check',
      subtype: 'multiple_choice',
      content: {
        question: 'You receive an urgent email from "HR Benefits" stating that open enrollment ends in 15 minutes and you must verify your login credentials immediately to keep health coverage. What is your safest action?',
        options: [
          { text: 'Click the link immediately so your healthcare is not canceled.', isCorrect: false },
          { text: 'Report the email using the PhishAlarm button and verify with HR through official company Slack/Teams.', isCorrect: true },
          { text: 'Reply to the sender asking if this email is real.', isCorrect: false },
          { text: 'Forward it to your personal email to check on your phone.', isCorrect: false },
        ],
        explanation: 'Attackers create artificial urgency to bypass your rational critical thinking. Reporting the message protects both you and the organization.',
      },
    },
    {
      id: 'b-5-2',
      category: 'knowledge_check',
      subtype: 'multiple_choice',
      content: {
        question: 'An unknown caller claiming to be from Microsoft IT says your laptop is sending error signals and asks to establish a remote connection. How should you respond?',
        options: [
          { text: 'Allow connection if they confirm your company name.', isCorrect: false },
          { text: 'Refuse, hang up immediately, and report the caller to your internal IT team.', isCorrect: true },
          { text: 'Ask them to email you a verification code.', isCorrect: false },
        ],
        explanation: 'Legitimate IT service providers will never cold-call employees requesting unsolicited remote workstation control.',
      },
    },
  ];

  // Insert Course 1
  insertCourse.run(
    'course-social-eng',
    'Cyber Defense: Outsmarting Modern Phishing & Vishing',
    'Equip your team with the critical awareness to identify, evade, and report phishing, pretexting, and social manipulation attempts in modern hybrid workplaces.',
    'course',
    'published',
    'Mike Afurong',
    'MA',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80',
    JSON.stringify(defaultTheme),
    JSON.stringify(defaultPublish),
    h16Ago,
    h16Ago
  );

  // Insert Lessons for Course 1
  insertLesson.run(
    'les-se-1',
    'course-social-eng',
    'Spotting Social Engineering: Common Attacks and Warning Signs',
    'lesson',
    0,
    JSON.stringify(socialEngBlocksL1),
    h16Ago,
    h16Ago
  );

  insertLesson.run(
    'les-se-2',
    'course-social-eng',
    'Recognizing Email Phishing & Spear Phishing',
    'lesson',
    1,
    JSON.stringify(socialEngBlocksL2),
    h16Ago,
    h16Ago
  );

  insertLesson.run(
    'les-se-3',
    'course-social-eng',
    'Voice Phishing (Vishing) & Credential Harvesting',
    'lesson',
    2,
    JSON.stringify(socialEngBlocksL3),
    h16Ago,
    h16Ago
  );

  insertLesson.run(
    'les-se-4',
    'course-social-eng',
    'Incident Reporting & Defensive Best Practices',
    'lesson',
    3,
    JSON.stringify(socialEngBlocksL4),
    h16Ago,
    h16Ago
  );

  insertLesson.run(
    'quiz-se-5',
    'course-social-eng',
    'Knowledge Check: Social Engineering Defense',
    'quiz',
    4,
    JSON.stringify(socialEngBlocksL5),
    h16Ago,
    h16Ago
  );

  // Insert Course 2: High-Stakes Conversations: Leading Through Team Friction (13 lessons)
  insertCourse.run(
    'course-conflict',
    'High-Stakes Conversations: Leading Through Team Friction',
    'Learn empathetic communication and practical mediation skills to transform workplace friction into collaborative growth.',
    'course',
    'published',
    'Mike Afurong',
    'MA',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
    JSON.stringify(defaultTheme),
    JSON.stringify(defaultPublish),
    h17Ago,
    h17Ago
  );
  for (let i = 1; i <= 13; i++) {
    insertLesson.run(
      `les-conflict-${i}`,
      'course-conflict',
      `Conflict Resolution Module ${i}: ${['The Anatomy of Friction', 'Active Listening Tools', 'De-escalation Language', 'Perspective Taking', 'Crucial Conversations', 'Separating Intent from Impact', 'Finding Common Ground', 'Negotiation Dynamics', 'The Role of Emotions', 'Constructive Feedback', 'Handling Hostile Exchanges', 'Follow-up Check-ins', 'Final Assessment'][i - 1]}`,
      i === 13 ? 'quiz' : 'lesson',
      i - 1,
      JSON.stringify([]),
      h17Ago,
      h17Ago
    );
  }

  // Insert Course 3: When to Ask Your Boss for Help (7 lessons)
  insertCourse.run(
    'course-ask-boss',
    'When to Ask Your Boss for Help',
    'Master the subtle art of upward communication, knowing when to escalate blockers and how to present solutions, not just problems.',
    'course',
    'published',
    'Mike Afurong',
    'MA',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
    JSON.stringify(defaultTheme),
    JSON.stringify(defaultPublish),
    d1Ago,
    d1Ago
  );
  for (let i = 1; i <= 7; i++) {
    insertLesson.run(
      `les-boss-${i}`,
      'course-ask-boss',
      `Chapter ${i}: ${['The Independence vs. Escalation Dilemma', 'Assessing the Impact of Blockers', 'Structuring the 3-Option Proposal', 'Effective 1-on-1 Framing', 'Email vs. Instant Message Escalation', 'Recovering from Mistakes Gracefully', 'Quiz: Escalation Readiness'][i - 1]}`,
      i === 7 ? 'quiz' : 'lesson',
      i - 1,
      JSON.stringify([]),
      d1Ago,
      d1Ago
    );
  }

  // Insert Course 4: Performance Management (8 lessons)
  insertCourse.run(
    'course-perf',
    'Performance Management',
    'A framework for managers to set clear goals, conduct fair reviews, and nurture continuous career advancement.',
    'course',
    'published',
    'Mike Afurong',
    'MA',
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80',
    JSON.stringify(defaultTheme),
    JSON.stringify(defaultPublish),
    d1Ago,
    d1Ago
  );
  for (let i = 1; i <= 8; i++) {
    insertLesson.run(
      `les-perf-${i}`,
      'course-perf',
      `Lesson ${i}: ${['Aligning OKRs with Team Strengths', 'Continuous 1-on-1 Feedback', 'Mid-Year Calibrations', 'Coaching Underperformers', 'Spotlighting High Potential Talent', 'Fair Documentation Practices', 'The Year-End Conversation', 'Manager Certification Exam'][i - 1]}`,
      i === 8 ? 'quiz' : 'lesson',
      i - 1,
      JSON.stringify([]),
      d1Ago,
      d1Ago
    );
  }

  // Insert Course 5: Zero-Trust Security: 3-Minute Threat Drill (Microlearning)
  insertCourse.run(
    'micro-spot-phish',
    'Zero-Trust Security: 3-Minute Threat Drill',
    'A fast, high-stakes microlearning simulation testing immediate threat triage and incident reporting.',
    'microlearning',
    'published',
    'Mike Afurong',
    'MA',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
    JSON.stringify(defaultTheme),
    JSON.stringify(defaultPublish),
    d1Ago,
    d1Ago
  );
  insertLesson.run(
    'les-micro-phish-1',
    'micro-spot-phish',
    'Interactive Threat Drill Scenario',
    'lesson',
    0,
    JSON.stringify([]),
    d1Ago,
    d1Ago
  );

  // Insert Course 6: Peak Cognitive Performance for Remote Teams (Microlearning)
  insertCourse.run(
    'micro-better-naps',
    'Peak Cognitive Performance for Remote Teams',
    'Science-backed strategies to optimize midday rest, recharge cognitive energy, and sustain high output.',
    'microlearning',
    'published',
    'Mike Afurong',
    'MA',
    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80',
    JSON.stringify(defaultTheme),
    JSON.stringify(defaultPublish),
    d1Ago,
    d1Ago
  );
  insertLesson.run(
    'les-micro-naps-1',
    'micro-better-naps',
    'The 20-Minute Cognitive Reset Protocol',
    'lesson',
    0,
    JSON.stringify([]),
    d1Ago,
    d1Ago
  );

  // Insert Course 7: The Deal Desk: Mastering B2B Pricing & Margin Defense (Draft, 7 lessons)
  insertCourse.run(
    'course-articulate-ai',
    'The Deal Desk: Mastering B2B Pricing & Margin Defense',
    'Master pricing discipline, defend software profit margins, and structure enterprise SaaS deal approval workflows.',
    'course',
    'draft',
    'Mike Afurong',
    'MA',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
    JSON.stringify(defaultTheme),
    JSON.stringify(defaultPublish),
    d1Ago,
    d1Ago
  );
  for (let i = 1; i <= 7; i++) {
    insertLesson.run(
      `les-art-ai-${i}`,
      'course-articulate-ai',
      `Deal Desk Module ${i}: ${['Pricing Architecture & Tiers', 'Evaluating Discount Requests', 'Multi-Year Contract Economics', 'Defending Gross Margin', 'Non-Standard Terms & Liabilities', 'Executive Approval Escalations', 'Deal Desk Simulation Review'][i - 1]}`,
      i === 7 ? 'quiz' : 'lesson',
      i - 1,
      JSON.stringify([]),
      d1Ago,
      d1Ago
    );
  }

  seedTemplatesAndBanks(db);
}

// Data access operations
export function getCourses(search?: string, filter?: string, sort?: string): Course[] {
  const db = getDb();
  let query = `
    SELECT c.*, COUNT(l.id) as lesson_count
    FROM courses c
    LEFT JOIN lessons l ON c.id = l.course_id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (search && search.trim() !== '') {
    query += ` AND (c.title LIKE ? OR c.description LIKE ?)`;
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }

  if (filter && filter !== 'all') {
    if (filter === 'course' || filter === 'microlearning') {
      query += ` AND c.type = ?`;
      params.push(filter);
    } else if (filter === 'published' || filter === 'draft') {
      query += ` AND c.status = ?`;
      params.push(filter);
    }
  }

  query += ` GROUP BY c.id`;

  if (sort === 'title') {
    query += ` ORDER BY c.title ASC`;
  } else if (sort === 'oldest') {
    query += ` ORDER BY c.updated_at ASC`;
  } else {
    // default recently updated
    query += ` ORDER BY c.updated_at DESC`;
  }

  const rows = db.prepare(query).all(...params) as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || '',
    type: row.type as Course['type'],
    status: row.status as Course['status'],
    authorName: row.author_name as string,
    authorAvatar: row.author_avatar as string,
    coverImage: (row.cover_image as string) || null,
    themeSettings: JSON.parse(row.theme_settings as string),
    publishSettings: JSON.parse(row.publish_settings as string),
    isPublished: row.status === 'published',
    lastPublishedAt: (row.last_published_at as string) || null,
    hasUnpublishedChanges: Boolean(row.has_unpublished_changes),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    lessonCount: Number(row.lesson_count || 0),
  }));
}

export function getCourseById(id: string): (Course & { lessons: Lesson[] }) | null {
  const db = getDb();
  const courseRow = db.prepare('SELECT * FROM courses WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!courseRow) return null;

  const lessonRows = db.prepare('SELECT * FROM lessons WHERE course_id = ? ORDER BY sort_order ASC').all(id) as Array<Record<string, unknown>>;

  const lessons: Lesson[] = lessonRows.map((l) => ({
    id: l.id as string,
    courseId: l.course_id as string,
    title: l.title as string,
    type: l.type as Lesson['type'],
    sortOrder: Number(l.sort_order),
    blocks: JSON.parse((l.blocks as string) || '[]'),
    quizSettings: JSON.parse((l.quiz_settings as string) || '{}'),
    createdAt: l.created_at as string,
    updatedAt: l.updated_at as string,
  }));

  return {
    id: courseRow.id as string,
    title: courseRow.title as string,
    description: (courseRow.description as string) || '',
    type: courseRow.type as Course['type'],
    status: courseRow.status as Course['status'],
    authorName: courseRow.author_name as string,
    authorAvatar: courseRow.author_avatar as string,
    coverImage: (courseRow.cover_image as string) || null,
    themeSettings: JSON.parse(courseRow.theme_settings as string),
    publishSettings: JSON.parse(courseRow.publish_settings as string),
    isPublished: courseRow.status === 'published',
    lastPublishedAt: (courseRow.last_published_at as string) || null,
    hasUnpublishedChanges: Boolean(courseRow.has_unpublished_changes),
    createdAt: courseRow.created_at as string,
    updatedAt: courseRow.updated_at as string,
    lessons,
    lessonCount: lessons.length,
  };
}

export function createCourse(data: Partial<Course>): Course {
  const db = getDb();
  const id = data.id || `course-${Date.now()}`;
  const now = new Date().toISOString();

  const themeSettings: ThemeSettings = data.themeSettings || {
    accentColor: '#4F46E5',
    coverLayout: 'overlay',
    fontPairing: 'Plus Jakarta Sans / Inter',
    fontHeading: 'Plus Jakarta Sans',
    fontBody: 'Inter',
    logoUrl: null,
    coverImageUrl: null,
  };

  const publishSettings: PublishSettings = data.publishSettings || {
    navigationMode: 'free',
    showLessonNumbers: true,
    allowSearch: true,
    completionCriteria: 'all_lessons',
    passingScore: 80,
    scormVersion: '1.2',
    exportFormat: 'web',
  };

  db.prepare(`
    INSERT INTO courses (id, title, description, type, status, author_name, author_avatar, cover_image, theme_settings, publish_settings, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.title || 'Untitled Course',
    data.description || '',
    data.type || 'course',
    data.status || 'draft',
    data.authorName || 'Mike Afurong',
    data.authorAvatar || 'MA',
    data.coverImage || null,
    JSON.stringify(themeSettings),
    JSON.stringify(publishSettings),
    now,
    now
  );

  return getCourseById(id)!;
}

export function updateCourse(id: string, data: Partial<Course>): Course | null {
  const db = getDb();
  const existing = getCourseById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const title = data.title !== undefined ? data.title : existing.title;
  const description = data.description !== undefined ? data.description : existing.description;
  const type = data.type !== undefined ? data.type : existing.type;
  const status = data.status !== undefined ? data.status : existing.status;
  const coverImage = data.coverImage !== undefined ? data.coverImage : existing.coverImage;
  const themeSettings = data.themeSettings ? JSON.stringify({ ...existing.themeSettings, ...data.themeSettings }) : JSON.stringify(existing.themeSettings);
  const publishSettings = data.publishSettings ? JSON.stringify({ ...existing.publishSettings, ...data.publishSettings }) : JSON.stringify(existing.publishSettings);
  const lastPublishedAt = data.lastPublishedAt !== undefined ? data.lastPublishedAt : (existing.lastPublishedAt || null);
  const hasUnpublishedChanges = data.hasUnpublishedChanges !== undefined
    ? (data.hasUnpublishedChanges ? 1 : 0)
    : (existing.status === 'published' && status === 'published' ? 1 : (existing.hasUnpublishedChanges ? 1 : 0));

  db.prepare(`
    UPDATE courses
    SET title = ?, description = ?, type = ?, status = ?, cover_image = ?, theme_settings = ?, publish_settings = ?, last_published_at = ?, has_unpublished_changes = ?, updated_at = ?
    WHERE id = ?
  `).run(title, description, type, status, coverImage, themeSettings, publishSettings, lastPublishedAt, hasUnpublishedChanges, now, id);

  return getCourseById(id);
}

export function markCoursePublished(id: string): Course | null {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE courses
    SET status = 'published', last_published_at = ?, has_unpublished_changes = 0, updated_at = ?
    WHERE id = ?
  `).run(now, now, id);
  return getCourseById(id);
}

export function deleteCourse(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM courses WHERE id = ?').run(id);
  return result.changes > 0;
}

export function duplicateCourse(id: string): Course | null {
  const db = getDb();
  const original = getCourseById(id);
  if (!original) return null;

  const newId = `course-${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO courses (id, title, description, type, status, author_name, author_avatar, cover_image, theme_settings, publish_settings, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newId,
    `${original.title} (Copy)`,
    original.description,
    original.type,
    'draft',
    original.authorName,
    original.authorAvatar,
    original.coverImage,
    JSON.stringify(original.themeSettings),
    JSON.stringify(original.publishSettings),
    now,
    now
  );

  for (const lesson of original.lessons) {
    const newLessonId = `lesson-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    db.prepare(`
      INSERT INTO lessons (id, course_id, title, type, sort_order, blocks, quiz_settings, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newLessonId,
      newId,
      lesson.title,
      lesson.type,
      lesson.sortOrder,
      JSON.stringify(lesson.blocks),
      JSON.stringify(lesson.quizSettings || {}),
      now,
      now
    );
  }

  return getCourseById(newId);
}

// Lesson operations
export function getLessonById(lessonId: string): Lesson | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM lessons WHERE id = ?').get(lessonId) as Record<string, unknown> | undefined;
  if (!row) return null;

  return {
    id: row.id as string,
    courseId: row.course_id as string,
    title: row.title as string,
    type: row.type as Lesson['type'],
    sortOrder: Number(row.sort_order),
    blocks: JSON.parse((row.blocks as string) || '[]'),
    quizSettings: JSON.parse((row.quiz_settings as string) || '{}'),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function createLesson(courseId: string, data: Partial<Lesson>): Lesson {
  const db = getDb();
  const id = data.id || `lesson-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const now = new Date().toISOString();

  // Find max sort_order
  const maxOrderRow = db.prepare('SELECT MAX(sort_order) as max_order FROM lessons WHERE course_id = ?').get(courseId) as { max_order: number | null };
  const sortOrder = data.sortOrder !== undefined ? data.sortOrder : (maxOrderRow?.max_order ?? -1) + 1;

  db.prepare(`
    INSERT INTO lessons (id, course_id, title, type, sort_order, blocks, quiz_settings, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    courseId,
    data.title || 'Untitled Lesson',
    data.type || 'lesson',
    sortOrder,
    JSON.stringify(data.blocks || []),
    JSON.stringify(data.quizSettings || {}),
    now,
    now
  );

  // Update course updated_at and flag unpublished changes
  db.prepare('UPDATE courses SET has_unpublished_changes = 1, updated_at = ? WHERE id = ?').run(now, courseId);

  return getLessonById(id)!;
}

export function updateLesson(lessonId: string, data: Partial<Lesson>): Lesson | null {
  const db = getDb();
  const existing = getLessonById(lessonId);
  if (!existing) return null;

  const now = new Date().toISOString();
  const title = data.title !== undefined ? data.title : existing.title;
  const type = data.type !== undefined ? data.type : existing.type;
  const sortOrder = data.sortOrder !== undefined ? data.sortOrder : existing.sortOrder;
  const blocks = data.blocks ? JSON.stringify(data.blocks) : JSON.stringify(existing.blocks);
  const quizSettings = data.quizSettings ? JSON.stringify({ ...existing.quizSettings, ...data.quizSettings }) : JSON.stringify(existing.quizSettings || {});

  db.prepare(`
    UPDATE lessons
    SET title = ?, type = ?, sort_order = ?, blocks = ?, quiz_settings = ?, updated_at = ?
    WHERE id = ?
  `).run(title, type, sortOrder, blocks, quizSettings, now, lessonId);

  // Update course updated_at and flag unpublished changes
  db.prepare('UPDATE courses SET has_unpublished_changes = 1, updated_at = ? WHERE id = ?').run(now, existing.courseId);

  return getLessonById(lessonId);
}

export function deleteLesson(lessonId: string): boolean {
  const db = getDb();
  const lesson = getLessonById(lessonId);
  if (!lesson) return false;

  const result = db.prepare('DELETE FROM lessons WHERE id = ?').run(lessonId);
  const now = new Date().toISOString();
  db.prepare('UPDATE courses SET has_unpublished_changes = 1, updated_at = ? WHERE id = ?').run(now, lesson.courseId);

  return result.changes > 0;
}

export function reorderLessons(courseId: string, lessonIds: string[]): boolean {
  const db = getDb();
  const now = new Date().toISOString();

  const updateStmt = db.prepare('UPDATE lessons SET sort_order = ?, updated_at = ? WHERE id = ? AND course_id = ?');

  const transaction = db.transaction((ids: string[]) => {
    ids.forEach((id, index) => {
      updateStmt.run(index, now, id, courseId);
    });
    db.prepare('UPDATE courses SET has_unpublished_changes = 1, updated_at = ? WHERE id = ?').run(now, courseId);
  });

  transaction(lessonIds);
  return true;
}

// Block Templates operations
export function getBlockTemplates() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM block_templates ORDER BY created_at DESC').all() as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    description: (r.description as string) || '',
    category: (r.category as string) || 'custom',
    blocks: JSON.parse((r.blocks as string) || '[]'),
    createdAt: r.created_at as string,
  }));
}

export function createBlockTemplate(data: { name: string; description?: string; category?: string; blocks: Block[] }) {
  const db = getDb();
  const id = `tmpl-${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO block_templates (id, name, description, category, blocks, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.name, data.description || '', data.category || 'custom', JSON.stringify(data.blocks), now);

  return {
    id,
    name: data.name,
    description: data.description || '',
    category: data.category || 'custom',
    blocks: data.blocks,
    createdAt: now,
  };
}

export function deleteBlockTemplate(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM block_templates WHERE id = ?').run(id);
  return result.changes > 0;
}

// Question Banks operations
export function getQuestionBanks() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM question_banks ORDER BY created_at DESC').all() as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    description: (r.description as string) || '',
    questions: JSON.parse((r.questions as string) || '[]'),
    createdAt: r.created_at as string,
  }));
}

export function getQuestionBankById(id: string) {
  const db = getDb();
  const r = db.prepare('SELECT * FROM question_banks WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!r) return null;
  return {
    id: r.id as string,
    title: r.title as string,
    description: (r.description as string) || '',
    questions: JSON.parse((r.questions as string) || '[]'),
    createdAt: r.created_at as string,
  };
}

export function createQuestionBank(data: { title: string; description?: string; questions: QuizQuestion[] }) {
  const db = getDb();
  const id = `qb-${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO question_banks (id, title, description, questions, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, data.title, data.description || '', JSON.stringify(data.questions), now);

  return {
    id,
    title: data.title,
    description: data.description || '',
    questions: data.questions,
    createdAt: now,
  };
}

export function updateQuestionBank(id: string, data: Partial<QuestionBank>) {
  const db = getDb();
  const existing = getQuestionBankById(id);
  if (!existing) return null;

  const title = data.title !== undefined ? data.title : existing.title;
  const description = data.description !== undefined ? data.description : existing.description;
  const questions = data.questions !== undefined ? JSON.stringify(data.questions) : JSON.stringify(existing.questions);

  db.prepare(`
    UPDATE question_banks
    SET title = ?, description = ?, questions = ?
    WHERE id = ?
  `).run(title, description, questions, id);

  return getQuestionBankById(id);
}

export function deleteQuestionBank(id: string) {
  const db = getDb();
  const result = db.prepare('DELETE FROM question_banks WHERE id = ?').run(id);
  return result.changes > 0;
}

// Media Assets operations
export function getMediaAssets(options?: {
  fileType?: string;
  search?: string;
  tag?: string;
  favoritesOnly?: boolean;
  category?: string;
} | string, searchLegacy?: string): MediaAsset[] {
  const db = getDb();
  let query = 'SELECT * FROM media_assets';
  const params: unknown[] = [];
  const whereClauses: string[] = [];

  let fileType: string | undefined;
  let search: string | undefined;
  let tag: string | undefined;
  let favoritesOnly: boolean | undefined;
  let category: string | undefined;

  if (typeof options === 'string') {
    fileType = options;
    search = searchLegacy;
  } else if (options) {
    fileType = options.fileType;
    search = options.search;
    tag = options.tag;
    favoritesOnly = options.favoritesOnly;
    category = options.category;
  }

  if (fileType && fileType !== 'all') {
    whereClauses.push('file_type = ?');
    params.push(fileType);
  }

  if (favoritesOnly) {
    whereClauses.push('is_favorite = 1');
  }

  if (category && category !== 'all') {
    whereClauses.push('category = ?');
    params.push(category);
  }

  if (tag && tag.trim()) {
    const cleanTag = tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`;
    whereClauses.push('tags LIKE ?');
    params.push(`%"${cleanTag}"%`);
  }

  if (search && search.trim()) {
    whereClauses.push('(filename LIKE ? OR prompt LIKE ? OR title LIKE ? OR tags LIKE ?)');
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term);
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  const rows = db.prepare(query).all(...params) as Array<Record<string, unknown>>;
  return rows.map((r) => {
    let parsedTags: string[] = [];
    try {
      parsedTags = JSON.parse((r.tags as string) || '[]');
    } catch {
      parsedTags = [];
    }

    return {
      id: r.id as string,
      url: r.url as string,
      filename: r.filename as string,
      title: (r.title as string) || (r.filename as string) || '',
      tags: parsedTags,
      category: (r.category as string) || '',
      isFavorite: Number(r.is_favorite) === 1,
      fileType: r.file_type as 'image' | 'video' | 'audio',
      source: r.source as 'upload' | 'flow' | 'dropzone' | 'library' | 'stock' | 'ai',
      fileSize: (r.file_size as number) || 0,
      width: (r.width as number) || 0,
      height: (r.height as number) || 0,
      prompt: (r.prompt as string) || '',
      aspectRatio: (r.aspect_ratio as string) || '',
      stylePreset: (r.style_preset as string) || '',
      model: (r.model as string) || undefined,
      createdAt: r.created_at as string,
    };
  });
}

export function getMediaAssetById(id: string): MediaAsset | null {
  const db = getDb();
  const r = db.prepare('SELECT * FROM media_assets WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!r) return null;

  let parsedTags: string[] = [];
  try {
    parsedTags = JSON.parse((r.tags as string) || '[]');
  } catch {
    parsedTags = [];
  }

  return {
    id: r.id as string,
    url: r.url as string,
    filename: r.filename as string,
    title: (r.title as string) || (r.filename as string) || '',
    tags: parsedTags,
    category: (r.category as string) || '',
    isFavorite: Number(r.is_favorite) === 1,
    fileType: r.file_type as 'image' | 'video' | 'audio',
    source: r.source as 'upload' | 'flow' | 'dropzone' | 'library' | 'stock' | 'ai',
    fileSize: (r.file_size as number) || 0,
    width: (r.width as number) || 0,
    height: (r.height as number) || 0,
    prompt: (r.prompt as string) || '',
    aspectRatio: (r.aspect_ratio as string) || '',
    stylePreset: (r.style_preset as string) || '',
    model: (r.model as string) || undefined,
    createdAt: r.created_at as string,
  };
}

export function getAllMediaTags(): { tag: string; count: number }[] {
  const db = getDb();
  const rows = db.prepare('SELECT tags FROM media_assets WHERE tags IS NOT NULL AND tags != ""').all() as Array<{ tags: string }>;
  const tagCounts = new Map<string, number>();

  for (const row of rows) {
    try {
      const list: string[] = JSON.parse(row.tags);
      if (Array.isArray(list)) {
        for (const t of list) {
          const norm = t.trim().toLowerCase().startsWith('#') ? t.trim().toLowerCase() : `#${t.trim().toLowerCase()}`;
          if (norm.length > 1) {
            tagCounts.set(norm, (tagCounts.get(norm) || 0) + 1);
          }
        }
      }
    } catch {
      // ignore bad JSON
    }
  }

  const sorted = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  return sorted;
}

export function createMediaAsset(data: {
  id?: string;
  url: string;
  filename: string;
  title?: string;
  tags?: string[];
  category?: string;
  isFavorite?: boolean;
  fileType: 'image' | 'video' | 'audio';
  source?: 'upload' | 'flow' | 'dropzone' | 'library' | 'stock' | 'ai';
  fileSize?: number;
  width?: number;
  height?: number;
  prompt?: string;
  aspectRatio?: string;
  stylePreset?: string;
  model?: string;
}): MediaAsset {
  const db = getDb();
  const id = data.id || `media-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const title = data.title || data.filename;
  const tagsJson = JSON.stringify(data.tags || []);
  const category = data.category || '';
  const isFavorite = data.isFavorite ? 1 : 0;

  db.prepare(`
    INSERT INTO media_assets (
      id, url, filename, title, tags, category, is_favorite,
      file_type, source, file_size, width, height, prompt,
      aspect_ratio, style_preset, model, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.url,
    data.filename,
    title,
    tagsJson,
    category,
    isFavorite,
    data.fileType,
    data.source || 'upload',
    data.fileSize || 0,
    data.width || 0,
    data.height || 0,
    data.prompt || '',
    data.aspectRatio || '',
    data.stylePreset || '',
    data.model || '',
    now
  );

  return {
    id,
    url: data.url,
    filename: data.filename,
    title,
    tags: data.tags || [],
    category,
    isFavorite: !!data.isFavorite,
    fileType: data.fileType,
    source: data.source || 'upload',
    fileSize: data.fileSize || 0,
    width: data.width || 0,
    height: data.height || 0,
    prompt: data.prompt || '',
    aspectRatio: data.aspectRatio || '',
    stylePreset: data.stylePreset || '',
    model: data.model,
    createdAt: now,
  };
}

export function updateMediaAsset(
  id: string,
  updates: {
    title?: string;
    tags?: string[];
    category?: string;
    isFavorite?: boolean;
  }
): MediaAsset | null {
  const db = getDb();
  const existing = getMediaAssetById(id);
  if (!existing) return null;

  const title = updates.title !== undefined ? updates.title : existing.title;
  const tags = updates.tags !== undefined ? updates.tags : existing.tags;
  const category = updates.category !== undefined ? updates.category : existing.category;
  const isFavorite = updates.isFavorite !== undefined ? (updates.isFavorite ? 1 : 0) : (existing.isFavorite ? 1 : 0);

  db.prepare(`
    UPDATE media_assets
    SET title = ?, tags = ?, category = ?, is_favorite = ?
    WHERE id = ?
  `).run(title, JSON.stringify(tags || []), category, isFavorite, id);

  return getMediaAssetById(id);
}

export function deleteMediaAsset(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM media_assets WHERE id = ?').run(id);
  return result.changes > 0;
}

// Course Snapshots operations
export function getCourseSnapshots(courseId: string): CourseSnapshot[] {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM course_snapshots WHERE course_id = ? ORDER BY created_at DESC'
  ).all(courseId) as Array<Record<string, unknown>>;

  return rows.map((r) => ({
    id: r.id as string,
    courseId: r.course_id as string,
    name: r.name as string,
    data: JSON.parse(r.data as string),
    createdAt: r.created_at as string,
  }));
}

export function createCourseSnapshot(courseId: string, name: string): CourseSnapshot | null {
  const db = getDb();
  const course = getCourseById(courseId);
  if (!course) return null;

  const id = `snap-${Date.now()}`;
  const now = new Date().toISOString();
  const payload = JSON.stringify(course);

  db.prepare(`
    INSERT INTO course_snapshots (id, course_id, name, data, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, courseId, name || `Snapshot ${new Date().toLocaleTimeString()}`, payload, now);

  return {
    id,
    courseId,
    name,
    data: course,
    createdAt: now,
  };
}

export function restoreCourseSnapshot(snapshotId: string): (Course & { lessons: Lesson[] }) | null {
  const db = getDb();
  const r = db.prepare('SELECT * FROM course_snapshots WHERE id = ?').get(snapshotId) as Record<string, unknown> | undefined;
  if (!r) return null;

  const snapshotCourse = JSON.parse(r.data as string) as Course & { lessons: Lesson[] };
  const courseId = snapshotCourse.id;

  // Restore within transaction
  const transaction = db.transaction(() => {
    // 1. Update course row
    db.prepare(`
      UPDATE courses
      SET title = ?, description = ?, type = ?, status = ?, author_name = ?, author_avatar = ?, cover_image = ?, theme_settings = ?, publish_settings = ?, updated_at = ?
      WHERE id = ?
    `).run(
      snapshotCourse.title,
      snapshotCourse.description || '',
      snapshotCourse.type || 'course',
      snapshotCourse.status || 'draft',
      snapshotCourse.authorName || 'Mike Afurong',
      snapshotCourse.authorAvatar || 'MA',
      snapshotCourse.coverImage || null,
      JSON.stringify(snapshotCourse.themeSettings || {}),
      JSON.stringify(snapshotCourse.publishSettings || {}),
      new Date().toISOString(),
      courseId
    );

    // 2. Clear existing lessons and recreate
    db.prepare('DELETE FROM lessons WHERE course_id = ?').run(courseId);

    const insertLesson = db.prepare(`
      INSERT INTO lessons (id, course_id, title, type, sort_order, blocks, quiz_settings, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const l of snapshotCourse.lessons || []) {
      insertLesson.run(
        l.id,
        courseId,
        l.title,
        l.type || 'lesson',
        l.sortOrder || 0,
        JSON.stringify(l.blocks || []),
        JSON.stringify(l.quizSettings || {}),
        l.createdAt || new Date().toISOString(),
        new Date().toISOString()
      );
    }
  });

  transaction();
  return getCourseById(courseId);
}

export function deleteCourseSnapshot(snapshotId: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM course_snapshots WHERE id = ?').run(snapshotId);
  return result.changes > 0;
}

// Review Comments (ID Peer Review)
export function getReviewComments(courseId: string): ReviewComment[] {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM review_comments WHERE course_id = ? ORDER BY created_at DESC'
  ).all(courseId) as Array<Record<string, unknown>>;

  return rows.map((r) => ({
    id: r.id as string,
    courseId: r.course_id as string,
    lessonId: (r.lesson_id as string) || null,
    lessonTitle: (r.lesson_title as string) || null,
    blockId: (r.block_id as string) || null,
    authorName: r.author_name as string,
    content: r.content as string,
    category: (r.category as ReviewCommentCategory) || 'comment',
    status: (r.status as ReviewCommentStatus) || 'open',
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }));
}

export function createReviewComment(data: {
  courseId: string;
  lessonId?: string | null;
  lessonTitle?: string | null;
  blockId?: string | null;
  authorName: string;
  content: string;
  category?: ReviewCommentCategory;
}): ReviewComment {
  const db = getDb();
  const id = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const category = data.category || 'comment';
  const status: ReviewCommentStatus = 'open';

  db.prepare(`
    INSERT INTO review_comments (id, course_id, lesson_id, lesson_title, block_id, author_name, content, category, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.courseId,
    data.lessonId || null,
    data.lessonTitle || null,
    data.blockId || null,
    data.authorName.trim() || 'Co-Instructional Designer',
    data.content.trim(),
    category,
    status,
    now,
    now
  );

  return {
    id,
    courseId: data.courseId,
    lessonId: data.lessonId || null,
    lessonTitle: data.lessonTitle || null,
    blockId: data.blockId || null,
    authorName: data.authorName.trim() || 'Co-Instructional Designer',
    content: data.content.trim(),
    category,
    status,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateReviewComment(
  id: string,
  updates: { status?: ReviewCommentStatus; content?: string }
): ReviewComment | null {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM review_comments WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!existing) return null;

  const now = new Date().toISOString();
  const newStatus = updates.status !== undefined ? updates.status : (existing.status as ReviewCommentStatus);
  const newContent = updates.content !== undefined ? updates.content.trim() : (existing.content as string);

  db.prepare(`
    UPDATE review_comments
    SET status = ?, content = ?, updated_at = ?
    WHERE id = ?
  `).run(newStatus, newContent, now, id);

  return {
    id,
    courseId: existing.course_id as string,
    lessonId: (existing.lesson_id as string) || null,
    lessonTitle: (existing.lesson_title as string) || null,
    blockId: (existing.block_id as string) || null,
    authorName: existing.author_name as string,
    content: newContent,
    category: (existing.category as ReviewCommentCategory) || 'comment',
    status: newStatus,
    createdAt: existing.created_at as string,
    updatedAt: now,
  };
}

export function deleteReviewComment(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM review_comments WHERE id = ?').run(id);
  return result.changes > 0;
}


// Seed Initial Media Assets
export function seedMediaAssets(db: Database.Database) {
  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO media_assets (id, url, filename, file_type, source, file_size, width, height, prompt, aspect_ratio, style_preset, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialAssets = [
    {
      id: 'media-security-hero',
      url: '/thumbnails/social-engineering.svg',
      filename: 'corporate-security-hero.svg',
      fileType: 'image' as const,
      source: 'flow' as const,
      fileSize: 45000,
      width: 1920,
      height: 1080,
      prompt: 'Modern corporate glass office with biometric security access turnstiles, cinematic blue and orange ambient lighting',
      aspectRatio: '16:9',
      stylePreset: 'Cinematic',
    },
    {
      id: 'media-phishing-alert',
      url: '/thumbnails/social-engineering.svg',
      filename: 'phishing-detection-analysis.svg',
      fileType: 'image' as const,
      source: 'flow' as const,
      fileSize: 38000,
      width: 1200,
      height: 1200,
      prompt: 'Employee examining deceptive phishing email red flags on laptop, holographic security overlay',
      aspectRatio: '1:1',
      stylePreset: 'Photorealistic Office',
    },
    {
      id: 'media-soc-dashboard',
      url: '/thumbnails/social-engineering.svg',
      filename: 'soc-threat-radar.svg',
      fileType: 'image' as const,
      source: 'flow' as const,
      fileSize: 52000,
      width: 1600,
      height: 900,
      prompt: 'Cybersecurity incident response operations center SOC monitor walls, isometric 3D render',
      aspectRatio: '16:9',
      stylePreset: '3D Render',
    },
    {
      id: 'media-office-badge',
      url: '/thumbnails/social-engineering.svg',
      filename: 'physical-tailgating-checkpoint.svg',
      fileType: 'image' as const,
      source: 'library' as const,
      fileSize: 32000,
      width: 1400,
      height: 1050,
      prompt: 'Office employee tapping contactless RFID security badge at doorway, shallow depth of field',
      aspectRatio: '4:3',
      stylePreset: 'Photorealistic Office',
    },
  ];

  for (const asset of initialAssets) {
    insert.run(
      asset.id,
      asset.url,
      asset.filename,
      asset.fileType,
      asset.source,
      asset.fileSize,
      asset.width,
      asset.height,
      asset.prompt,
      asset.aspectRatio,
      asset.stylePreset,
      now
    );
  }
}

/**
 * Resets or upgrades the seeded sample course to full LXD v2 specification:
 * 1. Observable action outcomes
 * 2. Supportive security framing & evidence-based facts
 * 3. Realistic decision practice in Lesson 1
 * 4. Clear terminology & Explanatory Quiz Feedback
 * 5. Actionable Job Aid checklist with placeholders
 */
export function resetSampleCourseToLxdV2(): Course {
  const db = getDb();
  const now = new Date().toISOString();

  const socialEngBlocksL1: Block[] = [
    {
      id: 'b-1-img',
      category: 'image',
      subtype: 'image_full_width',
      content: {
        url: '/uploads/social-engineering-banner.svg',
        caption: '',
        alt: 'Office employee examining a suspicious email on a laptop while a colleague looks on',
      },
      settings: {
        paddingTop: 'small',
        paddingBottom: 'medium',
        backgroundColor: 'white',
      },
    },
    {
      id: 'b-1-outcomes',
      category: 'list',
      subtype: 'numbered_list',
      content: {
        title: 'Action Learning Objectives',
        items: [
          'Identify suspicious sender addresses, domain typosquatting, and artificial urgency cues in workplace communications.',
          'Verify unexpected or high-risk requests using an out-of-band trusted channel before taking action.',
          'Confidently refuse credential and multi-factor authentication (MFA) disclosure to unverified individuals.',
          'Report suspected social engineering attacks immediately using your organization\'s official reporting workflow.',
        ],
      },
      settings: {
        paddingTop: 'medium',
        paddingBottom: 'medium',
        backgroundColor: 'white',
      },
    },
    {
      id: 'b-1-statement',
      category: 'statement',
      subtype: 'statement_b',
      content: {
        statement: 'Social engineering exploits normal, helpful workplace habits like urgency, curiosity, and trust.',
        subtext: 'Reporting uncertainty is always encouraged and celebrated—protecting the organization is a shared team defense, never a personal blame game.',
      },
      settings: {
        paddingTop: 'medium',
        paddingBottom: 'medium',
        backgroundColor: 'white',
      },
    },
    {
      id: 'b-1-principles',
      category: 'interactive',
      subtype: 'accordion',
      content: {
        title: 'Core Psychological Triggers Exploited by Attackers',
        items: [
          {
            title: '1. Artificial Urgency & Time Scarcity',
            content: 'Attackers create fake deadlines (e.g., "Account termination within 15 minutes") to force rapid emotional compliance before rational evaluation occurs.',
          },
          {
            title: '2. Impersonated Authority & Pretexting',
            content: 'Attackers impersonate executives, auditors, or IT administrators, demanding an immediate bypass of standard approval workflows.',
          },
          {
            title: '3. Reciprocity & Helpful Pretexts',
            content: 'Offering unsolicited assistance or claiming to resolve an urgent problem before requesting credentials or Authenticator approvals.',
          },
        ],
      },
      settings: {
        paddingTop: 'medium',
        paddingBottom: 'medium',
        backgroundColor: 'white',
      },
    },
    {
      id: 'b-1-decision-practice',
      category: 'knowledge_check',
      subtype: 'multiple_choice',
      content: {
        question: 'Interactive Decision Practice: You receive an urgent email appearing to come from the Chief Information Security Officer (CISO) with the subject "CRITICAL: Global Identity Migration – Immediate Action Required". The email demands that you reply with your 6-digit Authenticator code within 10 minutes to prevent your account from being locked during an emergency maintenance window. What should you do?',
        options: [
          {
            text: 'Reply with the 6-digit Authenticator code immediately to prevent your account from being locked during an active crisis.',
            isCorrect: false,
          },
          {
            text: 'Forward the email to three department colleagues to ask if they received a similar request.',
            isCorrect: false,
          },
          {
            text: 'Refuse disclosure, do not reply, and report the message immediately using [Your Security Reporting Button / PhishAlarm] while notifying your IT Operations channel.',
            isCorrect: true,
          },
        ],
        explanation: 'Safe Workplace Action: Authentic security teams and IT leadership will NEVER request your one-time passwords, Authenticator push approvals, or passwords. Reporting the email through official channels immediately alerts incident responders to protect your entire team.',
      },
      settings: {
        paddingTop: 'medium',
        paddingBottom: 'medium',
        backgroundColor: 'white',
      },
    },
    {
      id: 'b-1-continue',
      category: 'divider',
      subtype: 'continue_button',
      content: {
        label: 'Continue to Lesson 2',
      },
      settings: {
        buttonText: 'Continue to Lesson 2',
        completionRequirement: 'none',
        paddingTop: 'medium',
        paddingBottom: 'large',
      },
    },
  ];

  const socialEngBlocksL2: Block[] = [
    {
      id: 'b-2-1',
      category: 'statement',
      subtype: 'statement_warning',
      content: {
        statement: 'Phishing emails often closely mimic legitimate corporate branding.',
        subtext: 'Attackers use domain typosquatting and fake urgent banners to deceive busy employees.',
      },
    },
    {
      id: 'b-2-2',
      category: 'interactive',
      subtype: 'accordion',
      content: {
        title: 'Email Red Flags to Always Inspect',
        items: [
          {
            title: 'Mismatched Domains & Typosquatting',
            content: 'Check the real email address behind the display name (e.g., support@ingram-mlcro.com instead of support@ingrammicro.com).',
          },
          {
            title: 'Urgent Demands for Financial Action',
            content: 'Requests to change supplier bank wire details or purchase gift cards for a company event must always be validated over phone or face-to-face.',
          },
          {
            title: 'Suspicious Attachments & QR Codes (Quishing)',
            content: 'Never scan an unexpected QR code or open zipped macro-enabled files (.docm, .xlsm, .exe).',
          },
        ],
      },
    },
  ];

  const socialEngBlocksL3: Block[] = [
    {
      id: 'b-3-1',
      category: 'text',
      subtype: 'paragraph',
      content: {
        heading: 'Voice Phishing (Vishing) & Helpdesk Impersonation',
        body: '<p>Voice phishing attacks often occur late on Friday afternoons or early mornings when IT staff shifts change. Attackers impersonate remote employees locked out of their multi-factor authentication (MFA) devices.</p>',
      },
    },
    {
      id: 'b-3-2',
      category: 'interactive',
      subtype: 'flashcards',
      content: {
        title: 'Common Vishing Scenarios',
        cards: [
          {
            front: 'Scenario 1: IT Helpdesk Calling You',
            back: 'Caller claims your VPN token expired and asks you to approve an authenticator push notification. Response: Deny and call the official IT Helpdesk extension.',
          },
          {
            front: 'Scenario 2: The Executive Assistant',
            back: 'Caller says the VP needs immediate customer database access for an unscheduled board meeting. Response: Follow standard authorization protocols; no exceptions.',
          },
        ],
      },
    },
  ];

  const socialEngBlocksL4: Block[] = [
    {
      id: 'b-4-1',
      category: 'statement',
      subtype: 'statement_accent',
      content: {
        statement: 'Defensive Protocol: When in doubt, verify out-of-band.',
        subtext: 'Never use the phone number, email reply, or link provided in the suspicious message itself.',
      },
    },
    {
      id: 'b-4-jobaid',
      category: 'list',
      subtype: 'checkbox_list',
      content: {
        title: 'Actionable Job Aid: Verification & Reporting Checklist',
        items: [
          'Inspect Sender Details: Expand full headers to verify the real sending domain (e.g., alert@company-payroll.net vs. alert@company.com).',
          'Gauge Emotional Urgency: Is the sender pressuring you to bypass standard authorization workflows or act in minutes?',
          'Verify Out-of-Band: Contact the purported sender or IT support via an independently verified directory number or official Slack/Teams channel.',
          'Protect Authentication Factors: Never share passwords, SMS codes, or approve unsolicited Authenticator push notifications.',
          'Report Suspected Incidents: Click [Your Security Reporting Button / PhishAlarm] or forward to [Your Security Operations Channel].',
        ],
      },
      settings: {
        paddingTop: 'medium',
        paddingBottom: 'medium',
        backgroundColor: 'white',
      },
    },
    {
      id: 'b-4-summary',
      category: 'text',
      subtype: 'paragraph_heading',
      content: {
        heading: 'Downloadable Workplace Job Aid',
        body: '<p>Save or print this quick reference card to keep next to your workstation. Remember: Reporting an unexpected message is always rewarded—false alarms help security teams fine-tune corporate email filters without penalty.</p>',
      },
    },
  ];

  const socialEngBlocksL5: QuizQuestion[] = [
    {
      id: 'q-1',
      type: 'multiple_choice',
      title: 'You receive an email claiming to be from "Microsoft IT Support" with the subject "CRITICAL: Mailbox Storage Exceeded - Click Here to Retain Emails". The sender address is "support@msft-tenant-verify.net". What is the safest, correct course of action?',
      points: 10,
      options: [
        { id: 'opt-1-1', text: 'Click the link immediately to clear your inbox storage before email access is cut off.', isCorrect: false },
        { id: 'opt-1-2', text: 'Report the email using [Your Security Reporting Button / PhishAlarm] and do not click any links.', isCorrect: true },
        { id: 'opt-1-3', text: 'Reply to the sender asking them to verify their employee credentials.', isCorrect: false },
        { id: 'opt-1-4', text: 'Forward the email to your personal email account to inspect the link safely on your phone.', isCorrect: false },
      ],
      feedback: {
        correct: 'Explanatory Analysis: The domain "msft-tenant-verify.net" is an external lookalike domain (typosquatting). Reporting the message alerts the security operations team to block the domain across the entire enterprise.',
        incorrect: 'Explanatory Analysis: Never click links or interact with lookalike domains. Legitimate system notifications will never direct you to external third-party domains.',
      },
    },
    {
      id: 'q-2',
      type: 'multiple_response',
      title: 'Select all confirmed indicators of a voice phishing (vishing) or telephone pretexting attack:',
      points: 10,
      options: [
        { id: 'opt-2-1', text: 'Caller claims to be an executive assistant demanding immediate wire transfer approval for an off-cycle transaction.', isCorrect: true },
        { id: 'opt-2-2', text: 'Caller asks you to read back a 6-digit one-time passcode sent to your phone or approve an unsolicited push.', isCorrect: true },
        { id: 'opt-2-3', text: 'Caller instructs you to bypass standard verification protocols due to an urgent executive "emergency".', isCorrect: true },
        { id: 'opt-2-4', text: 'Caller directs you to submit a standard helpdesk ticket via the official internal IT portal.', isCorrect: false },
      ],
      feedback: {
        correct: 'Explanatory Analysis: Well done! Demands for immediate wires, urgency bypasses, and requests for one-time codes or Authenticator approvals are classic vishing attack indicators.',
        incorrect: 'Explanatory Analysis: Directing a user to submit a standard ticket via an internal portal is standard legitimate procedure. Demands for immediate wires, urgency bypasses, and requests for one-time codes are vishing attacks.',
      },
    },
  ];

  const courseId = 'course-social-eng';
  const existing = getCourseById(courseId);

  const themeSettings = existing?.themeSettings || {
    accentColor: '#ff5722',
    coverLayout: 'overlay',
    fontPairing: 'modern',
    fontHeading: 'Plus Jakarta Sans',
    fontBody: 'Inter',
    logoUrl: null,
    coverImageUrl: '/uploads/social-engineering-banner.svg',
    sidebarState: 'open',
    showPrevNextButtons: true,
    showLessonNumbers: true,
  };

  const publishSettings = {
    navigationMode: 'free' as const,
    showLessonNumbers: true,
    allowSearch: true,
    completionCriteria: 'all_lessons' as const,
    passingScore: 80,
    scormVersion: '1.2' as const,
    exportFormat: 'web' as const,
    scormStandard: 'scorm12' as const,
    trackingType: 'quiz' as const,
    completionPercentage: 100,
    reportingStatus: 'passed_incomplete' as const,
    includeExitLink: true,
    showPrevNextButtons: true,
    sidebarState: 'open' as const,
  };

  // Upsert course
  db.prepare(`
    INSERT INTO courses (id, title, description, type, status, author_name, author_avatar, cover_image, theme_settings, publish_settings, last_published_at, has_unpublished_changes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      cover_image = excluded.cover_image,
      theme_settings = excluded.theme_settings,
      publish_settings = excluded.publish_settings,
      has_unpublished_changes = 0,
      updated_at = excluded.updated_at
  `).run(
    courseId,
    'Defending Against Social Engineering: Practical Skills for Office Employees',
    'Equip yourself with practical, observable skills to identify suspicious sender/urgency cues, verify requests via an out-of-band trusted channel, refuse credential disclosure, and report suspected attacks using your organization\'s reporting workflow.',
    'course',
    'published',
    'Mike Afurong',
    'MA',
    '/uploads/social-engineering-banner.svg',
    JSON.stringify(themeSettings),
    JSON.stringify(publishSettings),
    now,
    0,
    now,
    now
  );

  // Upsert Lessons
  const upsertLesson = db.prepare(`
    INSERT INTO lessons (id, course_id, title, type, sort_order, blocks, quiz_settings, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      type = excluded.type,
      sort_order = excluded.sort_order,
      blocks = excluded.blocks,
      quiz_settings = excluded.quiz_settings,
      updated_at = excluded.updated_at
  `);

  upsertLesson.run(
    'les-se-1',
    courseId,
    'Spotting Social Engineering: Practical Warning Signs & First-Line Defense',
    'lesson',
    0,
    JSON.stringify(socialEngBlocksL1),
    '{}',
    now,
    now
  );

  upsertLesson.run(
    'les-se-2',
    courseId,
    'Recognizing Email Phishing & Spear Phishing',
    'lesson',
    1,
    JSON.stringify(socialEngBlocksL2),
    '{}',
    now,
    now
  );

  upsertLesson.run(
    'les-se-3',
    courseId,
    'Voice Phishing (Vishing) & Credential Harvesting',
    'lesson',
    2,
    JSON.stringify(socialEngBlocksL3),
    '{}',
    now,
    now
  );

  upsertLesson.run(
    'les-se-4',
    courseId,
    'Incident Reporting & Actionable Job Aid',
    'lesson',
    3,
    JSON.stringify(socialEngBlocksL4),
    '{}',
    now,
    now
  );

  upsertLesson.run(
    'quiz-se-5',
    courseId,
    'Final Assessment: Social Engineering Defense',
    'quiz',
    4,
    JSON.stringify(socialEngBlocksL5),
    JSON.stringify({
      passingScore: 80,
      retries: 'unlimited',
      requirePassingScore: true,
      shuffleQuestions: false,
      shuffleAnswers: false,
      revealAnswers: true,
    }),
    now,
    now
  );

  return getCourseById(courseId)!;
}

// ============================================================================
// WORKSPACE AI CREDITS & USAGE ENGINE
// ============================================================================

export interface WorkspaceCredits {
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  planTier: string;
}

export interface CreditLog {
  id: string;
  action: string;
  creditsCost: number;
  modelUsed: string;
  details?: string;
  createdAt: string;
}

export function getWorkspaceCredits(): WorkspaceCredits {
  const db = getDb();
  let row = db.prepare('SELECT total_credits, used_credits, plan_tier FROM workspace_credits WHERE id = ?').get('default') as {
    total_credits: number;
    used_credits: number;
    plan_tier: string;
  } | undefined;

  if (!row) {
    db.prepare(`
      INSERT OR IGNORE INTO workspace_credits (id, total_credits, used_credits, plan_tier, updated_at)
      VALUES ('default', 25000, 0, 'PRO_STUDIO', ?)
    `).run(new Date().toISOString());
    row = { total_credits: 25000, used_credits: 0, plan_tier: 'PRO_STUDIO' };
  }

  const total = Number(row.total_credits) || 25000;
  const used = Number(row.used_credits) || 0;
  return {
    totalCredits: total,
    usedCredits: used,
    remainingCredits: Math.max(0, total - used),
    planTier: row.plan_tier || 'PRO_STUDIO',
  };
}

export function deductCredits(
  action: string,
  cost: number,
  modelUsed: string,
  details?: string
): { success: boolean; remaining: number; error?: string } {
  const db = getDb();
  const current = getWorkspaceCredits();
  if (current.remainingCredits < cost) {
    return {
      success: false,
      remaining: current.remainingCredits,
      error: `Insufficient AI credits. Required: ${cost}, Remaining: ${current.remainingCredits}. Top up in the sidebar.`,
    };
  }

  const newUsed = current.usedCredits + cost;
  db.prepare(`
    UPDATE workspace_credits
    SET used_credits = ?, updated_at = ?
    WHERE id = 'default'
  `).run(newUsed, new Date().toISOString());

  const logId = `cred-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  db.prepare(`
    INSERT INTO credit_logs (id, action, credits_cost, model_used, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(logId, action, cost, modelUsed, details || '', new Date().toISOString());

  return {
    success: true,
    remaining: Math.max(0, current.totalCredits - newUsed),
  };
}

export function topUpCredits(amount = 10000): WorkspaceCredits {
  const db = getDb();
  const current = getWorkspaceCredits();
  const newTotal = current.totalCredits + amount;
  db.prepare(`
    UPDATE workspace_credits
    SET total_credits = ?, updated_at = ?
    WHERE id = 'default'
  `).run(newTotal, new Date().toISOString());

  const logId = `cred-${Date.now()}-topup`;
  db.prepare(`
    INSERT INTO credit_logs (id, action, credits_cost, model_used, details, created_at)
    VALUES (?, 'Credit Top-Up', ?, 'SYSTEM', 'Balance replenishment', ?)
  `).run(logId, -amount, new Date().toISOString());

  return getWorkspaceCredits();
}

export function resetCredits(): WorkspaceCredits {
  const db = getDb();
  db.prepare(`
    UPDATE workspace_credits
    SET total_credits = 25000, used_credits = 0, updated_at = ?
    WHERE id = 'default'
  `).run(new Date().toISOString());

  const logId = `cred-${Date.now()}-reset`;
  db.prepare(`
    INSERT INTO credit_logs (id, action, credits_cost, model_used, details, created_at)
    VALUES (?, 'Credit Reset', 0, 'SYSTEM', 'Reset balance to 25,000 credits', ?)
  `).run(logId, new Date().toISOString());

  return getWorkspaceCredits();
}

export function getCreditLogs(limit = 20): CreditLog[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, action, credits_cost as creditsCost, model_used as modelUsed, details, created_at as createdAt
    FROM credit_logs
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit) as CreditLog[];
  return rows;
}

// ==========================================
// CHARACTER CUTOUT LIBRARY (8 Flagship Curated Characters with 6 Distinct Expressions)
// ==========================================

const SEED_CHARACTERS = [
  {
    id: 'char-jet',
    name: 'Jet',
    gender: 'male',
    clothing: 'business_casual',
    ageGroup: '20s_30s',
    ethnicity: 'Asian',
    role: 'Product Success Manager & Solutions Architect',
    folder: 'jet',
  },
  {
    id: 'char-terri',
    name: 'Terri',
    gender: 'female',
    clothing: 'corporate',
    ageGroup: '40s_50s',
    ethnicity: 'Black',
    role: 'VP Enterprise Operations & People Strategy',
    folder: 'terri',
  },
  {
    id: 'char-jeremy',
    name: 'Jeremy',
    gender: 'male',
    clothing: 'corporate',
    ageGroup: '20s_30s',
    ethnicity: 'White',
    role: 'Enterprise Strategy Director & Compliance Lead',
    folder: 'jeremy',
  },
  {
    id: 'char-elena',
    name: 'Dr. Elena Ramos',
    gender: 'female',
    clothing: 'medical',
    ageGroup: '20s_30s',
    ethnicity: 'Latina',
    role: 'Chief Medical Officer & Clinical Specialist',
    folder: 'elena',
  },
  {
    id: 'char-marcus',
    name: 'Marcus Vance',
    gender: 'male',
    clothing: 'industry',
    ageGroup: '20s_30s',
    ethnicity: 'Black',
    role: 'Lead Industrial Safety Engineer & Field Inspector',
    folder: 'marcus',
  },
  {
    id: 'char-maya',
    name: 'Maya Patel',
    gender: 'female',
    clothing: 'casual',
    ageGroup: '20s_30s',
    ethnicity: 'South Asian',
    role: 'Lead UX Designer & Creative Technologist',
    folder: 'maya',
  },
  {
    id: 'char-arthur',
    name: 'Arthur Sterling',
    gender: 'male',
    clothing: 'corporate',
    ageGroup: '60s_plus',
    ethnicity: 'White',
    role: 'Executive Managing Partner & Board Advisor',
    folder: 'arthur',
  },
  {
    id: 'char-sarah',
    name: 'Sarah Jenkins',
    gender: 'female',
    clothing: 'business_casual',
    ageGroup: '40s_50s',
    ethnicity: 'White',
    role: 'Director of People Operations & Talent Development',
    folder: 'sarah',
  },
];

export function seedInitialCharacters(db: Database.Database) {
  // Purge any legacy unverified characters first
  try {
    db.prepare(`
      DELETE FROM characters 
      WHERE id NOT IN ('char-jet', 'char-terri', 'char-jeremy', 'char-elena', 'char-marcus', 'char-maya', 'char-arthur', 'char-sarah')
         OR transparent_png_url LIKE '%unsplash%'
         OR transparent_png_url LIKE '%char-%'
    `).run();
  } catch (purgeErr) {
    console.warn('Character table purge note:', purgeErr);
  }

  const insert = db.prepare(`
    INSERT OR REPLACE INTO characters (
      id, name, gender, clothing, age_group, style, crop, ethnicity, role,
      transparent_png_url, expressions, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  for (const c of SEED_CHARACTERS) {
    const pngUrl = `/characters/${c.folder}/neutral.png?v=2`;
    const expressionsMap = {
      neutral: `/characters/${c.folder}/neutral.png?v=2`,
      happy: `/characters/${c.folder}/happy.png?v=2`,
      talking: `/characters/${c.folder}/talking.png?v=2`,
      worried: `/characters/${c.folder}/worried.png?v=2`,
      concerned: `/characters/${c.folder}/worried.png?v=2`,
      frustrated: `/characters/${c.folder}/frustrated.png?v=2`,
      disappointed: `/characters/${c.folder}/frustrated.png?v=2`,
      confused: `/characters/${c.folder}/confused.png?v=2`,
      thinking: `/characters/${c.folder}/confused.png?v=2`,
      presenting: `/characters/${c.folder}/presenting.png?v=2`,
    };

    insert.run(
      c.id,
      c.name,
      c.gender,
      c.clothing,
      c.ageGroup,
      'photographic',
      'half_body',
      c.ethnicity,
      c.role,
      pngUrl,
      JSON.stringify(expressionsMap),
      now,
      now
    );
  }
}

interface CharacterDbRow {
  id: string;
  name: string;
  gender: 'male' | 'female';
  clothing: 'business_casual' | 'casual' | 'corporate' | 'industry' | 'medical';
  age_group: '20s_30s' | '40s_50s' | '60s_plus';
  style: 'photographic' | 'illustrated';
  crop: 'half_body' | 'full_body' | 'headshot';
  ethnicity?: string | null;
  role?: string | null;
  transparent_png_url: string;
  expressions: string;
  created_at: string;
  updated_at: string;
}

function mapCharacterRow(row: CharacterDbRow): CharacterItem {
  let parsedExpressions: Record<CharacterPose, string>;
  try {
    parsedExpressions = typeof row.expressions === 'string' ? JSON.parse(row.expressions) : row.expressions;
  } catch {
    parsedExpressions = {
      neutral: row.transparent_png_url,
      talking: row.transparent_png_url,
      happy: row.transparent_png_url,
      concerned: row.transparent_png_url,
      frustrated: row.transparent_png_url,
      confused: row.transparent_png_url,
      presenting: row.transparent_png_url,
    };
  }

  return {
    id: row.id,
    name: row.name,
    gender: row.gender,
    clothing: row.clothing,
    ageGroup: row.age_group,
    style: row.style,
    crop: row.crop,
    ethnicity: row.ethnicity || undefined,
    role: row.role || undefined,
    transparentPngUrl: row.transparent_png_url,
    expressions: parsedExpressions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getCharacters(filters?: {
  clothing?: string;
  gender?: string;
  ageGroup?: string;
  style?: string;
  search?: string;
}): CharacterItem[] {
  const db = getDb();
  let query = 'SELECT * FROM characters WHERE 1=1';
  const params: string[] = [];

  if (filters?.clothing && filters.clothing !== 'all') {
    query += ' AND clothing = ?';
    params.push(filters.clothing);
  }
  if (filters?.gender && filters.gender !== 'all') {
    query += ' AND gender = ?';
    params.push(filters.gender);
  }
  if (filters?.ageGroup && filters.ageGroup !== 'all') {
    query += ' AND age_group = ?';
    params.push(filters.ageGroup);
  }
  if (filters?.style && filters.style !== 'all') {
    query += ' AND style = ?';
    params.push(filters.style);
  }
  if (filters?.search && filters.search.trim()) {
    query += ' AND (name LIKE ? OR role LIKE ? OR ethnicity LIKE ?)';
    const term = `%${filters.search.trim()}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY created_at ASC';
  const rows = db.prepare(query).all(...params) as CharacterDbRow[];
  return rows.map(mapCharacterRow);
}

export function getCharacterById(id: string): CharacterItem | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(id) as CharacterDbRow | undefined;
  if (!row) return null;
  return mapCharacterRow(row);
}

export function createCharacter(char: Omit<CharacterItem, 'createdAt' | 'updatedAt'>): CharacterItem {
  const db = getDb();
  const now = new Date().toISOString();
  const expressionsStr = typeof char.expressions === 'string' ? char.expressions : JSON.stringify(char.expressions);

  db.prepare(`
    INSERT INTO characters (
      id, name, gender, clothing, age_group, style, crop, ethnicity, role,
      transparent_png_url, expressions, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    char.id,
    char.name,
    char.gender,
    char.clothing,
    char.ageGroup,
    char.style || 'illustrated',
    char.crop || 'half_body',
    char.ethnicity || '',
    char.role || '',
    char.transparentPngUrl,
    expressionsStr,
    now,
    now
  );

  return {
    ...char,
    createdAt: now,
    updatedAt: now,
  };
}

export function deleteCharacter(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM characters WHERE id = ?').run(id);
  return result.changes > 0;
}



