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

    // TODO: Phase 2 - Implement settings UI
    // - Questions per note (number slider, 1-20)
    // - Question types (multi-select checkboxes)
    // - Difficulty (dropdown)
    // - Include related concepts (toggle)
    // - Custom prompt (text area)

    new Setting(containerEl)
      .setName('Quiz generation')
      .setHeading();

    new Setting(containerEl)
      .setName('Coming soon')
      .setDesc('Full configuration will be available in a future update.');
  }
}
