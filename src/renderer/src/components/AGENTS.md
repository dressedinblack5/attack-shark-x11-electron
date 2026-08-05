# RENDERER COMPONENTS KNOWLEDGE BASE

**Generated:** 2026-08-04
**Parent:** ../../../AGENTS.md

## OVERVIEW
Vue 3 + Tailwind CSS + lucide-vue-next UI components. 14 components in `src/renderer/src/components/` + 2 in `widgets/`. Single-file `.vue` with `<script setup lang="ts">`.

## STRUCTURE
```
src/renderer/src/components/
├── BaseButton.vue        # Primary button (variants: green, red, gray, etc.)
├── BaseInput.vue         # Text input
├── BaseSelect.vue        # Select dropdown
├── BaseSlider.vue        # Range slider
├── BaseToggle.vue        # Toggle switch
├── Card.vue              # Container card
├── StatusMessage.vue     # Error/info banner
├── LanguageSelector.vue  # Locale switcher (EN/ES)
├── ThemeToggle.vue       # Dark/Light/Cappuccino theme switch
├── BatteryIndicator.vue  # Widget: battery level + charging state
├── ToastStack.vue        # Widget: toast notifications
├── UserPreferences.vue   # Lighting, sleep, key response, RGB (largest)
├── DpiSettings.vue       # 6-stage DPI config + angle snap/ripple
├── MacroSettings.vue     # Simple button remap macros
├── CustomMacroEditor.vue # Complex multi-event macro builder
└── DeviceInfo.vue        # Device info + reset button
```

## WHERE TO LOOK
| Feature | Component | Key Props/Emits |
|---------|-----------|-----------------|
| Lighting/preferences | UserPreferences.vue | `v-model:preferences`, `isConnected`, `deviceModel`, `connectionMode`, `@reset-complete` |
| DPI config | DpiSettings.vue | `isConnected`, `deviceModel` |
| Simple macros | MacroSettings.vue | `isConnected` |
| Custom macros | CustomMacroEditor.vue | `isConnected` |
| Device info/reset | DeviceInfo.vue | `isConnected` |
| Battery widget | widgets/BatteryIndicator.vue | `level`, `connected` |
| Toasts | widgets/ToastStack.vue | `toasts[]`, `@remove` |
| Theme | ThemeToggle.vue | — (localStorage) |
| Language | LanguageSelector.vue | — (i18n) |

## CONVENTIONS
- **`<script setup lang="ts">`** — Composition API, TypeScript
- **Tailwind utility classes** — custom CSS variables for theming (`--bg-primary`, `--text-primary`, `--shark-primary`, `--sidebar-bg`, etc.)
- **`lucide-vue-next` icons** — imported per-component (Settings, Zap, Keyboard, etc.)
- **`vue-i18n`** — `useI18n()`, `$t('key')` in templates, `t('key')` in script
- **Props with defaults** — `withDefaults(defineProps<{...}>(), {...})`
- **Emits typed** — `defineEmits<{...}>()`
- **Reactive state** — `ref()`, `reactive()`, `computed()`, `watch()`
- **IPC via `window.api`** — exposed by preload (28 methods: `connectDevice`, `setDpi`, `getBattery`, `setMacro`, `listProfiles`, etc.)
- **Battery updates** — `window.api.onBatteryUpdated(callback)` returns cleanup fn
- **Settings persistence** — `watch([activeTab, preferences, ...])` → `window.api.saveSettings()` (debounced via snapshot)
- **Theme** — `localStorage.setItem('theme', ...)`, `document.documentElement.className = theme`

## ANTI-PATTERNS
- **No test coverage** — renderer components have zero tests
- **`window.api` typed as `any`** in components (preload exports `unknown` for most methods) — runtime validation in main/index.ts handlers
- **Large components** — `UserPreferences.vue` (12.7KB), `CustomMacroEditor.vue` (9.4KB), `DpiSettings.vue` (7KB) — consider splitting
- **No `defineModel`** (Vue 3.4+) — uses `v-model:preferences` with `defineProps`/`defineEmits` manually

## TESTS
- **None** — `__tests__/` only covers driver/protocols/storage
- **No Playwright/Vitest config** — `.playwright-mcp/` is orphaned logs only