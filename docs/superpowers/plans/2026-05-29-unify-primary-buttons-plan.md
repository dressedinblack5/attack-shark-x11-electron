# Unify Primary Buttons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify primary button styling across the application by creating a `BaseButton.vue` component and refactoring existing buttons.

**Architecture:** Create a new component `BaseButton.vue` with the specified tailwind classes and `v-bind="$attrs"` for prop passing. Replace direct button declarations in UI components with this new component.

**Tech Stack:** Vue 3, Tailwind CSS.

---

### Task 1: Create BaseButton.vue

**Files:**
- Create: `src/renderer/src/components/BaseButton.vue`

- [ ] **Step 1: Write BaseButton.vue component**

```vue
<template>
  <button 
    class="bg-transparent border border-[var(--border-card)] text-[var(--text-primary)] hover:bg-[var(--border-card)]/50 hover:border-transparent transition-all rounded-lg px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/BaseButton.vue
git commit -m "feat: add BaseButton component"
```

### Task 2: Refactor DpiSettings.vue

**Files:**
- Modify: `src/renderer/src/components/DpiSettings.vue`

- [ ] **Step 1: Replace Save DPI button with BaseButton**

Locate `button` in `DpiSettings.vue` and replace with `BaseButton`.

```vue
<!-- DpiSettings.vue -->
<BaseButton
    @click="applyDpi"
    :disabled="!isConnected || isSaving"
>
    {{ isSaving ? 'Applying...' : 'Save DPI' }}
</BaseButton>
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/DpiSettings.vue
git commit -m "refactor: use BaseButton in DpiSettings"
```

### Task 3: Refactor MacroSettings.vue

**Files:**
- Modify: `src/renderer/src/components/MacroSettings.vue`

- [ ] **Step 1: Replace Apply Macro button with BaseButton**

Locate `button` in `MacroSettings.vue` and replace with `BaseButton`.

```vue
<!-- MacroSettings.vue -->
<BaseButton
    @click="applyMacro"
    :disabled="!isConnected || isSaving"
>
    <Save class="w-4 h-4" />
    {{ isSaving ? 'Applying...' : 'Apply Macro' }}
</BaseButton>
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/MacroSettings.vue
git commit -m "refactor: use BaseButton in MacroSettings"
```

### Task 4: Refactor UserPreferences.vue

**Files:**
- Modify: `src/renderer/src/components/UserPreferences.vue`

- [ ] **Step 1: Replace Save and Apply Settings buttons with BaseButton**

Locate `button` tags for "Save" and "Apply Settings" in `UserPreferences.vue` and replace with `BaseButton`.

```vue
<!-- UserPreferences.vue -->
<BaseButton
    @click="saveNewProfile"
>
    Save
</BaseButton>
<BaseButton
    @click="applyPreferences"
    :disabled="!isConnected || isSaving"
>
    {{ isSaving ? 'Saving...' : 'Apply Settings' }}
</BaseButton>
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/UserPreferences.vue
git commit -m "refactor: use BaseButton in UserPreferences"
```
