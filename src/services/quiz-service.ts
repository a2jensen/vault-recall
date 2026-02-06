/**
 * QuizService - Manages quiz sessions and question retrieval
 */

import type { FileService } from './file-service';
import type {
  Question,
  QuizSession,
  QuizAttempt,
  QuizResult,
  MultipleChoiceQuestion,
} from '../types';
import { generateId, getCurrentTimestamp, shuffledCopy } from '../utils/helpers';

export class QuizService {
  constructor(private fileService: FileService) {}

  /**
   * Gets all questions from the questions file.
   */
  async getAllQuestions(): Promise<Question[]> {
    const questionsFile = await this.fileService.readQuestions();
    return questionsFile.questions;
  }

  /**
   * Gets questions filtered by source note path.
   * @param sourcePath - The path of the source note
   */
  async getQuestionsBySource(sourcePath: string): Promise<Question[]> {
    const questions = await this.getAllQuestions();
    return questions.filter((q) => q.sourceNote === sourcePath);
  }

  /**
   * Gets questions from notes within a folder (recursive).
   * @param folderPath - The folder path to filter by
   */
  async getQuestionsByFolder(folderPath: string): Promise<Question[]> {
    const questions = await this.getAllQuestions();
    // Normalize folder path to ensure consistent matching
    const normalizedFolder = folderPath.endsWith('/')
      ? folderPath
      : `${folderPath}/`;
    return questions.filter(
      (q) =>
        q.sourceNote.startsWith(normalizedFolder) ||
        q.sourceNote === folderPath.replace(/\/$/, '')
    );
  }

  /**
   * Starts a new quiz session with the given questions.
   * Shuffles the question order.
   * @param questions - Array of questions to include in the quiz
   * @param count - Optional limit on number of questions
   */
  startQuiz(questions: Question[], count?: number): QuizSession {
    let quizQuestions = shuffledCopy(questions);

    if (count && count > 0 && count < quizQuestions.length) {
      quizQuestions = quizQuestions.slice(0, count);
    }

    return {
      questions: quizQuestions,
      currentIndex: 0,
      results: [],
      startTime: Date.now(),
    };
  }

  /**
   * Gets the current question in a quiz session.
   */
  getCurrentQuestion(session: QuizSession): Question | null {
    if (session.currentIndex >= session.questions.length) {
      return null;
    }
    return session.questions[session.currentIndex] ?? null;
  }

  /**
   * Gets shuffled options for a multiple choice question.
   * Returns array with correct answer mixed among incorrect answers.
   */
  getShuffledOptions(question: MultipleChoiceQuestion): string[] {
    const options = [question.correctAnswer, ...question.incorrectAnswers];
    return shuffledCopy(options);
  }

  /**
   * Submits an answer for the current question.
   * @param session - The current quiz session
   * @param answer - The user's answer (string for MC/fill, boolean for T/F)
   * @param timeSpent - Time spent on this question in milliseconds
   * @returns Whether the answer was correct
   */
  submitAnswer(
    session: QuizSession,
    answer: string | string[] | boolean,
    timeSpent: number
  ): boolean {
    const question = this.getCurrentQuestion(session);
    if (!question) {
      return false;
    }

    const correct = this.checkAnswer(question, answer);

    const result: QuizResult = {
      questionId: question.id,
      correct,
      timeSpent,
    };

    session.results.push(result);
    session.currentIndex += 1;

    return correct;
  }

  /**
   * Checks if an answer is correct for a given question.
   */
  checkAnswer(question: Question, answer: string | string[] | boolean): boolean {
    switch (question.type) {
      case 'multiple_choice':
        return answer === question.correctAnswer;

      case 'true_false':
        return answer === question.correctAnswer;

      case 'fill_blank': {
        if (!Array.isArray(answer)) {
          return false;
        }
        // Check each blank, case-insensitive
        if (answer.length !== question.blanks.length) {
          return false;
        }
        return question.blanks.every(
          (blank, i) =>
            answer[i] &&
            answer[i].toLowerCase().trim() === blank.toLowerCase().trim()
        );
      }

      default:
        return false;
    }
  }

  /**
   * Checks if the quiz session is complete.
   */
  isQuizComplete(session: QuizSession): boolean {
    return session.currentIndex >= session.questions.length;
  }

  /**
   * Finishes the quiz and returns the attempt record.
   * Does not save to history (that's done by the caller).
   */
  finishQuiz(session: QuizSession): QuizAttempt {
    const correctCount = session.results.filter((r) => r.correct).length;
    const totalQuestions = session.questions.length;
    const score =
      totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    return {
      id: generateId(),
      date: getCurrentTimestamp(),
      questionIds: session.questions.map((q) => q.id),
      results: session.results,
      score,
    };
  }

  /**
   * Records a quiz attempt to history.
   */
  async recordAttempt(attempt: QuizAttempt): Promise<void> {
    const history = await this.fileService.readHistory();
    history.attempts.push(attempt);
    await this.fileService.writeHistory(history);
  }

  /**
   * Gets the total number of questions available.
   */
  async getQuestionCount(): Promise<number> {
    const questions = await this.getAllQuestions();
    return questions.length;
  }
}
