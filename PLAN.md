# Vault Recall - Implementation Plan

## Overview

This document outlines the implementation plan for the Vault Recall Obsidian plugin. The plugin turns notes into quizzes for active recall practice, with AI-powered question generation handled externally by Claude Code.

---

## Phase 1: Core Infrastructure

### 1.1 Project Structure

```
src/
├── main.ts                    # Plugin entry point
├── settings.ts                # Settings tab
├── types.ts                   # TypeScript interfaces
├── constants.ts               # Constants and defaults
├── utils/
│   └── helpers.ts             # Misc helpers (ID generation, date formatting)
├── services/
│   ├── file-service.ts        # File I/O operations
│   ├── validation-service.ts  # Schema validation
│   ├── quiz-service.ts        # Quiz state management
│   ├── streak-service.ts      # Streak tracking logic
│   └── import-service.ts      # Question import orchestration
├── views/
│   ├── sidebar-view.ts        # Main sidebar view
│   └── quiz-modal.ts          # Quiz taking modal
└── components/
    ├── question-renderer.ts   # Renders different question types
    └── stats-display.ts       # Streak/stats UI component
```

### 1.2 Types (types.ts)

```typescript
// Question types
type QuestionType = 'multiple_choice' | 'fill_blank' | 'true_false';
type Difficulty = 'easy' | 'medium' | 'hard';

interface BaseQuestion {
  id: string;
  sourceNote: string;
  createdAt: string;
  type: QuestionType;
  difficulty: Difficulty;
  question: string;
  explanation: string;
  relatedConcepts?: string[];
}

interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  correctAnswer: string;
  incorrectAnswers: [string, string, string];
}

interface FillBlankQuestion extends BaseQuestion {
  type: 'fill_blank';
  blanks: string[];
}

interface TrueFalseQuestion extends BaseQuestion {
  type: 'true_false';
  correctAnswer: boolean;
}

type Question = MultipleChoiceQuestion | FillBlankQuestion | TrueFalseQuestion;

// File schemas
interface Config {
  version: number;
  streak: {
    current: number;
    longest: number;
    lastQuizDate: string | null;
  };
  preferences: {
    questionsPerNote: number;
    questionTypes: QuestionType[];
    difficulty: Difficulty;
    includeRelatedConcepts: boolean;
    customPrompt: string;
  };
}

interface PendingNote {
  path: string;
  addedAt: string;
  priority: 'low' | 'normal' | 'high';
}

interface PendingFile {
  version: number;
  notes: PendingNote[];
}

interface QuestionsFile {
  version: number;
  questions: Question[];
}

interface QuizAttempt {
  id: string;
  date: string;
  questionIds: string[];
  results: {
    questionId: string;
    correct: boolean;
    timeSpent: number;
  }[];
  score: number;
}

interface HistoryFile {
  version: number;
  attempts: QuizAttempt[];
}

interface ImportFile {
  questions: Question[];
}
```

### 1.3 Constants (constants.ts)

```typescript
export const QUIZ_FOLDER = '.quiz';
export const CONFIG_FILE = 'config.json';
export const QUESTIONS_FILE = 'questions.json';
export const PENDING_FILE = 'pending.json';
export const HISTORY_FILE = 'history.json';
export const IMPORT_FILE = 'import.json';
export const CLAUDE_FILE = 'CLAUDE.md';

export const DEFAULT_CONFIG: Config = {
  version: 1,
  streak: {
    current: 0,
    longest: 0,
    lastQuizDate: null,
  },
  preferences: {
    questionsPerNote: 5,
    questionTypes: ['multiple_choice', 'fill_blank', 'true_false'],
    difficulty: 'medium',
    includeRelatedConcepts: true,
    customPrompt: '',
  },
};
```

---

## Phase 2: Plugin Foundation

### 2.1 Main Plugin (main.ts)

**Responsibilities:**
- Initialize plugin on load
- Create `.quiz/` folder and default files if not exist
- Register commands
- Register sidebar view
- Register code block processor for embeddable quizzes
- Register context menu items
- Load/save settings

**Commands to register:**
- `vault-recall:add-note-to-queue` - Add current note to pending
- `vault-recall:add-folder-to-queue` - Add folder to pending
- `vault-recall:take-quiz` - Open quiz modal
- `vault-recall:import-questions` - Import from import.json
- `vault-recall:open-sidebar` - Focus sidebar view

**Context menu items:**
- File menu: "Add to Quiz Queue"
- Folder menu: "Add to Quiz Queue"

### 2.2 Settings Tab (settings.ts)

**Settings to expose:**
- Questions per note (number slider, 1-20)
- Question types (multi-select checkboxes)
- Difficulty (dropdown)
- Include related concepts (toggle)
- Custom prompt (text area)

Settings sync to `config.json` in `.quiz/` folder.

---

## Phase 3: File Management

### 3.1 FileService (services/file-service.ts)

Encapsulates all file I/O operations for the `.quiz/` folder.

```typescript
class FileService {
  constructor(private vault: Vault, private plugin: Plugin) {}

  /**
   * Creates .quiz/ folder if it doesn't exist.
   * Called once during plugin initialization.
   */
  ensureQuizFolder(): Promise<void>

  /**
   * Copies bundled CLAUDE.md template to .quiz/CLAUDE.md.
   * Only copies if file doesn't exist (preserves user edits).
   */
  initializeCLAUDEmd(): Promise<void>

  /**
   * Reads config.json from .quiz/ folder.
   * Returns DEFAULT_CONFIG if file doesn't exist or is invalid.
   */
  readConfig(): Promise<Config>

  /**
   * Writes config object to .quiz/config.json.
   * Used by settings tab and streak service.
   */
  writeConfig(config: Config): Promise<void>

  /**
   * Reads questions.json from .quiz/ folder.
   * Returns empty questions array if file doesn't exist.
   */
  readQuestions(): Promise<QuestionsFile>

  /**
   * Writes questions array to .quiz/questions.json.
   * Used by import service to append new questions.
   */
  writeQuestions(questions: QuestionsFile): Promise<void>

  /**
   * Reads pending.json from .quiz/ folder.
   * Returns empty notes array if file doesn't exist.
   */
  readPending(): Promise<PendingFile>

  /**
   * Writes pending notes array to .quiz/pending.json.
   * Used when adding/removing notes from queue.
   */
  writePending(pending: PendingFile): Promise<void>

  /**
   * Reads history.json from .quiz/ folder.
   * Returns empty attempts array if file doesn't exist.
   */
  readHistory(): Promise<HistoryFile>

  /**
   * Appends a quiz attempt to .quiz/history.json.
   * Called after completing a quiz.
   */
  writeHistory(history: HistoryFile): Promise<void>

  /**
   * Reads import.json from .quiz/ folder.
   * Returns null if file doesn't exist (no pending import).
   */
  readImport(): Promise<ImportFile | null>

  /**
   * Deletes .quiz/import.json after successful import.
   * Signals to user that import was processed.
   */
  clearImport(): Promise<void>

  /**
   * Recursively finds all .md files in a folder.
   * Used when adding a folder to the quiz queue.
   * @param folderPath - Path relative to vault root
   * @returns Array of file paths relative to vault root
   */
  getMarkdownFilesInFolder(folderPath: string): Promise<string[]>
}
```

### 3.2 ValidationService (services/validation-service.ts)

Validates data structures before reading/writing to ensure schema compliance.

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];  // Human-readable error messages
}

class ValidationService {
  /**
   * Validates a single question object.
   * Checks: required fields, correct types, valid enum values.
   * Used by import service before appending questions.
   * @param question - Unknown object to validate
   * @returns ValidationResult with specific error messages
   */
  validateQuestion(question: unknown): ValidationResult

  /**
   * Validates the entire import.json structure.
   * Checks: has questions array, each question is valid.
   * Aggregates all errors for user feedback.
   * @param data - Parsed JSON from import.json
   * @returns ValidationResult with all validation errors
   */
  validateImportFile(data: unknown): ValidationResult

  /**
   * Validates config.json structure.
   * Checks: version number, streak object, preferences object.
   * Used when reading config to detect corruption.
   * @param data - Parsed JSON from config.json
   * @returns ValidationResult
   */
  validateConfig(data: unknown): ValidationResult

  /**
   * Validates a multiple choice question specifically.
   * Checks: has correctAnswer (string), has incorrectAnswers (array of 3 strings).
   * @param question - Question object with type 'multiple_choice'
   */
  private validateMultipleChoice(question: unknown): ValidationResult

  /**
   * Validates a fill-in-the-blank question.
   * Checks: has blanks array, blanks count matches ___ in question text.
   * @param question - Question object with type 'fill_blank'
   */
  private validateFillBlank(question: unknown): ValidationResult

  /**
   * Validates a true/false question.
   * Checks: correctAnswer is boolean (not string "true"/"false").
   * @param question - Question object with type 'true_false'
   */
  private validateTrueFalse(question: unknown): ValidationResult
}

---

## Phase 4: Services

### 4.1 Quiz Service (services/quiz-service.ts)

**Responsibilities:**
- Fetch questions by source (note path, folder path, or all)
- Randomize question order
- Randomize multiple choice options
- Track current quiz state (current question, answers, score)
- Submit quiz and record to history

```typescript
class QuizService {
  getQuestionsBySource(source: string | null): Question[]
  getQuestionsByFolder(folderPath: string): Question[]
  getAllQuestions(): Question[]
  shuffleOptions(question: MultipleChoiceQuestion): string[]
  startQuiz(questions: Question[]): QuizSession
  submitAnswer(session: QuizSession, answer: unknown): boolean
  finishQuiz(session: QuizSession): QuizAttempt
}
```

### 4.2 Streak Service (services/streak-service.ts)

**Responsibilities:**
- Check if streak should reset (missed a day)
- Increment streak after quiz completion
- Update longest streak if current exceeds it

```typescript
class StreakService {
  checkAndUpdateStreak(): Promise<void>
  incrementStreak(): Promise<void>
  getStreakInfo(): { current: number; longest: number }
}
```

### 4.3 Import Service (services/import-service.ts)

**Responsibilities:**
- Read import.json
- Validate all questions
- Append valid questions to questions.json
- Clear import.json on success
- Return detailed errors on failure

```typescript
class ImportService {
  importQuestions(): Promise<ImportResult>
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
}
```

---

## Phase 5: UI Components

### 5.1 Sidebar View (views/sidebar-view.ts)

**Layout:**
```
┌─────────────────────────────┐
│  🔥 Streak: 5 days          │
│  Best: 12 days              │
├─────────────────────────────┤
│  [Take a Quiz]              │
├─────────────────────────────┤
│  Pending Notes (3)          │
│  • Note A                   │
│  • Note B                   │
│  • Folder/Note C            │
├─────────────────────────────┤
│  [Import Questions]         │
│  [Settings]                 │
└─────────────────────────────┘
```

**Interactions:**
- "Take a Quiz" → Opens source selection modal, then quiz modal
- Pending notes list → Click to open note, X to remove
- "Import Questions" → Run import, show success/error notice
- "Settings" → Open plugin settings

### 5.2 Quiz Modal (views/quiz-modal.ts)

**Layout:**
```
┌─────────────────────────────────────────┐
│  Question 3 of 10                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━        │
├─────────────────────────────────────────┤
│                                         │
│  What is the primary advantage of       │
│  SSDs over HDDs?                        │
│                                         │
│  ○ Lower cost per gigabyte              │
│  ○ Faster read/write speeds             │
│  ○ Higher storage capacity              │
│  ○ Better heat performance              │
│                                         │
├─────────────────────────────────────────┤
│              [Submit]                   │
└─────────────────────────────────────────┘
```

**After answer:**
```
┌─────────────────────────────────────────┐
│  ✓ Correct! / ✗ Incorrect               │
├─────────────────────────────────────────┤
│  Explanation:                           │
│  SSDs use flash memory with no moving   │
│  parts, resulting in faster access...   │
├─────────────────────────────────────────┤
│              [Next Question]            │
└─────────────────────────────────────────┘
```

**End of quiz:**
```
┌─────────────────────────────────────────┐
│  Quiz Complete!                         │
│                                         │
│  Score: 8/10 (80%)                      │
│  🔥 Streak: 6 days                      │
│                                         │
│              [Done]                     │
└─────────────────────────────────────────┘
```

### 5.3 Question Renderer (components/question-renderer.ts)

Renders different question types:

**Multiple Choice:**
- Radio buttons for each option
- Options randomized at render time

**Fill in the Blank:**
- Text inputs for each blank
- Show blanks inline in question text

**True/False:**
- Two buttons: True | False

---

## Phase 6: Embeddable Quizzes

### 6.1 Code Block Processor

Register processor for `vault-recall` code blocks:

````markdown
```vault-recall
source: "path/to/note.md"
count: 5
```
````

**Behavior:**
- Parse YAML config from code block
- Fetch questions matching `sourceNote`
- Render inline quiz widget
- Track completion separately (doesn't affect daily streak)

---

## Phase 7: Pending Queue Management

### 7.1 Add to Queue

**Adding a note:**
1. Get file path relative to vault root
2. Check if already in pending.json
3. Append to pending.json with timestamp

**Adding a folder:**
1. Recursively find all `.md` files in folder
2. Filter out already-pending notes
3. Append all to pending.json

### 7.2 Remove from Queue

- Click X on pending note in sidebar
- Remove from pending.json array

---

## Implementation Order

### Phases 1-3: Foundation, Core Services, UI — DONE
- [x] Project structure, types, constants, helpers
- [x] FileService, ValidationService
- [x] StreakService, ImportService, QuizService
- [x] SidebarView, QuizModal, QuestionRenderer, StatsDisplay
- [x] Settings tab, context menus, commands

### Phase 3.5: Prompt Generation — DONE
- [x] Single-note and queue prompt builders
- [x] Shell-safe vault path with space escaping
- [x] Directory-check preamble in all prompts
- [x] "Copy prompt" button in sidebar pending toolbar
- [x] "Copy generation prompt" command and context menu item
- [x] FileService migrated to vault.adapter

### Phase 3.6: Auto-Import Architecture — DONE
- [x] Architectural change: Claude writes to import.json only (never questions.json directly)
- [x] fs.watch watcher on .quiz/ directory in main.ts (event-driven, not polling)
- [x] 300ms debounce on watcher to handle double-fire on write
- [x] Watcher gated behind FileSystemAdapter check (desktop-only, safe on mobile)
- [x] handleImportFileChange() — checks file exists, runs importService, shows Notice, refreshes sidebar
- [x] importWatcher closed and debounce timer cleared in onunload()
- [x] ESLint override in eslint.config.mts to allow fs/path imports only in src/main.ts
- [x] claude-template.ts updated: import.json is sole write target, questions.json is read-only for Claude
- [x] .quiz/CLAUDE.md updated to match new workflow (fs.watch auto-processes import.json)

### Phase 4: Sidebar Question Browser — TODO
- [ ] Add a new section to the sidebar that lists all existing questions
- [ ] Group questions by source note
- [ ] Show question text preview (truncated)
- [ ] Add delete button per question
- [ ] Add "Delete all" button per source note group
- [ ] Wire delete actions to FileService (filter from questions.json and rewrite)
- [ ] Refresh question list after deletions

### Phase 5: Inline Config UI — TODO

Replace the stub settings tab with live config controls directly in the sidebar.
All changes write to `config.json` immediately via `fileService.writeConfig()`.

**Sidebar section: "Generation settings" (collapsible)**

```
┌─────────────────────────────┐
│  Generation settings    [▾] │
├─────────────────────────────┤
│  Questions per note         │
│  [────●──────] 5            │
│                             │
│  Question types             │
│  [✓] Multiple choice        │
│  [✓] Fill in the blank      │
│  [✓] True / False           │
│                             │
│  Difficulty                 │
│  [ Easy | Medium | Hard ]   │
│                             │
│  Include related concepts   │
│  [toggle: on]               │
│                             │
│  Custom prompt              │
│  ┌───────────────────────┐  │
│  │ (optional override)   │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

**Controls:**
- `questionsPerNote` — range slider (1–20), live label showing current value
- `questionTypes` — three checkboxes (at least one must remain checked)
- `difficulty` — segmented button: Easy / Medium / Hard
- `includeRelatedConcepts` — toggle switch
- `customPrompt` — textarea (placeholder: "Leave blank to use default prompt")

**Behaviour:**
- Section collapsed by default; state preserved in `localStorage` (not config.json)
- Each control saves immediately on change (`fileService.writeConfig()`)
- "Copy prompt" button in pending toolbar reflects current config live
- Settings tab stub (`settings.ts`) updated to show "Configure in sidebar" note

**Implementation notes:**
- Load initial values from `this.plugin.config` (already in memory)
- Update `this.plugin.config.preferences` on each change then write
- Validate: if all question types unchecked, re-check the one just unchecked

### Phase 6: Embeddable Quizzes
- [ ] Code block processor for `vault-recall` blocks
- [ ] Inline quiz widget rendering
- [ ] YAML config parsing (source, count)

### Phase 7: Polish
- [ ] Mobile compatibility testing
- [ ] Question refresh/regeneration UI

---

## Open Questions

1. **Embeddable quiz state** - Should inline quizzes save progress? Or reset each time?

2. **Question refresh** - Should there be a way to mark questions as "stale" and regenerate?

---

## Notes

- All file operations should handle missing files gracefully (create defaults)
- Use Obsidian's `requestUrl` if we ever need network (we don't for now)
- Mobile compatibility: test on mobile, ensure touch targets are adequate
- The CLAUDE.md file should be bundled with the plugin and copied to .quiz/ on first run
