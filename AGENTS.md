# Ressume Development & Architectural Guidelines

## 1. UI & Callout Design Invariants (Obsidian Style)
- **Obsidian Callout Standard**: All suggestion cards, alerts, and feedback tooltips must strictly adhere to the Obsidian Callout visual design:
  - **Danger / Critical**: Background `rgba(233, 49, 71, 0.1)`, 4px solid left border `rgba(233, 49, 71, 1)`, red bold title, `🛑` or `🚨` icon.
  - **Caution / Warning**: Background `rgba(219, 139, 0, 0.1)`, 4px solid left border `rgba(219, 139, 0, 1)`, orange bold title, `⚠️` icon.
  - **Info**: Background `rgba(8, 109, 221, 0.1)`, 4px solid left border `rgba(8, 109, 221, 1)`, blue bold title, `ℹ️` icon.
  - Structure: `.obsidian-callout` container, `.callout-title` with `display: flex; gap: 8px; font-weight: 600`, and `.callout-content`.

## 2. Drag and Drop Architecture
- **Library Selection**: Always use `@dnd-kit` (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`) for nested, 2-level, and multi-column drag-and-drop structures.
- **Do NOT use `swapy`**: Swapy produces slot ID collisions in nested React component trees and disrupts virtual DOM synchronization.

## 3. Dynamic Tooltip & Popover Positioning
- In multi-column or centered document layouts (like the CV paper), tooltips must **not** be fixed to arbitrary screen coordinates or fixed global offsets.
- Tooltips must dynamically track the bounding rectangle (`getBoundingClientRect()`) of the active hovered element:
  - Position adjacent to the element (`rect.right + 20px`).
  - Flip to the opposite side (`rect.left - 320px`) when approaching the viewport boundary (`window.innerWidth`).
  - Clamp vertically to prevent escaping `window.innerHeight`.

## 4. AI Suggestion Engine & Domain Focus
- Suggestions are pre-computed in modular JSON knowledge bases (`src/ai-knowledge/`) rather than real-time LLM inference.
- Current domain focus is strictly **Tech** (`tech` and `all` industries). Creative and Executive modules remain reserved for future phases.
