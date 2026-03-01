/**
 * Vault Recall - Settings Tab (stub for Phase 2)
 */

import { App, PluginSettingTab, Setting } from 'obsidian';
import type VaultRecallPlugin from './main';

export class VaultRecallSettingTab extends PluginSettingTab {
  plugin: VaultRecallPlugin;

  constructor(app: App, plugin: VaultRecallPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Quiz generation')
      .setHeading();

    new Setting(containerEl)
      .setName('Generation settings')
      .setDesc(
        'Configure questions per note, question types, difficulty, and custom prompt ' +
        'directly in the Vault Recall sidebar panel under "Generation settings".'
      );
  }
}
