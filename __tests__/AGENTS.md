# TEST CONVENTIONS KNOWLEDGE BASE

**Generated:** 2026-08-04
**Parent:** ../AGENTS.md

## OVERVIEW
145 tests across 9 files in `__tests__/`. Runner: `bun test` (Bun's built-in `bun:test`). No config files — relies on Bun's default `*.test.ts` discovery.

## STRUCTURE
```
__tests__/
├── AttackSharkX11.test.ts      # 34 tests — full driver integration (MockDevice)
├── BatteryMonitor.test.ts      # 37 tests — EventEmitter, fake timers, polling
├── UserPreferencesBuilder.test.ts  # 19 tests — golden hex, boundaries, R1 packing
├── profileManager.test.ts      # 12 tests — mocks electron + fs/promises
├── macro-templates.test.ts     # 11 tests — enum/template completeness
├── MacrosBuilder.test.ts       # 9 tests
├── CustomMacroBuilder.test.ts  # 8 tests
├── DpiBuilder.test.ts          # 8 tests
└── PollingRateBuilder.test.ts  # 7 tests
```

## WHERE TO LOOK
| Test File | Module Under Test | Key Patterns |
|-----------|-------------------|--------------|
| AttackSharkX11.test.ts | core/AttackSharkX11.ts | `createMockDevice(pid)`, `vi.mock('usb')` hoisted, dynamic import |
| BatteryMonitor.test.ts | core/BatteryMonitor.ts | `vi.useFakeTimers()`, try/finally real timers |
| UserPreferencesBuilder.test.ts | protocols/UserPreferencesBuilder.ts | Golden hex, JSDoc cites `docs/light-settings/`, R1 packing |
| profileManager.test.ts | storage/profileManager.ts | `vi.mock('electron')`, `vi.mock('fs/promises')` shared mocks |
| macro-templates.test.ts | shared/macro-templates.ts | Enum completeness, template structure |
| *Builder.test.ts | protocols/*Builder.ts | Golden hex `builder.toString()`, validation throws |

## CONVENTIONS
- **Location**: `__tests__/<Module>.test.ts` at repo root (never colocated)
- **Imports**: NodeNext `.js` extension (`'../src/main/driver/protocols/DpiBuilder.js'`)
- **Barrel imports**: enums/types/errors from `'../src/main/driver/index.js'`
- **`vi.mock('usb', ...)` as line 2** in 7/9 files — hoisted before imports
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
- **No test for `settingsManager.ts`** — gap
- **No test for `src/main/index.ts` IPC layer** — gap (parameter clamping logic untested)
- **No test for `preload/index.ts` or renderer** — gap
- **`tsconfig.json` excludes `__tests__`** — tests never typechecked by `npm run typecheck`
- **README stale**: "145 tests across 12 files" → actual 9 files
- **CodeGraph index broken** — `.codegraph` symlink dangling; `codegraph callers/affected` unusable

## COMMANDS
```bash
bun test                              # all 145 tests
bun test __tests__/AttackSharkX11.test.ts
bun test __tests__/BatteryMonitor.test.ts
bun test __tests__/UserPreferencesBuilder.test.ts
bun test --coverage                   # coverage/ (gitignored)
```