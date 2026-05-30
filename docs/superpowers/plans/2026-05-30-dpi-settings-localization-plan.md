# DpiSettings.vue Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Localize all hardcoded strings in `DpiSettings.vue`.

**Architecture:**
1.  Identify strings in `DpiSettings.vue`.
2.  Add translations to `locales/en.json` and `locales/es.json`.
3.  Replace hardcoded strings in `DpiSettings.vue` with `$t('key')`.

**Tech Stack:** Vue 3, vue-i18n.

---

### Task 1: Update Locale Files

**Files:**
- Modify: `locales/en.json`
- Modify: `locales/es.json`

- [ ] **Step 1: Add DpiSettings strings to locales**

`locales/en.json` addition:
```json
  "dpi": {
    "title": "DPI Configuration",
    "save": "Save DPI",
    "applying": "Applying...",
    "updating": "Updating DPI configuration...",
    "applied": "DPI settings applied!",
    "error": "Error",
    "sensorOptions": "SENSOR OPTIONS",
    "angleSnap": "Angle Snapping",
    "angleSnapDesc": "Corrects mouse movement to straight lines",
    "rippleControl": "Ripple Control",
    "rippleControlDesc": "Smooths out jitter at high DPI levels",
    "activeStage": "ACTIVE STAGE",
    "stage": "Stage",
    "activeImmediately": "Selected stage is active immediately after saving.",
    "sensitivityStages": "SENSITIVITY STAGES (1-6)",
    "dpiUnit": "DPI"
  }
```

`locales/es.json` addition:
```json
  "dpi": {
    "title": "Configuración DPI",
    "save": "Guardar DPI",
    "applying": "Aplicando...",
    "updating": "Actualizando configuración DPI...",
    "applied": "¡Configuración DPI aplicada!",
    "error": "Error",
    "sensorOptions": "OPCIONES DEL SENSOR",
    "angleSnap": "Ajuste de ángulo",
    "angleSnapDesc": "Corrige el movimiento del mouse a líneas rectas",
    "rippleControl": "Control de ondulación",
    "rippleControlDesc": "Suaviza el jitter en niveles altos de DPI",
    "activeStage": "ETAPA ACTIVA",
    "stage": "Etapa",
    "activeImmediately": "La etapa seleccionada se activa inmediatamente después de guardar.",
    "sensitivityStages": "ETAPAS DE SENSIBILIDAD (1-6)",
    "dpiUnit": "DPI"
  }
```

- [ ] **Step 2: Commit**

```bash
git add locales/en.json locales/es.json
git commit -m "feat: add DpiSettings localization strings"
```

### Task 2: Refactor DpiSettings.vue

**Files:**
- Modify: `src/renderer/src/components/DpiSettings.vue`

- [ ] **Step 1: Replace strings in DpiSettings.vue with $t('dpi.key')**

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/DpiSettings.vue
git commit -m "feat: localize DpiSettings.vue"
```
