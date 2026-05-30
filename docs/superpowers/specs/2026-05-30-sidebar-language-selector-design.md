# Design Specification: Global Sidebar Language Selector

## Overview
This design covers moving the language selector from `UserPreferences.vue` to the sidebar footer in `App.vue` to make it globally accessible.

## 1. UI Changes
- **Location**: `src/renderer/src/App.vue` within the sidebar footer.
- **Component**: A new, compact `LanguageSelector.vue` will be created.
- **Style**: Compact dropdown or simple toggle to fit sidebar constraints.

## 2. Functionality
- **Data Flow**: Interfaces with `electronAPI.getSettings` and `electronAPI.saveSettings`.
- **Locale Management**: Updates `vue-i18n` locale globally when changed.
- **Persistence**: Automatically saves the new language setting to `settings.json` upon selection.

---
Spec written and committed to `docs/superpowers/specs/2026-05-30-sidebar-language-selector-design.md`. Please review it and let me know if you want to make any changes before we start writing out the implementation plan.
