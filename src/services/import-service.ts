/**
 * ImportService - Handles importing questions from import.json
 */

import type { FileService } from './file-service';
import type { ValidationService } from './validation-service';
import type { Question } from '../types';

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
}

export class ImportService {
  constructor(
    private fileService: FileService,
    private validationService: ValidationService
  ) {}

  /**
   * Imports questions from .quiz/import.json into questions.json.
   * Validates all questions before importing.
   * Clears import.json on successful import.
   * @returns ImportResult with success status, count, and any errors
   */
  async importQuestions(): Promise<ImportResult> {
    // Read import file
    const importData = await this.fileService.readImport();

    if (!importData) {
      return {
        success: false,
        imported: 0,
        errors: ['No import.json file found in .quiz folder'],
      };
    }

    // Validate the import file structure
    const fileValidation = this.validationService.validateImportFile(importData);
    if (!fileValidation.valid) {
      return {
        success: false,
        imported: 0,
        errors: fileValidation.errors,
      };
    }

    // Validate each question individually
    const errors: string[] = [];
    const validQuestions: Question[] = [];

    for (let i = 0; i < importData.questions.length; i++) {
      const question = importData.questions[i];
      const validation = this.validationService.validateQuestion(question);

      if (validation.valid) {
        validQuestions.push(question as Question);
      } else {
        errors.push(`Question ${i + 1}: ${validation.errors.join(', ')}`);
      }
    }

    // If there are any errors, don't import anything
    if (errors.length > 0) {
      return {
        success: false,
        imported: 0,
        errors,
      };
    }

    // Read existing questions and append new ones
    const questionsFile = await this.fileService.readQuestions();
    questionsFile.questions.push(...validQuestions);

    // Write updated questions file
    await this.fileService.writeQuestions(questionsFile);

    // Clear import file on success
    await this.fileService.clearImport();

    return {
      success: true,
      imported: validQuestions.length,
      errors: [],
    };
  }

  /**
   * Checks if there's a pending import file.
   */
  async hasPendingImport(): Promise<boolean> {
    const importData = await this.fileService.readImport();
    return importData !== null;
  }
}
