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

### Phase 3.5: Prompt Generation
- `buildGenerationPrompt()` - Single-note prompt with preferences
- `buildQueueGenerationPrompt()` - Multi-note prompt for all queued notes
- `copyGenerationPrompt()` / `copyQueueGenerationPrompt()` - Clipboard helpers
- `getShellSafeVaultPath()` - Shell-escaped absolute vault path (wraps spaces in single quotes)
- `buildDirectoryPreamble()` - Directory-check preamble included in all prompts (offers to cd into vault)
- Command: `copy-generation-prompt` - Copy prompt for active note
- Context menu: "Copy quiz prompt" on .md files
- Sidebar: "Copy prompt" button in pending toolbar (copies prompt for all queued notes)
- `FileService` migrated to `vault.adapter` for reliable dotfolder (.quiz/) access

### Phase 3.6: Auto-Import Architecture
- **Architectural change**: Claude writes only to `import.json`; plugin auto-detects and merges into `questions.json`
- `startImportWatcher()` - Uses `fs.watch` (Node.js, event-driven) on `.quiz/` directory
- 300ms debounce prevents double-processing on rapid write events
- Watcher gated behind `FileSystemAdapter` check — safe no-op on mobile
- `handleImportFileChange()` - Validates existence, calls `importService.importQuestions()`, shows Notice, refreshes sidebar
- `onunload()` - Closes `FSWatcher` and clears debounce timer on plugin unload
- ESLint override in `eslint.config.mts` — disables `import/no-nodejs-modules` for `src/main.ts` only
- `src/templates/claude-template.ts` — updated: `import.json` is sole write target, `questions.json` is read-only for Claude
- `.quiz/CLAUDE.md` — updated in-vault file to match new workflow

### Registered Commands
- `add-note-to-queue` - Add current note to pending queue
- `copy-generation-prompt` - Copy generation prompt for active note
- `import-questions` - Import from .quiz/import.json
- `take-quiz` - Open source selection then quiz modal
- `open-sidebar` - Open/reveal sidebar view

### Context Menus
- File menu: "Add to quiz queue" (on .md files)
- File menu: "Copy quiz prompt" (on .md files)
- Folder menu: "Add folder to quiz queue"

## Up Next

### Sidebar: Question Browser
- Display all existing questions in the sidebar (grouped by source note)
- Ability to delete individual questions
- Ability to bulk-delete questions by source note

### Prompt Customization
- Make the generation prompt editable from the UI
- Let the user choose which question types to include (multiple choice, fill-in-the-blank, true/false)
- Expose these settings in the prompt that gets copied

## Not Started

### Phase 4: Embeddable Quizzes
- Code block processor for `vault-recall` blocks
- Inline quiz widget rendering
- YAML config parsing (source, count)

### Phase 4: Polish
- Mobile compatibility testing
- Question refresh/regeneration UI
