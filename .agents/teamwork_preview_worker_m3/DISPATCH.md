# Worker M3 Task: BaseItem & BaseSection Zero-Guard Registry Dispatch

## Working Directory
`/home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m3`

## Inputs
- Authoritative Request: `/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md` (section `## 2026-09-11T03:13:35Z`)
- Project Scope: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_orchestrator_11/PROJECT.md`
- Audit Blueprints: `/home/juani/Documentos/Ressume/docs/code-review.md` (Section 5.2 Blueprint 2 and Section 5.3 Blueprint 3)
- Explorer 1 Detailed Specifications: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_survey_1/handoff.md` (Sections 3 & 5)
- Explorer 3 Test Coupling Invariants: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_survey_3/handoff.md` (Section 1.3)

## Write Ownership
- `src/registry/sectionRegistry.js`
- `src/components/CV/BaseItem.jsx`
- `src/components/CV/BaseSection.jsx`

## Task Description
1. Update `src/registry/sectionRegistry.js`:
   - Add formal `@typedef {Object} SectionDescriptor` JSDoc block documenting all properties: `type`, `label`, `defaultTitle`, `defaultColumn`, `icon`, `description`, `allowDelete`, `allowAddItem`, `allowDeleteItem`, `hasTitle`, `hasItemDrag`, `supportsBulletCustomization`, `isHeader`, `isSpacer`, `sectionClass`, `wrapperClass`, `containerTag`, `containerClass`, `containerStyle`, `printContainerStyle`, `itemTag`, `itemClass`, `itemStyle`, `printItemStyle`, `sectionComponent`, `itemComponent`, `createDefaultItem`, `adaptItem`, etc.
   - Enhance each of the 14 registered section descriptors (`profile_header`, `about`, `list`, `projects`, `education`, `skills`, `certificates`, `languages`, `awards`, `publications`, `volunteering`, `references`, `simple_list`, `spacer`) so they specify all tags, classes, styles, and flags needed for rendering.
   - Crucial test-compatibility mappings:
     - `profile_header`: `hasTitle: false`, `allowDelete: false`, `allowAddItem: false`, `allowDeleteItem: false`, `hasItemDrag: false`, `wrapperClass: ''`, `containerTag: 'div'`, `itemTag: 'div'`, `itemClass: 'home__data bd-grid'`
     - `about`: `allowAddItem: false`, `wrapperClass: ''`, `containerTag: 'div'`, `itemTag: 'div'`, `itemClass: 'profile__description'`
     - `education`: `itemClass: 'education__content'`, `itemStyle: { display: 'flex' }`, `supportsBulletCustomization: true` (ensures `educationRounderAlignment.test.jsx` passes!)
     - `simple_list`: `containerTag: 'ul'`, `containerClass: 'experience__bullets simple-list-ul'`, `itemTag: 'li'`, `itemClass: 'simple-list-item'`, `isListItem: true`, `containerStyle: { color: 'var(--text-color)', padding: 0 }`, `printContainerStyle: { color: 'var(--text-color)', paddingLeft: '1.15rem', marginTop: '0.25rem', marginBottom: 0, listStyleType: 'disc' }`, `printItemStyle: { display: 'list-item', listStyleType: 'disc', marginBottom: 'var(--item-gap, 8px)', lineHeight: 1.45, color: 'var(--text-color)' }`
     - `skills`: `containerTag: 'ul'`, `containerClass: 'skills__content bd-grid'`, `itemTag: 'li'`, `itemClass: 'skills__name'`, `isListItem: true`, `containerStyle: { gridTemplateColumns: '1fr', padding: 0 }`, `printContainerStyle: { gridTemplateColumns: '1fr', padding: 0, margin: 0, listStyle: 'none' }`, `itemStyle: { display: 'flex', alignItems: 'flex-start', listStyle: 'none' }`
     - `spacer`: `sectionComponent: SpacerBlock`, `hasTitle: false`, `allowAddItem: false`, `isSpacer: true` (ensures `spacer-component.test.jsx` passes!)
2. Refactor `src/components/CV/BaseItem.jsx`:
   - Must contain ZERO `if (sectionType === ...)` guards in its render path.
   - Pure template pattern delegating to descriptor: `ItemTag = descriptor.itemTag || 'div'`, `className={`${descriptor.itemClass} cv-block`}`, styles from descriptor.
   - Exports: both default `BaseItem` and named `PrintBaseItem` (as tested by `educationRounderAlignment.test.jsx`).
   - File-level comment and JSDoc block. Must be <= 300 lines (target ~100 lines).
3. Refactor `src/components/CV/BaseSection.jsx`:
   - Must contain ZERO `if (section.type === ...)` guards in its render path.
   - Pure template pattern delegating to descriptor: custom section via `descriptor.sectionComponent`, title via `descriptor.hasTitle !== false`, wrapper via `descriptor.wrapperClass`, container tag via `descriptor.containerTag`, bullet customization via `descriptor.supportsBulletCustomization`.
   - Exports: both default `BaseSection` and named `PrintBaseSection` (as tested by `spacer-component.test.jsx`).
   - File-level comment and JSDoc block. Must be <= 300 lines (target ~230 lines).
4. Run tests:
   - `npx vitest run` -> all 628 tests must pass.
   - `npm run build` -> 0 errors.
   - Grep verification: `grep -rn "sectionType ===" src/components/CV/BaseItem.jsx` -> 0 results!
   - Grep verification: `grep -rn "section.type ===" src/components/CV/BaseSection.jsx` -> 0 results!
5. Document results in `handoff.md` and message orchestrator.

## 2026-09-11T03:35:21Z
User Request received for Worker M3:
Refactor `src/registry/sectionRegistry.js`, `src/components/CV/BaseItem.jsx`, and `src/components/CV/BaseSection.jsx` to enforce the Factory/Strategy & Template pattern with ZERO `if (sectionType === ...)` and ZERO `if (section.type === ...)` guards.

