/**
 * Vault Recall - Main Plugin Entry Point
 */

import { Plugin, Notice, TFile, TFolder, Menu } from 'obsidian';
import { FileService } from './services/file-service';
import { ValidationService } from './services/validation-service';
import { StreakService } from './services/streak-service';
import { ImportService } from './services/import-service';
import { QuizService } from './services/quiz-service';
import { VaultRecallSettingTab } from './settings';
import { SidebarView, SIDEBAR_VIEW_TYPE } from './views/sidebar-view';
import { QuizModal, QuizSourceModal } from './views/quiz-modal';
import type { Config, PendingNote } from './types';
import { DEFAULT_CONFIG } from './constants';
import { getCurrentTimestamp } from './utils/helpers';

export default class VaultRecallPlugin extends Plugin {
  fileService: FileService;
  validationService: ValidationService;
  streakService: StreakService;
  importService: ImportService;
  quizService: QuizService;
  config: Config;

  async onload() {
    console.debug('Loading Vault Recall plugin');

    // Initialize services
    this.fileService = new FileService(this.app);
    this.validationService = new ValidationService();
    this.streakService = new StreakService(this.fileService);
    this.importService = new ImportService(
      this.fileService,
      this.validationService
    );
    this.quizService = new QuizService(this.fileService);

    // Initialize plugin data
    await this.initializePlugin();

    // Load configuration
    this.config = await this.fileService.readConfig();

    // Check and update streak on load
    await this.streakService.checkAndUpdateStreak();

    // Register sidebar view
    this.registerView(SIDEBAR_VIEW_TYPE, (leaf) => new SidebarView(leaf, this));

    // Register commands
    this.registerCommands();

    // Register context menu items
    this.registerContextMenus();

    // Add settings tab
    this.addSettingTab(new VaultRecallSettingTab(this.app, this));

    // Add ribbon icon
    this.addRibbonIcon('brain', 'Open sidebar', () => {
      void this.activateSidebar();
    });

    // TODO: Phase 4 - Register code block processor
  }

  /**
   * Initialize the plugin - create .quiz folder and default files
   */
  async initializePlugin(): Promise<void> {
    try {
      // Ensure .quiz folder exists
      await this.fileService.ensureQuizFolder();

      // Copy CLAUDE.md template if it doesn't exist
      await this.fileService.initializeCLAUDEmd();

      // Initialize config if it doesn't exist
      const config = await this.fileService.readConfig();
      if (!config.version) {
        await this.fileService.writeConfig(DEFAULT_CONFIG);
      }

      console.debug('Vault Recall: Initialization complete');
    } catch (error) {
      console.error('Vault Recall: Initialization failed', error);
      new Notice('Failed to initialize quiz folder');
    }
  }

  /**
   * Reload configuration from file
   */
  async reloadConfig(): Promise<void> {
    this.config = await this.fileService.readConfig();
  }

  /**
   * Register all plugin commands
   */
  private registerCommands(): void {
    // Add current note to quiz queue
    this.addCommand({
      id: 'add-note-to-queue',
      name: 'Add current note to quiz queue',
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (file && file.extension === 'md') {
          if (!checking) {
            void this.addNoteToQueue(file.path);
          }
          return true;
        }
        return false;
      },
    });

    // Copy generation prompt to clipboard
    this.addCommand({
      id: 'copy-generation-prompt',
      name: 'Copy generation prompt to clipboard',
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (file && file.extension === 'md') {
          if (!checking) {
            void this.copyGenerationPrompt(file.path);
          }
          return true;
        }
        return false;
      },
    });

    // Import questions from import.json
    this.addCommand({
      id: 'import-questions',
      name: 'Import questions from import.json',
      callback: async () => {
        await this.runImport();
      },
    });

    // Take a quiz
    this.addCommand({
      id: 'take-quiz',
      name: 'Take a quiz',
      callback: () => {
        void this.openQuiz();
      },
    });

    // Open sidebar
    this.addCommand({
      id: 'open-sidebar',
      name: 'Open sidebar',
      callback: () => {
        void this.activateSidebar();
      },
    });
  }

  /**
   * Activates the sidebar view
   */
  async activateSidebar(): Promise<void> {
    const { workspace } = this.app;

    let leaf = workspace.getLeavesOfType(SIDEBAR_VIEW_TYPE)[0];

    if (!leaf) {
      const rightLeaf = workspace.getRightLeaf(false);
      if (rightLeaf) {
        await rightLeaf.setViewState({
          type: SIDEBAR_VIEW_TYPE,
          active: true,
        });
        leaf = rightLeaf;
      }
    }

    if (leaf) {
      void workspace.revealLeaf(leaf);
    }
  }

  /**
   * Opens the quiz modal
   */
  async openQuiz(): Promise<void> {
    const questions = await this.quizService.getAllQuestions();

    if (questions.length === 0) {
      new Notice('No questions available. Add notes to the queue and generate questions first.');
      return;
    }

    const sourceNotes = [...new Set(questions.map((q) => q.sourceNote))];

    new QuizSourceModal(this.app, sourceNotes, (source, path) => {
      void (async () => {
        let quizQuestions = questions;

        if (source === 'folder' && path) {
          quizQuestions = await this.quizService.getQuestionsByFolder(path);
        } else if (source === 'note' && path) {
          quizQuestions = await this.quizService.getQuestionsBySource(path);
        }

        if (quizQuestions.length === 0) {
          new Notice('No questions found for the selected source');
          return;
        }

        new QuizModal(
          this.app,
          this.quizService,
          this.streakService,
          quizQuestions
        ).open();
      })();
    }).open();
  }

  /**
   * Register context menu items for files and folders
   */
  private registerContextMenus(): void {
    // File context menu
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu: Menu, file) => {
        if (file instanceof TFile && file.extension === 'md') {
          menu.addItem((item) => {
            item
              .setTitle('Add to quiz queue')
              .setIcon('plus-circle')
              .onClick(() => {
                void this.addNoteToQueue(file.path);
              });
          });

          menu.addItem((item) => {
            item
              .setTitle('Copy quiz prompt')
              .setIcon('clipboard-copy')
              .onClick(() => {
                void this.copyGenerationPrompt(file.path);
              });
          });
        }

        if (file instanceof TFolder) {
          menu.addItem((item) => {
            item
              .setTitle('Add folder to quiz queue')
              .setIcon('folder-plus')
              .onClick(() => {
                void this.addFolderToQueue(file.path);
              });
          });
        }
      })
    );
  }

  /**
   * Add a single note to the quiz queue
   */
  async addNoteToQueue(notePath: string): Promise<void> {
    try {
      const pending = await this.fileService.readPending();

      // Check if already in queue
      if (pending.notes.some((n) => n.path === notePath)) {
        new Notice('Note is already in the quiz queue');
        return;
      }

      // Add to queue
      const newNote: PendingNote = {
        path: notePath,
        addedAt: getCurrentTimestamp(),
        priority: 'normal',
      };
      pending.notes.push(newNote);

      await this.fileService.writePending(pending);
      new Notice('Added to quiz queue');
    } catch (error) {
      console.error('Failed to add note to queue', error);
      new Notice('Failed to add note to queue');
    }
  }

  /**
   * Add all markdown files in a folder to the quiz queue
   */
  async addFolderToQueue(folderPath: string): Promise<void> {
    try {
      const files = await this.fileService.getMarkdownFilesInFolder(folderPath);

      if (files.length === 0) {
        new Notice('No Markdown files found in folder');
        return;
      }

      const pending = await this.fileService.readPending();
      let addedCount = 0;

      for (const filePath of files) {
        // Skip if already in queue
        if (!pending.notes.some((n) => n.path === filePath)) {
          pending.notes.push({
            path: filePath,
            addedAt: getCurrentTimestamp(),
            priority: 'normal',
          });
          addedCount++;
        }
      }

      if (addedCount === 0) {
        new Notice('All notes are already in the queue');
        return;
      }

      await this.fileService.writePending(pending);
      new Notice(`Added ${addedCount} note${addedCount > 1 ? 's' : ''} to quiz queue`);
    } catch (error) {
      console.error('Failed to add folder to queue', error);
      new Notice('Failed to add folder to queue');
    }
  }

  /**
   * Builds a generation prompt string for a given note path.
   */
  buildGenerationPrompt(notePath: string): string {
    const { preferences } = this.config;
    const lines = [
      'Read .quiz/CLAUDE.md for instructions, then generate questions for the following note:',
      '',
      `Note: ${notePath}`,
      '',
      'Preferences:',
      `- Questions: ${preferences.questionsPerNote}`,
      `- Types: ${preferences.questionTypes.join(', ')}`,
      `- Difficulty: ${preferences.difficulty}`,
    ];

    if (preferences.customPrompt) {
      lines.push('', `Additional instructions: ${preferences.customPrompt}`);
    }

    return lines.join('\n');
  }

  /**
   * Copies a generation prompt for the given note to the clipboard.
   */
  async copyGenerationPrompt(notePath: string): Promise<void> {
    const prompt = this.buildGenerationPrompt(notePath);
    await navigator.clipboard.writeText(prompt);
    new Notice('Generation prompt copied to clipboard');
  }

  /**
   * Run the import process
   */
  async runImport(): Promise<void> {
    const result = await this.importService.importQuestions();

    if (result.success) {
      new Notice(`Imported ${result.imported} question${result.imported !== 1 ? 's' : ''}`);
    } else {
      const errorMsg = result.errors.slice(0, 3).join('\n');
      new Notice(`Import failed:\n${errorMsg}`, 5000);
    }
  }

  onunload() {
    console.debug('Unloading Vault Recall plugin');
  }
}
