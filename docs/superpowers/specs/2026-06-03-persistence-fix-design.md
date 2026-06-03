# Design: Fix Persistence Issue via `v-model` Synchronization

## Problem
The `UserPreferences.vue` component maintains local state (`form`) that is initialized from `props.preferences`. Changes to this form are not propagated back to the `preferences` object in the parent `App.vue`. Because the `watch` observer in `App.vue` monitors `preferences`, it never triggers, causing settings not to be saved to disk.

## Proposed Solution: `v-model` Synchronization
We will implement two-way data binding using Vue 3's `v-model` pattern to ensure the parent `App.vue` component's state is always in sync with `UserPreferences.vue`.

### Changes

1.  **`UserPreferences.vue`**:
    *   Change props from `preferences` to `modelValue`.
    *   Define `emits: ['update:modelValue']`.
    *   In the form component, watch `form` and emit `update:modelValue` whenever a change is detected.

2.  **`App.vue`**:
    *   Update `<UserPreferences />` to use `v-model="preferences"`.

## Benefits
*   **Idiomatic Vue**: Uses established pattern for two-way binding.
*   **Automatic Sync**: The `watch` observer in `App.vue` will correctly detect changes made within `UserPreferences.vue`, ensuring `saveSettings` is called automatically.

## Data Flow
1. User changes a setting in `UserPreferences.vue`.
2. `form` in `UserPreferences` updates.
3. `UserPreferences` emits `update:modelValue` with the new data.
4. `App.vue` receives the event and updates its `preferences` object.
5. The `watch` in `App.vue` triggers and calls `window.api.saveSettings`.
