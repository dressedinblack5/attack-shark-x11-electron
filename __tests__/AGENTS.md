# TEST CONVENTIONS KNOWLEDGE BASE

**Generated:** 2026-08-04
**Parent:** ../AGENTS.md

## OVERVIEW
149 tests across 11 files in `__tests__/`. Runner: `bun test` (Bun's built-in `bun:test`). No config files — relies on Bun's default `*.test.ts` discovery.

## STRUCTURE
```
__tests__/
├── AttackSharkX11.test.ts      # 31 tests — full driver integration (MockDevice)
├── BatteryMonitor.test.ts      # 22 tests — EventEmitter, fake timers, polling
├── UserPreferencesBuilder.test.ts  # 19 tests — golden hex, boundaries, R1 packing
├── profileManager.test.ts      # 12 tests — mocks electron + fs/promises
├── settingsManager.test.ts     # 11 tests — defaults, coercion, validation
├── macro-templates.test.ts     # 11 tests — enum/template completeness
├── PollingRateBuilder.test.ts  # 10 tests
├── MacrosBuilder.test.ts       # 9 tests
├── zzz-preload.test.ts         # 8 tests — static analysis of preload API surface
├── DpiBuilder.test.ts          # 8 tests
└── CustomMacroBuilder.test.ts  # 8 tests
```

## WHERE TO LOOK
| Test File | Module Under Test | Key Patterns |
|-----------|-------------------|--------------|
| AttackSharkX11.test.ts | core/AttackSharkX11.ts | `createMockDevice(pid)`, `vi.mock('usb')` hoisted, dynamic import |
| BatteryMonitor.test.ts | core/BatteryMonitor.ts | `vi.useFakeTimers()`, try/finally real timers |
| UserPreferencesBuilder.test.ts | protocols/UserPreferencesBuilder.ts | Golden hex, JSDoc cites `docs/light-settings/`, R1 packing |
| profileManager.test.ts | storage/profileManager.ts | `vi.mock('electron')`, `vi.mock('fs/promises')` shared mocks |
| macro-templates.test.ts | shared/macro-templates.ts | Enum completeness, template structure |
| settingsManager.test.ts | storage/settingsManager.ts | Defaults, coercion, validation, deviceModel |
| zzz-preload.test.ts | preload/index.ts | Static analysis of API surface (method names, imports) |
| *Builder.test.ts | protocols/*Builder.ts | Golden hex `builder.toString()`, validation throws |

## CONVENTIONS
- **Location**: `__tests__/<Module>.test.ts` at repo root (never colocated)
- **Imports**: NodeNext `.js` extension (`'../src/main/driver/protocols/DpiBuilder.js'`)
- **Barrel imports**: enums/types/errors from `'../src/main/driver/index.js'`
- **`vi.mock('usb', ...)` as line 2** in 7/11 files — hoisted before imports
- **Dynamic import for mocked modules**: `const { AttackSharkX11 } = await import('../src/main/driver/core/AttackSharkX11.js')` after `vi.mock`
- **MockDevice factory** (AttackSharkX11.test.ts only): `createMockDevice(productId)` returns full usb v3 async API with `vi.fn()` per method
- **Structure**: `describe('<ClassName>')` → nested `describe('<methodName>()')` per public method
- **`bun:test` only**: `describe, it, expect, vi, beforeEach` from `'bun:test'`
- **Fake timers**: `vi.useFakeTimers()` wrapped in `try/finally` with `vi.useRealTimers()`
- **Error assertions**: `toThrow(ParamsError)` / `toThrow(DriverError)` / etc. — project-specific classes
- **Golden hex**: `expect(builder.toString()).toBe('06090101fe00000000')` — hardware reverse-engineering style
- **`@ts-expect-error test`** before deliberately-invalid calls (validates throw, bypasses `no-explicit-any: error`)
- **JSDoc hardware refs**: UserPreferencesBuilder tests cite `docs/light-settings/*.md` panel captures

## ANTI-PATTERNS
- **No test for `src/main/index.ts` IPC layer** — gap (parameter clamping logic untested; zzz-preload only does static analysis)
- **No test for renderer components** — gap
- **`tsconfig.json` excludes `__tests__`** — tests never typechecked by `npm run typecheck`

## COMMANDS
```bash
bun test                              # all 149 tests
bun test __tests__/AttackSharkX11.test.ts
bun test __tests__/BatteryMonitor.test.ts
bun test __tests__/UserPreferencesBuilder.test.ts
bun test --coverage                   # coverage/ (gitignored)
```