# Extending Sections

Add a new CV section type without touching core rendering (`BaseSection.jsx`, `BaseItem.jsx`).
Both resolve everything via `getSectionDescriptor(type)` — no `type === ...` conditionals.

## 1. Descriptor shape

A descriptor is a plain object in `src/registry/descriptors/`. Reference examples:
`experience.js` (rich block), `skills.js` (list), `spacer.js` (custom section).

```js
export const myDescriptor = {
  type: 'mytype',               // unique key, used as section.type
  label: 'My Section',          // picker / UI label
  defaultTitle: 'MY SECTION',   // used by createDefaultSection()
  defaultColumn: 'right',       // 'left' | 'right'
  icon: 'Star',                 // lucide icon name (string)
  schema: { title: 'string' },  // documentation only, not validated

  // Rendering
  sectionClass: 'experience',   // <section class>
  containerTag: 'div',          // wrapper: 'div' | 'ul' | 'ol'
  containerClass: 'experience__container bd-grid',
  containerStyle: {},           // editor only (optional)
  printContainerStyle: {},      // print/PDF only (optional)
  itemTag: 'div',               // 'div' for blocks, 'li' for lists
  itemClass: 'experience__content',
  itemStyle: {},                // editor wrapper style
  printItemStyle: {},           // print wrapper style

  get itemComponent() { return MyItem; }, // React component (items/MyItem.jsx)
  sectionComponent: undefined,  // optional: full-section override (see §4)

  // Export (ATS / AI / TXT). Defaults to baseItem* if omitted.
  renderMarkdown: (item) => `- ${item.title}`,
  renderXML: (item) => `<item>${item.title}</item>`,
  renderPlainText: (item) => `* ${item.title}`,

  // Factories (required)
  createDefaultItem: () => ({ id: generateUniqueId('my'), title: 'Nuevo' }),
  adaptItem: (src) => ({ id: src?.id || generateUniqueId('my'), title: src?.title || 'Nuevo' }),
};
```

## 2. Flags

| Flag | Default | Effect |
|------|---------|--------|
| `hasTitle` | `true` | Show editable `<h2>` title. `false` for `spacer`. |
| `hasItemDrag` | `true` | Drag handles on items. |
| `allowDelete` | `true` | Show section delete button. |
| `allowAddItem` | `true` | Show `+` add-item button. `false` ⇒ single-item section (deleting item deletes section). |
| `allowDeleteItem` | `true` | Show per-item delete button. |
| `supportsBulletCustomization` | `false` | Show bullet-style popover. `true` in `experience`. |
| `isSpacer` / `isListItem` | unset | Semantic markers (`spacer.js` sets `isSpacer: true`). |
| `wrapperClass` | derived | Override `resolveSectionWrapperClass()` (`${sectionClass}__container bd-grid`). |

Registry (`sectionRegistry.js`) enriches missing fields: `containerTag → div`,
list tags (`ul`) default to `skills__content` / `li` / `skills__name`,
otherwise `experience__container` / `div` / `experience__content`.

## 3. Factories

From `src/registry/sectionRegistry.js` (+ `descriptors/idGenerator.js`):

- `registerSectionType(descriptor)` — validates `type`, enriches defaults, stores in `Map`.
- `getSectionDescriptor(type)` — returns enriched descriptor; unknown types get a safe
  `ExperienceItem`-based fallback (so custom types never crash). Note: `'experience'` normalizes to `'list'`.
- `createDefaultItem(type)` / `createDefaultSection(column, type, title)` — used by editor actions.
- `adaptItemToSectionType(item, targetType)` — calls `descriptor.adaptItem()` when converting/pasting items across types.
- `generateUniqueId(prefix)` — `prefix_xxxxxx`, always use for new ids.

## 4. Add a new type (no core changes)

1. Create `src/components/CV/items/TalksItem.jsx` (props: `{ item, sectionId, isPrint, isLast, onUpdateItem? }`).
2. Create `src/registry/descriptors/talks.js` with the shape above.
3. Register at startup — append to `allDescriptors` in `descriptors/index.js`
   (one line), or register dynamically without editing the registry file:

```js
// src/registry/descriptors/talks.js
import TalksItem from '../../components/CV/items/TalksItem';
import { generateUniqueId } from './idGenerator';
import { registerSectionType } from '../sectionRegistry';

const talksDescriptor = {
  type: 'talks',
  label: 'Charlas',
  defaultTitle: 'CHARLAS',
  defaultColumn: 'right',
  icon: 'Mic',
  sectionClass: 'experience',
  containerTag: 'div',
  get itemComponent() { return TalksItem; },
  createDefaultItem: () => ({ id: generateUniqueId('talk'), title: 'Nueva charla', subtitle: 'Evento', date: '2026' }),
  adaptItem: (s = {}) => ({ id: s.id || generateUniqueId('talk'), title: s.title || s.name || 'Nueva charla', subtitle: s.subtitle || '', date: s.date || '' }),
  schema: { title: 'string', subtitle: 'string', date: 'string' },
};
registerSectionType(talksDescriptor); // self-registering: just import this file once
export default talksDescriptor;
```

Need a fully custom layout (like `SpacerBlock`)? Set `sectionComponent: MyBlock`
in the descriptor — `BaseSection` delegates to it for both edit and print modes.

## 5. Rules

- Never branch on `section.type` in components — put the variation in the descriptor.
- Always provide `createDefaultItem` + `adaptItem`; keep ids via `generateUniqueId()`.
- `containerTag: 'ul'` requires `itemTag: 'li'` for valid HTML (see `skills.js`).
- Reuse `baseItemMarkdown/XML/PlainText` from `itemFormatters.js` unless the shape differs.
