/**
 * StreakService - Manages quiz streak tracking
 */

import type { FileService } from './file-service';

export interface StreakInfo {
  current: number;
  longest: number;
  lastQuizDate: string | null;
}

export class StreakService {
  constructor(private fileService: FileService) {}

  /**
   * Gets the current streak information.
   */
  async getStreakInfo(): Promise<StreakInfo> {
    const config = await this.fileService.readConfig();
    return {
      current: config.streak.current,
      longest: config.streak.longest,
      lastQuizDate: config.streak.lastQuizDate,
    };
  }

  /**
   * Checks if the streak should be reset (missed a day) and updates accordingly.
   * Should be called when the plugin loads and before taking a quiz.
   */
  async checkAndUpdateStreak(): Promise<void> {
    const config = await this.fileService.readConfig();
    const { lastQuizDate } = config.streak;

    if (!lastQuizDate) {
      // No quiz taken yet, nothing to reset
      return;
    }

    const lastDate = this.parseDate(lastQuizDate);
    const today = this.getToday();
    const daysDiff = this.daysBetween(lastDate, today);

    if (daysDiff > 1) {
      // Missed at least one day, reset streak
      config.streak.current = 0;
      await this.fileService.writeConfig(config);
    }
  }

  /**
   * Increments the streak after completing a quiz.
   * Only increments once per calendar day.
   */
  async incrementStreak(): Promise<StreakInfo> {
    const config = await this.fileService.readConfig();
    const today = this.formatDate(this.getToday());
    const { lastQuizDate } = config.streak;

    if (lastQuizDate === today) {
      // Already took a quiz today, don't increment
      return {
        current: config.streak.current,
        longest: config.streak.longest,
        lastQuizDate: config.streak.lastQuizDate,
      };
    }

    // Increment streak
    config.streak.current += 1;
    config.streak.lastQuizDate = today;

    // Update longest if current exceeds it
    if (config.streak.current > config.streak.longest) {
      config.streak.longest = config.streak.current;
    }

    await this.fileService.writeConfig(config);

    return {
      current: config.streak.current,
      longest: config.streak.longest,
      lastQuizDate: config.streak.lastQuizDate,
    };
  }

  /**
   * Resets the streak to zero.
   */
  async resetStreak(): Promise<void> {
    const config = await this.fileService.readConfig();
    config.streak.current = 0;
    config.streak.lastQuizDate = null;
    await this.fileService.writeConfig(config);
  }

  /**
   * Gets today's date at midnight (local time).
   */
  private getToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  /**
   * Parses a YYYY-MM-DD date string into a Date object.
   */
  private parseDate(dateStr: string): Date {
    const parts = dateStr.split('-').map(Number);
    const year = parts[0] ?? 0;
    const month = parts[1] ?? 1;
    const day = parts[2] ?? 1;
    return new Date(year, month - 1, day);
  }

  /**
   * Formats a Date object as YYYY-MM-DD.
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Calculates the number of days between two dates.
   */
  private daysBetween(date1: Date, date2: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor((date2.getTime() - date1.getTime()) / msPerDay);
  }
}
