# Sidebar Language Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move language selector to sidebar footer.

**Architecture:**
1. Create `src/renderer/src/components/LanguageSelector.vue`.
2. Update `src/renderer/src/App.vue` to import and use this component in the sidebar.
3. Remove language selector from `UserPreferences.vue`.

**Tech Stack:** Vue 3, vue-i18n, Electron IPC.

---

### Task 1: Create LanguageSelector Component

**Files:**
- Create: `src/renderer/src/components/LanguageSelector.vue`

- [ ] **Step 1: Create LanguageSelector.vue**

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseSelect from './BaseSelect.vue';

const { locale } = useI18n();
const currentLanguage = ref('en');

onMounted(async () => {
	const settings: any = await window.api.getSettings();
	if (settings && settings.language) {
		currentLanguage.value = settings.language;
		locale.value = settings.language;
	}
});

const updateLanguage = async (lang: string) => {
	currentLanguage.value = lang;
	locale.value = lang;
	const settings: any = await window.api.getSettings();
	await window.api.saveSettings({ ...settings, language: lang });
};
</script>

<template>
	<div class="flex items-center gap-2">
		<BaseSelect :modelValue="currentLanguage" @update:modelValue="updateLanguage" class="w-full">
			<option value="en">{{ $t('english') }}</option>
			<option value="es">{{ $t('spanish') }}</option>
		</BaseSelect>
	</div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/LanguageSelector.vue
git commit -m "feat: create LanguageSelector component"
```

### Task 2: Update App.vue Sidebar

**Files:**
- Modify: `src/renderer/src/App.vue`

- [ ] **Step 1: Import and add LanguageSelector to App.vue sidebar**

```vue
<script setup lang="ts">
// ...
import LanguageSelector from './components/LanguageSelector.vue';
// ...
</script>

<template>
  <!-- ... inside the sidebar footer ... -->
  <div class="p-4 bg-slate-950 border-t border-slate-800 space-y-2">
    <LanguageSelector />
    <!-- ... existing connection/battery display ... -->
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/App.vue
git commit -m "feat: add LanguageSelector to sidebar footer"
```

### Task 3: Remove Language Selector from UserPreferences

**Files:**
- Modify: `src/renderer/src/components/UserPreferences.vue`

- [ ] **Step 1: Remove language selection logic from UserPreferences.vue**

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/UserPreferences.vue
git commit -m "refactor: remove language selector from UserPreferences"
```
