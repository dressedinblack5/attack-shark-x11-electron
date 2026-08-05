# STORAGE KNOWLEDGE BASE

**Generated:** 2026-08-04
**Parent:** ../../AGENTS.md

## OVERVIEW
JSON file persistence for settings and profiles. Uses Electron `app.getPath('userData')` for cross-platform storage location.

## STRUCTURE
```
src/main/storage/
├── settingsManager.ts   # AppSettings persistence (type-safe load/save)
└── profileManager.ts    # Profile CRUD (name + arbitrary data)
```

## WHERE TO LOOK
| Task | File | Key Exports |
|------|------|-------------|
| Load settings (with defaults/validation) | settingsManager.ts | `getSettings(): Promise<AppSettings>` |
| Save settings | settingsManager.ts | `saveSettings(settings: AppSettings): Promise<void>` |
| List profile names | profileManager.ts | `listProfiles(): Promise<string[]>` |
| Save profile (name + data) | profileManager.ts | `saveProfile(name, data): Promise<void>` |
| Load profile by name | profileManager.ts | `loadProfile(name): Promise<unknown>` |
| Delete profile | profileManager.ts | `deleteProfile(name): Promise<void>` |

## CONVENTIONS
- **Storage path**: `path.join(app.getPath('userData'), 'settings.json')` / `'profiles.json'`
- **`AppSettings` interface** (settingsManager.ts:8-29): lastTab, connectionMode, deviceModel, language, theme, preferences (lightMode, ledSpeed, keyResponse, pollingRate, sleepTime, deepSleepTime, rgb), dpiConfig (activeStage, angleSnap, ripplerControl, dpiValues[6])
- **Defaults** (settingsManager.ts:31-52): dark theme, Adapter mode, X11 model, Breathing lightMode, pollingRate 1000, DPI [800,1600,2400,3200,5000,22000]
- **Type-safe loading**: `getSettings()` merges saved JSON over `DEFAULT_SETTINGS`, coerces numbers via `toNum()`, fixes `deviceModel` ('R1' or 'X11'), validates array lengths
- **Profile data**: arbitrary `unknown` — no schema enforcement; stored as `{name, data}[]` array
- **Atomic writes**: `fs.writeFile` with `JSON.stringify(settings, null, 2)`
- **Error handling**: `getSettings()` returns defaults on any read/parse error; `profileManager` returns empty array/null

## ANTI-PATTERNS
- **No test coverage** — `settingsManager.ts` and `profileManager.ts` have no dedicated test files (only indirectly tested via IPC in main/index.ts)
- **No migration logic** — `getSettings()` merges over defaults but doesn't handle schema versioning
- **Profile data is `unknown`** — no runtime validation on load; caller must validate

## TESTS
- `__tests__/profileManager.test.ts` — mocks `electron` + `fs/promises`, 12 tests
- **No test for settingsManager** — gap