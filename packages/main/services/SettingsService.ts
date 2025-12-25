import { app } from 'electron';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { AppSettings } from '../types';

const SETTINGS_FILE = join(app.getPath('userData'), 'settings.json');

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'auto',
  brewMirror: undefined,
  autoSourceShell: true
};

export class SettingsService {
  private static settings: AppSettings = { ...DEFAULT_SETTINGS };

  static load(): AppSettings {
    try {
      if (existsSync(SETTINGS_FILE)) {
        const content = readFileSync(SETTINGS_FILE, 'utf-8');
        const loaded = JSON.parse(content);
        this.settings = { ...DEFAULT_SETTINGS, ...loaded };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return this.settings;
  }

  static save(settings: Partial<AppSettings>): AppSettings {
    this.settings = { ...this.settings, ...settings };
    try {
      writeFileSync(SETTINGS_FILE, JSON.stringify(this.settings, null, 2));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
    return this.settings;
  }

  static get(): AppSettings {
    return this.settings;
  }

  static set(settings: Partial<AppSettings>): AppSettings {
    return this.save(settings);
  }
}
