# Design Document: Unify Primary Buttons

## Goal
Encapsulate the primary button styling in a `BaseButton.vue` component to ensure consistency across the application and simplify refactoring.

## Design
- Component: `BaseButton.vue`
- Styling:
  - `bg-transparent`
  - `border border-[var(--border-card)]`
  - `text-[var(--text-primary)]`
  - `hover:bg-[var(--border-card)]/50`
  - `hover:border-transparent`
  - `transition-all`
  - `rounded-lg`
  - `px-6 py-2`
  - `disabled:opacity-50`
  - `disabled:cursor-not-allowed`
- Interaction:
  - Support `v-bind="$attrs"` to pass attributes like `@click`, `:disabled`.
  - Use `<slot />` for content.

## Implementation Plan
1. Create `src/renderer/src/components/BaseButton.vue`.
2. Update `DpiSettings.vue` to use `BaseButton.vue` for the "Save DPI" button.
3. Update `MacroSettings.vue` to use `BaseButton.vue` for the "Apply Macro" button.
4. Update `UserPreferences.vue` to use `BaseButton.vue` for "Save" and "Apply Settings" buttons.
5. Verify that all buttons retain their functionality and styles.
