# DeviceInfo.vue Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Localize all hardcoded strings in `DeviceInfo.vue`.

**Architecture:**
1.  Add translations to `locales/en.json` and `locales/es.json`.
2.  Replace hardcoded strings in `DeviceInfo.vue` with `$t('key')` or `t('key')`.

---

### Task 1: Update Locale Files

**Files:**
- Modify: `locales/en.json`
- Modify: `locales/es.json`

- [ ] **Step 1: Add DeviceInfo strings**

(Example en.json structure)
```json
  "deviceInfo": {
    "title": "Device Information",
    "refresh": "Refresh",
    "loading": "Loading...",
    "fetchError": "Failed to fetch device info: ",
    "loadingInfo": "Loading device information...",
    "deviceTitle": "Device",
    "manufacturer": "Manufacturer",
    "productName": "Product Name",
    "connectionMode": "Connection Mode",
    "technicalDetails": "Technical Details",
    "vendorId": "Vendor ID",
    "productId": "Product ID",
    "deviceVersion": "Device Version",
    "interfaces": "Interfaces",
    "serialNumber": "Serial Number",
    "refreshHint": "Click \"Refresh\" to load device information",
    "connectHint": "Connect a device to view information"
  }
```

- [ ] **Step 2: Commit**

```bash
git add locales/en.json locales/es.json
git commit -m "feat: add DeviceInfo localization strings"
```

### Task 2: Refactor DeviceInfo.vue

**Files:**
- Modify: `src/renderer/src/components/DeviceInfo.vue`

- [ ] **Step 1: Replace strings in DeviceInfo.vue with $t('deviceInfo.key')**

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/DeviceInfo.vue
git commit -m "feat: localize DeviceInfo.vue"
```
