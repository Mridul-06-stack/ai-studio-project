# MIAA — Mock Interview Agent Assistant

MIAA (Mock Interview Agent Assistant) is an AI-powered technical and behavioral interview preparation workbench that parses a candidate's resume and target job description to conduct realistic, multi-track mock interviews with a split-pane code/system-design editor, on-demand real-time coaching hints, and comprehensive post-session evaluation reports.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following core product decisions have been locked in based on your specifications:

- **Confirmed Decision 1 — Interaction Modality**: **Text Chat & Code/Architecture Editor Focus**. Candidates interact through a responsive conversational interviewer thread paired side-by-side with a multi-language code editor and system design workspace.
- **Confirmed Decision 2 — Interview Preparation Tracks**: **Resume & Job Description Parsing**, **Behavioral & Leadership Rounds**, and **Technical Coding & System Design**. Sessions dynamically tailor questions to skill gaps and role requirements extracted from the candidate's resume and target job posting.
- **Confirmed Decision 3 — Feedback & Coaching Depth**: **Real-Time Hints During the Interview + Post-Session Summary Report**. Candidates can request contextual, non-spoiling hints (STAR framework nudges, algorithmic complexity clues, or edge-case prompts) mid-interview, and conclude with a structured scorecard and question-by-question breakdown.

---

## 1. Overview & Core Concept

- **What It Does**: MIAA transforms static interview prep into an adaptive, role-specific simulation. Candidates paste or upload their resume and a target job description (or pick from curated FAANG/startup role presets), choose an interview track (Behavioral & Leadership, Technical Coding, or System Design), and enter a distraction-free interview workbench. During the session, the AI interviewer probes depth, inspects live code or architecture notes, offers tiered hints on demand, and compiles an actionable evaluation report upon completion.
- **Target Audience / Persona**: Software engineers, tech leads, and engineering candidates preparing for behavioral screens, algorithmic coding rounds, and system architecture interviews.
- **Key Value**: Bridges the gap between solo practice (LeetCode/static flashcards) and live human mock interviews by combining resume-aware questioning, live code inspection, progressive hints that prevent getting stuck, and concrete answer rewrites.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Context & Role Setup (Prep Studio)**:
   - Candidates input or upload their **Resume** and **Target Job Description** (or load instant role templates such as *Senior Full-Stack Engineer*, *Backend Distributed Systems Engineer*, or *Engineering Manager*).
   - Clicking **Analyze Alignment** extracts key skills, experience highlights, potential probe areas, and generates a tailored 4-question interview plan across the selected track (**Behavioral & Leadership**, **Technical Coding**, or **System Design**).
2. **Active Interview Workbench**:
   - **Left Pane (Interviewer Thread & Coaching Drawer)**: Displays the current question progression (`Question 2 of 4 · Technical Coding`), full conversational transcript with the AI interviewer, and a collapsible **Real-Time Hint Drawer** offering 3 progressive hint tiers (*Conceptual Nudge*, *Approach / Framework*, *Edge Case Check*).
   - **Right Pane (Interactive Code & System Design Studio)**:
     - In **Technical Coding** mode: Language selector (`TypeScript`, `Python`, `Java`, `Go`, `C++`), syntax-styled code editor with starter boilerplate, complexity notes, a **Run Dry-Run / Analyze Code** action that checks logic and edge cases, and **Submit Solution to Interviewer**.
     - In **System Design** mode: Structured architecture scratchpad with sections for *Capacity Estimation*, *API Contract*, *Data Model*, *High-Level Components*, and *Bottlenecks & Scaling*, synced directly with the interviewer's follow-up questions.
     - In **Behavioral & Leadership** mode: Interactive **STAR Framework Scratchpad** (*Situation*, *Task*, *Action*, *Result*) that helps candidates structure key bullet points before sending their response.
3. **Post-Interview Summary Report & History**:
   - At any point after answering questions (or completing all rounds), clicking **Complete & Generate Report** produces a comprehensive evaluation containing:
     - Overall readiness rating and competency breakdown (*Problem Solving*, *Technical Depth*, *Communication & Structure*, *Role Alignment*).
     - Question-by-question review comparing the candidate's response/code against an ideal senior-level exemplar response.
     - Prioritized action items and saved session history in local storage for tracking progress across multiple mock sessions.

### Visual Identity & Theme

- **Aesthetic Direction**: High-craft developer workspace and executive assessment studio inspired by Linear and Raycast—calm, razor-sharp, high-contrast dark slate surfaces with zero visual clutter.
- **Color Palette & Mood (60-30-10 Discipline)**:
  - **60% Dominant Neutral Canvas**: Deep obsidian slate (`#0B0F17` primary canvas, `#111827` workspace panels) with crisp off-white typography (`#F8FAFC`).
  - **30% Structural Surfaces**: Subdued panel containers (`#1E293B/60`), 1px hairline borders (`border-slate-800`), and muted secondary text (`#94A3B8`) with typographic dot separators (`·`).
  - **10% Accent Budget**: Electric indigo (`#6366F1` / `indigo-500`) for primary CTAs and active track indicators, paired with semantic status pairings (`#16A34A` Emerald with explicit text labels for strong rubric items, `#D97706` Amber for hints/warnings, `#DC2626` Crimson for critical gaps).
- **Typography & Hierarchy (2+1 Font Rule)**:
  - **Display & Navigation**: `Plus Jakarta Sans` (SemiBold/Bold 600–700) for workspace headers, section titles, and structured rubrics (`text-wrap: balance`).
  - **Body Prose & Transcript**: `Public Sans` (Regular 400, Medium 500) at `15px` with `1.6` line height for comfortable reading across long interview dialogues.
  - **Monospace & Telemetry**: `JetBrains Mono` with `tabular-nums` for the code editor, session timer, question counters, complexity metrics, and rubric scores.
- **Component Styling & Layout**:
  - **Top Bar Contract**: Strict single-row, three-zone header separated by `gap-8`:
    1. *Brand Zone*: Single-line `MIAA` wordmark (`whitespace-nowrap shrink-0`).
    2. *Navigation Zone*: 4 concise single-line links (`Prep Studio`, `Live Workbench`, `Evaluation Report`, `Session History`).
    3. *Primary Action Zone*: 1 primary CTA button (`Start Mock Session` or `Finish & Evaluate` depending on active state).
  - **Zero-Pill Metadata Discipline**: All question metadata, track labels, timestamps, and difficulty indicators render as quiet inline text separated by `·` or `/`—never wrapped in static pill badges.
  - **Single-Elevation Depth**: Flat split-pane panels divided by `1px solid` hairline borders with container outer padding (`24px`) $\ge$ inner child gaps (`16px`).

### Interactive Feedback & Motion

- Smooth compositor-only transitions (`opacity`, `transform` within `150ms`) when switching between interview tracks, opening the Real-Time Hint Drawer, or transitioning from the live workbench to the evaluation report.
- Deterministic loading skeletons matching transcript bubbles and scorecard rows during AI generation, plus instant preset filling so candidates can test a full session in one click.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Unified Server-Side Gemini Architecture with `gemini-3.8-flash`**
  - *Chosen Approach*: Route all AI operations through an Express backend (`/api/miaa/*`) using `@google/genai` and `gemini-3.8-flash` with structured JSON schemas (`Type.OBJECT`) where appropriate.
  - *Why*: Keeps the `GEMINI_API_KEY` strictly server-side, guarantees sub-second response latency for conversational follow-ups and real-time hints, and works seamlessly out of the box without requiring paid-model unlocking flows.
  - *Alternatives Considered*: Using heavier reasoning models with high thinking budgets—passed over for live chat turns because interview dialogue and on-demand hints require snappy, conversational responsiveness.
- **Decision 2: Track-Aware Right-Hand Workspace (Code + System Design + STAR)**
  - *Chosen Approach*: Dynamically adapt the right-hand editor panel to the active question's track while automatically attaching the candidate's current editor content to every chat turn and hint request.
  - *Why*: Ensures the AI interviewer has live visibility into what the candidate has written in their code editor or architecture notes without requiring manual copy-pasting into the chat box.
- **Decision 3: Progressive 3-Tier Real-Time Coaching Hints**
  - *Chosen Approach*: Provide structured hints in three escalating levels (*Level 1: Conceptual Direction*, *Level 2: Framework / Data Structure*, *Level 3: Edge Case & Complexity Check*) rather than giving away the full answer immediately.
  - *Why*: Mirrors how a real human interviewer nudges a candidate during a live round while preserving the learning value of solving the problem.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        Top Navigation Bar (3-Zone Contract)                  │
│   [MIAA]        [Prep Studio · Live Workbench · Report · History]    [CTA]   │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌──────────────────────┐
│   1. Prep Studio    │     │  2. Live Workbench  │     │ 3. Evaluation Report │
│ ─────────────────── │     │ ─────────────────── │     │ ──────────────────── │
│ • Resume Input      │     │ ┌─────────────────┐ │     │ • Overall Scorecard  │
│ • Job Desc Input    │     │ │ Interview Chat  │ │     │ • 4-Pillar Rubric    │
│ • Role Presets      │     │ │ + Hint Drawer   │ │     │ • Q&A Exemplar Diff  │
│ • Alignment Parser  │     │ └────────┬────────┘ │     │ • Actionable Roadmap │
│ • Track & Question  │     │          │Sync      │     │ • LocalStorage Sync  │
│   Plan Generator    │     │ ┌────────▼────────┐ │     └──────────────────────┘
└──────────┬──────────┘     │ │ Adaptive Studio │ │                 ▲
           │                │ │ • Code Editor   │ │                 │
           │                │ │ • SysDesign Pad │ │                 │
           │                │ │ • STAR Builder  │ │                 │
           │                │ └────────┬────────┘ │                 │
           └───────────────────────────┼──────────┴─────────────────┘
                                       │ HTTP JSON (/api/miaa/*)
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     Express Backend Proxy (server.ts)                        │
│ ──────────────────────────────────────────────────────────────────────────── │
│ • POST /api/miaa/parse-context   -> Extracts skills, gaps & 4-question plan  │
│ • POST /api/miaa/interview-turn  -> Contextual interviewer reply + follow-up │
│ • POST /api/miaa/request-hint    -> Generates 3-tier hint from chat + editor │
│ • POST /api/miaa/analyze-code    -> Dry-run complexity & bug analysis        │
│ • POST /api/miaa/evaluate        -> Structured JSON post-interview report    │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ @google/genai (gemini-3.8-flash)
                                       ▼
                           [ Google Gemini API Server-Side ]
```

### Data Model & State

- **`InterviewContext`**: Stores `candidateName`, `targetRole`, `companyName`, `resumeText`, `jobDescriptionText`, `selectedTracks` (`behavioral` | `coding` | `system_design`), `difficulty` (`mid` | `senior` | `staff`), and parsed `alignmentSummary` (`matchedSkills`, `focusAreas`, `tailoredQuestions`).
- **`InterviewQuestion`**: Represents each planned round item with `id`, `track`, `title`, `prompt`, `starterCode`, `language`, `evaluationCriteria`, and `completed` status.
- **`ChatMessage`**: Stores `id`, `sender` (`interviewer` | `candidate` | `system`), `content`, `timestamp`, `questionId`, and optional `codeSnapshot`.
- **`HintRecord`**: Stores `questionId`, `tier` (`1 | 2 | 3`), `hintTitle`, `hintContent`, and `timestamp`.
- **`EvaluationReport`**: Structured post-interview assessment containing `overallScore`, `verdict`, `competencyScores` (`problemSolving`, `technicalDepth`, `communication`, `roleAlignment`), `strengths`, `growthAreas`, and `questionBreakdowns` (each with `candidateSummary`, `score`, `feedback`, and `idealAnswer`).

### Interactive Component & State Mapping

- **Resume & JD Parser Flow**: Clicking *Analyze & Build Interview Plan* sends `resumeText`, `jobDescriptionText`, and selected tracks to `POST /api/miaa/parse-context`. Populates the alignment summary and custom question queue; includes a 1-click *Load Sample Candidate & Role* selector for immediate testing.
- **Live Interview Turn & Editor Sync**: Sending a message or clicking *Submit Solution to Interviewer* dispatches the conversation history, active question, and current code/architecture/STAR editor buffer to `POST /api/miaa/interview-turn`. The interviewer either asks a targeted probing follow-up or transitions to the next planned question.
- **Code Dry-Run & Complexity Analyzer**: Clicking *Analyze Code* in the coding studio calls `POST /api/miaa/analyze-code` to return time/space complexity (`Big-O`), edge-case coverage, and syntax/logic feedback directly inside the editor console drawer.
- **On-Demand Real-Time Hints**: Clicking *Get Coaching Hint* calls `POST /api/miaa/request-hint` with the current transcript and editor snapshot, unlocking progressive Tier 1, Tier 2, and Tier 3 hints without spoiling the complete solution.
- **Final Report Generation & History Persistence**: Clicking *Complete & Generate Report* calls `POST /api/miaa/evaluate`, renders the full scorecard view, and persists the completed session to `localStorage` so candidates can revisit past interviews in the *Session History* view.
