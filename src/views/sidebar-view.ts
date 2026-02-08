/**
 * SidebarView - Main sidebar panel for Vault Recall
 */

import { ItemView, WorkspaceLeaf, Notice, TFile } from 'obsidian';
import type VaultRecallPlugin from '../main';
import { StatsDisplay } from '../components/stats-display';
import { QuizModal, QuizSourceModal } from './quiz-modal';
import { SIDEBAR_VIEW_TYPE } from '../constants';

export { SIDEBAR_VIEW_TYPE };

export class SidebarView extends ItemView {
  private plugin: VaultRecallPlugin;
  private statsDisplay: StatsDisplay | null = null;
  private pendingListEl: HTMLElement | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: VaultRecallPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return SIDEBAR_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'Vault recall';
  }

  getIcon(): string {
    return 'brain';
  }

  async onOpen(): Promise<void> {
    await this.render();
  }

  async onClose(): Promise<void> {
    // Cleanup if needed
  }

  async render(): Promise<void> {
    const container = this.containerEl.children[1];
    if (!(container instanceof HTMLElement)) return;
    container.empty();
    container.addClass('vr-sidebar');

    // Stats section
    const statsSection = container.createDiv({ cls: 'vr-sidebar-section' });
    this.statsDisplay = new StatsDisplay(statsSection);
    await this.refreshStats();

    // Take Quiz button
    const quizSection = container.createDiv({ cls: 'vr-sidebar-section' });
    const quizBtn = quizSection.createEl('button', {
      cls: 'vr-btn vr-btn-primary vr-btn-full',
      text: 'Take a quiz',
    });
    quizBtn.addEventListener('click', () => {
      void this.openQuiz();
    });

    // Pending notes section
    const pendingSection = container.createDiv({ cls: 'vr-sidebar-section' });
    const pendingHeader = pendingSection.createDiv({ cls: 'vr-section-header' });
    pendingHeader.createEl('h3', { text: 'Pending notes' });

    this.pendingListEl = pendingSection.createDiv({ cls: 'vr-pending-list' });
    await this.refreshPendingList();

    // Actions section
    const actionsSection = container.createDiv({ cls: 'vr-sidebar-section vr-sidebar-actions' });

    // Import button
    const importBtn = actionsSection.createEl('button', {
      cls: 'vr-btn vr-btn-outline vr-btn-full',
      text: 'Import questions',
    });
    importBtn.addEventListener('click', () => {
      void this.runImport();
    });

    // Refresh button
    const refreshBtn = actionsSection.createEl('button', {
      cls: 'vr-btn vr-btn-outline vr-btn-full',
      text: 'Refresh',
    });
    refreshBtn.addEventListener('click', () => {
      void this.refresh();
    });
  }

  async refresh(): Promise<void> {
    await this.refreshStats();
    await this.refreshPendingList();
  }

  private async refreshStats(): Promise<void> {
    if (!this.statsDisplay) return;

    const streakInfo = await this.plugin.streakService.getStreakInfo();
    this.statsDisplay.update(streakInfo);
  }

  private async refreshPendingList(): Promise<void> {
    if (!this.pendingListEl) return;

    this.pendingListEl.empty();

    const pending = await this.plugin.fileService.readPending();

    if (pending.notes.length === 0) {
      const emptyMsg = this.pendingListEl.createDiv({ cls: 'vr-pending-empty' });
      emptyMsg.textContent = 'No notes in queue';
      emptyMsg.createEl('p', {
        text: 'Right-click a note to add it to the quiz queue.',
        cls: 'vr-pending-hint',
      });
      return;
    }

    // Show count and generate button
    const pendingToolbar = this.pendingListEl.createDiv({ cls: 'vr-pending-toolbar' });
    const countEl = pendingToolbar.createDiv({ cls: 'vr-pending-count' });
    countEl.textContent = `${pending.notes.length} note${pending.notes.length !== 1 ? 's' : ''} waiting`;

    const generateBtn = pendingToolbar.createEl('button', {
      cls: 'vr-btn vr-btn-secondary vr-btn-sm',
      text: 'Copy prompt',
      attr: { 'aria-label': 'Copy generation prompt for all queued notes' },
    });
    generateBtn.addEventListener('click', () => {
      void this.plugin.copyQueueGenerationPrompt();
    });

    // List pending notes
    for (const note of pending.notes) {
      const noteEl = this.pendingListEl.createDiv({ cls: 'vr-pending-item' });

      // Note name (just filename without path)
      const nameEl = noteEl.createSpan({ cls: 'vr-pending-name' });
      const filename = note.path.split('/').pop() || note.path;
      nameEl.textContent = filename.replace(/\.md$/, '');
      nameEl.setAttribute('title', note.path);

      // Click to open note
      nameEl.addEventListener('click', () => {
        void this.openNote(note.path);
      });

      // Remove button
      const removeBtn = noteEl.createEl('button', {
        cls: 'vr-pending-remove',
        attr: { 'aria-label': 'Remove from queue' },
      });
      removeBtn.textContent = '\u00d7'; // × symbol
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        void this.removeFromQueue(note.path);
      });
    }
  }

  private async openNote(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      await this.app.workspace.getLeaf().openFile(file);
    } else {
      new Notice('Note not found');
    }
  }

  private async removeFromQueue(path: string): Promise<void> {
    try {
      const pending = await this.plugin.fileService.readPending();
      pending.notes = pending.notes.filter((n) => n.path !== path);
      await this.plugin.fileService.writePending(pending);
      await this.refreshPendingList();
      new Notice('Removed from queue');
    } catch (error) {
      console.error('Failed to remove from queue', error);
      new Notice('Failed to remove from queue');
    }
  }

  private async openQuiz(): Promise<void> {
    // Get all available questions
    const questions = await this.plugin.quizService.getAllQuestions();

    if (questions.length === 0) {
      new Notice('No questions available. Add notes to the queue and generate questions first.');
      return;
    }

    // Get unique source notes for the source selector
    const sourceNotes = [...new Set(questions.map((q) => q.sourceNote))];

    // Open source selection modal
    new QuizSourceModal(this.app, sourceNotes, (source, path) => {
      void (async () => {
        let quizQuestions = questions;

        if (source === 'folder' && path) {
          quizQuestions = await this.plugin.quizService.getQuestionsByFolder(path);
        } else if (source === 'note' && path) {
          quizQuestions = await this.plugin.quizService.getQuestionsBySource(path);
        }

        if (quizQuestions.length === 0) {
          new Notice('No questions found for the selected source');
          return;
        }

        // Open quiz modal
        const quizModal = new QuizModal(
          this.app,
          this.plugin.quizService,
          this.plugin.streakService,
          quizQuestions,
          () => {
            // Refresh stats after quiz completes
            void this.refreshStats();
          }
        );
        quizModal.open();
      })();
    }).open();
  }

  private async runImport(): Promise<void> {
    const result = await this.plugin.importService.importQuestions();

    if (result.success) {
      new Notice(`Imported ${result.imported} question${result.imported !== 1 ? 's' : ''}`);
    } else {
      const errorMsg = result.errors.slice(0, 3).join('\n');
      new Notice(`Import failed:\n${errorMsg}`, 5000);
    }
  }
}
