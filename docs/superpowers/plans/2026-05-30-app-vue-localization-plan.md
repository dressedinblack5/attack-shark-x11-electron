# App.vue Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Localize all hardcoded strings in `App.vue` (Sidebar and Connection Screen).

**Architecture:**
1.  Identify strings in `App.vue`.
2.  Add translations to `locales/en.json` and `locales/es.json`.
3.  Replace hardcoded strings in `App.vue` with `$t('key')`.

**Tech Stack:** Vue 3, vue-i18n.

---

### Task 1: Update Locale Files

**Files:**
- Modify: `locales/en.json`
- Modify: `locales/es.json`

- [ ] **Step 1: Add App.vue strings to locales**

`locales/en.json`:
```json
{
  "dashboard": "Dashboard",
  "settings": "Settings",
  "language": "Language",
  "english": "English",
  "spanish": "Spanish",
  "sidebar": {
    "preferences": "Preferences",
    "dpi": "DPI Config",
    "macros": "Macros",
    "deviceInfo": "Device Info"
  },
  "connection": {
    "title": "Connect your X11",
    "description": "Please select the connection mode to start configuring your device.",
    "adapter": "2.4G Adapter",
    "wired": "Wired Mode",
    "forceRefresh": "Force App Refresh",
    "disconnected": "Device Disconnected"
  }
}
```

`locales/es.json`:
```json
{
  "dashboard": "Panel",
  "settings": "Configuración",
  "language": "Idioma",
  "english": "Inglés",
  "spanish": "Español",
  "sidebar": {
    "preferences": "Preferencias",
    "dpi": "Configuración DPI",
    "macros": "Macros",
    "deviceInfo": "Info del Dispositivo"
  },
  "connection": {
    "title": "Conecta tu X11",
    "description": "Por favor selecciona el modo de conexión para configurar tu dispositivo.",
    "adapter": "Adaptador 2.4G",
    "wired": "Modo Cable",
    "forceRefresh": "Forzar actualización",
    "disconnected": "Dispositivo Desconectado"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add locales/en.json locales/es.json
git commit -m "feat: add App.vue localization strings to locales"
```

### Task 2: Refactor App.vue

**Files:**
- Modify: `src/renderer/src/App.vue`

- [ ] **Step 1: Replace hardcoded strings in App.vue**

```vue
<!-- Replace sidebar buttons -->
<button @click="activeTab = 'preferences'" ...>
  <Settings class="w-5 h-5" /> {{ $t('sidebar.preferences') }}
</button>
<button @click="activeTab = 'dpi'" ...>
  <Zap class="w-5 h-5" /> {{ $t('sidebar.dpi') }}
</button>
<!-- ... and so on for all sidebar buttons -->

<!-- Replace connection screen -->
<h2 class="text-2xl font-bold mb-2">{{ $t('connection.title') }}</h2>
<p class="text-slate-400 mb-8">{{ $t('connection.description') }}</p>
<!-- ... and so on for buttons and error text -->
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/App.vue
git commit -m "feat: localize App.vue"
```
