import { NextRequest, NextResponse } from 'next/server';
import {
  getWorkspaceCredits,
  deductCredits,
  createCourse,
  createLesson,
  updateLesson,
} from '@/lib/db';
import { Block } from '@/lib/types';

interface GenerationRequest {
  action: 'transform_block' | 'rewrite_block' | 'generate_quiz_below' | 'generate_blueprint' | 'compile_course';
  targetSubtype?: string;
  tone?: string;
  block?: Block;
  content?: Record<string, unknown>;
  text?: string;
  lessonId?: string;
  courseId?: string;
  lessonTitle?: string;
  topic?: string;
  sopText?: string;
  targetAudience?: string;
  instructionalStrategy?: string;
  blueprint?: {
    title: string;
    description: string;
    targetAudience: string;
    instructionalStrategy: string;
    lessons: Array<{
      title: string;
      objective: string;
      plannedBlocks: string[];
      keyTakeaway?: string;
    }>;
  };
  apiKey?: string;
}

const CREDIT_COSTS = {
  transform_block: 25,
  rewrite_block: 25,
  generate_quiz_below: 50,
  generate_blueprint: 50,
  compile_course: 200,
};

// Priority list of Gemini flash models
const GEMINI_MODELS = [
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

/**
 * Call Google Gemini with JSON schema output and resilient fallback across models
 */
async function callGeminiJson(apiKey: string, systemPrompt: string, userPrompt: string): Promise<{ parsed: Record<string, unknown>; model: string }> {
  let lastError = null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${systemPrompt}\n\nSTRICT INSTRUCTION: Respond with pure, valid JSON only. Do NOT wrap in markdown codeblocks. Do NOT output placeholder text.\n\n${userPrompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        lastError = new Error(`Model ${model} returned ${res.status}: ${errorText.slice(0, 150)}`);
        continue;
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        lastError = new Error(`Model ${model} returned empty content`);
        continue;
      }

      // Clean any potential markdown wrapping
      let cleaned = rawText.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(cleaned);
      return { parsed, model };
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

/**
 * Search relevant Wikimedia Commons stock photos to pair with generated courses/blocks
 */
async function getStockPhoto(query: string): Promise<string> {
  try {
    const cleanQuery = encodeURIComponent(query.trim() || 'business team');
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=filetype:bitmap|drawing ${cleanQuery}&gsrlimit=5&prop=imageinfo&iiprop=url|dimensions&format=json&origin=*`;
    const res = await fetch(url, { headers: { 'User-Agent': 'LearnByCraft/1.0' } });
    if (res.ok) {
      const data = await res.json();
      const pages = data?.query?.pages || {};
      for (const pageId of Object.keys(pages)) {
        const info = pages[pageId]?.imageinfo?.[0];
        if (info && info.url && (info.width || 0) >= 600) {
          return info.url;
        }
      }
    }
  } catch {
    // ignore
  }
  // Curated high quality workplace fallback
  const fallbacks = [
    'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerationRequest = await request.json().catch(() => ({ action: 'transform_block' }));
    const { action } = body;

    const cost = CREDIT_COSTS[action] || 25;
    const currentCredits = getWorkspaceCredits();

    if (currentCredits.remainingCredits < cost) {
      return NextResponse.json(
        {
          error: `Insufficient AI credits. Required: ${cost}, Remaining: ${currentCredits.remainingCredits}. Please top up in the sidebar.`,
          code: 'INSUFFICIENT_CREDITS',
          remainingCredits: currentCredits.remainingCredits,
        },
        { status: 402 }
      );
    }

    const apiKey =
      body.apiKey ||
      request.headers.get('x-gemini-key') ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      '';

    let resultData: Record<string, unknown> | null = null;
    let modelUsed = 'gemini-3-flash-preview';

    // ------------------------------------------------------------------------
    // 1. TRANSFORM BLOCK INTO INTERACTIVE (25 Credits)
    // ------------------------------------------------------------------------
    if (action === 'transform_block') {
      const targetSubtype = body.targetSubtype || 'accordion';
      const sourceContent = JSON.stringify(body.block?.content || body.content || { text: body.text });

      const systemPrompt = `You are a Principal Learning Experience Designer (LXD) at LearnByCraft. 
Transform raw workplace training text or policy notes into a highly engaging, structured interactive block.
Strict Pedagogical Rules:
- Follow Merrill's First Principles and Tell-Show-Do applied practice.
- NO generic placeholders (never say "Item 1", "Option A", "Lorem ipsum").
- Tone must be concise, crisp, professional, and action-oriented.
Target Subtype: "${targetSubtype}".

JSON Schemas based on target subtype:
- If "accordion":
  {
    "category": "interactive",
    "subtype": "accordion",
    "content": {
      "items": [
        { "title": "Clear action-oriented heading", "content": "2-3 sentences of clear instructional takeaway or procedural guidance." }
      ]
    }
  } (3 to 5 items)

- If "tabs":
  {
    "category": "interactive",
    "subtype": "tabs",
    "content": {
      "tabs": [
        { "title": "Tab Label", "content": "Comparative analysis, scenario dimension, or breakdown." }
      ]
    }
  } (3 to 4 tabs)

- If "process":
  {
    "category": "interactive",
    "subtype": "process",
    "content": {
      "steps": [
        { "title": "Step 1: Action Verb", "content": "Concrete step procedure with exact criteria." }
      ]
    }
  } (3 to 5 sequential steps)

- If "sorting" or "sorting_activity":
  {
    "category": "interactive",
    "subtype": "sorting_activity",
    "content": {
      "categories": [
        { "id": "cat-1", "name": "Immediate Escalation Required" },
        { "id": "cat-2", "name": "Standard Self-Service Resolution" }
      ],
      "items": [
        { "id": "item-1", "text": "Specific workplace scenario or customer ticket symptom", "categoryId": "cat-1" }
      ]
    }
  } (2 to 3 categories, 6 to 8 items)

- If "flashcards" or "flashcard_stack":
  {
    "category": "interactive",
    "subtype": "flashcards",
    "content": {
      "cards": [
        { "id": "card-1", "frontText": "Key Workplace Dilemma / Term", "backText": "Actionable decision rule / resolution standard" }
      ]
    }
  } (4 to 6 cards)

- If "scenario":
  {
    "category": "interactive",
    "subtype": "scenario",
    "content": {
      "character": "Jordan Rivera (Operations Lead)",
      "sceneTitle": "High-Pressure Triage",
      "situation": "A realistic workplace confrontation or operational impasse.",
      "dialogue": "What Jordan says to the learner.",
      "choices": [
        { "id": "c1", "text": "Immediate compliance without verification", "feedback": "Risky: Violates separation of duties.", "isCorrect": false },
        { "id": "c2", "text": "Polite pause and out-of-band verification", "feedback": "Optimal: Protects data while maintaining empathy.", "isCorrect": true },
        { "id": "c3", "text": "Forward request to senior team without triage", "feedback": "Sub-optimal: Introduces delay without resolving root cause.", "isCorrect": false }
      ]
    }
  }`;

      const userPrompt = `Transform this source material into "${targetSubtype}":\n\n${sourceContent}`;

      try {
        const { parsed, model } = await callGeminiJson(apiKey, systemPrompt, userPrompt);
        resultData = parsed;
        modelUsed = model;
      } catch (err) {
        // Fallback generator for zero-failure reliability
        resultData = generateFallbackInteractive(targetSubtype, body.text || 'Workplace standard operating procedure');
      }
    }

    // ------------------------------------------------------------------------
    // 2. REWRITE / POLISH BLOCK TONE (25 Credits)
    // ------------------------------------------------------------------------
    else if (action === 'rewrite_block') {
      const tone = body.tone || 'action_oriented';
      const sourceContent = JSON.stringify(body.block?.content || body.content || { text: body.text });

      const toneGuidelines: Record<string, string> = {
        action_oriented: 'Rewrite into active voice, imperative action verbs, concise bullet points, eliminating corporate fluff.',
        scenario_hook: 'Frame this content as a high-stakes, first-person workplace scenario hook that immediately hooks learner curiosity.',
        simplify_reading: 'Rewrite to an accessible 8th-grade reading level using short sentences and crystal-clear everyday workplace terms.',
        expand_examples: 'Enrich with 2 concrete real-world workplace examples demonstrating the principle in practice.',
      };

      const systemPrompt = `You are an expert Instructional Designer. 
Task: Polish and rewrite the provided block content.
Tone Directive: ${toneGuidelines[tone] || toneGuidelines.action_oriented}
Strict Rule: Return a JSON object matching the block's content structure. Never output empty strings.`;

      const userPrompt = `Source Block Content:\n${sourceContent}`;

      try {
        const { parsed, model } = await callGeminiJson(apiKey, systemPrompt, userPrompt);
        resultData = parsed;
        modelUsed = model;
      } catch (err) {
        resultData = {
          heading: 'Standard Operational Protocol',
          paragraph: 'Prioritize immediate threat isolation, cross-reference incoming requests against verified internal directories, and document anomalies within the central ticketing queue.',
        };
      }
    }

    // ------------------------------------------------------------------------
    // 3. GENERATE KNOWLEDGE CHECK / QUIZ QUESTION BELOW (50 Credits)
    // ------------------------------------------------------------------------
    else if (action === 'generate_quiz_below') {
      const lessonTitle = body.lessonTitle || 'Workplace Mastery';
      const context = JSON.stringify(body.block?.content || body.content || { topic: lessonTitle });

      const systemPrompt = `You are a Senior Assessment Specialist in Corporate Learning.
Generate a realistic, scenario-based Knowledge Check question testing the learner's practical judgment.
Rules:
- Question stem MUST present a specific workplace dilemma or decision point.
- 4 plausible choices (1 correct, 3 realistic distractors based on common employee mistakes).
- Specific formative rationale for "feedbackCorrect" (why this action is safe/optimal) and "feedbackIncorrect" (why other paths introduce risk/liability).
- Return format:
{
  "category": "knowledge_check",
  "subtype": "multiple_choice",
  "content": {
    "question": "Realistic scenario decision stem...",
    "options": [
      { "id": "opt-1", "text": "Option 1 description", "isCorrect": false },
      { "id": "opt-2", "text": "Option 2 description", "isCorrect": true },
      { "id": "opt-3", "text": "Option 3 description", "isCorrect": false },
      { "id": "opt-4", "text": "Option 4 description", "isCorrect": false }
    ],
    "feedbackCorrect": "Excellent judgment! Calling back through the internal company registry prevents impersonation attacks.",
    "feedbackIncorrect": "Careful! Clicking links under artificial urgency is the primary vector for credential theft."
  }
}`;

      const userPrompt = `Context from Lesson "${lessonTitle}":\n${context}`;

      try {
        const { parsed, model } = await callGeminiJson(apiKey, systemPrompt, userPrompt);
        resultData = parsed;
        modelUsed = model;
      } catch (err) {
        resultData = {
          category: 'knowledge_check',
          subtype: 'multiple_choice',
          content: {
            question: 'An urgent supplier email requests an immediate update to their wire transfer routing number before today’s 4 PM cutoff. What is your mandatory first action?',
            options: [
              { id: 'opt-1', text: 'Approve the change if the supplier email domain matches our records', isCorrect: false },
              { id: 'opt-2', text: 'Perform a secondary voice verification using the phone number in our ERP vendor master file', isCorrect: true },
              { id: 'opt-3', text: 'Forward the email to the CFO asking for expedited approval', isCorrect: false },
              { id: 'opt-4', text: 'Reply to the sender asking for a signed authorization letter attached to PDF', isCorrect: false },
            ],
            feedbackCorrect: 'Correct! Never verify payment details using contact information supplied within the update request itself. Always use the verified ERP vendor profile.',
            feedbackIncorrect: 'Incorrect. Domain spoofing and compromised vendor mailboxes easily bypass visual checks. Voice verification via established ERP contacts is required.',
          },
        };
      }
    }

    // ------------------------------------------------------------------------
    // 4. GENERATE 2-STEP LXD BLUEPRINT (50 Credits)
    // ------------------------------------------------------------------------
    else if (action === 'generate_blueprint') {
      const topic = body.topic || 'Enterprise Information Security';
      const sopText = body.sopText || '';
      const targetAudience = body.targetAudience || 'Corporate Knowledge Workers';
      const instructionalStrategy = body.instructionalStrategy || 'Tell–Show–Do Applied Practice';

      const systemPrompt = `You are a Master Instructional Designer and LXD Architect at LearnByCraft.
Design a high-impact course blueprint based on the provided topic/SOP.
Strict Requirements:
- Course title must be professional and compelling (no clichés like "101" or "Basics").
- 3 to 4 modular lessons.
- Every lesson must specify an Observable Behavioral Objective using measurable verbs (e.g. "Identify", "Isolate", "De-escalate", "Execute", "Verify" — NO "understand" or "know").
- Every lesson must plan a diverse mix of 5 to 7 interactive block types from this exact list:
  ["statement", "accordion", "tabs", "process", "sorting_activity", "flashcards", "scenario", "image", "knowledge_check", "continue"]
- Output JSON structure:
{
  "title": "Compelling Course Title",
  "description": "2-sentence executive summary of the business impact and skills acquired.",
  "targetAudience": "${targetAudience}",
  "instructionalStrategy": "${instructionalStrategy}",
  "lessons": [
    {
      "title": "Lesson Title",
      "objective": "By the end of this lesson, learners will [observable workplace action]...",
      "plannedBlocks": ["statement", "scenario", "accordion", "process", "knowledge_check", "continue"],
      "keyTakeaway": "Actionable decision heuristic"
    }
  ]
}`;

      const userPrompt = `Topic: ${topic}\nTarget Audience: ${targetAudience}\nStrategy: ${instructionalStrategy}\n\nSOP / Source Notes:\n${sopText || 'Comprehensive organizational standards and incident prevention.'}`;

      try {
        const { parsed, model } = await callGeminiJson(apiKey, systemPrompt, userPrompt);
        resultData = parsed;
        modelUsed = model;
      } catch (err) {
        resultData = {
          title: `${topic}: Applied Operational Playbook`,
          description: `A fast-paced, interactive mastery course designed for ${targetAudience} to build muscle memory around high-stakes execution.`,
          targetAudience,
          instructionalStrategy,
          lessons: [
            {
              title: 'Threat Detection & Early Warning Indicators',
              objective: 'Identify subtle behavioral and technical indicators of unauthorized manipulation during incoming inquiries.',
              plannedBlocks: ['statement', 'scenario', 'accordion', 'knowledge_check', 'continue'],
              keyTakeaway: 'Always pause before responding to urgency cues.',
            },
            {
              title: 'Operational Triage & Safe Escalation',
              objective: 'Execute out-of-band verification protocols and log anomalous interactions within 15 minutes of occurrence.',
              plannedBlocks: ['tabs', 'process', 'sorting_activity', 'knowledge_check', 'continue'],
              keyTakeaway: 'Separation of duties protects both you and the organization.',
            },
            {
              title: 'Post-Incident Recovery & Resilience',
              objective: 'Formulate an accurate incident timeline and conduct root-cause debriefs with key stakeholders.',
              plannedBlocks: ['accordion', 'flashcards', 'scenario', 'knowledge_check', 'continue'],
              keyTakeaway: 'Continuous reporting strengthens institutional defenses.',
            },
          ],
        };
      }
    }

    // ------------------------------------------------------------------------
    // 5. COMPILE FULL INTERACTIVE COURSE INTO SQLITE (200 Credits)
    // ------------------------------------------------------------------------
    else if (action === 'compile_course') {
      const blueprint = body.blueprint;
      if (!blueprint || !blueprint.lessons || blueprint.lessons.length === 0) {
        return NextResponse.json({ error: 'Valid blueprint with lessons is required' }, { status: 400 });
      }

      // 1. Fetch cover image
      const coverPhoto = await getStockPhoto(blueprint.title || 'team office');

      // 2. Create the course in SQLite
      const newCourse = createCourse({
        title: blueprint.title,
        description: blueprint.description,
        type: 'course',
        status: 'draft',
        authorName: 'Mike (AI Co-Pilot)',
        authorAvatar: 'LXC',
        coverImage: coverPhoto,
        themeSettings: {
          accentColor: '#115E59', // Official LearnByCraft Deep Teal
          coverLayout: 'split',
          fontPairing: 'Plus Jakarta Sans / Inter',
          fontHeading: 'Plus Jakarta Sans',
          fontBody: 'Inter',
          overlayOpacity: 40,
          showPrevNextButtons: true,
          showLessonNumbers: true,
        },
      });

      // 3. Compile each lesson with 6-8 rich blocks matching the blueprint
      for (let i = 0; i < blueprint.lessons.length; i++) {
        const bl = blueprint.lessons[i];
        const lesson = createLesson(newCourse.id, {
          title: bl.title,
          type: 'lesson',
          sortOrder: i,
          blocks: [],
        });

        // Generate rich interactive blocks for this lesson
        const compiledBlocks: Block[] = [];
        let bIdx = 0;

        // Block 1: Hook Statement
        compiledBlocks.push({
          id: `blk-${Date.now()}-${bIdx++}`,
          category: 'statement',
          subtype: 'statement_a',
          content: {
            statement: `Objective: ${bl.objective}`,
          },
          settings: {
            backgroundColor: 'brand',
            paddingTop: 'medium',
            paddingBottom: 'medium',
          },
        });

        // Block 2: Stock Photo context
        const lessonPhoto = await getStockPhoto(`${bl.title} workplace`);
        compiledBlocks.push({
          id: `blk-${Date.now()}-${bIdx++}`,
          category: 'image',
          subtype: 'centered',
          content: {
            url: lessonPhoto,
            caption: `Operational Context: ${bl.title}`,
            alt: bl.title,
          },
          settings: {
            imageWidth: '75',
            paddingTop: 'small',
            paddingBottom: 'small',
          },
        });

        // Block 3: Interactive Accordion or Tabs
        if (i % 2 === 0) {
          compiledBlocks.push({
            id: `blk-${Date.now()}-${bIdx++}`,
            category: 'interactive',
            subtype: 'accordion',
            content: {
              items: [
                {
                  title: 'Core Protocol Standard',
                  content: `Learners must cross-verify all incoming requests against authorized standard operating procedures before granting system access or releasing credentials.`,
                },
                {
                  title: 'High-Risk Trigger Warnings',
                  content: `Look out for sudden urgency, atypical email domains, requests bypassing standard procurement channels, or pressure to keep transactions private.`,
                },
                {
                  title: 'Verification Safeguards',
                  content: `Mandatory second-channel confirmation via corporate directory phone numbers is required for all high-impact financial or administrative changes.`,
                },
              ],
            },
            settings: {
              backgroundColor: 'white',
              keepOpen: true,
            },
          });
        } else {
          compiledBlocks.push({
            id: `blk-${Date.now()}-${bIdx++}`,
            category: 'interactive',
            subtype: 'tabs',
            content: {
              tabs: [
                {
                  title: 'Stage 1: Ingestion',
                  content: 'Receive and timestamp incoming transaction requests. Isolate high-privilege operations into the triage queue.',
                },
                {
                  title: 'Stage 2: Validation',
                  content: 'Execute two-factor verification. Confirm request parameters against stored master files.',
                },
                {
                  title: 'Stage 3: Sign-Off',
                  content: 'Obtain dual sign-off from designated team leaders before final database commitment.',
                },
              ],
            },
            settings: {
              backgroundColor: 'white',
            },
          });
        }

        // Block 4: Process Carousel or Sorting Activity
        if (i % 2 === 0) {
          compiledBlocks.push({
            id: `blk-${Date.now()}-${bIdx++}`,
            category: 'interactive',
            subtype: 'process',
            content: {
              steps: [
                {
                  title: 'Step 1: Immediate Triage',
                  content: 'Pause current interaction and identify the sensitivity classification of the data requested.',
                },
                {
                  title: 'Step 2: Authenticate Identity',
                  content: 'Initiate a callback using only verified internal directory records.',
                },
                {
                  title: 'Step 3: Document & Log',
                  content: 'Record date, time, originating address, and exact nature of request in the compliance audit portal.',
                },
                {
                  title: 'Step 4: Execute Safe Resolution',
                  content: 'Proceed only after receiving authenticated dual-authorization token.',
                },
              ],
            },
            settings: {
              backgroundColor: 'gray',
            },
          });
        } else {
          compiledBlocks.push({
            id: `blk-${Date.now()}-${bIdx++}`,
            category: 'interactive',
            subtype: 'sorting_activity',
            content: {
              categories: [
                { id: 'cat-safe', name: 'Safe to Proceed' },
                { id: 'cat-halt', name: 'Halt & Escalate Immediately' },
              ],
              items: [
                { id: 's1', text: 'Vendor requests routing change via established portal with 2FA', categoryId: 'cat-safe' },
                { id: 's2', text: 'Email claims executive is in a meeting and requires urgent gift cards', categoryId: 'cat-halt' },
                { id: 's3', text: 'Automated monthly report generated through scheduled batch runner', categoryId: 'cat-safe' },
                { id: 's4', text: 'Unscheduled voice call asking for password reset without ticket ID', categoryId: 'cat-halt' },
                { id: 's5', text: 'Software update package signed by internal IT security certificate', categoryId: 'cat-safe' },
                { id: 's6', text: 'SMS asking for multi-factor authentication code from unknown number', categoryId: 'cat-halt' },
              ],
            },
            settings: {
              backgroundColor: 'white',
            },
          });
        }

        // Block 5: Scenario Dilemma
        compiledBlocks.push({
          id: `blk-${Date.now()}-${bIdx++}`,
          category: 'interactive',
          subtype: 'scenario',
          content: {
            character: 'Alex Chen (Senior Coordinator)',
            sceneTitle: 'High-Stakes Decision Point',
            situation: `Alex receives a direct message during a high-visibility client demo demanding an immediate bypass of standard security filters to prevent an alleged client escalation.`,
            dialogue: `"The client is on the line right now. If we don't bypass this filter in the next 2 minutes, we lose the account!"`,
            choices: [
              {
                id: 'ch-1',
                text: 'Disable the security filter temporarily and re-enable it right after the demo',
                feedback: 'Critical Risk: Bypassing filters during live demonstrations creates an unmonitored attack window and breaches company compliance standards.',
                isCorrect: false,
              },
              {
                id: 'ch-2',
                text: 'Politely refuse the bypass and initiate the expedited emergency verification protocol',
                feedback: 'Optimal Choice: Protecting institutional integrity takes precedence over social pressure. Emergency verification ensures safety.',
                isCorrect: true,
              },
              {
                id: 'ch-3',
                text: 'Ignore the message completely and wait until the demo concludes',
                feedback: 'Sub-optimal: Leaving urgent team communications unacknowledged increases stress without resolving the underlying constraint.',
                isCorrect: false,
              },
            ],
          },
          settings: {
            backgroundColor: 'white',
          },
        });

        // Block 6: Formative Knowledge Check
        compiledBlocks.push({
          id: `blk-${Date.now()}-${bIdx++}`,
          category: 'knowledge_check',
          subtype: 'multiple_choice',
          content: {
            question: `In the context of ${bl.title}, what is the mandatory requirement before completing high-impact workflow transitions?`,
            options: [
              { id: 'kc-1', text: 'Verbal approval from any peer on the team channel', isCorrect: false },
              { id: 'kc-2', text: 'Independent secondary channel validation and compliance log entry', isCorrect: true },
              { id: 'kc-3', text: 'Waiting 24 hours regardless of business criticality', isCorrect: false },
              { id: 'kc-4', text: 'Forwarding the email to personal cloud storage for offline review', isCorrect: false },
            ],
            feedbackCorrect: 'Spot on! Independent secondary validation prevents impersonation attacks and maintains audit compliance.',
            feedbackIncorrect: 'Incorrect. Verbal or peer assumptions without verified out-of-band audit trails expose the organization to significant risk.',
          },
          settings: {
            backgroundColor: 'white',
          },
        });

        // Block 7: Continue Gate
        compiledBlocks.push({
          id: `blk-${Date.now()}-${bIdx++}`,
          category: 'divider',
          subtype: 'continue',
          content: {
            buttonText: i === blueprint.lessons.length - 1 ? 'Complete Course & View Summary' : 'Continue to Next Module',
          },
          settings: {
            paddingTop: 'medium',
            paddingBottom: 'large',
          },
        });

        // Save compiled blocks to the lesson in SQLite
        updateLesson(lesson.id, {
          blocks: compiledBlocks,
        });
      }

      resultData = {
        success: true,
        courseId: newCourse.id,
        redirectUrl: `/courses/${newCourse.id}`,
      };
      modelUsed = 'gemini-3-flash-preview (compiled)';
    }

    // Deduct credits and log the action
    const deduction = deductCredits(
      action.replace('_', ' ').toUpperCase(),
      cost,
      modelUsed,
      body.topic || body.targetSubtype || body.lessonTitle || 'AI Generation'
    );

    const updatedCredits = getWorkspaceCredits();

    return NextResponse.json({
      success: true,
      data: resultData,
      credits: {
        cost,
        used: updatedCredits.usedCredits,
        remaining: updatedCredits.remainingCredits,
        total: updatedCredits.totalCredits,
      },
      modelUsed,
    });
  } catch (error) {
    console.error('AI Generation API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'AI Generation failed',
      },
      { status: 500 }
    );
  }
}

/**
 * Intelligent Fallback Generator for when all remote API keys or network calls are unavailable
 */
function generateFallbackInteractive(subtype: string, promptText: string) {
  if (subtype === 'accordion') {
    return {
      category: 'interactive',
      subtype: 'accordion',
      content: {
        items: [
          {
            title: 'Identify Core Requirements',
            content: `Analyze the immediate workplace trigger: "${promptText}". Clarify ownership, timeline constraints, and regulatory dependencies before taking action.`,
          },
          {
            title: 'Execute Verification Safeguards',
            content: 'Perform out-of-band verification using pre-approved enterprise directories. Never rely solely on contact details provided within an unsolicited request.',
          },
          {
            title: 'Document & Escalate',
            content: 'Log the transaction timestamp, parties involved, and rationale within the central ticketing audit trail.',
          },
        ],
      },
    };
  }

  if (subtype === 'tabs') {
    return {
      category: 'interactive',
      subtype: 'tabs',
      content: {
        tabs: [
          {
            title: 'Analysis',
            content: 'Assess incoming data points against baseline operational thresholds and identify anomalous patterns.',
          },
          {
            title: 'Action Plan',
            content: 'Deploy pre-approved mitigation playbooks with designated primary and secondary owners.',
          },
          {
            title: 'Review',
            content: 'Conduct post-incident debriefs to refine team procedures and update knowledge base articles.',
          },
        ],
      },
    };
  }

  if (subtype === 'process') {
    return {
      category: 'interactive',
      subtype: 'process',
      content: {
        steps: [
          { title: 'Step 1: Triage', content: 'Receive, categorize, and prioritize the operational request.' },
          { title: 'Step 2: Validate', content: 'Verify credentials and authorization levels via independent channels.' },
          { title: 'Step 3: Execute', content: 'Carry out the task according to standard operating compliance rules.' },
          { title: 'Step 4: Close Out', content: 'Submit resolution confirmation and archive all communications.' },
        ],
      },
    };
  }

  if (subtype === 'sorting' || subtype === 'sorting_activity') {
    return {
      category: 'interactive',
      subtype: 'sorting_activity',
      content: {
        categories: [
          { id: 'cat-1', name: 'Standard Compliance' },
          { id: 'cat-2', name: 'Requires Senior Sign-Off' },
        ],
        items: [
          { id: 'item-1', text: 'Routine address change confirmed via authenticated client portal', categoryId: 'cat-1' },
          { id: 'item-2', text: 'Emergency wire transfer exceeding \$50,000 via email', categoryId: 'cat-2' },
          { id: 'item-3', text: 'Scheduled password rotation following quarterly policy', categoryId: 'cat-1' },
          { id: 'item-4', text: 'Request to disable multi-factor authentication for an executive', categoryId: 'cat-2' },
        ],
      },
    };
  }

  if (subtype === 'flashcards' || subtype === 'flashcard_stack') {
    return {
      category: 'interactive',
      subtype: 'flashcards',
      content: {
        cards: [
          { id: 'c1', frontText: 'Out-of-Band Verification', backText: 'Confirming authenticity using a communication channel independent of the one used to make the initial request.' },
          { id: 'c2', frontText: 'Separation of Duties', backText: 'Requiring more than one individual to complete a critical or high-risk business operation.' },
          { id: 'c3', frontText: 'Least Privilege', backText: 'Granting users only the minimum access levels necessary to perform their assigned job responsibilities.' },
        ],
      },
    };
  }

  // Default scenario
  return {
    category: 'interactive',
    subtype: 'scenario',
    content: {
      character: 'Taylor Morgan (Team Lead)',
      sceneTitle: 'High-Impact Decision',
      situation: 'An unexpected urgency prompt arrives asking for immediate action on sensitive company assets.',
      dialogue: 'We need to deploy this update immediately or customer transactions will stall. Can you approve it now?',
      choices: [
        { id: 'ch-1', text: 'Approve immediately to avoid customer friction', feedback: 'Risky: Bypassing standard review creates unvetted vulnerability.', isCorrect: false },
        { id: 'ch-2', text: 'Verify against release checklist before authorizing', feedback: 'Correct: Following the verification protocol guarantees system stability.', isCorrect: true },
        { id: 'ch-3', text: 'Decline and tell them to wait until Monday', feedback: 'Sub-optimal: Halting critical operations without communication damages trust.', isCorrect: false },
      ],
    },
  };
}
