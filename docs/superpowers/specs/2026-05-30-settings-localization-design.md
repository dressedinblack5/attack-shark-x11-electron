# Design Specification: Settings Persistence and Localization

## Overview
This design covers the implementation of a new persistent settings system for UI preferences and a localization system using `vue-i18n` for multi-language support in the Attack Shark X11 Electron application.

## 1. Settings Persistence
- **Implementation**: New `src/main/storage/settingsManager.ts` to handle I/O for `settings.json`.
- **Storage Location**: `userData` directory (Electron standard).
- **Interface**:
    ```typescript
    export interface AppSettings {
        lastTab: string;
        connectionMode: 'Adapter' | 'Wired' | 'Bluetooth';
        language: string;
    }
    ```

## 2. Localization
- **Framework**: `vue-i18n`.
- **Storage**: Project-root `locales/` directory containing JSON files for each language.
- **Initialization**: Renderer process initializes `vue-i18n` using the `language` preference loaded from `settings.json` on app launch.

## 3. Data Flow
1.  **Startup**: Main process reads `settings.json`, sends preferences to renderer.
2.  **Renderer**: Renderer initializes `vue-i18n` with the language setting.
3.  **UI Updates**: Changing language/settings in UI triggers an IPC call to the main process to update `settings.json`.

---
Spec written and committed to `docs/superpowers/specs/2026-05-30-settings-localization-design.md`. Please review it and let me know if you want to make any changes before we start writing out the implementation plan.
