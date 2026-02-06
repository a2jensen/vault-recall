/**
 * QuestionRenderer - Renders different question types in the quiz UI
 */

import type {
  Question,
  MultipleChoiceQuestion,
  FillBlankQuestion,
  TrueFalseQuestion,
} from '../types';
import { shuffledCopy } from '../utils/helpers';

export type UserAnswer = string | string[] | boolean;

interface RenderResult {
  container: HTMLElement;
  getAnswer: () => UserAnswer | null;
  showFeedback: (correct: boolean, explanation: string) => void;
  disable: () => void;
}

export class QuestionRenderer {
  private selectedOption: string | null = null;
  private selectedTrueFalse: boolean | null = null;
  private blankInputs: HTMLInputElement[] = [];

  /**
   * Renders a question and returns the container with answer retrieval methods.
   */
  render(question: Question): RenderResult {
    switch (question.type) {
      case 'multiple_choice':
        return this.renderMultipleChoice(question);
      case 'fill_blank':
        return this.renderFillBlank(question);
      case 'true_false':
        return this.renderTrueFalse(question);
    }
  }

  /**
   * Renders a multiple choice question with radio button options.
   */
  private renderMultipleChoice(question: MultipleChoiceQuestion): RenderResult {
    const container = document.createElement('div');
    container.addClass('vr-question', 'vr-question-mc');

    // Question text
    const questionText = container.createDiv({ cls: 'vr-question-text' });
    questionText.textContent = question.question;

    // Options container
    const optionsContainer = container.createDiv({ cls: 'vr-options' });

    // Shuffle options
    const options = shuffledCopy([
      question.correctAnswer,
      ...question.incorrectAnswers,
    ]);

    let selectedOption: string | null = null;
    const optionElements: HTMLElement[] = [];

    for (const option of options) {
      const optionEl = optionsContainer.createDiv({ cls: 'vr-option' });
      optionElements.push(optionEl);

      const radio = optionEl.createEl('input', {
        type: 'radio',
        attr: { name: 'vr-mc-option' },
      });
      radio.dataset.value = option;

      const label = optionEl.createSpan({ cls: 'vr-option-label' });
      label.textContent = option;

      optionEl.addEventListener('click', () => {
        // Deselect all
        optionElements.forEach((el) => el.removeClass('vr-option-selected'));
        optionsContainer
          .querySelectorAll('input[type="radio"]')
          .forEach((r: HTMLInputElement) => (r.checked = false));

        // Select this one
        radio.checked = true;
        optionEl.addClass('vr-option-selected');
        selectedOption = option;
      });
    }

    // Feedback container (hidden initially)
    const feedbackContainer = container.createDiv({
      cls: 'vr-feedback vr-hidden',
    });

    return {
      container,
      getAnswer: () => selectedOption,
      showFeedback: (correct: boolean, explanation: string) => {
        feedbackContainer.removeClass('vr-hidden');
        feedbackContainer.addClass(correct ? 'vr-correct' : 'vr-incorrect');

        const resultText = feedbackContainer.createDiv({ cls: 'vr-result' });
        resultText.textContent = correct ? 'Correct!' : 'Incorrect';

        // Highlight correct answer
        optionElements.forEach((el) => {
          const value = el.querySelector('input')?.dataset.value;
          if (value === question.correctAnswer) {
            el.addClass('vr-option-correct');
          } else if (el.hasClass('vr-option-selected') && !correct) {
            el.addClass('vr-option-wrong');
          }
        });

        const explanationEl = feedbackContainer.createDiv({
          cls: 'vr-explanation',
        });
        explanationEl.createEl('strong', { text: 'Explanation: ' });
        explanationEl.createSpan({ text: explanation });
      },
      disable: () => {
        optionElements.forEach((el) => {
          el.addClass('vr-disabled');
          const radio = el.querySelector('input');
          if (radio) radio.disabled = true;
        });
      },
    };
  }

  /**
   * Renders a fill-in-the-blank question with text inputs.
   */
  private renderFillBlank(question: FillBlankQuestion): RenderResult {
    const container = document.createElement('div');
    container.addClass('vr-question', 'vr-question-fill');

    // Parse question text and insert input fields where ___ appears
    const questionContainer = container.createDiv({ cls: 'vr-question-text' });
    const parts = question.question.split('___');
    const inputs: HTMLInputElement[] = [];

    parts.forEach((part, index) => {
      questionContainer.createSpan({ text: part });

      if (index < parts.length - 1) {
        const input = questionContainer.createEl('input', {
          type: 'text',
          cls: 'vr-blank-input',
          attr: { placeholder: `blank ${index + 1}` },
        });
        inputs.push(input);
      }
    });

    // Feedback container (hidden initially)
    const feedbackContainer = container.createDiv({
      cls: 'vr-feedback vr-hidden',
    });

    return {
      container,
      getAnswer: () => {
        const answers = inputs.map((input) => input.value.trim());
        // Return null if any blank is empty
        if (answers.some((a) => a === '')) {
          return null;
        }
        return answers;
      },
      showFeedback: (correct: boolean, explanation: string) => {
        feedbackContainer.removeClass('vr-hidden');
        feedbackContainer.addClass(correct ? 'vr-correct' : 'vr-incorrect');

        const resultText = feedbackContainer.createDiv({ cls: 'vr-result' });
        resultText.textContent = correct ? 'Correct!' : 'Incorrect';

        // Show correct answers
        if (!correct) {
          const correctAnswers = feedbackContainer.createDiv({
            cls: 'vr-correct-answers',
          });
          correctAnswers.createEl('strong', { text: 'Correct answers: ' });
          correctAnswers.createSpan({ text: question.blanks.join(', ') });
        }

        // Highlight inputs
        inputs.forEach((input, index) => {
          const userAnswer = input.value.trim().toLowerCase();
          const correctAnswer = question.blanks[index]?.toLowerCase() ?? '';
          if (userAnswer === correctAnswer) {
            input.addClass('vr-input-correct');
          } else {
            input.addClass('vr-input-wrong');
          }
        });

        const explanationEl = feedbackContainer.createDiv({
          cls: 'vr-explanation',
        });
        explanationEl.createEl('strong', { text: 'Explanation: ' });
        explanationEl.createSpan({ text: explanation });
      },
      disable: () => {
        inputs.forEach((input) => {
          input.disabled = true;
        });
      },
    };
  }

  /**
   * Renders a true/false question with two buttons.
   */
  private renderTrueFalse(question: TrueFalseQuestion): RenderResult {
    const container = document.createElement('div');
    container.addClass('vr-question', 'vr-question-tf');

    // Question text
    const questionText = container.createDiv({ cls: 'vr-question-text' });
    questionText.textContent = question.question;

    // True/False buttons
    const buttonsContainer = container.createDiv({ cls: 'vr-tf-buttons' });

    let selectedValue: boolean | null = null;

    const trueBtn = buttonsContainer.createEl('button', {
      cls: 'vr-tf-btn',
      text: 'True',
    });
    const falseBtn = buttonsContainer.createEl('button', {
      cls: 'vr-tf-btn',
      text: 'False',
    });

    trueBtn.addEventListener('click', () => {
      trueBtn.addClass('vr-tf-selected');
      falseBtn.removeClass('vr-tf-selected');
      selectedValue = true;
    });

    falseBtn.addEventListener('click', () => {
      falseBtn.addClass('vr-tf-selected');
      trueBtn.removeClass('vr-tf-selected');
      selectedValue = false;
    });

    // Feedback container (hidden initially)
    const feedbackContainer = container.createDiv({
      cls: 'vr-feedback vr-hidden',
    });

    return {
      container,
      getAnswer: () => selectedValue,
      showFeedback: (correct: boolean, explanation: string) => {
        feedbackContainer.removeClass('vr-hidden');
        feedbackContainer.addClass(correct ? 'vr-correct' : 'vr-incorrect');

        const resultText = feedbackContainer.createDiv({ cls: 'vr-result' });
        resultText.textContent = correct ? 'Correct!' : 'Incorrect';

        // Highlight correct answer
        const correctBtn = question.correctAnswer ? trueBtn : falseBtn;
        const wrongBtn = question.correctAnswer ? falseBtn : trueBtn;

        correctBtn.addClass('vr-tf-correct');
        if (!correct) {
          wrongBtn.addClass('vr-tf-wrong');
        }

        const explanationEl = feedbackContainer.createDiv({
          cls: 'vr-explanation',
        });
        explanationEl.createEl('strong', { text: 'Explanation: ' });
        explanationEl.createSpan({ text: explanation });
      },
      disable: () => {
        trueBtn.disabled = true;
        falseBtn.disabled = true;
      },
    };
  }
}
