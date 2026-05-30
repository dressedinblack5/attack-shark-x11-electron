# Settings Persistence and Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement settings persistence (using a new `settings.json`) and localization (using `vue-i18n` with static JSON files).

**Architecture:**
1.  Add `settingsManager.ts` in `src/main/storage/` for persistence.
2.  Install `vue-i18n`.
3.  Create `locales/` directory.
4.  Configure `vue-i18n` in `src/renderer/src/main.ts`.
5.  Update IPC handlers to bridge settings between main and renderer.

**Tech Stack:** Electron, Vue 3, TypeScript, `vue-i18n`, Bun.

---

### Task 1: Create Settings Manager

**Files:**
- Create: `src/main/storage/settingsManager.ts`
- Modify: `src/main/index.ts` (to add IPC handlers for settings)

- [ ] **Step 1: Create `src/main/storage/settingsManager.ts`**

```typescript
import { app } from 'electron';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');

export interface AppSettings {
    lastTab: string;
    connectionMode: 'Adapter' | 'Wired' | 'Bluetooth';
    language: string;
}

const DEFAULT_SETTINGS: AppSettings = {
    lastTab: 'dashboard',
    connectionMode: 'Adapter',
    language: 'en'
};

export async function getSettings(): Promise<AppSettings> {
    try {
        const data = await fs.readFile(SETTINGS_PATH, 'utf-8');
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/main/storage/settingsManager.ts
git commit -m "feat: create settings manager"
```

### Task 2: Localization Setup

**Files:**
- Create: `locales/en.json`
- Create: `locales/es.json`
- Modify: `package.json` (add dependency)

- [ ] **Step 1: Add dependency**

```bash
bun add vue-i18n
```

- [ ] **Step 2: Create locale files**

`locales/en.json`:
```json
{
  "dashboard": "Dashboard",
  "settings": "Settings",
  "language": "Language"
}
```

`locales/es.json`:
```json
{
  "dashboard": "Panel",
  "settings": "Configuración",
  "language": "Idioma"
}
```

- [ ] **Step 3: Commit**

```bash
git add locales/en.json locales/es.json package.json bun.lock
git commit -m "feat: add localization files and dependency"
```

### Task 3: Configure `vue-i18n` in Renderer

**Files:**
- Modify: `src/renderer/src/main.ts`

- [ ] **Step 1: Configure `vue-i18n`**

```typescript
import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import App from './App.vue';
import en from '../../../locales/en.json';
import es from '../../../locales/es.json';

const i18n = createI18n({
  legacy: false,
  locale: 'en', // Default, will be updated via settings
  messages: { en, es }
});

const app = createApp(App);
app.use(i18n);
app.mount('#app');
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/main.ts
git commit -m "feat: configure vue-i18n"
```

### Task 4: Connect Settings via IPC

**Files:**
- Modify: `src/main/index.ts`
- Modify: `src/preload/index.ts`

- [ ] **Step 1: Update main IPC handlers**

```typescript
// src/main/index.ts

import { ipcMain } from 'electron';
import { getSettings, saveSettings } from './storage/settingsManager';

ipcMain.handle('get-settings', async () => await getSettings());
ipcMain.handle('save-settings', async (_event, settings) => await saveSettings(settings));
```

- [ ] **Step 2: Expose IPC to renderer via preload**

```typescript
// src/preload/index.ts

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings)
});
```

- [ ] **Step 3: Commit**

```bash
git add src/main/index.ts src/preload/index.ts
git commit -m "feat: add ipc handlers for settings"
```
