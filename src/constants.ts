/**
 * Vault Recall - Constants and Defaults
 */

import type { Config } from './types';

// File paths (relative to vault root)
export const QUIZ_FOLDER = '.quiz';
export const CONFIG_FILE = 'config.json';
export const QUESTIONS_FILE = 'questions.json';
export const PENDING_FILE = 'pending.json';
export const HISTORY_FILE = 'history.json';
export const IMPORT_FILE = 'import.json';
export const CLAUDE_FILE = 'CLAUDE.md';

// Full paths helper
export const getQuizPath = (filename: string): string => `${QUIZ_FOLDER}/${filename}`;

// Default configuration
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

// Empty file defaults
export const EMPTY_QUESTIONS_FILE = {
  version: 1,
  questions: [],
};

export const EMPTY_PENDING_FILE = {
  version: 1,
  notes: [],
};

export const EMPTY_HISTORY_FILE = {
  version: 1,
  attempts: [],
};

// View identifiers
export const SIDEBAR_VIEW_TYPE = 'vault-recall-sidebar';

// Question validation
export const VALID_QUESTION_TYPES = ['multiple_choice', 'fill_blank', 'true_false'] as const;
export const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const VALID_PRIORITIES = ['low', 'normal', 'high'] as const;

// UI constants
export const BLANK_PLACEHOLDER = '___';
