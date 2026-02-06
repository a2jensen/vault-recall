# Vault Recall - Checkpoint

## Current State

Phases 1-3 are complete. The plugin builds and lints cleanly.

## Completed

### Phase 1: Foundation
- `src/types.ts` - All TypeScript interfaces (Question types, Config, PendingFile, HistoryFile, QuizSession, etc.)
- `src/constants.ts` - File paths, defaults, view identifiers, validation constants
- `src/utils/helpers.ts` - ID generation, timestamps, Fisher-Yates shuffle
- `src/services/file-service.ts` - All .quiz/ folder I/O (read/write config, questions, pending, history, import)
- `src/services/validation-service.ts` - Schema validation for questions, imports, config
- `src/templates/claude-template.ts` - Bundled CLAUDE.md template for .quiz/ folder

### Phase 2: Plugin Core
- `src/main.ts` - Plugin entry point with initialization, commands, context menus, ribbon icon
- `src/settings.ts` - Settings tab syncing preferences to config.json
- `src/services/streak-service.ts` - Streak tracking (check/reset/increment, once per calendar day)
- `src/services/import-service.ts` - Import questions from import.json with validation
- `src/services/quiz-service.ts` - Quiz session management, answer checking, history recording

### Phase 3: UI
- `src/views/sidebar-view.ts` - Sidebar panel (stats, take quiz button, pending notes list, import/refresh)
- `src/views/quiz-modal.ts` - Quiz modal (progress bar, question display, feedback, results screen) + source selection modal
- `src/components/question-renderer.ts` - Renders multiple choice, fill-in-blank, true/false with feedback
- `src/components/stats-display.ts` - Streak/best streak display widget
- `styles.css` - Full CSS for all UI components

### Registered Commands
- `add-note-to-queue` - Add current note to pending queue
- `import-questions` - Import from .quiz/import.json
- `take-quiz` - Open source selection then quiz modal
- `open-sidebar` - Open/reveal sidebar view

### Context Menus
- File menu: "Add to quiz queue" (on .md files)
- Folder menu: "Add folder to quiz queue"

## Not Started

### Phase 4: Embeddable Quizzes
- Code block processor for `vault-recall` blocks
- Inline quiz widget rendering
- YAML config parsing (source, count)

### Phase 4: Polish
- Mobile compatibility testing
- Question refresh/regeneration UI
