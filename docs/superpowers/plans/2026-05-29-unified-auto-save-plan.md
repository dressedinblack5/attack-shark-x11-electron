# Global Auto-Save Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify auto-save (debouncing) functionality across all settings tabs (`UserPreferences`, `DpiSettings`, `MacroSettings`) to ensure a fluid experience.

**Architecture:** Use Vue's `watch` with `{ deep: true }` and `setTimeout` for debouncing in each component to automatically trigger saving functions upon state changes.

**Tech Stack:** Vue 3 (Composition API).

---

### Task 1: Implement Auto-Save in `DpiSettings.vue`

- [ ] **Step 1: Add state watcher with debounce**

Modify `src/renderer/src/components/DpiSettings.vue`:

```typescript
// Inside script setup
let debounceTimer: ReturnType<typeof setTimeout>;

watch(
	() => dpiConfig,
	() => {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(applyDpi, 300);
	},
	{ deep: true }
);
```

- [ ] **Step 2: Commit**
```bash
git add src/renderer/src/components/DpiSettings.vue
git commit -m "feat(ui): implement auto-save for DpiSettings"
```

### Task 2: Implement Auto-Save in `MacroSettings.vue`

- [ ] **Step 1: Implement state watcher**

Modify `src/renderer/src/components/MacroSettings.vue` to watch `selectedTemplate` and `selectedButton` (or whichever state object holds the macro config).

```typescript
// Example - adjust based on actual state structure
let debounceTimer: ReturnType<typeof setTimeout>;

watch(
    [selectedTemplate, selectedButton],
    () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(applyMacro, 300);
    }
);
```

- [ ] **Step 2: Commit**
```bash
git add src/renderer/src/components/MacroSettings.vue
git commit -m "feat(ui): implement auto-save for MacroSettings"
```

### Task 3: Expand Auto-Save in `UserPreferences.vue`

- [ ] **Step 1: Update watcher to include all preferences**

Modify the existing `watch` in `src/renderer/src/components/UserPreferences.vue` to include all relevant state fields.

```typescript
watch(
	() => props.preferences,
	() => {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(applyPreferences, 300);
	},
	{ deep: true }
);
```

- [ ] **Step 2: Commit**
```bash
git add src/renderer/src/components/UserPreferences.vue
git commit -m "feat(ui): expand auto-save in UserPreferences"
```
