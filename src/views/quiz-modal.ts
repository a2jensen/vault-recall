/**
 * QuizModal - Modal for taking quizzes
 */

import { Modal, App } from 'obsidian';
import type { QuizService } from '../services/quiz-service';
import type { StreakService } from '../services/streak-service';
import type { Question, QuizSession, QuizAttempt } from '../types';
import { QuestionRenderer } from '../components/question-renderer';

export class QuizModal extends Modal {
  private quizService: QuizService;
  private streakService: StreakService;
  private session: QuizSession;
  private renderer: QuestionRenderer;
  private currentRender: ReturnType<QuestionRenderer['render']> | null = null;
  private questionStartTime: number = 0;
  private onComplete: ((attempt: QuizAttempt) => void) | null = null;

  constructor(
    app: App,
    quizService: QuizService,
    streakService: StreakService,
    questions: Question[],
    onComplete?: (attempt: QuizAttempt) => void
  ) {
    super(app);
    this.quizService = quizService;
    this.streakService = streakService;
    this.session = quizService.startQuiz(questions);
    this.renderer = new QuestionRenderer();
    this.onComplete = onComplete || null;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('vr-quiz-modal');

    this.renderCurrentQuestion();
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }

  private renderCurrentQuestion(): void {
    const { contentEl } = this;
    contentEl.empty();

    const question = this.quizService.getCurrentQuestion(this.session);

    if (!question) {
      // Quiz is complete
      void this.renderResults();
      return;
    }

    // Progress header
    const header = contentEl.createDiv({ cls: 'vr-quiz-header' });
    const progress = header.createDiv({ cls: 'vr-quiz-progress' });
    progress.textContent = `Question ${this.session.currentIndex + 1} of ${this.session.questions.length}`;

    // Progress bar
    const progressBar = header.createDiv({ cls: 'vr-progress-bar' });
    const progressFill = progressBar.createDiv({ cls: 'vr-progress-fill' });
    const percent = ((this.session.currentIndex) / this.session.questions.length) * 100;
    progressFill.style.width = `${percent}%`;

    // Question type badge
    const badge = header.createDiv({ cls: 'vr-question-badge' });
    badge.textContent = this.getQuestionTypeLabel(question.type);

    // Question container
    const questionContainer = contentEl.createDiv({ cls: 'vr-question-container' });
    this.currentRender = this.renderer.render(question);
    questionContainer.appendChild(this.currentRender.container);

    // Start timing
    this.questionStartTime = Date.now();

    // Action buttons
    const actions = contentEl.createDiv({ cls: 'vr-quiz-actions' });
    const submitBtn = actions.createEl('button', {
      cls: 'vr-btn vr-btn-primary',
      text: 'Submit',
    });

    submitBtn.addEventListener('click', () => {
      this.handleSubmit(question, submitBtn, actions);
    });
  }

  private handleSubmit(
    question: Question,
    submitBtn: HTMLButtonElement,
    actions: HTMLElement
  ): void {
    if (!this.currentRender) return;

    const answer = this.currentRender.getAnswer();

    if (answer === null) {
      // No answer selected
      return;
    }

    // Calculate time spent
    const timeSpent = Date.now() - this.questionStartTime;

    // Submit answer and get result
    const correct = this.quizService.submitAnswer(this.session, answer, timeSpent);

    // Show feedback
    this.currentRender.showFeedback(correct, question.explanation);
    this.currentRender.disable();

    // Replace submit with next button
    submitBtn.remove();

    const isLastQuestion = this.quizService.isQuizComplete(this.session);
    const nextBtn = actions.createEl('button', {
      cls: 'vr-btn vr-btn-primary',
      text: isLastQuestion ? 'See Results' : 'Next Question',
    });

    nextBtn.addEventListener('click', () => {
      this.renderCurrentQuestion();
    });
  }

  private async renderResults(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();

    // Finish quiz and get attempt record
    const attempt = this.quizService.finishQuiz(this.session);

    // Record the attempt
    await this.quizService.recordAttempt(attempt);

    // Update streak
    const streakInfo = await this.streakService.incrementStreak();

    // Results container
    const resultsContainer = contentEl.createDiv({ cls: 'vr-quiz-results' });

    // Title
    const title = resultsContainer.createEl('h2', { cls: 'vr-results-title' });
    title.textContent = 'Quiz complete!';

    // Score
    const scoreContainer = resultsContainer.createDiv({ cls: 'vr-score-container' });
    const correctCount = this.session.results.filter((r) => r.correct).length;
    const totalCount = this.session.questions.length;

    const scoreCircle = scoreContainer.createDiv({ cls: 'vr-score-circle' });
    const scoreValue = scoreCircle.createDiv({ cls: 'vr-score-value' });
    scoreValue.textContent = `${attempt.score}%`;

    const scoreDetails = scoreContainer.createDiv({ cls: 'vr-score-details' });
    scoreDetails.textContent = `${correctCount} out of ${totalCount} correct`;

    // Streak info
    const streakContainer = resultsContainer.createDiv({ cls: 'vr-results-streak' });
    const fireIcon = streakContainer.createSpan({ cls: 'vr-streak-icon' });
    fireIcon.textContent = '\uD83D\uDD25';
    const streakText = streakContainer.createSpan({ cls: 'vr-streak-text' });
    streakText.textContent = `${streakInfo.current} day streak!`;

    // Performance indicator
    const performanceContainer = resultsContainer.createDiv({ cls: 'vr-performance' });
    if (attempt.score >= 80) {
      performanceContainer.textContent = 'Excellent work!';
      performanceContainer.addClass('vr-performance-excellent');
    } else if (attempt.score >= 60) {
      performanceContainer.textContent = 'Good effort!';
      performanceContainer.addClass('vr-performance-good');
    } else {
      performanceContainer.textContent = 'Keep practicing!';
      performanceContainer.addClass('vr-performance-needs-work');
    }

    // Done button
    const actions = resultsContainer.createDiv({ cls: 'vr-quiz-actions' });
    const doneBtn = actions.createEl('button', {
      cls: 'vr-btn vr-btn-primary',
      text: 'Done',
    });

    doneBtn.addEventListener('click', () => {
      this.close();
      if (this.onComplete) {
        this.onComplete(attempt);
      }
    });
  }

  private getQuestionTypeLabel(type: string): string {
    switch (type) {
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'fill_blank':
        return 'Fill in the Blank';
      case 'true_false':
        return 'True or False';
      default:
        return type;
    }
  }
}

/**
 * Modal for selecting quiz source before starting
 */
export class QuizSourceModal extends Modal {
  private onSelect: (source: 'all' | 'note', path?: string) => void;
  private sourceNotes: string[];
  private noteCounts: Map<string, number>;

  constructor(
    app: App,
    sourceNotes: string[],
    noteCounts: Map<string, number>,
    onSelect: (source: 'all' | 'note', path?: string) => void
  ) {
    super(app);
    this.sourceNotes = sourceNotes;
    this.noteCounts = noteCounts;
    this.onSelect = onSelect;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('vr-source-modal');

    contentEl.createEl('h2', { cls: 'vr-source-title', text: 'Select quiz source' });

    const options = contentEl.createDiv({ cls: 'vr-source-options' });

    // All questions
    const totalCount = Array.from(this.noteCounts.values()).reduce((a, b) => a + b, 0);
    const allBtn = options.createEl('button', { cls: 'vr-btn vr-btn-primary vr-btn-full' });
    allBtn.createSpan({ text: 'All questions' });
    allBtn.createSpan({ cls: 'vr-source-count', text: `${totalCount}` });
    allBtn.addEventListener('click', () => {
      this.onSelect('all');
      this.close();
    });

    // Per-note list, grouped by folder
    if (this.sourceNotes.length > 0) {
      const noteSection = options.createDiv({ cls: 'vr-source-section' });
      noteSection.createEl('h3', { text: 'By note' });

      // Group notes by parent folder
      const groups = new Map<string, string[]>();
      for (const notePath of this.sourceNotes) {
        const parts = notePath.split('/');
        const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
        if (!groups.has(folder)) groups.set(folder, []);
        groups.get(folder)!.push(notePath);
      }

      // Root notes first, then folders alphabetically by last segment
      const sortedFolders = [...groups.keys()].sort((a, b) => {
        if (a === '') return -1;
        if (b === '') return 1;
        return (a.split('/').pop() ?? a).localeCompare(b.split('/').pop() ?? b);
      });

      for (const folder of sortedFolders) {
        const notes = groups.get(folder)!;

        if (folder !== '') {
          const folderHeader = noteSection.createDiv({ cls: 'vr-source-folder-header' });
          folderHeader.createSpan({ text: folder.split('/').pop() ?? folder });
        }

        const group = noteSection.createDiv({
          cls: folder !== '' ? 'vr-source-folder-group' : 'vr-source-root-group',
        });

        for (const notePath of notes) {
          const filename = notePath.split('/').pop()?.replace(/\.md$/, '') ?? notePath;
          const count = this.noteCounts.get(notePath) ?? 0;

          const noteBtn = group.createEl('button', {
            cls: 'vr-btn vr-btn-outline vr-btn-full vr-source-note-btn',
            attr: { title: notePath },
          });
          noteBtn.createSpan({ cls: 'vr-source-note-name', text: filename });
          noteBtn.createSpan({ cls: 'vr-source-count', text: `${count}` });

          noteBtn.addEventListener('click', () => {
            this.onSelect('note', notePath);
            this.close();
          });
        }
      }
    }

    // Cancel
    const cancelContainer = contentEl.createDiv({ cls: 'vr-source-cancel' });
    cancelContainer.createEl('button', {
      cls: 'vr-btn vr-btn-secondary',
      text: 'Cancel',
    }).addEventListener('click', () => this.close());
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
