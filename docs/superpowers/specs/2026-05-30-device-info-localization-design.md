# Design Specification: DeviceInfo.vue Localization

## Overview
This design covers the localization of the `DeviceInfo.vue` component, ensuring all UI labels, status messages, and placeholder text are translated using `vue-i18n`.

## 1. Resource Mapping
A new `deviceInfo` section will be added to both `locales/en.json` and `locales/es.json`.
- **Keys**: `title`, `refresh`, `loading`, `fetchError`, `loadingInfo`, `deviceTitle`, `manufacturer`, `productName`, `connectionMode`, `technicalDetails`, `vendorId`, `productId`, `deviceVersion`, `interfaces`, `serialNumber`, `refreshHint`, `connectHint`.

## 2. Refactoring
- Replace hardcoded UI labels with `$t('deviceInfo.key')` in the `<template>`.
- Use `t('deviceInfo.key')` for dynamic text (error messages, loading state labels) in the `<script>` section.

---
Spec written and committed to `docs/superpowers/specs/2026-05-30-device-info-localization-design.md`. Please review it and let me know if you want to make any changes before we start writing out the implementation plan.
