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

When you write questions here instead of directly to \`questions.json\`, the user can click **Import Questions** in the plugin to validate and import them. This is safer because:
- The plugin validates the schema before importing
- User sees clear error messages if format is wrong
- User controls when questions are added

Use \`import.json\` when:
- Formatting questions from external sources (LeetCode, textbooks, etc.)
- User wants validation before committing questions
- You're uncertain about the exact schema

Use \`questions.json\` directly when:
- Generating questions from the user's own notes
- User explicitly asks you to write directly

### questions.json

The question cache. **This is the file you write to.**

\`\`\`json
{
  "version": 1,
  "questions": [
    {
      "id": "q_abc123",
      "sourceNote": "School/Datacenters/Hardware Components.md",
      "createdAt": "2025-01-15T11:00:00Z",
      "type": "multiple_choice",
      "difficulty": "medium",
      "question": "What is the primary advantage of SSDs over HDDs in datacenter environments?",
      "correctAnswer": "Faster read/write speeds and lower latency",
      "incorrectAnswers": [
        "Lower cost per gigabyte",
        "Higher storage capacity",
        "Better performance in high-temperature environments"
      ],
      "explanation": "SSDs use flash memory with no moving parts, resulting in significantly faster access times and lower latency compared to the mechanical spinning platters in HDDs.",
      "relatedConcepts": ["storage architecture", "IOPS", "latency"]
    },
    {
      "id": "q_def456",
      "sourceNote": "School/Algorithms/Graph Traversal.md",
      "createdAt": "2025-01-15T11:00:00Z",
      "type": "fill_blank",
      "difficulty": "medium",
      "question": "BFS uses a ___ data structure while DFS uses a ___.",
      "blanks": ["queue", "stack"],
      "explanation": "BFS explores level by level using FIFO ordering (queue), while DFS explores as deep as possible first using LIFO ordering (stack).",
      "relatedConcepts": ["queue", "stack", "tree traversal"]
    },
    {
      "id": "q_jkl012",
      "sourceNote": "School/Datacenters/Hardware Components.md",
      "createdAt": "2025-01-15T11:00:00Z",
      "type": "true_false",
      "difficulty": "easy",
      "question": "In datacenter memory hierarchy, L1 cache is slower but larger than L2 cache.",
      "correctAnswer": false,
      "explanation": "L1 cache is the fastest and smallest cache, closest to the CPU. L2 is larger but slower, and L3 is larger still but slowest among caches.",
      "relatedConcepts": ["cache hierarchy", "memory latency"]
    }
  ]
}
\`\`\`

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
4. **Read history.json** (optional) to see what questions exist and user performance
5. **Generate questions** following the schemas above
6. **Write to questions.json** — append new questions to the existing array

### Generation Guidelines

- Generate \`questionsPerNote\` questions per note (from config)
- Mix question types based on \`questionTypes\` preference
- Match the \`difficulty\` setting
- If \`includeRelatedConcepts\` is true, generate some questions that extend beyond the literal note content
- If \`customPrompt\` is set, follow those instructions
- Generate unique \`id\` values using format \`q_\` + 6 random alphanumeric characters
- Always include \`explanation\` — this is shown after the user answers
- Set \`relatedConcepts\` to help with future question clustering

### ID Generation

Use this format for question IDs:
\`\`\`
q_[6 random alphanumeric characters]
\`\`\`

Example: \`q_a7b3x9\`, \`q_m2k8p1\`

---

## What NOT To Do

- **Do not modify** config.json, pending.json, or history.json
- **Do not delete** existing questions from questions.json
- **Do not generate duplicate questions** for notes that already have questions (check existing sourceNote values)
- **Do not hallucinate** — only generate questions based on actual note content
- **Do not include answers in questions** — avoid giving away the answer in how the question is phrased

---

## Example Workflow

User prompt: "Generate questions for my pending notes"

1. Read \`.quiz/config.json\` → understand preferences
2. Read \`.quiz/pending.json\` → get list of notes
3. Read \`.quiz/questions.json\` → check existing questions
4. Read each note file in pending.json
5. Generate questions per the config
6. Append new questions to \`.quiz/questions.json\`
7. Report what was generated

---

## Notes

- All paths are relative to the vault root
- Timestamps use ISO 8601 format
- The plugin handles clearing pending.json after you generate questions
- Question quality matters — prefer fewer good questions over many mediocre ones
`;
