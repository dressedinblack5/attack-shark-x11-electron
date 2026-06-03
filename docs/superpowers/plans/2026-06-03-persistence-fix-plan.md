# Persistence Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the settings persistence issue by implementing `v-model` two-way data binding between `App.vue` and `UserPreferences.vue`.

**Architecture:** Refactor `UserPreferences.vue` to use `modelValue` and `emit('update:modelValue')` instead of local props binding. Update `App.vue` to use `v-model`.

**Tech Stack:** Vue 3, TypeScript.

---

### Task 1: Refactor `UserPreferences.vue` to support `v-model`

**Files:**
- Modify: `src/renderer/src/components/UserPreferences.vue`

- [ ] **Step 1: Update component to use `v-model`**

Replace:
```typescript
const props = defineProps<{
	isConnected: boolean;
	preferences: UserPreferences;
}>();

const form = reactive<UserPreferences>({ ...props.preferences });

watch(
	() => props.preferences,
	(newVal) => {
		Object.assign(form, newVal);
	},
	{ deep: true },
);
```

With:
```typescript
const props = defineProps<{
	isConnected: boolean;
	modelValue: UserPreferences;
}>();

const emit = defineEmits(['update:modelValue']);

const form = reactive<UserPreferences>({ ...props.modelValue });

watch(
	() => props.modelValue,
	(newVal) => {
		Object.assign(form, newVal);
	},
	{ deep: true },
);

// Watch form changes to sync with parent
watch(
	form,
	(newVal) => {
		emit('update:modelValue', { ...newVal });
	},
	{ deep: true },
);
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/UserPreferences.vue
git commit -m "refactor: update UserPreferences to support v-model"
```

### Task 2: Update `App.vue` to use `v-model`

**Files:**
- Modify: `src/renderer/src/App.vue`

- [ ] **Step 1: Update component usage**

Find:
```html
<UserPreferences :preferences="preferences" :isConnected="isConnected" />
```

Replace with:
```html
<UserPreferences v-model="preferences" :isConnected="isConnected" />
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/App.vue
git commit -m "fix: use v-model to persist settings"
```

### Task 3: Verify Fix

- [ ] **Step 1: Run project**

Run: `bun dev`

- [ ] **Step 2: Verify Persistence**

1.  Open the application.
2.  Change a setting in `UserPreferences`.
3.  Observe that `saveSettings` is called (check console/network tab).
4.  Restart the application.
5.  Verify that the setting remains changed.

---
