# Unified Auto-Save Implementation Plan

## Goal
Extend auto-save functionality with debouncing to all settings tabs (`UserPreferences`, `DpiSettings`, `MacroSettings`) to ensure a consistent, fluid user experience without needing manual 'Apply' actions.

## Design
Each settings component will implement a deep `watch` on its configuration state, debounced by 300ms, triggering an automatic save function.

### Specifications
1. **Debounce Time:** 300ms.
2. **Mechanism:** Vue's `watch` with `{ deep: true }` and `setTimeout`.
3. **Components:**
    - `UserPreferences.vue`: Update `watch` to include `pollingRate`, `sleepTime`, and `deepSleepTime`.
    - `DpiSettings.vue`: Implement new `watch` on `dpiConfig`.
    - `MacroSettings.vue`: Implement new `watch` on macro configuration state.

## Implementation Tasks

### Task 1: Unify Auto-Save in `DpiSettings.vue`
- [ ] Implement `watch` on `dpiConfig` with debouncing.
- [ ] Ensure `applyDpi` is called automatically.

### Task 2: Unify Auto-Save in `MacroSettings.vue`
- [ ] Identify configuration state object.
- [ ] Implement `watch` with debouncing.
- [ ] Ensure `applyMacro` is called automatically.

### Task 3: Expand Auto-Save in `UserPreferences.vue`
- [ ] Update `watch` to include remaining preferences.
- [ ] Ensure `sendLightingUpdate` logic covers all preferences or create a unified `saveAll` function.
