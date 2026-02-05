# Vault Recall

Turn your Obsidian notes into interactive quizzes for active recall practice. Track your streak, test your knowledge, and learn from your own notes.

## How It Works

This plugin combines **deterministic plugin logic** with **AI-powered question generation**:

- **The plugin** handles the UI, streak tracking, quiz flow, and file management
- **Claude Code** (or similar AI tools) reads your notes and generates questions

Everything stays local. No API keys in the plugin. You control when AI runs by invoking it yourself in your terminal!

## Installation

### From Community Plugins (Recommended)

1. Open Obsidian Settings → Community Plugins
2. Click **Browse** and search for "Vault Recall"
3. Click **Install**, then **Enable**
4. The plugin will create a `.quiz/` folder in your vault root

### Manual Installation

1. Download the latest release from the [Releases page](https://github.com/a2jensen/vault-recall/releases)
2. Extract to your vault's `.obsidian/plugins/vault-recall/` folder
3. Enable the plugin in Obsidian Settings → Community Plugins
4. The plugin will create a `.quiz/` folder in your vault root

## Quick Start

### 1. Add notes or folders to the quiz queue

Right-click any note or folder → **"Add to Quiz Queue"**

Or use the command palette:
- `Vault Recall: Add current note to queue`
- `Vault Recall: Add folder to queue`

When you add a folder, the plugin finds all markdown files in that folder (recursively) and adds them to `pending.json`.

### 2. Generate questions with Claude Code

Open your terminal in your vault directory and run Claude Code:

```
claude
```

Then ask:

```
Read .quiz/CLAUDE.md for instructions, then generate
questions for the notes in .quiz/pending.json
```

Claude Code will read your notes and write questions to `.quiz/questions.json`.

### 3. Take a quiz

Open the sidebar (click the graduation cap icon) and hit **Take a Quiz**. You'll be prompted to select:

- A specific note
- A folder (quizzes from all notes in that folder)
- All available questions

The plugin fetches questions matching your selection and presents them.

## Features

### Sidebar View

- Start daily quiz
- View current streak
- See pending notes awaiting questions
- Import questions
- Access settings

### Embeddable Quizzes

Insert a quiz block in any note to show questions related to that note:

```
```vault-recall
source: "path/to/your/note.md"
count: 5
```
```

This pulls questions from `questions.json` where `sourceNote` matches and displays them inline.

### Streak Tracking

- Complete at least one quiz per day to maintain your streak
- Streak resets if you miss a day
- View your current and longest streak in the sidebar

### Importing Questions (No AI Required)

You can add questions without using Claude Code:

1. Create or download a JSON file with questions
2. Place it at `.quiz/import.json`
3. Click **Import Questions** in the sidebar

The plugin validates the schema and either:
- **Success**: Appends questions to `questions.json` and clears `import.json`
- **Error**: Shows what's wrong with the format (missing fields, invalid types, etc.)

This is useful for:
- Importing question sets from external sources (LeetCode, textbooks, etc.)
- Manually writing your own questions
- Using Claude Code to format questions into `import.json` first, then letting the plugin safely validate and import

See the Question Types section below for the expected format.

### Question Types

The plugin supports three question types:

| Type | Description |
|------|-------------|
| `multiple_choice` | 4 options, one correct |
| `fill_blank` | Fill in missing words |
| `true_false` | True or false statements |

## File Structure

The plugin creates and manages these files in `.quiz/`:

```
.quiz/
├── CLAUDE.md        # Documentation for AI tools (don't edit)
├── config.json      # Your settings and streak data
├── questions.json   # Generated questions cache
├── history.json     # Quiz attempt history
├── pending.json     # Notes waiting for question generation
└── import.json      # Staging file for question imports
```

## Configuration

Open Settings → Vault Recall to configure:

| Setting | Description | Default |
|---------|-------------|---------|
| Questions per note | How many questions to generate per note | 5 |
| Question types | Which types to include | All |
| Difficulty | easy, medium, hard | medium |
| Include related concepts | Generate questions beyond literal note content | true |
| Custom prompt | Additional instructions for question generation | empty |

These settings are saved to `.quiz/config.json` and read by Claude Code when generating questions.

## Using with Claude Code

The plugin includes `.quiz/CLAUDE.md` — a documentation file that tells Claude Code exactly how to work with your quiz files.

### Generate questions

```
Read .quiz/CLAUDE.md, then generate questions for pending notes
```

### Generate questions for a specific note

```
Read .quiz/CLAUDE.md, then generate 10 hard questions
for "School/Algorithms/Graph Traversal.md"
```

### Customize question style

```
Read .quiz/CLAUDE.md, then generate questions for pending notes.
Focus on practical application and debugging scenarios.
```

## Tips

- **Quality over quantity**: Fewer good questions beat many mediocre ones
- **Review explanations**: After answering, read the explanation even if you got it right
- **Refresh questions periodically**: Re-run Claude Code on old notes to get fresh questions
- **Use the custom prompt**: Tailor questions to your learning style

## Privacy

- All data stays in your vault
- No telemetry or analytics
- No network requests from the plugin
- AI generation happens in your terminal, under your control

## License

MIT
