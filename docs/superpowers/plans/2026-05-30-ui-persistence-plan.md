# UI Settings Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist UI settings (specifically language/locale) using the new settings persistence layer.

**Architecture:**
1.  Update `UserPreferences.vue` to fetch and update application settings using the new IPC handlers (`getSettings`, `saveSettings`).
2.  Ensure language selection in `UserPreferences.vue` triggers `saveSettings` to persist the preference.

**Tech Stack:** Vue 3, Electron IPC.

---

### Task 1: Integrate Settings Persistence in UserPreferences

**Files:**
- Modify: `src/renderer/src/components/UserPreferences.vue`

- [ ] **Step 1: Add language selector and persistence logic to UserPreferences.vue**

```vue
<script setup lang="ts">
// ... existing imports
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

// ... existing props
const { locale } = useI18n();
const currentLanguage = ref('en');

onMounted(async () => {
  const settings = await window.electronAPI.getSettings();
  currentLanguage.value = settings.language;
  locale.value = settings.language;
});

const updateLanguage = async (lang: string) => {
  currentLanguage.value = lang;
  locale.value = lang;
  const settings = await window.electronAPI.getSettings();
  await window.electronAPI.saveSettings({ ...settings, language: lang });
};
</script>

<template>
  <!-- ... existing template ... -->
  <div>
    <label class="block text-sm text-[var(--text-primary)] opacity-70 mb-2">Language</label>
    <BaseSelect :modelValue="currentLanguage" @update:modelValue="updateLanguage">
      <option value="en">English</option>
      <option value="es">Español</option>
    </BaseSelect>
  </div>
  <!-- ... rest of template ... -->
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/UserPreferences.vue
git commit -m "feat: persist language setting in UserPreferences"
```
