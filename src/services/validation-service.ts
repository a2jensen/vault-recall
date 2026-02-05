/**
 * ValidationService - Validates data structures before reading/writing
 */

import type { ValidationResult } from '../types';
import {
  VALID_QUESTION_TYPES,
  VALID_DIFFICULTIES,
  BLANK_PLACEHOLDER,
} from '../constants';

export class ValidationService {
  /**
   * Validates a single question object.
   * Checks: required fields, correct types, valid enum values.
   * @param question - Unknown object to validate
   * @returns ValidationResult with specific error messages
   */
  validateQuestion(question: unknown): ValidationResult {
    const errors: string[] = [];

    if (!question || typeof question !== 'object') {
      return { valid: false, errors: ['Question must be an object'] };
    }

    const q = question as Record<string, unknown>;

    // Required base fields
    if (!q.id || typeof q.id !== 'string') {
      errors.push('Missing or invalid "id" (must be string)');
    }

    if (!q.sourceNote || typeof q.sourceNote !== 'string') {
      errors.push('Missing or invalid "sourceNote" (must be string)');
    }

    if (!q.type || typeof q.type !== 'string') {
      errors.push('Missing or invalid "type" (must be string)');
    } else if (!VALID_QUESTION_TYPES.includes(q.type as typeof VALID_QUESTION_TYPES[number])) {
      errors.push(`Invalid "type": must be one of ${VALID_QUESTION_TYPES.join(', ')}`);
    }

    if (!q.difficulty || typeof q.difficulty !== 'string') {
      errors.push('Missing or invalid "difficulty" (must be string)');
    } else if (!VALID_DIFFICULTIES.includes(q.difficulty as typeof VALID_DIFFICULTIES[number])) {
      errors.push(`Invalid "difficulty": must be one of ${VALID_DIFFICULTIES.join(', ')}`);
    }

    if (!q.question || typeof q.question !== 'string') {
      errors.push('Missing or invalid "question" (must be string)');
    }

    if (!q.explanation || typeof q.explanation !== 'string') {
      errors.push('Missing or invalid "explanation" (must be string)');
    }

    // Validate type-specific fields
    if (q.type === 'multiple_choice') {
      const mcResult = this.validateMultipleChoice(q);
      errors.push(...mcResult.errors);
    } else if (q.type === 'fill_blank') {
      const fbResult = this.validateFillBlank(q);
      errors.push(...fbResult.errors);
    } else if (q.type === 'true_false') {
      const tfResult = this.validateTrueFalse(q);
      errors.push(...tfResult.errors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates the entire import.json structure.
   * Checks: has questions array, each question is valid.
   * @param data - Parsed JSON from import.json
   * @returns ValidationResult with all validation errors
   */
  validateImportFile(data: unknown): ValidationResult {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['Import file must be an object'] };
    }

    const d = data as Record<string, unknown>;

    if (!Array.isArray(d.questions)) {
      return { valid: false, errors: ['Import file must have a "questions" array'] };
    }

    // Validate each question
    d.questions.forEach((q, index) => {
      const result = this.validateQuestion(q);
      if (!result.valid) {
        errors.push(`Question ${index + 1}: ${result.errors.join('; ')}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates config.json structure.
   * Checks: version number, streak object, preferences object.
   * @param data - Parsed JSON from config.json
   * @returns ValidationResult
   */
  validateConfig(data: unknown): ValidationResult {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['Config must be an object'] };
    }

    const d = data as Record<string, unknown>;

    // Version
    if (typeof d.version !== 'number') {
      errors.push('Missing or invalid "version" (must be number)');
    }

    // Streak object
    if (!d.streak || typeof d.streak !== 'object') {
      errors.push('Missing or invalid "streak" object');
    } else {
      const streak = d.streak as Record<string, unknown>;
      if (typeof streak.current !== 'number') {
        errors.push('streak.current must be a number');
      }
      if (typeof streak.longest !== 'number') {
        errors.push('streak.longest must be a number');
      }
      if (streak.lastQuizDate !== null && typeof streak.lastQuizDate !== 'string') {
        errors.push('streak.lastQuizDate must be a string or null');
      }
    }

    // Preferences object
    if (!d.preferences || typeof d.preferences !== 'object') {
      errors.push('Missing or invalid "preferences" object');
    } else {
      const prefs = d.preferences as Record<string, unknown>;
      if (typeof prefs.questionsPerNote !== 'number') {
        errors.push('preferences.questionsPerNote must be a number');
      }
      if (!Array.isArray(prefs.questionTypes)) {
        errors.push('preferences.questionTypes must be an array');
      }
      if (typeof prefs.difficulty !== 'string') {
        errors.push('preferences.difficulty must be a string');
      }
      if (typeof prefs.includeRelatedConcepts !== 'boolean') {
        errors.push('preferences.includeRelatedConcepts must be a boolean');
      }
      if (typeof prefs.customPrompt !== 'string') {
        errors.push('preferences.customPrompt must be a string');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates a multiple choice question specifically.
   * Checks: has correctAnswer (string), has incorrectAnswers (array of 3 strings).
   */
  private validateMultipleChoice(question: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    if (!question.correctAnswer || typeof question.correctAnswer !== 'string') {
      errors.push('Multiple choice: missing or invalid "correctAnswer" (must be string)');
    }

    if (!Array.isArray(question.incorrectAnswers)) {
      errors.push('Multiple choice: missing "incorrectAnswers" array');
    } else if (question.incorrectAnswers.length !== 3) {
      errors.push('Multiple choice: "incorrectAnswers" must have exactly 3 items');
    } else {
      const allStrings = question.incorrectAnswers.every((a) => typeof a === 'string');
      if (!allStrings) {
        errors.push('Multiple choice: all incorrectAnswers must be strings');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validates a fill-in-the-blank question.
   * Checks: has blanks array, blanks count matches ___ in question text.
   */
  private validateFillBlank(question: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    if (!Array.isArray(question.blanks)) {
      errors.push('Fill blank: missing "blanks" array');
    } else {
      const allStrings = question.blanks.every((b) => typeof b === 'string');
      if (!allStrings) {
        errors.push('Fill blank: all blanks must be strings');
      }

      // Count blanks in question text
      if (typeof question.question === 'string') {
        const blankCount = (question.question.match(new RegExp(BLANK_PLACEHOLDER, 'g')) || []).length;
        if (blankCount !== question.blanks.length) {
          errors.push(
            `Fill blank: found ${blankCount} "${BLANK_PLACEHOLDER}" in question but ${question.blanks.length} answers in blanks array`
          );
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validates a true/false question.
   * Checks: correctAnswer is boolean (not string "true"/"false").
   */
  private validateTrueFalse(question: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    if (typeof question.correctAnswer !== 'boolean') {
      errors.push('True/false: "correctAnswer" must be a boolean (true or false), not a string');
    }

    return { valid: errors.length === 0, errors };
  }
}
