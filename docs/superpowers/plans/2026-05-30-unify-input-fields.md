# Unify Input Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify all input/select fields to follow the subtle fill design system using `BaseInput.vue` and `BaseSelect.vue`.

**Architecture:** Replace raw `input` and `select` HTML elements with the new `BaseInput.vue` and `BaseSelect.vue` components in `UserPreferences.vue`, `DpiSettings.vue`, and `MacroSettings.vue`.

**Tech Stack:** Vue 3, Tailwind CSS

---

### Task 1: Refactor `UserPreferences.vue`

**Files:**
- Modify: `src/renderer/src/components/UserPreferences.vue`

- [ ] **Step 1: Replace input/select elements with BaseInput/BaseSelect**
- [ ] **Step 2: Verify functionality**

### Task 2: Refactor `DpiSettings.vue`

**Files:**
- Modify: `src/renderer/src/components/DpiSettings.vue`

- [ ] **Step 1: Replace input elements with BaseInput**
- [ ] **Step 2: Verify functionality**

### Task 3: Refactor `MacroSettings.vue`

**Files:**
- Modify: `src/renderer/src/components/MacroSettings.vue`

- [ ] **Step 1: Replace select elements with BaseSelect**
- [ ] **Step 2: Verify functionality**

### Task 4: Commit

- [ ] **Step 1: Commit the changes**
