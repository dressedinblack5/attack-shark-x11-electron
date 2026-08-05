# PROJECT KNOWLEDGE BASE

**Generated:** 2026-08-04
**Commit:** HEAD
**Branch:** main

## OVERVIEW
Cross-platform Electron + Vue 3 desktop app to configure Attack Shark X11/R1 gaming mice (DPI, macros, lighting, polling rate, battery). Built with Bun, TypeScript strict mode, and node-usb-rs v3 (async WebUSB API).

## STRUCTURE
```
.
├── src/
│   ├── main/           # Electron main process (IPC, driver, storage)
│   │   ├── driver/     # Core USB HID driver — see src/main/driver/AGENTS.md
│   │   └── storage/    # JSON file persistence — see src/main/storage/AGENTS.md
│   ├── preload/        # contextBridge IPC API (src/preload/index.ts)
│   ├── renderer/       # Vue 3 + Tailwind UI — see src/renderer/src/components/AGENTS.md
│   └── shared/         # Shared types (macro-templates, macro-types)
├── __tests__/          # 9 test files, bun:test — see __tests__/AGENTS.md
├── docs/               # Protocol docs (packet analysis, DPI mapping)
├── locales/            # i18n (en.json, es.json)
├── .github/workflows/  # 3 CI + 6 AI bot workflows
├── .husky/             # pre-commit (lint-staged), pre-push (test + tsc)
└── Config: package.json, tsconfig.json, eslint.config.ts, electron.vite.config.ts, .editorconfig, .prettierrc
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Main process entry / IPC handlers | src/main/index.ts | 414 lines, all device commands |
| USB driver core | src/main/driver/core/AttackSharkX11.ts | 545 lines, main driver class |
| Protocol builders (DPI, lighting, macros, polling) | src/main/driver/protocols/ | Each builder = one report ID |
| Battery monitoring | src/main/driver/core/BatteryMonitor.ts | Interrupt endpoint polling |
| Persistence (settings, profiles) | src/main/storage/ | Electron app.getPath('userData') |
| Preload IPC bridge | src/preload/index.ts | contextBridge.exposeInMainWorld('api') |
| UI components | src/renderer/src/components/ | 14 Vue components |
| Test conventions | __tests__/ | bun:test, vi.mock USB, golden hex |
| CI / release | .github/workflows/ | test.yml, lint.yml, security-audit.yml |

## CODE MAP
| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|
| AttackSharkX11 | class | src/main/driver/core/AttackSharkX11.ts | High | Main driver, EventEmitter, USB control transfers |
| BatteryMonitor | class | src/main/driver/core/BatteryMonitor.ts | Med | Interrupt polling, emits batteryChange |
| DpiBuilder | class | src/main/driver/protocols/DpiBuilder.ts | High | Report 0x0304, 6-stage DPI + checksum |
| UserPreferencesBuilder | class | src/main/driver/protocols/UserPreferencesBuilder.ts | High | Report 0x0305, lighting/sleep/key response |
| MacrosBuilder | class | src/main/driver/protocols/MacrosBuilder.ts | Med | Report 0x0308, button remapping |
| CustomMacroBuilder | class | src/main/driver/protocols/CustomMacroBuilder.ts | Med | Report 0x0309, multi-page key sequences |
| PollingRateBuilder | class | src/main/driver/protocols/PollingRateBuilder.ts | Med | Report 0x0306, 125-1000 Hz |
| settingsManager | module | src/main/storage/settingsManager.ts | Med | JSON persistence, type-safe load/save |
| profileManager | module | src/main/storage/profileManager.ts | Low | Profile CRUD, JSON file |
| preload api | object | src/preload/index.ts | High | 28 IPC methods exposed to renderer |

## CONVENTIONS
- **Indentation**: tabs, 4-wide (`.editorconfig`, eslint `indent: ['error', 'tab']`)
- **Quotes**: single, semicolons, trailing commas, max 120 cols (`.prettierrc`)
- **TypeScript**: strict mode, `noImplicitAny`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noUnusedLocals/Parameters`, `isolatedModules`, `forceConsistentCasingInFileNames`
- **Imports**: `import type` for type-only; `interface` over `type` for object shapes (`@typescript-eslint/consistent-type-definitions: ['error', 'interface']`)
- **Equality**: `===`/`!==` always (`eqeqeq: ['error', 'always']`)
- **No `any`**: `@typescript-eslint/no-explicit-any: error` (use `@ts-expect-error test` in tests for deliberate invalid calls)
- **Module resolution**: NodeNext, `.js` extension required in imports (`import ... from './file.js'`)
- **Error classes**: `DriverError` base → `ParamsError`, `DeviceError`, `InterfaceError`, `TimeoutError` (src/main/driver/errors.ts)
- **Logging**: structured `{ time, level, message, context }` via `Logger` interface (src/main/driver/types.ts)
- **Tests**: `__tests__/<Module>.test.ts`, `bun:test` imports, `vi.mock('usb', ...)` line 2, golden hex `builder.toString()` assertions
- **Git hooks**: pre-commit → `lint-staged` (prettier + eslint --fix); pre-push → `bun test` + `bunx tsc --noEmit`

## ANTI-PATTERNS (THIS PROJECT)
- **No `@deprecated` / TODO / FIXME / HACK / XXX** anywhere in source — clean codebase
- **CustomMacroBuilder**: `macroEvents` and `macrosBuilder` options discouraged (src/main/driver/protocols/CustomMacroBuilder.ts:23) — "I do not recommend using them directly"
- **SECURITY.md**: do not open public GitHub issues for vulnerabilities (report privately)
- **CI**: `bun.lockb` cache key bug (workflows reference `bun.lockb` but repo tracks `bun.lock`); no build/package CI job; `continue-on-error: true` on security audit; `trufflehog@main` unpinned

## UNIQUE STYLES
- **Hardware reverse-engineering style**: protocol builders encode exact USB report bytes, validated via golden hex strings (`builder.toString()`)
- **DPI encoding map**: `src/main/driver/tables/dpi-map.ts` (326 lines) maps DPI→hardware byte; wraps at 10000/20000 boundaries
- **ConnectionMode enum**: `Adapter=0xfa60` (wireless), `Wired=0xfa55` (X11 wired), `R1Wired=0xfa61` (R1 wired)
- **DeviceModel**: `'X11' | 'X11SE' | 'R1'` — R1 lacks RGB, macros, button remap, light modes
- **Battery**: interrupt endpoint polling (nativeTransferIn) via BatteryMonitor; wired returns -1
- **IPC**: all device commands go through `src/main/index.ts` handlers → driver methods; preload exposes 28 methods

## COMMANDS
```bash
bun install              # deps (uses bun.lock)
bun run dev              # electron-vite dev (HMR)
bun run build            # electron-vite build (typecheck + compile)
bun run package          # build + electron-builder → dist/
bun run lint             # eslint . --ext .ts --cache
bun run lint:fix         # eslint --fix
bun run format           # prettier --check
bun run format:fix       # prettier --write
bun run typecheck        # tsc --noEmit
bun test                 # 145 tests, bun:test
bun test --coverage      # coverage/ (gitignored)
```

## NOTES
- **No CodeGraph index**: `.codegraph` symlink dangling; run `codegraph init` to enable `codegraph callers/affected`
- **README stale**: claims "145 tests across 12 files" — actual: 9 files
- **Install script**: `install.sh` (curl-pipe, builds in /var/tmp, `|| true` swallows build failure — fix if distributing)
- **Cross-platform**: Linux (udev rules needed), macOS, Windows; `usb` v3 uses node-usb-rs (Rust backend)
- **Key vendor/product**: VID=0x1d57; PIDs=0xfa60 (wireless), 0xfa55 (X11 wired), 0xfa61 (R1 wired)