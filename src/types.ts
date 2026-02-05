/**
 * Vault Recall - Type Definitions
 */

// Question types
export type QuestionType = 'multiple_choice' | 'fill_blank' | 'true_false';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Priority = 'low' | 'normal' | 'high';

// Base question interface
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

// Multiple choice question
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  correctAnswer: string;
  incorrectAnswers: [string, string, string];
}

// Fill in the blank question
export interface FillBlankQuestion extends BaseQuestion {
  type: 'fill_blank';
  blanks: string[];
}

// True/false question
export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true_false';
  correctAnswer: boolean;
}

// Union type for all questions
export type Question = MultipleChoiceQuestion | FillBlankQuestion | TrueFalseQuestion;

// Config file schema
export interface Config {
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

// Pending note entry
export interface PendingNote {
  path: string;
  addedAt: string;
  priority: Priority;
}

// Pending file schema
export interface PendingFile {
  version: number;
  notes: PendingNote[];
}

// Questions file schema
export interface QuestionsFile {
  version: number;
  questions: Question[];
}

// Quiz attempt result
export interface QuizResult {
  questionId: string;
  correct: boolean;
  timeSpent: number;
}

// Quiz attempt
export interface QuizAttempt {
  id: string;
  date: string;
  questionIds: string[];
  results: QuizResult[];
  score: number;
}

// History file schema
export interface HistoryFile {
  version: number;
  attempts: QuizAttempt[];
}

// Import file schema
export interface ImportFile {
  questions: Question[];
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Quiz session (runtime state)
export interface QuizSession {
  questions: Question[];
  currentIndex: number;
  results: QuizResult[];
  startTime: number;
}
