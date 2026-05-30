# UserPreferences.vue Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Localize all hardcoded strings in `UserPreferences.vue`.

**Architecture:**
1.  Identify strings in `UserPreferences.vue`.
2.  Add translations to `locales/en.json` and `locales/es.json`.
3.  Replace hardcoded strings in `UserPreferences.vue` with `$t('key')`.

**Tech Stack:** Vue 3, vue-i18n.

---

### Task 1: Update Locale Files

**Files:**
- Modify: `locales/en.json`
- Modify: `locales/es.json`

- [ ] **Step 1: Add UserPreferences strings to locales**

`locales/en.json` addition:
```json
  "preferences": {
    "title": "User Preferences",
    "saveProfile": "Save",
    "apply": "Apply",
    "saving": "Saving...",
    "storedProfiles": "Stored Profiles",
    "applyAction": "Apply",
    "deleteAction": "Delete",
    "lighting": "LIGHTING",
    "effectMode": "Effect Mode",
    "ledSpeed": "LED Speed",
    "slow": "Slow",
    "fast": "Fast",
    "color": "Color",
    "red": "Red",
    "green": "Green",
    "blue": "Blue",
    "deviceBehavior": "DEVICE BEHAVIOR",
    "pollingRate": "Polling Rate",
    "keyResponse": "Key Response",
    "sleepTimer": "Sleep Timer",
    "deepSleepTimer": "Deep Sleep Timer"
  }
```

`locales/es.json` addition:
```json
  "preferences": {
    "title": "Preferencias de Usuario",
    "saveProfile": "Guardar",
    "apply": "Aplicar",
    "saving": "Guardando...",
    "storedProfiles": "Perfiles Guardados",
    "applyAction": "Aplicar",
    "deleteAction": "Eliminar",
    "lighting": "ILUMINACIÓN",
    "effectMode": "Modo de Efecto",
    "ledSpeed": "Velocidad LED",
    "slow": "Lento",
    "fast": "Rápido",
    "color": "Color",
    "red": "Rojo",
    "green": "Verde",
    "blue": "Azul",
    "deviceBehavior": "COMPORTAMIENTO DEL DISPOSITIVO",
    "pollingRate": "Tasa de Sondeo",
    "keyResponse": "Respuesta de Tecla",
    "sleepTimer": "Temporizador de Reposo",
    "deepSleepTimer": "Temporizador de Reposo Profundo"
  }
```

- [ ] **Step 2: Commit**

```bash
git add locales/en.json locales/es.json
git commit -m "feat: add UserPreferences localization strings"
```

### Task 2: Refactor UserPreferences.vue

**Files:**
- Modify: `src/renderer/src/components/UserPreferences.vue`

- [ ] **Step 1: Replace strings in UserPreferences.vue with $t('preferences.key')**

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/UserPreferences.vue
git commit -m "feat: localize UserPreferences.vue"
```
