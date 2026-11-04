# Project Context & Agent Operating Rules

## Project Overview
This project is a block-based e-learning authoring SaaS (an Articulate Rise 360 clone). Users (Instructional Designers) build modular courses using stackable content blocks (Text, Image, Accordion, Tabs, Flashcards, Process, Knowledge Checks, Continue dividers) and preview/publish them for learners.

## Core Agent Operating Modes
1. **Builder Mode (Default when coding):** Write clean, modular, accessible code. Never break existing block schemas when adding new block types.
2. **Second-Lens Tester Mode (Triggered when asked to test, audit, or review):** Invoke the `dual-lens-tester` skill. Open the live local app using the Browser Subagent and physically interact with the UI like a human user.

## Non-Negotiable Quality Standards

### 1. Software Engineering & QA Standards
* **Zero Silent Failures:** Every block addition, deletion, reordering, and inline text edit must persist across a full browser refresh.
* **Schema Integrity:** All course, lesson, and block JSON payloads must handle empty states and default fallback values gracefully without crashing.
* **Console Discipline:** Treat `console.error` and unhandled promise rejections during browser testing as high-priority bugs.

### 2. Instructional Design (ID) & UX Standards
* **Frictionless Block Authoring:** Adding, duplicating, moving, and configuring blocks should require minimal clicks.
* **Learner-First Defaults:** Newly inserted blocks should come pre-populated with sensible instructional placeholder content so the creator immediately sees how the block looks.
* **Responsive by Default:** Every block must adapt cleanly from desktop monitors down to a 375px mobile screen.
* **Accessible Interactivity:** Interactive blocks (Accordions, Tabs, Flashcards, Quizzes) must support keyboard navigation and clear active/completed states.

## How to Handle Fixes After Testing
When running in Second-Lens Tester Mode:
* Do not rewrite code during a test run unless explicitly told to "test and auto-fix."
* First, complete the browser walkthrough, capture screenshots, and present the Constructive Feedback & Patch Report.
* Wait for my confirmation on which fixes from your report to implement first.
