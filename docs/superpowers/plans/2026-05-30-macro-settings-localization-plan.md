# MacroSettings.vue Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Localize all hardcoded strings in `MacroSettings.vue`.

**Architecture:**
1.  Identify strings in `MacroSettings.vue`.
2.  Add translations to `locales/en.json` and `locales/es.json`.
3.  Replace hardcoded strings in `MacroSettings.vue` with `$t('key')`.
4.  Refactor `templateOptions` and `buttons` labels to be computed/reactive using `t()`.

**Tech Stack:** Vue 3, vue-i18n.

---

### Task 1: Update Locale Files

**Files:**
- Modify: `locales/en.json`
- Modify: `locales/es.json`

- [ ] **Step 1: Add MacroSettings strings to locales**

`locales/en.json` addition:
```json
  "macros": {
    "title": "Macro Selector",
    "apply": "Apply Macro",
    "applying": "Applying...",
    "macroAssigned": "Macro assigned!",
    "errorPrefix": "Error: ",
    "configTitle": "Macro Configuration",
    "targetButton": "Target Button",
    "macroTemplate": "Macro Template",
    "buttons": {
      "left": "Left Button",
      "right": "Right Button",
      "middle": "Middle Button",
      "forward": "Forward Button",
      "backward": "Backward Button",
      "dpi": "DPI Button"
    }
  }
```

`locales/es.json` addition:
```json
  "macros": {
    "title": "Selector de Macros",
    "apply": "Aplicar Macro",
    "applying": "Aplicando...",
    "macroAssigned": "¡Macro asignado!",
    "errorPrefix": "Error: ",
    "configTitle": "Configuración de Macros",
    "targetButton": "Botón Objetivo",
    "macroTemplate": "Plantilla de Macro",
    "buttons": {
      "left": "Botón Izquierdo",
      "right": "Botón Derecho",
      "middle": "Botón Central",
      "forward": "Botón Adelante",
      "backward": "Botón Atrás",
      "dpi": "Botón DPI"
    }
  }
```

- [ ] **Step 2: Commit**

```bash
git add locales/en.json locales/es.json
git commit -m "feat: add MacroSettings localization strings"
```

### Task 2: Refactor MacroSettings.vue

**Files:**
- Modify: `src/renderer/src/components/MacroSettings.vue`

- [ ] **Step 1: Replace strings in MacroSettings.vue with $t('macros.key')**

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/MacroSettings.vue
git commit -m "feat: localize MacroSettings.vue"
```
