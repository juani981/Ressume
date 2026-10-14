# Architecture

Forensic record of the system as it exists in code. No aspirations, no stale plans.

## 1. Runtime shape

```
index.html → src/main.jsx → RootErrorBoundary → CVProvider → TourProvider → App
```

- `src/main.jsx`: `ReactDOM.createRoot(#root)`, `React.StrictMode`. Import-time side
  effect: `setupDisableNativeTooltips()`.
- `src/context/CVContext.jsx:CVProvider({initialCV, initialLanguage})` owns
  `const [cvData, setCvData] = useState(loadInitialCVData | initialCV-merge)`.
  Four domain hooks compose inside: `useCVHistory(setCvData)`,
  `useCVData({cvData, setCvData, applyStateWithHistory, ...})`,
  `useCVLayout({cvData, applyStateWithHistory})`, `useCVExport()`.
  A `useMemo` flattens them into one backward-compatible context value consumed via
  `useCV()`. Granular selectors (`useCVLayoutState`, `useCVExportActions`,
  `useCVPagesState`, `useCVHistoryState`, `useCVDataActions`) exist in the same file.
  Barrel: `src/context/index.js`, `src/context/hooks/index.js`.

## 2. Data — `cvData`

Shape enforced by `src/utils/schema.js` (`defaultSchema`) and
`src/utils/cvSchemaValidator.js` (`validateCVSnapshot` pure,
`sanitizeAndValidateCVSnapshot` coercive):

```js
{
  profile: { name, subtitle?, email?, phone?, location?, linkedin?, github?, description? },
  layout: {
    type: '2-column' | '1-column', isAtsMode: bool,
    leftColumnWidth: number|null, fontFamily, fontScale, titleScale,
    bodyScale, listScale, lineHeight, pagePadding, sectionGap, itemGap,
    leftBg, rightBg, language?
  },
  sections: [{ id, column: 'left'|'right'|'single', type, title, items: [], bulletStyle?, bottomSpacing? }]
}
```

- Seed: `src/utils/schema.js:defaultSchema` (9 sections: `profile_header`, `contact`,
  `about_section`, `skills`, `experience(type:list)`, `projects(type:list)`,
  `education`, `certificates(type:simple_list)`, `languages(type:simple_list)`).
  Random demo seeds: `src/utils/seedCVTemplates.js` (6 profiles).
- Load: `loadInitialCVData()` (`src/context/hooks/useCVData.js`) reads
  `localStorage['cvData']`, sanitizes, guarantees `profile_header` + `contact` via
  `ensureProfileHeader`. Corrupt payloads are quarantined to
  `ressume_quarantined_snapshots`. Under Vitest/jsdom it returns `defaultSchema`,
  otherwise a random seed CV.
- Mutations (all via `applyStateWithHistory`, undo cap 30, `Ctrl/Cmd+Z` /
  `Ctrl+Shift+Z` / `Ctrl+Y` except inside inputs): `updateProfile` (dual-writes
  `profile` + header/contact items), `addSection` (via `createDefaultSection`),
  `deleteSection` (refuses `profile_header`), `reorderSections`,
  `add/update/delete/reorderSectionItem` (canonicalizes `__cont_` continuation ids;
  header/contact edits propagate back to `profile`), `moveItemBetweenSections`
  (via `adaptItemToSectionType`), `moveSectionToColumnAndIndex` (fixed-section veto),
  `loadVersionSnapshot`, `resetToDefault`, `deletePage` (delegates to
  `pageDeletionEngine.js`).
- Persistence effects: every `cvData` change writes `localStorage['cvData']`;
  language packs → `cvLanguagePacks`, active lang → `cvActiveLanguage` +
  `document.documentElement.lang`.

## 3. Rendering — `App.jsx` orchestration

`src/App.jsx:App()` pulls `{cvData, setCvData, recordHistoryTransition,
moveItemBetweenSections, moveSectionToColumnAndIndex, updateLayout, setTotalPages,
deletePage} = useCV()` and wires four pipelines into one `#area-cv` tree:

1. **DnD** — `useCVDndCoordinator({...})` returns sensors + handlers; `<DndContext>`
   wraps `<main>`; `<CVDragOverlay>` renders print-view ghosts. Pointer sensor
   distance 5 + keyboard sensor. `handleDragOver` does live `setCvData` (arrayMove /
   cross-column splice, items adapted); `handleDragEnd` commits atomically via
   `recordHistoryTransition(preSnapshot, current)` on sections-JSON diff;
   `handleDragCancel` restores the snapshot. Fixed sections
   (`profile_header/title_subtitle/contact/about`) cannot move.
2. **Pagination** — `measuredHeights = useLiveDomHeights(areaCvRef, [layout,
   sections])` (ResizeObserver + rAF, 3px stability gate, queries
   `[data-section-title]` / `[data-item-id]` / `[data-item-base-id]`) feeds
   `useDocumentPages({cvData, options:{measuredHeights}})` →
   `{pages: PageModel[], totalPages}`. `totalPages` syncs back into context for
   `useCVPagesState` consumers.
3. **Resizer** — `useColumnResizer({areaCvRef, onResize: leftColumnWidth,
   initialLeftWidth})` clamps 20–55% (`COLUMN_RESIZER_LIMITS`), rendered only on
   page 1 in 2-column mode.
4. **Pages** — `pages.map → <A4PageBox pageNumber totalPages … onDeletePage> →
   <DroppableColumn id=column-{left,right,single}[-page-N]> → <SortableContext> →
   <BaseSection>`. Add-section buttons render only on the last page and open
   `AppModals` state. `isAtsMode = isAtsLayout(layout)` toggles single-column +
   `ats-mode-active` body class. Typography CSS vars from
   `computeTypographyTokens(layout)` spread onto `#area-cv`.

## 4. Document model and pagination

- `PageModel` (`src/utils/pageModelTypes.js:createPageModel`): frozen
  `{pageNumber, totalPages, isLastPage, leftSections[], rightSections[],
  singleSections[]}`. Producer `pageDistributor.js:1079`, returned `deepFreeze`d.
- `distributeSectionsToPages(cvData, options)` (`src/utils/pageDistributor.js:994`):
  capacity = `pageHeight − padding − bottomPadding − clearance`, tolerance =
  `round((padding+clearance) × 0.1)`, floor `MIN_PAGE_CAPACITY_PX`. ATS/single →
  one bucket list; 2-col → left/right independently;
  `totalPages = max(maxBucket, minPages)`.
- `distributeSectionListToPageBuckets` (`:573`): explicit `item.page/targetPage/
  breakBefore` wins (continuation parts `id__cont_N`, `isContinuation`, `(Cont.)`
  title unless suppressed); explicit `section.page/targetPage` jumps pages;
  otherwise whole-section fit → indivisible/spacer push → anti-orphan guard →
  granular item packing → bullet splitting via `splitCandidateItemByBullets`
  (`:236`, gated by `splitGranularBullets || isEditor || single-item`). Hysteresis
  deadband 14px (`HYSTERESIS_DEADBAND_PX`) resists page flapping.
- Estimators: `SECTION_HEIGHT_ESTIMATORS` frozen map (per-type strategies);
  priority measured DOM > custom > `item.height` > descriptor > strategy >
  fallback. `getItemNetHeight = gross − itemGap`.
- Editor box: `src/components/CV/A4PageBox.jsx` — fixed `210mm × 297mm`
  (`A4_WIDTH_CSS`), `overflow: hidden`, `margin: 0 auto 32px (EDITOR_PAGE_GAP_PX)`,
  2-col `display: grid` with L/R gradient split, 1-col block with
  `padding: pagePadding / bottom = round(pagePadding/2)`. Page badge + delete
  (page > 1) carry `.no-print`.
- Helpers: `src/utils/pageGeometry.js` re-exports the SSOT and measures real mm→px
  via a hidden ruler div (`getRulerHeightPx`). Tokens: `src/constants/geometry.js`
  (A4 210×297mm, 794×1123px @96dpi, gap 20, editor gap 32, columns 33.33% /
  `1fr 2fr`), `spacing.js` (padding 24, sectionGap 12, itemGap 6, lineHeight 1.30,
  clearance 12, terminal tolerance 4, minCapacity 100, photo 120/70, spacer 24),
  `typography.js` (5 families, Poppins default, base h1:24 h2:18 h3:15 normal:12
  small:11, advance ratios, column char capacities), `colors.js` (Obsidian
  danger/caution/info + UI tokens, YIQ threshold 128).

## 5. Print pipeline (passive projection)

`src/services/print/`: `index.js` facade re-exports `pdfTitleService`,
`cleanHtmlGenerator`, `printExecutionDriver`, `printFonts` (+ `parityChecker`,
`textLayerExtractor`).

1. `captureEditorSnapshot()` — reads `#area-cv` rect/scrollHeight, ruler height,
   `[data-editor-break-forced]` folds, `data-total-pages`.
2. `createSanitizedPrintClone()` — deep clone; strips `.round-btn-del`,
   `.drag-handle`, `.column-resizer`, `.obsidian-callout`, `.action-menu`,
   `.no-print`, `[data-editor-ui]`; ATS strips photo+svg else aria-hidden svg;
   sanitizes bullets/OCR-math/date ranges; `.a4-page-wrapper → display: contents`;
   forces `.a4-page-box` to `210mm/297mm, overflow hidden, break-inside avoid,
   break-after page (except last)`; atomic `.cv-block` avoid, splittable
   containers auto.
3. `generateLayoutVariablesCSS(layout)` — emits `:root` vars (a4, padding,
   incl. `--page-padding-bottom = round(padding/2)`, gaps, scales, grid columns,
   backgrounds, `calc(rem × scale)` font sizes).
4. `generateCleanPrintHTML()` — rebuild fallback when no live clone exists.
5. `executeCleanPrint(cvData, lang, customSnapshot)` (`printExecutionDriver.js:57`)
   — hidden iframe sized `pages × 1123px`, `verifyModelPdfParity` warn-only,
   writes full doc (`STATIC_PRINT_FONTS_CSS` static TTF — variable WOFF2 strips
   the Cairo `Tj/TJ` text layer), copies live `--*` vars, `fonts.ready + 1000ms`,
   applies forced breaks, `zoom = calculatePrintScale` under jsdom else `1.0`,
   `window.print()`, cleanup on `afterprint` + fallbacks. `downloadPDF` aliases it.
6. `print.css @media print` — `@page { size: A4; margin: 0 }` (×2), boxes
   `!important` fixed + avoid + break-after, wrapper `display: contents`,
   grid rows `1fr`, column padding from vars, first/last-child margin collapse
   guards, continuation-aware exceptions, atomic blocks avoid, multi-bullet
   containers auto, `print-color-adjust: exact`, ATS hides svg/photo.
7. `pdfTitleService.js` — `<>:"/\|?*` + controls → `_`, collapse spaces;
   version name wins else `CV_name_subtitle`.
8. `parityChecker.js:verifyModelPdfParity` — normalized text comparison, per-type
   primary identifiers, returns `{isParityValid, matched, missing}` (advisory).

Editor/print split convention: `PrintModeContext` (`usePrintMode`) +
`props.isPrint ?? context` selects `Print*` (static) vs `Editable*`
(contentEditable, `execCommand`) views in `BaseSection`, `BaseItem`, `InlineEdit`.
Drag ghosts reuse the print views. `useExport().exportCleanPDF` goes through
`src/utils/staticHtmlPdfEngine` with identical lifecycle + toasts.

## 6. Sections registry (Open/Closed)

- `src/registry/descriptors/*.js` (18 types) each export a descriptor:
  identity (`type, label, defaultTitle, defaultColumn, icon, description?`),
  flags (`allowDelete/Add/DeleteItem, hasTitle, hasItemDrag,
  supportsBulletCustomization`, sparse `isMoveDisabled/isHeader/hideControls/
  isListItem/isSpacer`), rendering (`sectionClass, wrapperClass?, containerTag
  div|ul, containerClass/Style(+print), itemTag div|li, itemClass/Style(+print),
  sectionComponent?` only spacer, `itemComponent` getter, `renderMarkdown/XML/
  PlainText`), factories (`createDefaultItem`, `adaptItem`, informal `schema`),
  ids via `generateUniqueId(prefix)` (`Date.now()_counter_rand5`).
- `src/registry/sectionRegistry.js`: `Map` + `registerSectionType` (defaults +
  enrichment, throws without `type`), `getSectionDescriptor` (legacy
  `experience→list` alias, synthetic fallback to `ExperienceItem`), `getAll*`,
  boot `allDescriptors.forEach(register)`, `createDefaultItem/Section`
  (`{id, column, type, title, items:[default], bulletStyle, bottomSpacing:0}`),
  `adaptItemToSectionType`.
- `BaseSection.jsx` / `BaseItem.jsx`: resolve descriptor at render, honor
  `sectionComponent` escape hatch, gate all chrome (drag, delete, add,
  bullets) on flags. Zero `type` switches in core.
- Item components `src/components/CV/items/` (18): `ProfileHeader`,
  `ProfileTitle`, `About`, `Experience(list)`, `Projects`, `Education`, `Skills`,
  `Certificates`, `Languages`, `Awards`, `Publications`, `Volunteering`,
  `References`, `SimpleList(simple_list)`, `Spacer`, `Mentoring`, `Photo`,
  `Contact`. Print/Edit split in Experience/Projects/Volunteering/ProfileTitle/
  Contact. Bullets: `SortableBulletItem` (`useSortable type:bullet`) + inline
  `SimpleListItem` splice-back. Spacer: `SpacerBlock` (print pure-height div;
  edit presets 20/40/80/120, 8–600px, hover bottom spacer 0–600px).
- Serialization: `src/registry/itemFormatters.js` per-type Markdown/XML/PlainText
  (spacer/photo inline in descriptors).
- Resilience: 3-tier boundaries — `RootErrorBoundary` (main.jsx, full-session
  recovery from `cvData` / quarantined snapshots), `ModalErrorBoundary`
  (AppModals), `SectionErrorBoundary` (per-section isolation). All Obsidian-danger
  callouts. Storage: `sanitizeAndValidateCVSnapshot` on load, `QuotaExceededError`
  guard on save (see FILEMAP).

## 7. Editor chrome, modals, tours

- `ActionMenu/ActionMenuRoot.jsx` (hover intent 280/350ms, pin in localStorage):
  navbar (`.no-print`, `data-testid=action-menu-navbar`) with Versions, Design,
  AI prompts, Translation, BYO-CV, native print (`executeCleanPrint` direct import
  + fallback warn). `DesignPanel.jsx` (`design-popover no-print`) tabs
  typography/spacing/colors with sliders (`slider-title-scale` etc.).
- `AppModals.jsx` hosts `AddSectionModal` (backdrop/dialog/cards testids,
  positioned via `#area-cv.getBoundingClientRect`, `addSection(col,type,…)`),
  `AIExportModal` (~2275 lines: 10-prompt hub, copy/paste clipboard, per-prompt
  tour steps, paste-back → `cleanAndParseRawJSON →
  normalizeAnyJSONToCVSnapshot → saveVersion → loadVersionSnapshot`),
  `VersionManagerModal` (IndexedDB CRUD via `versionStorage` + `thumbnailGenerator`,
  subcomponents `VersionActionBar/Card/ConfirmationDialogs`),
  `TranslationModal` (prompt/import/slots tabs, slot-dictionary engine, AI
  disclaimer Obsidian callout), `Joyride` onboarding, `AITipsSidebar`,
  `ToastNotification`. `ModalErrorBoundary` wraps AddSection + HelpDialog only.
- Tours: `TourContext.jsx` (`TOUR_IDS`, `ressume_tour_*` persistence,
  `MODAL_HELP_CONTENT` formal guides, bitácora-tour flag) + `tour/*` steps
  (main canvas, sidebar spotlight-clicks, per-AI-prompt, add-section, import-cv)
  + `tourUtils` sidebar pin/unpin + resize. `ModalHelpButton`
  (`btn-modal-help`) → `ModalHelpDialog` (`modal-help-dialog`, focus-trapped,
  themed). `useFocusTrap` (Tab loop, Escape→onClose, focus restore) used by
  modals; `useModalTheme` (`ressume_fullscreen_modal_theme`).
- Primitives: `DroppableColumn` (`useDroppable type:column`), `DragHandle`
  (`stopPropagation` anti-nested-sensor, `data-editor-ui`), `DropIndicatorPlaceholder`
  (dashed `#3874ff` fallback), `CVDragOverlay` (180ms cubic-bezier drop animation),
  `ColumnResizer` (separator role, Arrow/Home/End keys), `LayoutModeToggle`
  (flag-gated), `InlineEdit` (print static vs contentEditable execCommand),
  `Footer` (`app-footer no-print`). Dnd ambient: `DndDropTargetContext`,
  `DndStatusContext`.

## 8. Import/export, AI, i18n, storage

- Formats: native `{profile, layout, sections}` + rich abstraction
  (`document_context/candidate_profile/normalized_sections`) accepted by
  `universalJsonImporter.js` (`cleanAndParseRawJSON`, root unwrap, layout alias
  map, en/es language detect, loose→canonical section map, contact channels).
  Canonical validators re-exported via `versionValidator.js`.
- AI exporters (`aiExporter.js`, re-exported prompts/legend/schema): Markdown, XML,
  ATS plain text, JSON-full (`generateCVLivePdfAbstraction`,
  `is_live_preview_pdf_abstraction: true`, physical page layout single vs
  left/right columns, LLM schema contract). `buildAIPromptPayload(cvData,
  promptId='recruiter_audit')` formats CV per prompt, injects
  system/task/output/commentary/job-description (`job_matcher` requires it).
- Offline rules (`ai-knowledge/index.js:getAISuggestions`, `getAIPromptById`):
  `locales/*/rules.json` (~31 rules: page_count/regex/format/content/word-count/
  dictionary, severity critical/warning/info, auto_fixable).
- Prompt pack (`locales/es|en/prompts.json`, 10 each): recruiter_audit,
  job_matcher, star_enhancer, technical_interview, translate_english (JSON-only,
  US-Tech localization), live_coding_coach, career_upskilling_roadmap,
  cold_outreach_generator, salary_negotiation_advisor, bring_your_own_cv
  (JSON-only). Bidirectional handlers (`services/ai/bidirectionalPromptContract.js`)
  for translate/import: parse → normalize → auto-backup version
  (`[subtitle - name][Backup][LEGEND]`) → load.
- Translation engine (`translationEngine.js`): 8 langs supported, 2 with full
  dictionaries (`locales/index.js`: `es` fallback, `content/prompts/rules/ui`
  JSON, `applyDictionaryToCVState`, `extractDictionaryFromCV`, canonical ES title
  maps, JSON-only response contract).
- Storage map: `cvData`, `cvLanguagePacks`, `cvActiveLanguage`, `cv_show_ai_tips`,
  `action_menu_pinned`, `skip_onboarding_tour`, `ressume_tour_*`,
  `seen_ai_modal_tour`, `ressume_fullscreen_modal_theme` (localStorage);
  `RessumeDB.versions` (IndexedDB, `memoryStore` fallback, indexes
  createdAt/name); Bitácora votes/custom
  (`Easy CV Editor_bitacora_voted_ids|_custom_items`, 600ms cooldown) + voter
  token (`Easy CV Editor_voter_token`); Supabase `bitacora_posts` (RLS published
  read, `toggle_bitacora_vote` RPC, schema in `src/data/bitacora/schema.sql`,
  categories + `INITIAL_BITACORA_ITEMS` seed).
- Deps (runtime): `react@18`, `react-dom@18`, `@dnd-kit/{core@6,sortable@8,
  utilities@3}`, `@supabase/supabase-js@2`, `lucide-react@1`, `react-joyride@3`.
  Dev: `vite@5` (+react plugin), `vitest@1` (jsdom, `src/tests/setup.js`),
  `cypress@16`, testing-library, `yaml`. Build `chunkSizeWarningLimit: 1600`;
  dev server `0.0.0.0:5173` polling. Flags: `VITE_ENABLE_TWO_COLUMN_MODE`,
  `VITE_ENABLE_BITACORA` (default false; test env forces two-col true).
