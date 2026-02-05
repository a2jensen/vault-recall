/**
 * FileService - Handles all file I/O operations for the .quiz/ folder
 */

import { App, TFile, TFolder, Vault } from 'obsidian';
import type {
  Config,
  QuestionsFile,
  PendingFile,
  HistoryFile,
  ImportFile,
} from '../types';
import {
  QUIZ_FOLDER,
  CONFIG_FILE,
  QUESTIONS_FILE,
  PENDING_FILE,
  HISTORY_FILE,
  IMPORT_FILE,
  CLAUDE_FILE,
  getQuizPath,
  DEFAULT_CONFIG,
  EMPTY_QUESTIONS_FILE,
  EMPTY_PENDING_FILE,
  EMPTY_HISTORY_FILE,
} from '../constants';
import { CLAUDE_MD_TEMPLATE } from '../templates/claude-template';

export class FileService {
  private vault: Vault;

  constructor(private app: App) {
    this.vault = app.vault;
  }

  /**
   * Creates .quiz/ folder if it doesn't exist.
   * Called once during plugin initialization.
   */
  async ensureQuizFolder(): Promise<void> {
    const folder = this.vault.getAbstractFileByPath(QUIZ_FOLDER);
    if (!folder) {
      await this.vault.createFolder(QUIZ_FOLDER);
    }
  }

  /**
   * Copies bundled CLAUDE.md template to .quiz/CLAUDE.md.
   * Only copies if file doesn't exist (preserves user edits).
   */
  async initializeCLAUDEmd(): Promise<void> {
    const path = getQuizPath(CLAUDE_FILE);
    const file = this.vault.getAbstractFileByPath(path);
    if (!file) {
      await this.vault.create(path, CLAUDE_MD_TEMPLATE);
    }
  }

  /**
   * Reads config.json from .quiz/ folder.
   * Returns DEFAULT_CONFIG if file doesn't exist or is invalid.
   */
  async readConfig(): Promise<Config> {
    const path = getQuizPath(CONFIG_FILE);
    try {
      const file = this.vault.getAbstractFileByPath(path);
      if (!file || !(file instanceof TFile)) {
        return { ...DEFAULT_CONFIG };
      }
      const content = await this.vault.read(file);
      const parsed = JSON.parse(content) as Config;
      return parsed;
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  /**
   * Writes config object to .quiz/config.json.
   * Used by settings tab and streak service.
   */
  async writeConfig(config: Config): Promise<void> {
    const path = getQuizPath(CONFIG_FILE);
    const content = JSON.stringify(config, null, 2);
    const file = this.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      await this.vault.modify(file, content);
    } else {
      await this.vault.create(path, content);
    }
  }

  /**
   * Reads questions.json from .quiz/ folder.
   * Returns empty questions array if file doesn't exist.
   */
  async readQuestions(): Promise<QuestionsFile> {
    const path = getQuizPath(QUESTIONS_FILE);
    try {
      const file = this.vault.getAbstractFileByPath(path);
      if (!file || !(file instanceof TFile)) {
        return { ...EMPTY_QUESTIONS_FILE };
      }
      const content = await this.vault.read(file);
      const parsed = JSON.parse(content) as QuestionsFile;
      return parsed;
    } catch {
      return { ...EMPTY_QUESTIONS_FILE };
    }
  }

  /**
   * Writes questions array to .quiz/questions.json.
   * Used by import service to append new questions.
   */
  async writeQuestions(questions: QuestionsFile): Promise<void> {
    const path = getQuizPath(QUESTIONS_FILE);
    const content = JSON.stringify(questions, null, 2);
    const file = this.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      await this.vault.modify(file, content);
    } else {
      await this.vault.create(path, content);
    }
  }

  /**
   * Reads pending.json from .quiz/ folder.
   * Returns empty notes array if file doesn't exist.
   */
  async readPending(): Promise<PendingFile> {
    const path = getQuizPath(PENDING_FILE);
    try {
      const file = this.vault.getAbstractFileByPath(path);
      if (!file || !(file instanceof TFile)) {
        return { ...EMPTY_PENDING_FILE };
      }
      const content = await this.vault.read(file);
      const parsed = JSON.parse(content) as PendingFile;
      return parsed;
    } catch {
      return { ...EMPTY_PENDING_FILE };
    }
  }

  /**
   * Writes pending notes array to .quiz/pending.json.
   * Used when adding/removing notes from queue.
   */
  async writePending(pending: PendingFile): Promise<void> {
    const path = getQuizPath(PENDING_FILE);
    const content = JSON.stringify(pending, null, 2);
    const file = this.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      await this.vault.modify(file, content);
    } else {
      await this.vault.create(path, content);
    }
  }

  /**
   * Reads history.json from .quiz/ folder.
   * Returns empty attempts array if file doesn't exist.
   */
  async readHistory(): Promise<HistoryFile> {
    const path = getQuizPath(HISTORY_FILE);
    try {
      const file = this.vault.getAbstractFileByPath(path);
      if (!file || !(file instanceof TFile)) {
        return { ...EMPTY_HISTORY_FILE };
      }
      const content = await this.vault.read(file);
      const parsed = JSON.parse(content) as HistoryFile;
      return parsed;
    } catch {
      return { ...EMPTY_HISTORY_FILE };
    }
  }

  /**
   * Writes history to .quiz/history.json.
   * Called after completing a quiz.
   */
  async writeHistory(history: HistoryFile): Promise<void> {
    const path = getQuizPath(HISTORY_FILE);
    const content = JSON.stringify(history, null, 2);
    const file = this.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      await this.vault.modify(file, content);
    } else {
      await this.vault.create(path, content);
    }
  }

  /**
   * Reads import.json from .quiz/ folder.
   * Returns null if file doesn't exist (no pending import).
   */
  async readImport(): Promise<ImportFile | null> {
    const path = getQuizPath(IMPORT_FILE);
    try {
      const file = this.vault.getAbstractFileByPath(path);
      if (!file || !(file instanceof TFile)) {
        return null;
      }
      const content = await this.vault.read(file);
      const parsed = JSON.parse(content) as ImportFile;
      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Deletes .quiz/import.json after successful import.
   * Signals to user that import was processed.
   */
  async clearImport(): Promise<void> {
    const path = getQuizPath(IMPORT_FILE);
    const file = this.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      await this.app.fileManager.trashFile(file);
    }
  }

  /**
   * Recursively finds all .md files in a folder.
   * Used when adding a folder to the quiz queue.
   * @param folderPath - Path relative to vault root
   * @returns Array of file paths relative to vault root
   */
  async getMarkdownFilesInFolder(folderPath: string): Promise<string[]> {
    const folder = this.vault.getAbstractFileByPath(folderPath);
    if (!folder || !(folder instanceof TFolder)) {
      return [];
    }

    const files: string[] = [];
    const processFolder = (f: TFolder) => {
      for (const child of f.children) {
        if (child instanceof TFile && child.extension === 'md') {
          files.push(child.path);
        } else if (child instanceof TFolder) {
          processFolder(child);
        }
      }
    };

    processFolder(folder);
    return files;
  }
}
