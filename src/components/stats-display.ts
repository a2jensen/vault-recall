/**
 * StatsDisplay - Renders streak and statistics in the sidebar
 */

import type { StreakInfo } from '../services/streak-service';

export class StatsDisplay {
  private container: HTMLElement;
  private streakEl: HTMLElement;
  private bestEl: HTMLElement;

  constructor(parentEl: HTMLElement) {
    this.container = parentEl.createDiv({ cls: 'vr-stats' });
    this.render();
  }

  private render(): void {
    // Streak row
    const streakRow = this.container.createDiv({ cls: 'vr-stats-row vr-streak-row' });
    const fireIcon = streakRow.createSpan({ cls: 'vr-stats-icon' });
    fireIcon.textContent = '\uD83D\uDD25'; // Fire emoji
    this.streakEl = streakRow.createSpan({ cls: 'vr-stats-value' });
    this.streakEl.textContent = '0 days';

    // Best streak row
    const bestRow = this.container.createDiv({ cls: 'vr-stats-row vr-best-row' });
    const trophyIcon = bestRow.createSpan({ cls: 'vr-stats-icon' });
    trophyIcon.textContent = '\uD83C\uDFC6'; // Trophy emoji
    const bestLabel = bestRow.createSpan({ cls: 'vr-stats-label' });
    bestLabel.textContent = 'Best: ';
    this.bestEl = bestRow.createSpan({ cls: 'vr-stats-value' });
    this.bestEl.textContent = '0 days';
  }

  /**
   * Updates the displayed streak information.
   */
  update(info: StreakInfo): void {
    this.streakEl.textContent = `${info.current} day${info.current !== 1 ? 's' : ''}`;
    this.bestEl.textContent = `${info.longest} day${info.longest !== 1 ? 's' : ''}`;

    // Add animation class if streak is active
    if (info.current > 0) {
      this.container.addClass('vr-stats-active');
    } else {
      this.container.removeClass('vr-stats-active');
    }
  }

  /**
   * Returns the container element.
   */
  getContainer(): HTMLElement {
    return this.container;
  }
}
