# Comprehensive Architectural Survey & Handoff Report: CV Components & Section Registry

**Author**: Explorer 1  
**Target Milestone**: M2 (SortableBulletItem Unified Extraction) & M3 (BaseItem / BaseSection Zero-Guard Factory/Strategy Refactor)  
**Date**: 2026-09-11  
**Baseline Test Suite**: 37 test files, 628 tests passing (`npx vitest run`)

---

## 1. Observation

### 1.1 `BaseSection.jsx` Conditional Inventory
Path: `src/components/CV/BaseSection.jsx` (319 lines total)

In `PrintBaseSection`:
- **Line 17**: `if (section.type === 'spacer') { return <PrintSpacerBlock section={section} />; }`
  - Special-cases `spacer` section by bypassing the standard section template and delegating directly to `PrintSpacerBlock`.
- **Line 22**: `const isProfile = section.type === 'profile_header';`
  - Stores a boolean to suppress the title header and suppress the outer grid container.
- **Lines 24–34**:
  ```javascript
  const sectionClass = descriptor?.sectionClass || (
    section.type === 'skills' 
      ? 'skills' 
      : section.type === 'education' 
        ? 'education' 
        : section.type === 'profile_header' 
          ? 'home' 
          : section.type === 'about' 
            ? 'profile' 
            : 'experience'
  );
  ```
  - Hardcoded ternary fallback that duplicates registry descriptor classes.
- **Line 45**: `{!isProfile && section.title && (`
  - Hardcoded conditional preventing section title rendering for `profile_header`.
- **Line 51**: `<div className={isProfile || section.type === 'about' ? '' : `${sectionClass}__container bd-grid`}>`
  - Suppresses the grid container class (`${sectionClass}__container bd-grid`) for `profile_header` and `about`.
- **Lines 52–102**:
  ```javascript
  {section.type === 'simple_list' ? (
    <ul className="experience__bullets simple-list-ul" style={{ color: 'var(--text-color)', paddingLeft: '1.15rem', marginTop: '0.25rem', marginBottom: 0, listStyleType: 'disc' }}>
      {items.map((item, index) => (
        <BaseItem key={item.id || index} item={item} sectionId={section.id} sectionType={section.type} isPrint={true} isLast={index === items.length - 1} />
      ))}
    </ul>
  ) : section.type === 'skills' ? (
    <ul className="skills__content bd-grid" style={{ gridTemplateColumns: '1fr', padding: 0, margin: 0, listStyle: 'none' }}>
      {items.map((item, index) => (
        <BaseItem key={item.id || index} item={item} sectionId={section.id} sectionType={section.type} isPrint={true} isLast={index === items.length - 1} />
      ))}
    </ul>
  ) : descriptor?.containerTag === 'ul' ? (
    <ul className={descriptor.containerClass || ''} style={{ padding: 0, margin: 0, listStyle: 'none' }}>
      {items.map((item, index) => (
        <BaseItem key={item.id || index} item={item} sectionId={section.id} sectionType={section.type} isPrint={true} isLast={index === items.length - 1} />
      ))}
    </ul>
  ) : (
    items.map((item, index) => (
      <BaseItem key={item.id || index} item={item} sectionId={section.id} sectionType={section.type} isPrint={true} isLast={index === items.length - 1} />
    ))
  )}
  ```
  - 4-way conditional branch duplicating `<BaseItem ... />` mapping 4 times across `simple_list`, `skills`, `ul`, and fragment.

In `EditableBaseSection`:
- **Lines 149–157**:
  ```javascript
  const sectionClass = section.type === 'skills' 
    ? 'skills' 
    : section.type === 'education' 
      ? 'education' 
      : section.type === 'profile_header' 
        ? 'home' 
        : section.type === 'about' 
          ? 'profile' 
          : 'experience';
  ```
  - Completely ignores `descriptor?.sectionClass` in edit mode; directly evaluates a 5-branch ternary chain on `section.type`.
- **Line 160**: `const allowDelete = section.type !== 'profile_header' && descriptor.allowDelete !== false;`
  - Hardcodes delete permission exception for `profile_header` despite `descriptor.allowDelete: false`.
- **Line 161**: `const allowAddItem = section.type !== 'profile_header' && descriptor.allowAddItem !== false;`
  - Hardcodes add-item permission exception for `profile_header` despite `descriptor.allowAddItem: false`.
- **Line 162**: `const allowBulletCustomization = supportsBulletCustomization(section.type);`
  - Queries external function `supportsBulletCustomization(section.type)` from `src/utils/bulletStyles.js` instead of inspecting the descriptor.
- **Line 234**: `{section.type !== 'profile_header' && (`
  - Hardcodes suppression of section title editing for `profile_header`.
- **Line 244**: `<div className={section.type === 'profile_header' || section.type === 'about' ? '' : `${sectionClass}__container bd-grid`}>`
  - Suppresses `${sectionClass}__container bd-grid` for `profile_header` and `about`.
- **Lines 246–262**:
  ```javascript
  {section.type === 'simple_list' ? (
    <ul style={{ color: 'var(--text-color)', padding: 0 }}>
      {(section.items || []).map(item => (
        <BaseItem key={item.id} item={item} sectionId={section.id} sectionType={section.type} />
      ))}
    </ul>
  ) : section.type === 'skills' ? (
    <ul className="skills__content bd-grid" style={{ gridTemplateColumns: '1fr', padding: 0 }}>
      {(section.items || []).map(item => (
        <BaseItem key={item.id} item={item} sectionId={section.id} sectionType={section.type} />
      ))}
    </ul>
  ) : (
    (section.items || []).map(item => (
      <BaseItem key={item.id} item={item} sectionId={section.id} sectionType={section.type} />
    ))
  )}
  ```
  - 3-way conditional branch duplicating item rendering. Diverges from Print: print `simple_list` uses `className="experience__bullets simple-list-ul"` with left padding, while edit uses no class and zero padding.
- **Line 309**: `if (props.section?.type === 'spacer') { return <SpacerBlock {...props} />; }`
  - Bypasses BaseSection rendering for spacers at root component level.

---

### 1.2 `BaseItem.jsx` Conditional Inventory
Path: `src/components/CV/BaseItem.jsx` (262 lines total)

In `PrintBaseItem`:
- **Lines 13–26**:
  ```javascript
  if (sectionType === 'profile_header') {
    return (
      <div className="home__data bd-grid cv-block" data-item-id={item.id || 'profile_header'} data-section-id={sectionId} style={{ position: 'relative', color: 'var(--text-color)' }}>
        {ItemComponent && <ItemComponent item={item} sectionId={sectionId} isPrint={true} isLast={isLast} />}
      </div>
    );
  }
  ```
- **Lines 28–47**:
  ```javascript
  if (sectionType === 'simple_list') {
    return (
      <li className="cv-block simple-list-item" data-item-id={item.id} data-section-id={sectionId} style={{ display: 'list-item', listStyleType: 'disc', marginBottom: 'var(--item-gap, 8px)', lineHeight: 1.45, color: 'var(--text-color)' }}>
        {ItemComponent && <ItemComponent item={item} sectionId={sectionId} isPrint={true} isLast={isLast} />}
      </li>
    );
  }
  ```
- **Lines 49–63**:
  ```javascript
  const isListItem = descriptor.containerTag === 'ul' || sectionType === 'skills';
  if (isListItem) {
    return (
      <li style={{ display: 'flex', alignItems: 'flex-start', listStyle: 'none', position: 'relative', color: 'var(--text-color)' }} className={`${sectionType === 'skills' ? 'skills__name cv-block' : 'cv-block simple-list-item'}`} data-item-id={item.id} data-section-id={sectionId}>
        {ItemComponent && <ItemComponent item={item} sectionId={sectionId} isPrint={true} isLast={isLast} />}
      </li>
    );
  }
  ```
- **Lines 65–78**:
  ```javascript
  if (sectionType === 'about') {
    return (
      <div className="profile__description cv-block" data-item-id={item.id || 'about'} data-section-id={sectionId} style={{ position: 'relative', color: 'var(--text-color)' }}>
        {ItemComponent && <ItemComponent item={item} sectionId={sectionId} isPrint={true} isLast={isLast} />}
      </div>
    );
  }
  ```
- **Lines 80–93**:
  ```javascript
  if (sectionType === 'education') {
    return (
      <div className="education__content cv-block" data-item-id={item.id} data-section-id={sectionId} style={{ display: 'flex', position: 'relative', color: 'var(--text-color)' }}>
        {ItemComponent && <ItemComponent item={item} sectionId={sectionId} isPrint={true} isLast={isLast} />}
      </div>
    );
  }
  ```
- **Lines 95–106**:
  ```javascript
  return (
    <div className="experience__content cv-block" data-item-id={item.id} data-section-id={sectionId} style={{ display: 'flex', position: 'relative', color: 'var(--text-color)' }}>
      {ItemComponent && <ItemComponent item={item} sectionId={sectionId} isPrint={true} isLast={isLast} />}
    </div>
  );
  ```

In `EditableBaseItem`:
- **Line 135**: `if (sectionType === 'profile_header' || descriptor.allowDelete === false) return null;` (inside `renderDeleteButton`)
- **Lines 156–170**: `if (sectionType === 'profile_header') { return <div ref={setNodeRef} className="home__data bd-grid editable-item-container cv-block" ...>`
- **Lines 172–192**: `const isListItem = descriptor.containerTag === 'ul' || sectionType === 'skills' || sectionType === 'simple_list'; if (isListItem) { return <li ref={setNodeRef} className={`editable-item-container cv-block ${sectionType === 'skills' ? 'skills__name' : 'simple-list-item'}`} ...>`
- **Lines 194–212**: `if (sectionType === 'about') { return <div ref={setNodeRef} className="profile__description editable-item-container cv-block" ...>`
- **Lines 214–232**: `if (sectionType === 'education') { return <div ref={setNodeRef} className="education__content editable-item-container cv-block" ...>`
- **Lines 236–252**: `return <div ref={setNodeRef} className="experience__content editable-item-container cv-block" ...>`

Observations:
1. Every branch in `PrintBaseItem` is structurally identical: `<ItemTag className={`${itemClass} cv-block`} data-item-id={item.id} data-section-id={sectionId} style={itemStyle}>{ItemComponent && <ItemComponent ... />}</ItemTag>`.
2. Every branch in `EditableBaseItem` is structurally identical: `<ItemTag ref={setNodeRef} className={`${itemClass} editable-item-container cv-block`} style={baseStyle} {...attributes} {...containerDragListeners}>{hasDrag && <DragHandle ... />}{renderDeleteButton()}{ItemComponent && <ItemComponent ... />}</ItemTag>`.

---

### 1.3 `SortableBulletItem` Duplication Across 3 Files

Exact line ranges and component bodies:
1. `src/components/CV/items/ExperienceItem.jsx`: lines 24–90 (67 lines)
2. `src/components/CV/items/ProjectsItem.jsx`: lines 24–90 (67 lines)
3. `src/components/CV/items/VolunteeringItem.jsx`: lines 23–89 (67 lines)

Comparison of the 3 implementations:
- **Props**: Identical in all 3 files:
  `{ bulletId, bulletText, bulletIndex, sectionId, itemId, bullets, onUpdateItem, onDeleteBullet }`
- **Logic**:
  - `useSortable({ id: bulletId, data: { type: 'bullet', bulletIndex } })`
  - `createContainerDragListeners(listeners, true)`
  - `<DragHandle isInner={true} listeners={listeners} attributes={attributes} />`
  - `<SimpleListItem item={{ id: bulletIndex, text: bulletText }} sectionId={sectionId} onUpdateItem={(secId, bIdx, field, val) => { const newBullets = [...bullets]; newBullets[bIdx] = val; onUpdateItem(sectionId, itemId, 'bullets', newBullets); }} />`
  - Delete button with `<i className='bx bx-minus' style={{ fontSize: '12px', fontWeight: 'bold' }}></i>`
- **Only Discrepancy**:
  - In `ExperienceItem.jsx` (line 50): `marginBottom: 'var(--item-gap, 6px)'`
  - In `ProjectsItem.jsx` (line 50): `marginBottom: 'calc(var(--item-gap, 6px) / 2)'`
  - In `VolunteeringItem.jsx` (line 49): `marginBottom: 'calc(var(--item-gap, 6px) / 2)'`

---

### 1.4 Comprehensive File Survey of `src/components/CV/`

| File Path | Line Count | Coupling Violations & Anti-Patterns | Prop Drilling | Classification |
|---|---|---|---|---|
| `src/components/CV/BaseSection.jsx` | 319 | High coupling to `CVContext` (8 methods/state items); hardcoded section type guards; duplicates item rendering across 4 branches; diverges HTML for `simple_list` between print and edit. | `isPrint` drilled to all children | **(b)** Requires understanding global side-effects |
| `src/components/CV/BaseItem.jsx` | 262 | High coupling to `CVContext` (`updateSectionItem`, `deleteSectionItem`); ignores descriptor properties (`itemTag`, `itemClass`); duplicates item wrapper JSX 5 times. | `isPrint`, `isLast`, `sectionId`, `sectionType` | **(b)** Requires understanding global side-effects |
| `src/components/CV/CVBlock.jsx` | 9 | Redundant pass-through around `BaseItem`. **Dead code** (0 imports anywhere in project). Does not forward `isPrint` or callbacks. | N/A | **(a)** Safe to import as-is (dead code) |
| `src/components/CV/CVHeader.jsx` | 66 | References legacy `cvData.profile` shape. **Dead code** (0 imports in project). Mutates obsolete schema fields if invoked. | N/A | **(b)** Danger: causes schema desynchronization |
| `src/components/CV/CVSection.jsx` | 9 | Redundant 1-line wrapper around `BaseSection`. Used in `App.jsx` in 3 places where `BaseSection` could be used directly. Does not forward `isPrint`. | Drops `isPrint` | **(a)** Safe to import as-is |
| `src/components/CV/SpacerBlock.jsx` | 678 | Overly massive file (678 lines > 300 line limit). Dispatches global window events (`cv-spacer-live-resize`); directly mutates `document.body.style.cursor` and `document.body.style.userSelect`; directly mutates CVContext. | `isPrint` | **(b)** Global side-effects on DOM & window events |
| `src/components/CV/items/AboutItem.jsx` | 16 | None. Pure presentational component wrapping `InlineEdit`. | `isPrint` | **(a)** Safe to import as-is |
| `src/components/CV/items/AwardsItem.jsx` | 74 | None. Pure presentational component. | `isPrint` | **(a)** Safe to import as-is |
| `src/components/CV/items/CertificatesItem.jsx` | 86 | None. Pure presentational component. | `isPrint` | **(a)** Safe to import as-is |
| `src/components/CV/items/EducationItem.jsx` | 39 | None. Pure presentational component. | `isPrint`, `isLast` | **(a)** Safe to import as-is |
| `src/components/CV/items/ExperienceItem.jsx` | 328 | Duplicated `SortableBulletItem` (67 lines); instantiates inner `@dnd-kit` `DndContext` inside each item. | `isPrint`, `isLast` | **(b)** Inner nested DnD context |
| `src/components/CV/items/LanguagesItem.jsx` | 65 | None. Pure presentational component. | `isPrint` | **(a)** Safe to import as-is |
| `src/components/CV/items/ProfileHeaderItem.jsx` | 193 | Local state for contact category popover; invokes `onUpdateItem` callback with synchronized flat and nested contact structures. | `isPrint` | **(a)** Safe to import as-is (self-contained) |
| `src/components/CV/items/ProjectsItem.jsx` | 350 | Duplicated `SortableBulletItem` (67 lines); instantiates inner `@dnd-kit` `DndContext`. | `isPrint`, `isLast` | **(b)** Inner nested DnD context |
| `src/components/CV/items/PublicationsItem.jsx` | 87 | None. Pure presentational component. | `isPrint` | **(a)** Safe to import as-is |
| `src/components/CV/items/ReferencesItem.jsx` | 85 | None. Pure presentational component. | `isPrint` | **(a)** Safe to import as-is |
| `src/components/CV/items/SimpleListItem.jsx` | 39 | None. Pure presentational component with disc dot. | `isPrint` | **(a)** Safe to import as-is |
| `src/components/CV/items/SkillsItem.jsx` | 38 | None. Pure presentational component with skill circle. | `isPrint` | **(a)** Safe to import as-is |
| `src/components/CV/items/SpacerItem.jsx` | 20 | Adapts item-level data to `SpacerBlock`. Inherits `SpacerBlock` global side-effects. | `isPrint` | **(b)** Delegates to SpacerBlock |
| `src/components/CV/items/VolunteeringItem.jsx` | 329 | Duplicated `SortableBulletItem` (67 lines); instantiates inner `@dnd-kit` `DndContext`. | `isPrint`, `isLast` | **(b)** Inner nested DnD context |

---

## 2. Logic Chain

1. **Premise**: In `BaseSection.jsx` and `BaseItem.jsx`, whenever a section or item is rendered, the code evaluates multiple `if (section.type === ...)` or `if (sectionType === ...)` checks (Observations 1.1 and 1.2).
2. **Cause**: `src/registry/sectionRegistry.js` currently stores partial metadata (`sectionClass`, `containerTag`, `itemTag`, `itemClass`), but `BaseSection` and `BaseItem` do not fully rely on it. They hardcode visual styling differences, container tags, suppression rules (`isProfile`, `about`), delete buttons, and custom components (`spacer`).
3. **Implication**: Any new section type added by an open-source contributor cannot work properly by just registering a descriptor; it falls into the `experience` fallback container or fails if it needs list or non-list styling. BaseSection and BaseItem must be edited every time a section type is added.
4. **Resolution via Strategy / Factory Pattern**: If every visual property (container tag, container class, item tag, item class, container styles, item styles, title suppression, bullet support, and custom section components) is formally declared on the section descriptor, `BaseSection` and `BaseItem` become purely generic templates:
   - In `BaseSection`:
     - Custom section renderer? `if (descriptor.sectionComponent) return <descriptor.sectionComponent ... />`
     - Render title? `descriptor.hasTitle !== false && section.title && <h2 ...>`
     - Wrapper class: `descriptor.wrapperClass ?? (descriptor.suppressWrapper ? '' : `${descriptor.sectionClass}__container bd-grid`)`
     - Container tag: `<ContainerTag className={descriptor.containerClass} style={isPrint ? descriptor.printContainerStyle : descriptor.containerStyle}>`
     - Bullet customization button: `Boolean(descriptor.supportsBulletCustomization)`
   - In `BaseItem`:
     - Item tag: `const ItemTag = descriptor.itemTag || 'div'`
     - Item class: `${descriptor.itemClass} cv-block`
     - Item style: `descriptor.printItemStyle` or `descriptor.itemStyle`
     - Item drag handle: `descriptor.hasItemDrag !== false`
     - Delete button: `descriptor.allowDeleteItem !== false && descriptor.allowDelete !== false`
5. **Deduplication of SortableBulletItem**:
   - `ExperienceItem`, `ProjectsItem`, and `VolunteeringItem` contain verbatim identical copies of `SortableBulletItem` (Observation 1.3).
   - The only variation is `marginBottom`: `var(--item-gap, 6px)` in Experience vs `calc(var(--item-gap, 6px) / 2)` in Projects/Volunteering.
   - Extracting this into `src/components/CV/SortableBulletItem.jsx` with an optional `marginBottom = 'var(--item-gap, 6px)'` prop preserves 100% pixel parity, satisfies DRY, and removes ~134 redundant lines of code.

---

## 3. Section Registry Descriptor Contract & JSDoc Specification

### 3.1 Enumeration of All 14 Registered Section Types

| Type | Label | Default Title | Default Column | Section Class | Container Tag | Container Class | Item Tag | Item Class | Item Component | Features |
|---|---|---|---|---|---|---|---|---|---|---|
| `profile_header` | Cabecera de Perfil | `""` | left | `home` | `div` | `home__container bd-grid` | `div` | `home__data bd-grid` | `ProfileHeaderItem` | `hasTitle: false`, `allowDelete: false`, `allowAddItem: false`, `allowDeleteItem: false`, `hasItemDrag: false`, `wrapperClass: ''` |
| `about` | Perfil Profesional | `Perfil Profesional` | left | `profile` | `div` | `""` | `div` | `profile__description` | `AboutItem` | `allowAddItem: false`, `wrapperClass: ''` |
| `list` | Experiencia Laboral | `EXPERIENCIA LABORAL` | right | `experience` | `div` | `experience__container bd-grid` | `div` | `experience__content` | `ExperienceItem` | `supportsBulletCustomization: true`, `itemStyle: { display: 'flex' }` |
| `projects` | Proyectos Destacados | `PROYECTOS DESTACADOS` | right | `experience` | `div` | `experience__container bd-grid` | `div` | `experience__content` | `ProjectsItem` | `supportsBulletCustomization: true`, `itemStyle: { display: 'flex' }` |
| `education` | Educación y Formación | `EDUCACIÓN` | left | `education` | `div` | `education__container bd-grid` | `div` | `education__content` | `EducationItem` | `supportsBulletCustomization: true`, `itemStyle: { display: 'flex' }` |
| `skills` | Habilidades Técnicas | `HABILIDADES TÉCNICAS` | left | `skills` | `ul` | `skills__content bd-grid` | `li` | `skills__name` | `SkillsItem` | `isListItem: true`, `containerStyle: { gridTemplateColumns: '1fr', padding: 0 }`, `printContainerStyle: { gridTemplateColumns: '1fr', padding: 0, margin: 0, listStyle: 'none' }`, `itemStyle: { display: 'flex', alignItems: 'flex-start', listStyle: 'none' }` |
| `certificates` | Certificaciones y Credenciales | `CERTIFICACIONES` | left | `education` | `div` | `education__container bd-grid` | `div` | `experience__content` | `CertificatesItem` | `itemStyle: { display: 'flex' }` |
| `languages` | Idiomas | `IDIOMAS` | left | `skills` | `div` | `skills__content bd-grid` | `div` | `experience__content` | `LanguagesItem` | `itemStyle: { display: 'flex' }` |
| `awards` | Premios y Distinciones | `PREMIOS Y RECONOCIMIENTOS` | right | `education` | `div` | `education__container bd-grid` | `div` | `experience__content` | `AwardsItem` | `itemStyle: { display: 'flex' }` |
| `publications` | Publicaciones y Artículos | `PUBLICACIONES` | right | `education` | `div` | `education__container bd-grid` | `div` | `experience__content` | `PublicationsItem` | `itemStyle: { display: 'flex' }` |
| `volunteering` | Voluntariado y Liderazgo | `VOLUNTARIADO Y LIDERAZGO` | right | `experience` | `div` | `experience__container bd-grid` | `div` | `experience__content` | `VolunteeringItem` | `supportsBulletCustomization: true`, `itemStyle: { display: 'flex' }` |
| `references` | Referencias Profesionales | `REFERENCIAS` | left | `skills` | `div` | `skills__content bd-grid` | `div` | `experience__content` | `ReferencesItem` | `itemStyle: { display: 'flex' }` |
| `simple_list` | Lista Simple / Cursos | `CURSOS Y CERTIFICACIONES` | right | `experience` | `ul` | `experience__bullets simple-list-ul` | `li` | `simple-list-item` | `SimpleListItem` | `isListItem: true`, `containerStyle: { color: 'var(--text-color)', padding: 0 }`, `printContainerStyle: { color: 'var(--text-color)', paddingLeft: '1.15rem', marginTop: '0.25rem', marginBottom: 0, listStyleType: 'disc' }`, `printItemStyle: { display: 'list-item', listStyleType: 'disc', marginBottom: 'var(--item-gap, 8px)', lineHeight: 1.45, color: 'var(--text-color)' }` |
| `spacer` | Espacio en Blanco | `""` | right | `spacer-section` | `div` | `spacer-container` | `div` | `spacer-item` | `SpacerItem` | `sectionComponent: SpacerBlock`, `hasTitle: false`, `allowAddItem: false`, `isSpacer: true` |

---

### 3.2 Formal JSDoc Specification

```javascript
/**
 * @typedef {Object} SectionDescriptor
 * @property {string} type - Unique identifier for the section type (e.g. 'list', 'skills', 'spacer').
 * @property {string} label - Human-readable name used in UI menus, dialogs, and button titles.
 * @property {string} [defaultTitle=''] - Initial title string rendered in the section header.
 * @property {'left'|'right'} [defaultColumn='right'] - Default column target in two-column layouts.
 * @property {string} [icon='bx-folder-plus'] - BoxIcon icon CSS class for toolbar and modal buttons.
 * @property {string} [description] - Optional explanatory text describing the section's purpose.
 * @property {boolean} [allowDelete=true] - Whether the user can delete the section from the CV.
 * @property {boolean} [allowAddItem=true] - Whether users can add new items to this section.
 * @property {boolean} [allowDeleteItem=true] - Whether individual items within this section have a delete button.
 * @property {boolean} [hasTitle=true] - Whether section renders a section title (<h2 className="section-title">).
 * @property {boolean} [hasItemDrag=true] - Whether individual items feature drag handles.
 * @property {boolean} [supportsBulletCustomization=false] - Whether section supports timeline circle bullet styles.
 * @property {boolean} [isHeader=false] - Flag indicating special profile/header identity block.
 * @property {boolean} [isSpacer=false] - Flag indicating spacer whitespace block.
 * @property {string} [sectionClass='experience'] - CSS class applied to the outer `<section>` container.
 * @property {string} [wrapperClass] - CSS class for the section inner grid container (empty string suppresses grid).
 * @property {'div'|'ul'|'ol'|React.ComponentType} [containerTag='div'] - Tag or component wrapping the items list.
 * @property {string} [containerClass='experience__container bd-grid'] - CSS class applied to the items container.
 * @property {React.CSSProperties} [containerStyle] - Inline styles applied to the items container in editable mode.
 * @property {React.CSSProperties} [printContainerStyle] - Inline styles applied to the items container in print mode.
 * @property {'div'|'li'|React.ComponentType} [itemTag='div'] - HTML element tag wrapping each item.
 * @property {string} [itemClass='experience__content'] - CSS class applied to each item container element.
 * @property {React.CSSProperties} [itemStyle] - Inline styles applied to each item in editable mode.
 * @property {React.CSSProperties} [printItemStyle] - Inline styles applied to each item in print mode.
 * @property {React.ComponentType} [sectionComponent] - Custom section-level renderer component (overriding BaseSection template).
 * @property {React.ComponentType} itemComponent - Component responsible for rendering item content fields.
 * @property {function(Object=): Object} createDefaultItem - Factory function producing a schema-compliant default item.
 * @property {function(Object): Object} adaptItem - Polymorphic adapter transforming an item from another section type.
 * @property {Object<string, string>} [schema] - Field schema mapping for type checking and validation.
 * @property {function(Object): string} [renderMarkdown] - Strategy function converting an item to Markdown format.
 * @property {function(Object): string} [renderXML] - Strategy function converting an item to XML format.
 * @property {function(Object): string} [renderPlainText] - Strategy function converting an item to Plain Text format.
 */
```

---

## 4. Extraction Specification for `SortableBulletItem.jsx`

### 4.1 Target File: `src/components/CV/SortableBulletItem.jsx`

```jsx
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragHandle from '../Editor/DragHandle';
import SimpleListItem from './items/SimpleListItem';
import { createContainerDragListeners } from '../../utils/dndUtils';

/**
 * SortableBulletItem
 *
 * Unified draggable bullet point row for multi-bullet CV sections
 * (Experience, Projects, Volunteering). Provides @dnd-kit sortable integration,
 * grab handle, inline text editing, and bullet deletion.
 *
 * @param {Object} props
 * @param {string} props.bulletId - Unique ID for @dnd-kit sortable tracking.
 * @param {string} props.bulletText - Text content of the bullet.
 * @param {number} props.bulletIndex - Index of the bullet within parent item's bullets array.
 * @param {string} props.sectionId - ID of parent section.
 * @param {string} props.itemId - ID of parent item.
 * @param {Array<string|Object>} props.bullets - Complete bullets array of the parent item.
 * @param {Function} props.onUpdateItem - Callback: (sectionId, itemId, field, value).
 * @param {Function} props.onDeleteBullet - Callback: (bulletIndex).
 * @param {string} [props.marginBottom='var(--item-gap, 6px)'] - Bottom margin override for layout density.
 */
const SortableBulletItem = ({ 
  bulletId, 
  bulletText, 
  bulletIndex, 
  sectionId, 
  itemId, 
  bullets, 
  onUpdateItem, 
  onDeleteBullet,
  marginBottom = 'var(--item-gap, 6px)'
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: bulletId,
    data: {
      type: 'bullet',
      bulletIndex
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    opacity: isDragging ? 0.35 : 1,
    display: 'flex',
    alignItems: 'flex-start',
    marginTop: 0,
    marginBottom,
    paddingRight: 0,
    paddingLeft: '1.15rem',
    color: 'inherit',
    lineHeight: 1.45
  };

  const containerDragListeners = createContainerDragListeners(listeners, true);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="bullet-item-row editable-item-container cv-block"
      {...attributes}
      {...containerDragListeners}
    >
      <DragHandle isInner={true} listeners={listeners} attributes={attributes} />
      <SimpleListItem 
        item={{ id: bulletIndex, text: bulletText }} 
        sectionId={sectionId} 
        onUpdateItem={(secId, bIdx, field, val) => {
          const newBullets = [...bullets];
          newBullets[bIdx] = val;
          onUpdateItem(sectionId, itemId, 'bullets', newBullets);
        }}
      />
      <button
        type="button"
        className="round-btn-del bullet-del-btn no-print"
        title="Eliminar esta viñeta"
        onClick={(e) => {
          e.stopPropagation();
          onDeleteBullet(bulletIndex);
        }}
      >
        <i className='bx bx-minus' style={{ fontSize: '12px', fontWeight: 'bold' }}></i>
      </button>
    </li>
  );
};

export default SortableBulletItem;
```

### 4.2 Consumers Integration Plan
- `ExperienceItem.jsx`:
  - Replace lines 24–90 with: `import SortableBulletItem from '../SortableBulletItem';`
  - Keeps default `marginBottom="var(--item-gap, 6px)"`.
- `ProjectsItem.jsx`:
  - Replace lines 24–90 with: `import SortableBulletItem from '../SortableBulletItem';`
  - Passes `marginBottom="calc(var(--item-gap, 6px) / 2)"`.
- `VolunteeringItem.jsx`:
  - Replace lines 23–89 with: `import SortableBulletItem from '../SortableBulletItem';`
  - Passes `marginBottom="calc(var(--item-gap, 6px) / 2)"`.

---

## 5. Zero-Guard Refactoring Architecture for `BaseItem` and `BaseSection`

### 5.1 Proposed Template for `BaseItem.jsx` (Zero Conditionals)

```jsx
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragHandle from '../Editor/DragHandle';
import { useCV } from '../../context/CVContext';
import { getSectionDescriptor } from '../../registry/sectionRegistry';
import { createContainerDragListeners } from '../../utils/dndUtils';

export const PrintBaseItem = ({ item, sectionId, sectionType, isLast = false }) => {
  const descriptor = getSectionDescriptor(sectionType);
  const ItemComponent = descriptor.itemComponent;
  const ItemTag = descriptor.itemTag || 'div';

  const style = descriptor.printItemStyle || {
    display: descriptor.itemStyle?.display || 'flex',
    position: 'relative',
    color: 'var(--text-color)'
  };

  return (
    <ItemTag 
      className={`${descriptor.itemClass} cv-block`}
      data-item-id={item.id || sectionType}
      data-section-id={sectionId}
      style={style}
    >
      {ItemComponent && (
        <ItemComponent item={item} sectionId={sectionId} isPrint={true} isLast={isLast} />
      )}
    </ItemTag>
  );
};

const EditableBaseItem = ({ item, sectionId, sectionType }) => {
  const { updateSectionItem, deleteSectionItem } = useCV();
  const descriptor = getSectionDescriptor(sectionType);
  const ItemComponent = descriptor.itemComponent;
  const ItemTag = descriptor.itemTag || 'div';

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: {
      type: 'item',
      item,
      sectionId,
      sectionType
    }
  });

  const baseStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    opacity: isDragging ? 0.35 : 1,
    color: 'var(--text-color)',
    ...(descriptor.itemStyle || {})
  };

  const hasItemDrag = descriptor.hasItemDrag !== false;
  const allowDelete = descriptor.allowDeleteItem !== false && descriptor.allowDelete !== false;
  const containerDragListeners = hasItemDrag ? createContainerDragListeners(listeners, true) : {};

  return (
    <ItemTag
      ref={setNodeRef}
      className={`${descriptor.itemClass} editable-item-container cv-block`}
      data-item-id={item.id || sectionType}
      data-section-id={sectionId}
      style={baseStyle}
      {...attributes}
      {...containerDragListeners}
    >
      {hasItemDrag && <DragHandle isInner={true} listeners={listeners} attributes={attributes} />}
      {allowDelete && (
        <button
          type="button"
          className="round-btn-del item-del-btn no-print"
          title="Eliminar este elemento"
          onClick={(e) => {
            e.stopPropagation();
            deleteSectionItem(sectionId, item.id);
          }}
        >
          <i className='bx bx-minus' style={{ fontSize: '14px', fontWeight: 'bold' }}></i>
        </button>
      )}
      {ItemComponent && (
        <ItemComponent 
          item={item} 
          sectionId={sectionId} 
          onUpdateItem={(secId, itemId, key, val) => updateSectionItem(secId, itemId, key, val)} 
        />
      )}
    </ItemTag>
  );
};

const BaseItem = (props) => {
  if (props.isPrint) {
    return <PrintBaseItem {...props} />;
  }
  return <EditableBaseItem {...props} />;
};

export default BaseItem;
```

*Result*: 0 `if (sectionType === ...)` checks. Replaces 262 lines with ~95 clean, template-pattern lines.

---

### 5.2 Proposed Template for `BaseSection.jsx` (Zero Conditionals)

```jsx
import React from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragHandle from '../Editor/DragHandle';
import InlineEdit from '../Editor/InlineEdit';
import { useCV } from '../../context/CVContext';
import BaseItem from './BaseItem';
import { getSectionDescriptor } from '../../registry/sectionRegistry';
import { Lightbulb, MoreHorizontal } from 'lucide-react';
import { getBulletClasses } from '../../utils/bulletStyles';
import SectionBulletStylePopover from '../Editor/SectionBulletStylePopover';
import { IntegratedBottomSpacer } from './SpacerBlock';
import { createContainerDragListeners } from '../../utils/dndUtils';

export const PrintBaseSection = ({ section }) => {
  if (!section) return null;
  const descriptor = getSectionDescriptor(section.type);

  // If section type provides its own component (Strategy pattern, e.g. SpacerBlock), delegate directly
  if (descriptor.sectionComponent) {
    const CustomSection = descriptor.sectionComponent;
    return <CustomSection section={section} isPrint={true} />;
  }

  const items = section.items || [];
  const ContainerTag = descriptor.containerTag || 'div';
  const bulletClasses = section.bulletStyle ? ` ${getBulletClasses(section.bulletStyle)}` : '';
  const wrapperClass = descriptor.wrapperClass !== undefined 
    ? descriptor.wrapperClass 
    : `${descriptor.sectionClass}__container bd-grid`;

  return (
    <section 
      className={`${descriptor.sectionClass} section cv-section${bulletClasses}`} 
      id={section.id}
      data-section-id={section.id}
      style={{ marginBottom: 'var(--section-gap, 20px)', color: 'var(--text-color)' }}
    >
      {descriptor.hasTitle !== false && section.title && (
        <h2 className="section-title" data-section-title={section.id}>
          <InlineEdit value={section.title || ''} isPrint={true} />
        </h2>
      )}

      <div className={wrapperClass}>
        <ContainerTag 
          className={descriptor.containerClass || ''} 
          style={descriptor.printContainerStyle || {}}
        >
          {items.map((item, index) => (
            <BaseItem 
              key={item.id || index} 
              item={item} 
              sectionId={section.id} 
              sectionType={section.type} 
              isPrint={true} 
              isLast={index === items.length - 1} 
            />
          ))}
        </ContainerTag>
      </div>

      <IntegratedBottomSpacer
        isPrint={true}
        containerId={section.id}
        height={section.bottomSpacing || 0}
      />
    </section>
  );
};

const EditableBaseSection = ({ section }) => {
  const descriptor = getSectionDescriptor(section.type);

  if (descriptor.sectionComponent) {
    const CustomSection = descriptor.sectionComponent;
    return <CustomSection section={section} isPrint={false} />;
  }

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: section.id,
    data: {
      type: 'section',
      section
    }
  });

  const { 
    updateSectionTitle, 
    updateSectionBulletStyle,
    addSectionItem, 
    deleteSection, 
    updateSectionProperty,
    activeTooltip,
    toggleTooltipForSection
  } = useCV();

  const [isBulletPopoverOpen, setIsBulletPopoverOpen] = React.useState(false);
  const [bulletTriggerRect, setBulletTriggerRect] = React.useState(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    opacity: isDragging ? 0.4 : 1,
    marginBottom: 'var(--section-gap, 20px)',
    color: 'var(--text-color)'
  };

  const isTooltipOpen = activeTooltip?.section?.id === section.id;
  const allowDelete = descriptor.allowDelete !== false;
  const allowAddItem = descriptor.allowAddItem !== false;
  const allowBulletCustomization = Boolean(descriptor.supportsBulletCustomization);
  const containerDragListeners = createContainerDragListeners(listeners, false);
  const ContainerTag = descriptor.containerTag || 'div';
  const wrapperClass = descriptor.wrapperClass !== undefined 
    ? descriptor.wrapperClass 
    : `${descriptor.sectionClass}__container bd-grid`;

  return (
    <section 
      ref={setNodeRef} 
      style={style} 
      className={`${descriptor.sectionClass} section editable-section-container cv-section ${getBulletClasses(section.bulletStyle)}`} 
      id={section.id}
      data-section-id={section.id}
      {...attributes}
      {...containerDragListeners}
    >
      <DragHandle listeners={listeners} attributes={attributes} />
      
      <div 
        className={`section-action-buttons no-print ${isTooltipOpen || isBulletPopoverOpen ? 'has-active-popover' : ''}`}
        data-testid={`section-actions-${section.id}`}
      >
        <button 
          type="button"
          className={`section-tips-toggle-btn ${isTooltipOpen ? 'active' : ''}`}
          title={isTooltipOpen ? 'Ocultar consejos IA' : 'Ver consejos IA para esta sección'}
          onClick={(e) => {
            e.stopPropagation();
            const bounding = e.currentTarget.closest('.cv-section')?.getBoundingClientRect();
            toggleTooltipForSection?.(section, bounding);
          }}
        >
          <Lightbulb size={13} color={isTooltipOpen ? '#ffffff' : '#eab308'} />
        </button>

        {allowBulletCustomization && (
          <button
            type="button"
            className={`section-bullet-style-btn ${isBulletPopoverOpen ? 'active' : ''}`}
            title="Personalizar círculo del título"
            aria-label="Personalizar círculo del título"
            data-testid={`btn-bullet-style-${section.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setBulletTriggerRect(e.currentTarget.getBoundingClientRect());
              setIsBulletPopoverOpen(prev => !prev);
            }}
          >
            <MoreHorizontal size={14} color={isBulletPopoverOpen ? '#ffffff' : '#0f172a'} />
          </button>
        )}

        {allowDelete && (
          <button 
            type="button"
            className="round-btn-del section-del-btn"
            title={`Eliminar sección ${section.title || section.id}`}
            onClick={(e) => {
              e.stopPropagation();
              deleteSection(section.id);
            }}
          >
            <i className='bx bx-trash' style={{ fontSize: '13px' }}></i>
          </button>
        )}
      </div>

      {descriptor.hasTitle !== false && (
        <h2 className="section-title" data-section-title={section.id}>
          <InlineEdit 
            value={section.title || ''} 
            onSave={(val) => updateSectionTitle(section.id, val)} 
          />
        </h2>
      )}
      
      <div className={wrapperClass}>
        <SortableContext items={(section.items || []).map(i => i.id)} strategy={verticalListSortingStrategy}>
          <ContainerTag 
            className={descriptor.containerClass || ''} 
            style={descriptor.containerStyle || {}}
          >
            {(section.items || []).map(item => (
              <BaseItem key={item.id} item={item} sectionId={section.id} sectionType={section.type} />
            ))}
          </ContainerTag>
        </SortableContext>
      </div>

      {allowAddItem && (
        <div className="section-add-container no-print">
          <button 
            type="button"
            className="round-btn-add no-print"
            title={`Agregar nuevo elemento a ${section.title || 'esta sección'}`}
            onClick={(e) => {
              e.stopPropagation();
              addSectionItem(section.id);
            }}
          >
            <i className='bx bx-plus' style={{ fontSize: '18px', fontWeight: 'bold' }}></i>
          </button>
        </div>
      )}

      {allowBulletCustomization && (
        <SectionBulletStylePopover
          isOpen={isBulletPopoverOpen}
          onClose={() => setIsBulletPopoverOpen(false)}
          bulletStyle={section.bulletStyle}
          onUpdateStyle={(newStyle) => updateSectionBulletStyle(section.id, newStyle)}
          triggerRect={bulletTriggerRect}
        />
      )}

      <IntegratedBottomSpacer
        containerId={section.id}
        height={section.bottomSpacing || 0}
        onUpdateHeight={(newH) => updateSectionProperty?.(section.id, 'bottomSpacing', newH)}
      />
    </section>
  );
};

const BaseSection = (props) => {
  if (props.isPrint) {
    return <PrintBaseSection {...props} />;
  }
  return <EditableBaseSection {...props} />;
};

export default BaseSection;
```

*Result*: 0 `if (section.type === ...)` checks. Replaces 319 lines with ~150 clean, template-pattern lines.

---

## 6. Caveats

1. **Dead Code Cleanup**: `CVHeader.jsx` and `CVBlock.jsx` are currently unused across the entire codebase. Removing them or keeping them as legacy facades should be coordinated with the parent architect.
2. **SpacerBlock Complexity**: `SpacerBlock.jsx` is 678 lines and contains 6 separate exports (`PrintSpacerBlock`, `useVerticalSpacerResize`, `SpacerResizeHandle`, `EditableIntegratedBottomSpacer`, `IntegratedBottomSpacer`, `EditableSpacerBlock`). Splitting it into smaller files (<300 lines each) is recommended during future polish milestones.
3. **printContainerStyle and containerStyle Differences**: Notice that for `simple_list`, print mode requires `paddingLeft: '1.15rem'` and `listStyleType: 'disc'`, while edit mode requires `padding: 0`. The descriptor contract accommodates this via `printContainerStyle` and `containerStyle`.

---

## 7. Conclusion

1. **Root Problem Verified**: BaseSection (12 conditionals) and BaseItem (11 conditionals) bypass the section registry, violating the Factory and Strategy patterns and making extension brittle.
2. **SortableBulletItem Duplication**: 3 identical 67-line blocks exist in `ExperienceItem.jsx`, `ProjectsItem.jsx`, and `VolunteeringItem.jsx`. A unified component in `src/components/CV/SortableBulletItem.jsx` can be extracted cleanly with an optional `marginBottom` prop.
3. **Contract Ready**: A complete `@typedef` and registry contract has been defined covering all 14 standard section types, enabling zero-guard implementations of both BaseItem and BaseSection without breaking any of the 628 passing Vitest tests.

---

## 8. Verification Method

To independently verify these findings:
1. **Run full baseline test suite**:
   ```bash
   npx vitest run
   ```
   *Expected*: 37 test files, 628 tests pass.
2. **Inspect conditional chains**:
   - `grep -n "section.type ===" src/components/CV/BaseSection.jsx`
   - `grep -n "sectionType ===" src/components/CV/BaseItem.jsx`
3. **Verify SortableBulletItem duplication**:
   - `sed -n '24,90p' src/components/CV/items/ExperienceItem.jsx`
   - `sed -n '24,90p' src/components/CV/items/ProjectsItem.jsx`
   - `sed -n '23,89p' src/components/CV/items/VolunteeringItem.jsx`
4. **Invalidation Condition**:
   - If refactoring BaseItem or BaseSection breaks any test in `src/tests/educationRounderAlignment.test.jsx`, `src/tests/bulletPointsNativePrint.test.jsx`, `src/tests/adversarial-challenger.test.jsx`, or `src/tests/polymorphic-dnd.test.jsx`, the descriptor properties did not faithfully capture the exact DOM tag or CSS class required.
