/**
 * Vault Recall - Main Plugin Entry Point
 */

import { Plugin, Notice } from 'obsidian';
import { FileService } from './services/file-service';
import { ValidationService } from './services/validation-service';
import type { Config } from './types';
import { DEFAULT_CONFIG } from './constants';

export default class VaultRecallPlugin extends Plugin {
  fileService: FileService;
  validationService: ValidationService;
  config: Config;

  async onload() {
    console.debug('Loading Vault Recall plugin');

    // Initialize services
    this.fileService = new FileService(this.app);
    this.validationService = new ValidationService();

    // Initialize plugin data
    await this.initializePlugin();

    // Load configuration
    this.config = await this.fileService.readConfig();

    // TODO: Phase 2 - Register commands
    // TODO: Phase 3 - Register sidebar view
    // TODO: Phase 3 - Register code block processor
    // TODO: Phase 3 - Register context menu items
    // TODO: Phase 2 - Add settings tab
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

  onunload() {
    console.debug('Unloading Vault Recall plugin');
  }
}
