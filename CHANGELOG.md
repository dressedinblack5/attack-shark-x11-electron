# Changelog

## [1.4.3] - 2026-08-14

### Fixed
- Release build: proper electron-vite build output

### Changed
- README consistency verification completed
- Git tag v1.4.3 created and pushed
- All 149 tests passing across 11 files

## [1.4.2] - 2026-06-05

### Added
- Reusable UI widgets: `BaseToggle`, `ColorPreview`, `BatteryIndicator`, `ToastStack`, `SkeletonCard`, and `useToast` composable
- Collapsible sidebar with overview dashboard and tab transitions
- i18n for the overview section, corrected LED mode name display
- Preload diagnostics for easier debugging
- AUR release workflow

### Changed
- Replaced inline toggles with `BaseToggle` across all settings, added Card hover effect, improved color picker layout
- Updated CSP to allow WebSocket and Worker connections
- Security hardening and dependency updates

### Fixed
- Inlined `@electron-toolkit/preload` to fix sandbox preload resolution on newer Electron
- Wrapped IPC calls in try/catch in `LanguageSelector` for graceful degradation
- TruffleHog CI: base/head commit diff detection now uses GitHub context variables

### Chores
- Formatted Vue components with Prettier

## [1.2.7] - 2026-06-13

### Fixed
- Typecheck script: use `tsc --noEmit` instead of `electron-vite typecheck` (the latter doesn't have a typecheck subcommand in v5.0.0)
- Battery status: always reactive by starting USB polling in `open()`
- `srcdir` paths now defined inside functions, not at top level
- PKGBUILD extracted dir: GitHub strips `v` prefix from tag archive

### Refactored
- Extracted `SettingsWriter` and `BatteryMonitor` from main driver, fixed lint warnings, formatted code
- Removed 24 debug `console.log` statements

### Changed
- Theme selection now persists to app settings via IPC
- Simplified README for readability
- Updated AUR package metadata (PKGBUILD, .SRCINFO) for v1.2.6

## [1.2.6] - 2026-06-05

### Added
- Full configuration persistence across restarts (preferences, DPI, language, theme, tab, connection mode)
- Type coercion for malformed numeric settings (prevents blank selects from stale string-typed values)
- `connectionMode` persistence in `settings.json`

### Changed
- `fetchSummary()` no longer overwrites user preferences with device-reported values
- Theme toggle now cycles through Dark, Light, and Cappuccino themes

### Fixed
- BaseSelect.vue type-preserving `v-model` emission (string → number coercion)
- UserPreferences.vue form initialization with fallback defaults
- settingsManager.ts deep merge preserves missing nested fields
- Wired mode preferences tab visibility (only hidden when actually connected)

## [1.2.5] - 2026-06-05

### Added
- Background image watermark in sidebar
- Comprehensive test suite: 137 unit tests across 13 files (driver, builders, utilities, validation)
- `StatusMessage.vue` shared component for consistent status banners
- `Card.vue` `title` slot for unified card heading pattern

### Changed
- Merged `AppInput.vue` into `BaseInput.vue` with optional `label` prop
- DPI settings auto-save with 300ms debounce (removed manual Save button)
- Macro settings auto-save with 300ms debounce (removed manual Apply button)
- DPI auto-apply watcher moved inside `onMounted` to prevent stale apply on tab switch

### Fixed
- Hardcoded English string in `App.vue` now uses `$t('connection.errorTip')` (i18n)
- `--color-accent` → `text-shark-primary` in UserPreferences.vue (3 occurrences)
- `mb-4` → `mb-6` on card headings in UserPreferences.vue (3 occurrences)
- Removed unused `.custom-scrollbar` CSS from MacroSettings.vue
- Test suite hang fixed by replacing `useFakeTimers` leak and removing real delays from tests

### Chores
- Updated README with v1.2.5 version references, feature list, and test info
- Bumped version to 1.2.5

## [1.2.1] - 2026-06-04

### Refactored
- Extracted macro enums, key codes, and templates to `src/shared/macro-templates.ts` for reuse between main and renderer processes
- Refactored driver barrel exports from wildcard re-exports to explicit named exports

### Improved
- `AsyncLock` now uses queue-based waiting instead of busy-spin (`setTimeout` loop), reducing CPU overhead
- `CustomMacroBuilder` delay encoding now clamps values to max 51000ms and caps extra delay units at 255
- Device summary parsing now validates response length and safely defaults missing fields

### Removed
- Bluetooth connection mode option (unsupported hardware)
- Unused `getPreferences` IPC handler and corresponding preload binding
- `GEMINI.md` and `PATCH_NOTE.md` documentation files

### Fixed
- `MacroSettings.vue` import path updated to use shared macro templates module
- `env.d.ts` type definitions aligned with removed Bluetooth mode and IPC methods
- Wired mode control transfer `wValue` formatting (Prettier normalization)
- DPI map table now includes explanatory comment for high-value encoding

### Chores
- Added `test` script (`bun test`) to package.json
- Updated `PKGBUILD` for release packaging
- Formatted all source files with Prettier
- Linted with ESLint (auto-fix applied)
