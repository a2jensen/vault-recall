/**
 * SidebarView - Main sidebar panel for Vault Recall
 */

import { ItemView, WorkspaceLeaf, Notice, TFile } from 'obsidian';
import type VaultRecallPlugin from '../main';
import type { Difficulty, QuestionType } from '../types';
import { StatsDisplay } from '../components/stats-display';
import { QuizModal, QuizSourceModal } from './quiz-modal';
import { SIDEBAR_VIEW_TYPE } from '../constants';

export { SIDEBAR_VIEW_TYPE };

export class SidebarView extends ItemView {
  private plugin: VaultRecallPlugin;
  private statsDisplay: StatsDisplay | null = null;
  private pendingListEl: HTMLElement | null = null;
  private settingsCollapsed = true;

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

    // Generation settings section
    this.renderConfigSection(container);

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

  private renderConfigSection(container: HTMLElement): void {
    const prefs = this.plugin.config.preferences;

    const section = container.createDiv({ cls: 'vr-sidebar-section vr-config-section' });

    // Collapsible header
    const header = section.createDiv({ cls: 'vr-config-header' });
    header.createEl('span', { text: 'Generation settings', cls: 'vr-config-title' });
    const arrow = header.createEl('span', {
      cls: 'vr-config-arrow',
      text: this.settingsCollapsed ? '▸' : '▾',
    });

    const body = section.createDiv({ cls: 'vr-config-body' });
    if (this.settingsCollapsed) body.addClass('vr-config-body--hidden');

    header.addEventListener('click', () => {
      this.settingsCollapsed = !this.settingsCollapsed;
      arrow.textContent = this.settingsCollapsed ? '▸' : '▾';
      body.toggleClass('vr-config-body--hidden', this.settingsCollapsed);
    });

    // Questions per note — range slider
    const qpnRow = body.createDiv({ cls: 'vr-config-row' });
    qpnRow.createEl('label', { text: 'Questions per note', cls: 'vr-config-label' });
    const sliderRow = qpnRow.createDiv({ cls: 'vr-slider-row' });
    const slider = sliderRow.createEl('input', {
      cls: 'vr-slider',
      attr: { type: 'range', min: '1', max: '20' },
    });
    slider.value = String(prefs.questionsPerNote);
    const sliderVal = sliderRow.createEl('span', {
      cls: 'vr-slider-value',
      text: String(prefs.questionsPerNote),
    });
    slider.addEventListener('input', () => {
      sliderVal.textContent = slider.value;
    });
    slider.addEventListener('change', () => {
      this.plugin.config.preferences.questionsPerNote = parseInt(slider.value, 10);
      void this.saveConfig();
    });

    // Question types — checkboxes
    const qtRow = body.createDiv({ cls: 'vr-config-row' });
    qtRow.createEl('label', { text: 'Question types', cls: 'vr-config-label' });
    const checkboxGroup = qtRow.createDiv({ cls: 'vr-checkboxes' });

    const typeOptions: { label: string; value: QuestionType }[] = [
      { label: 'Multiple choice', value: 'multiple_choice' },
      { label: 'Fill in the blank', value: 'fill_blank' },
      { label: 'True / False', value: 'true_false' },
    ];

    const checkboxEls: { cb: HTMLInputElement; value: QuestionType }[] = [];

    for (const opt of typeOptions) {
      const item = checkboxGroup.createDiv({ cls: 'vr-checkbox-item' });
      const cb = item.createEl('input', { cls: 'vr-checkbox', attr: { type: 'checkbox' } });
      cb.checked = prefs.questionTypes.includes(opt.value);
      item.createEl('span', { text: opt.label });
      checkboxEls.push({ cb, value: opt.value });

      cb.addEventListener('change', () => {
        const selected = checkboxEls.filter((x) => x.cb.checked).map((x) => x.value);
        // Prevent unchecking the last option
        if (selected.length === 0) {
          cb.checked = true;
          return;
        }
        this.plugin.config.preferences.questionTypes = selected;
        void this.saveConfig();
      });
    }

    // Difficulty — segmented button
    const diffRow = body.createDiv({ cls: 'vr-config-row' });
    diffRow.createEl('label', { text: 'Difficulty', cls: 'vr-config-label' });
    const segmented = diffRow.createDiv({ cls: 'vr-segmented' });

    const difficulties: { label: string; value: Difficulty }[] = [
      { label: 'Easy', value: 'easy' },
      { label: 'Medium', value: 'medium' },
      { label: 'Hard', value: 'hard' },
    ];

    const segBtns: { btn: HTMLButtonElement; value: Difficulty }[] = [];

    for (const d of difficulties) {
      const btn = segmented.createEl('button', { cls: 'vr-seg-btn', text: d.label });
      if (prefs.difficulty === d.value) btn.addClass('vr-seg-btn-active');
      segBtns.push({ btn, value: d.value });

      btn.addEventListener('click', () => {
        segBtns.forEach((x) => x.btn.removeClass('vr-seg-btn-active'));
        btn.addClass('vr-seg-btn-active');
        this.plugin.config.preferences.difficulty = d.value;
        void this.saveConfig();
      });
    }

    // Include related concepts — toggle
    const ircRow = body.createDiv({ cls: 'vr-config-row vr-config-row--inline' });
    ircRow.createEl('span', { text: 'Include related concepts', cls: 'vr-config-label' });
    const toggle = ircRow.createEl('input', { cls: 'vr-toggle', attr: { type: 'checkbox' } });
    toggle.checked = prefs.includeRelatedConcepts;
    toggle.addEventListener('change', () => {
      this.plugin.config.preferences.includeRelatedConcepts = toggle.checked;
      void this.saveConfig();
    });

    // Custom prompt — textarea
    const cpRow = body.createDiv({ cls: 'vr-config-row' });
    cpRow.createEl('label', { text: 'Custom prompt', cls: 'vr-config-label' });
    const textarea = cpRow.createEl('textarea', {
      cls: 'vr-config-textarea',
      attr: { placeholder: 'Leave blank to use default prompt', rows: '3' },
    });
    textarea.value = prefs.customPrompt;
    textarea.addEventListener('change', () => {
      this.plugin.config.preferences.customPrompt = textarea.value.trim();
      void this.saveConfig();
    });
  }

  private async saveConfig(): Promise<void> {
    await this.plugin.fileService.writeConfig(this.plugin.config);
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
    const questions = await this.plugin.quizService.getAllQuestions();

    if (questions.length === 0) {
      new Notice('No questions available. Add notes to the queue and generate questions first.');
      return;
    }

    // Build per-note counts and sorted note list
    const noteCounts = new Map<string, number>();
    for (const q of questions) {
      noteCounts.set(q.sourceNote, (noteCounts.get(q.sourceNote) ?? 0) + 1);
    }
    const sourceNotes = [...noteCounts.keys()].sort((a, b) =>
      a.split('/').pop()!.localeCompare(b.split('/').pop()!)
    );

    new QuizSourceModal(this.app, sourceNotes, noteCounts, (source, path) => {
      void (async () => {
        const quizQuestions =
          source === 'note' && path
            ? await this.plugin.quizService.getQuestionsBySource(path)
            : questions;

        if (quizQuestions.length === 0) {
          new Notice('No questions found for the selected note');
          return;
        }

        new QuizModal(
          this.app,
          this.plugin.quizService,
          this.plugin.streakService,
          quizQuestions,
          () => void this.refreshStats()
        ).open();
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
