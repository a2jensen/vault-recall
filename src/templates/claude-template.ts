/**
 * CLAUDE.md template - bundled with plugin and copied to .quiz/ on first run
 */

export const CLAUDE_MD_TEMPLATE = `# Vault Recall - Claude Code Documentation

This document describes how to work with the Vault Recall Obsidian plugin. Read this file before performing any operations.

## Overview

Vault Recall is an Obsidian plugin that generates quizzes from user notes for active recall practice. Claude Code's role is **question generation only** — all other operations (stats, streaks, file updates) are handled by the plugin.

## Directory Structure

\`\`\`
vault/
├── .quiz/
│   ├── CLAUDE.md             # This file
│   ├── config.json           # User settings and preferences
│   ├── questions.json        # Generated questions cache
│   ├── history.json          # Quiz attempt history (read-only for Claude)
│   ├── pending.json          # Notes awaiting question generation
│   └── import.json           # Staging file for question imports
└── [user notes]              # Markdown notes throughout the vault
\`\`\`

## File Schemas

### config.json

User preferences for question generation.

\`\`\`json
{
  "version": 1,
  "streak": {
    "current": 5,
    "longest": 12,
    "lastQuizDate": "2025-01-15"
  },
  "preferences": {
    "questionsPerNote": 5,
    "questionTypes": ["multiple_choice", "fill_blank", "true_false"],
    "difficulty": "medium",
    "includeRelatedConcepts": true,
    "customPrompt": ""
  }
}
\`\`\`

**Do not modify this file.** Read it to understand user preferences when generating questions.

### pending.json

Notes that need questions generated.

\`\`\`json
{
  "version": 1,
  "notes": [
    {
      "path": "School/Datacenters/Hardware Components.md",
      "addedAt": "2025-01-15T10:30:00Z",
      "priority": "normal"
    }
  ]
}
\`\`\`

**Do not modify this file.** The plugin manages this list.

### import.json

Staging file for question imports. **You can write to this file.**

\`\`\`json
{
  "questions": [
    {
      "id": "q_abc123",
      "sourceNote": "External/LeetCode.md",
      "type": "multiple_choice",
      "difficulty": "medium",
      "question": "...",
      "correctAnswer": "...",
      "incorrectAnswers": ["...", "...", "..."],
      "explanation": "..."
    }
  ]
}
\`\`\`

**This is the only file you write questions to.** Always use \`import.json\` — never write directly to \`questions.json\`.

The plugin watches \`import.json\` for changes. As soon as you write this file, the plugin automatically:
1. Validates each question against the schema
2. Appends valid questions to \`questions.json\`
3. Deletes \`import.json\`
4. Shows a notification with the result

This means you never need to read \`questions.json\` — the plugin owns that file. You only write the new batch to \`import.json\`.

### questions.json

The question cache. **Read-only for Claude — do not write to this file.**

The plugin manages \`questions.json\` entirely. It can grow to thousands of questions — reading it wastes tokens. The plugin handles deduplication and merging.

### history.json

Quiz attempt history. **Read-only** — the plugin writes this.

\`\`\`json
{
  "version": 1,
  "attempts": [
    {
      "id": "a_xyz789",
      "date": "2025-01-15T14:00:00Z",
      "questionIds": ["q_abc123", "q_def456"],
      "results": [
        { "questionId": "q_abc123", "correct": true, "timeSpent": 15 },
        { "questionId": "q_def456", "correct": false, "timeSpent": 30 }
      ],
      "score": 0.5
    }
  ]
}
\`\`\`

Use this to understand which questions the user struggles with when generating new questions.

---

## Question Types

### multiple_choice

\`\`\`json
{
  "type": "multiple_choice",
  "question": "string",
  "correctAnswer": "string",
  "incorrectAnswers": ["string", "string", "string"],
  "explanation": "string"
}
\`\`\`

- Provide exactly 1 correct answer and 3 incorrect answers
- The plugin's helper function will combine and randomize option order at runtime
- Do not worry about answer positioning — just provide the content

### fill_blank

\`\`\`json
{
  "type": "fill_blank",
  "question": "string with ___ blanks",
  "blanks": ["answer1", "answer2"],
  "explanation": "string"
}
\`\`\`

- Use \`___\` (three underscores) to indicate blanks
- \`blanks\` array should match the number of \`___\` in the question
- Order matters — first blank matches first answer

### true_false

\`\`\`json
{
  "type": "true_false",
  "question": "string (statement)",
  "correctAnswer": true | false,
  "explanation": "string"
}
\`\`\`

---

## Your Task: Generating Questions

When asked to generate questions:

1. **Read config.json** to understand user preferences
2. **Read pending.json** to see which notes need questions
3. **Read the actual note files** listed in pending.json
4. **Generate questions** following the schemas above
5. **Write to import.json** — the plugin detects the file, validates, and merges into questions.json automatically

**Do not read questions.json.** It can be very large. The plugin handles deduplication — just generate fresh questions for the requested notes.

### Generation Guidelines

- Generate \`questionsPerNote\` questions per note (from config)
- Mix question types based on \`questionTypes\` preference
- Match the \`difficulty\` setting
- If \`includeRelatedConcepts\` is true, generate some questions that extend beyond the literal note content
- If \`customPrompt\` is set, follow those instructions
- Always include \`explanation\` — this is shown after the user answers
- Set \`relatedConcepts\` to help with future question clustering
- You do **not** need to include \`id\` — the plugin assigns IDs automatically on import

---

## What NOT To Do

- **Do not modify** config.json, pending.json, or history.json
- **Do not read or write questions.json** — the plugin owns this file
- **Do not hallucinate** — only generate questions based on actual note content
- **Do not include answers in questions** — avoid giving away the answer in how the question is phrased

---

## Example Workflow

User prompt: "Generate questions for my pending notes"

1. Read \`.quiz/config.json\` → understand preferences
2. Read \`.quiz/pending.json\` → get list of notes
3. Read each note file in pending.json
4. Generate questions per the config
5. Write all new questions to \`.quiz/import.json\`
6. Plugin auto-detects the file, validates, and merges into questions.json
7. Report what was generated

---

## Notes

- All paths are relative to the vault root
- Timestamps use ISO 8601 format
- The plugin handles clearing pending.json after you generate questions
- Question quality matters — prefer fewer good questions over many mediocre ones
`;
