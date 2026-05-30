# Design Specification: Full Application Localization (Iterative Approach)

## Overview
This design defines the process for localizing the entire application, systematically refactoring UI components to use `vue-i18n` for multi-language support.

## 1. Approach: Iterative Component Refactoring
- The application will be refactored component-by-component to ensure stability and maintainability.
- Priority: Sidebar/Connection Screen (`App.vue`), followed by tab components (`DpiSettings.vue`, `MacroSettings.vue`, `DeviceInfo.vue`).

## 2. Process for Each Component
1.  **String Identification**: Scan the component for hardcoded strings.
2.  **Resource Mapping**: Add identified strings to `locales/en.json` and `locales/es.json` using structured, descriptive keys.
3.  **Refactoring**: Replace hardcoded text in templates and scripts with `$t('key')` or `t('key')` calls.
4.  **Verification**: Confirm successful build, run automated tests, and manually verify UI translation toggling.
5.  **Commit**: Commit changes after each component is completed and verified.

## 3. Data Flow
- `vue-i18n` will remain the core localization framework.
- The `settings.json` file will continue to store the user's selected `language`.
- Changes to the language in `UserPreferences.vue` will update `settings.json` and dynamically trigger a locale change in `vue-i18n` across the entire application.

---
Spec written and committed to `docs/superpowers/specs/2026-05-30-full-localization-design.md`. Please review it and let me know if you want to make any changes before we start writing out the implementation plan.
