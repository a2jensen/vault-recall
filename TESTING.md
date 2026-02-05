# Vault Recall - Testing Documentation

This document outlines the testing procedures for each implementation phase.

---

## How to Run Tests

### Automated Tests
```bash
./scripts/build.sh
```

This runs:
1. `npm install` - Install dependencies
2. `npm run lint` - ESLint code quality checks
3. `npm run build` - TypeScript compilation + bundling
4. Output file verification

### Manual Testing in Obsidian

1. Run the build script
2. Copy files to your vault:
   ```bash
   cp main.js manifest.json styles.css <vault>/.obsidian/plugins/vault-recall/
   ```
3. Reload Obsidian (Cmd/Ctrl + R) or toggle the plugin off/on
4. Follow phase-specific manual tests below

---

## Phase 1: Foundation

### Automated Tests
- [x] Lint passes (`npm run lint`)
- [x] Build succeeds (`npm run build`)
- [x] Output files generated (`main.js`, `manifest.json`)

### Manual Tests

#### 1.1 Plugin Loads
- [ ] Enable plugin in Obsidian settings
- [ ] No errors in console (Cmd/Ctrl + Shift + I)
- [ ] Console shows: "Loading Vault Recall plugin"

#### 1.2 Quiz Folder Created
- [ ] `.quiz/` folder appears in vault root
- [ ] `.quiz/CLAUDE.md` file exists with correct template content
- [ ] `.quiz/config.json` file exists with default values:
  ```json
  {
    "version": 1,
    "streak": { "current": 0, "longest": 0, "lastQuizDate": null },
    "preferences": {
      "questionsPerNote": 5,
      "questionTypes": ["multiple_choice", "fill_blank", "true_false"],
      "difficulty": "medium",
      "includeRelatedConcepts": true,
      "customPrompt": ""
    }
  }
  ```

#### 1.3 Plugin Unloads
- [ ] Disable plugin in settings
- [ ] Console shows: "Unloading Vault Recall plugin"
- [ ] No errors

#### 1.4 Reload Persistence
- [ ] Reload Obsidian
- [ ] `.quiz/` folder and files still exist
- [ ] CLAUDE.md not overwritten (preserves user edits if any)

---

## Phase 2: Core Services

### Automated Tests
- [ ] Lint passes
- [ ] Build succeeds

### Manual Tests

#### 2.1 Add Note to Queue
- [ ] Right-click note → "Add to Quiz Queue" (or command palette)
- [ ] Note appears in `.quiz/pending.json`
- [ ] Duplicate add is prevented (no duplicate entries)

#### 2.2 Add Folder to Queue
- [ ] Right-click folder → "Add to Quiz Queue"
- [ ] All .md files in folder added to `pending.json`
- [ ] Nested folders included (recursive)

#### 2.3 Remove from Queue
- [ ] Note can be removed from queue via sidebar
- [ ] Entry removed from `pending.json`

#### 2.4 Import Questions
- [ ] Create `.quiz/import.json` with valid questions
- [ ] Click "Import Questions" in sidebar
- [ ] Questions appended to `questions.json`
- [ ] `import.json` deleted after successful import

#### 2.5 Import Validation
- [ ] Create `import.json` with invalid question (missing field)
- [ ] Import shows error notice with specific field
- [ ] `questions.json` unchanged

#### 2.6 Streak Service
- [ ] Complete a quiz
- [ ] `config.json` streak.current increments
- [ ] `config.json` streak.lastQuizDate updates
- [ ] Miss a day, streak resets to 0

---

## Phase 3: UI

### Automated Tests
- [ ] Lint passes
- [ ] Build succeeds

### Manual Tests

#### 3.1 Sidebar View
- [ ] Sidebar icon appears (graduation cap)
- [ ] Click opens sidebar view
- [ ] Shows current streak
- [ ] Shows pending notes count
- [ ] "Take a Quiz" button visible
- [ ] "Import Questions" button visible

#### 3.2 Take a Quiz - Source Selection
- [ ] Click "Take a Quiz"
- [ ] Modal shows source options (note/folder/all)
- [ ] Selecting source fetches correct questions

#### 3.3 Quiz Flow - Multiple Choice
- [ ] Question displayed with 4 options
- [ ] Options are randomized
- [ ] Selecting option enables Submit
- [ ] Correct answer shows green, explanation
- [ ] Incorrect answer shows red, correct answer, explanation

#### 3.4 Quiz Flow - Fill in Blank
- [ ] Question shows with input fields for blanks
- [ ] Can type in each blank
- [ ] Submit checks answers

#### 3.5 Quiz Flow - True/False
- [ ] Question shows as statement
- [ ] True/False buttons available
- [ ] Correct feedback shown

#### 3.6 Quiz Completion
- [ ] Shows final score
- [ ] Shows streak update
- [ ] "Done" button closes modal
- [ ] Attempt recorded in `history.json`

#### 3.7 Settings Tab
- [ ] Settings tab appears in Obsidian settings
- [ ] Questions per note slider works
- [ ] Question types checkboxes work
- [ ] Difficulty dropdown works
- [ ] Related concepts toggle works
- [ ] Custom prompt text area works
- [ ] Changes saved to `config.json`

---

## Phase 4: Embeddable Quizzes

### Automated Tests
- [ ] Lint passes
- [ ] Build succeeds

### Manual Tests

#### 4.1 Code Block Recognition
- [ ] Create note with:
  ````
  ```vault-recall
  source: "path/to/note.md"
  count: 5
  ```
  ````
- [ ] Block renders as quiz widget (not code)

#### 4.2 Inline Quiz Functionality
- [ ] Widget shows questions from specified source
- [ ] Respects `count` parameter
- [ ] Can answer questions inline
- [ ] Shows feedback after each answer

#### 4.3 No Questions State
- [ ] Source with no questions shows helpful message
- [ ] Suggests generating questions

---

## Regression Testing

After each phase, verify previous phase tests still pass:

| Test | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|------|---------|---------|---------|---------|
| Plugin loads | ✓ | | | |
| .quiz folder created | ✓ | | | |
| Add to queue | | ✓ | | |
| Import questions | | ✓ | | |
| Sidebar view | | | ✓ | |
| Quiz flow | | | ✓ | |
| Embeddable quiz | | | | ✓ |

---

## Notes

- Always run `./scripts/build.sh` before manual testing
- Check browser console for errors during manual tests
- Test on both desktop and mobile if possible
- Document any bugs found in GitHub issues
