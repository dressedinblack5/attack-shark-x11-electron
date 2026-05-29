# UI Design System - Polish Strategy (2026-05-29)

## Goal
Establish a unified "Sleek & Minimal" design system to improve visual cohesion across all application tabs.

## Design Specifications

### 1. Primary Buttons
*   **Default:** `bg-transparent`, `border: 1px solid var(--border-card)`, `text: var(--text-primary)`.
*   **Hover:** `bg-[var(--border-card)]/50`, `border-transparent`.
*   **States:** `rounded-lg`, subtle transition on color/opacity.

### 2. Input Fields
*   **Default:** `bg-[var(--border-card)]/20`, `border: 1px solid transparent`.
*   **Focus:** `border: 1px solid var(--shark-primary)`, `bg-[var(--border-card)]/40`.
*   **Rounded:** `rounded-lg`, consistent padding.

### 3. Labels & Typography
*   **Labels:** `text-sm`, `font-medium`, `text: var(--text-primary)`, `opacity-70`.
*   **Spacing:** Consistent margin-bottom: 0.5rem.

### 4. Scrollbars
*   **Style:** Minimalist 6px width.
*   **Thumb:** `bg-[var(--border-card)]`, rounded corners.
*   **Hover:** `bg-[var(--text-primary)]/20`.

## Implementation Scope
*   Apply these standards across `DpiSettings.vue`, `MacroSettings.vue`, and `UserPreferences.vue` to replace existing heterogeneous styles.
