# Master Feature Flags Directory — Ressume

This document serves as the single source of truth for all feature flags within the Ressume architecture.

Feature flags allow features to be continuously merged into the main codebase while selectively activating or deactivating them across development, staging, testing, and production environments without code mutations.

---

## 🚩 Active Feature Flags

| Flag Name | Default Value | Target Component / Domain | Status | Description |
| :--- | :--- | :--- | :--- | :--- |
| `VITE_ENABLE_TWO_COLUMN_MODE` | `false` | `src/components/Editor/LayoutModeToggle.jsx` | Pre-Alpha Disabled | Enables switching between Traditional 2-Column layout and ATS 1-Column layout. When `false`, the editor locks into Single-Column ATS mode. |
| `VITE_ENABLE_BITACORA` | `false` | `src/components/Editor/ActionMenu/ActionMenuRoot.jsx` | Dormant / Opt-In | Controls visibility of the "Bitácora y Playbook de Carrera" knowledge hub button in the main floating Action Menu. |

---

## 🛠️ Detailed Specifications

### 1. `VITE_ENABLE_TWO_COLUMN_MODE`

- **Environment Variable**: `VITE_ENABLE_TWO_COLUMN_MODE`
- **Allowed Values**: `'true'` | `'false'`
- **Default**: `'false'`
- **Affected Files**:
  - `src/components/Editor/LayoutModeToggle.jsx`
  - `src/context/CVContext.jsx`
- **Behavior**:
  - **`false` (Default)**: The mode selector toggle is hidden. The editor displays the discrete, green "MODO OPTIMIZADO ATS" status badge. The document is enforced as single-column to guarantee ATS compatibility and avoid sub-pixel columnar reflow discrepancies during printing.
  - **`true`**: The dual-pill toggle ("Diseño Tradicional (2 Col)" vs. "Optimizado ATS (1 Col)") is displayed, allowing the user to partition the document between left sidebar and main right column.
- **Activation Command**:
  ```bash
  # In .env
  VITE_ENABLE_TWO_COLUMN_MODE=true
  ```

---

### 2. `VITE_ENABLE_BITACORA`

- **Environment Variable**: `VITE_ENABLE_BITACORA`
- **Allowed Values**: `'true'` | `'false'`
- **Default**: `'false'`
- **Affected Files**:
  - `src/components/Editor/ActionMenu/ActionMenuRoot.jsx`
  - `src/components/Bitacora/`
- **Behavior**:
  - **`false` (Default)**: The Bitácora button (`#bitacora-item`, `data-testid="btn-open-bitacora"`) and the underlying `<BitacoraModal>` are not rendered in the floating `ActionMenuRoot`. The editor remains lightweight and laser-focused on CV editing and PDF generation. All Bitácora code, schemas, and tests remain intact and verified in the codebase.
  - **`true`**: The violet book icon button appears in the Action Menu, opening the modal with community tips, category filters, upvoting, and submission workflows.
- **Activation Command**:
  ```bash
  # In .env
  VITE_ENABLE_BITACORA=true
  ```

---

## 📋 Convention for Adding New Feature Flags

When introducing new experimental features or staging workflows:
1. **Naming**: Must be prefixed with `VITE_ENABLE_` for Vite client-side bundle ingestion.
2. **Boolean Standard**: Parse via strict string equality (`import.meta.env?.VITE_FEATURE_FLAG === 'true'`).
3. **Synchronization**: Always define the default value across:
   - `.env`
   - `.env.example`
   - `.env.test`
4. **Documentation**: Register the flag immediately in this document (`FEATURE_FLAGS.md`) explaining rationale, default state, and activation steps.
