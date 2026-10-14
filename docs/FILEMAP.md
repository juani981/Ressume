# Ressume — `src/` FILEMAP

> Mental map of `src/`. Entry: `src/main.jsx` → `src/App.jsx` → `src/context/CVContext.jsx`. Registry: `src/registry/sectionRegistry.js`. Print: `src/services/print/`.

## Root `src/`
- `src/main.jsx` — React root; mounts `App` inside `CVProvider`+`TourProvider`+`RootErrorBoundary`.
- `src/App.jsx` — Editor shell; A4 pages, DnD wiring, `ActionMenu`, `AppModals`.
- `src/index.css` — Global styles / CSS variables entry.

## `src/ai-knowledge/`
- `src/ai-knowledge/index.js` — AI rules/prompts façade over `locales` (`getAISuggestions`, `getAIPromptById`).

## `src/components/` (root)
- `src/components/CustomTooltip.jsx` — Custom tooltip replacing native `title`.

## `src/components/Bitacora/`
- `src/components/Bitacora/index.js` — Barrel export for Bitácora hub.
- `src/components/Bitacora/BitacoraModal.jsx` — Knowledge-hub browser modal.
- `src/components/Bitacora/BitacoraCard.jsx` — Card preview for one entry.
- `src/components/Bitacora/BitacoraDetailModal.jsx` — Full-entry reading view.
- `src/components/Bitacora/BitacoraSubmitModal.jsx` — Submit/share form.
- `src/components/Bitacora/ObsidianCallout.jsx` — Obsidian-style callout renderer.

## `src/components/common/`
- `src/components/common/index.js` — Barrel for shared chrome.
- `src/components/common/Footer.jsx` — App footer.
- `src/components/common/RootErrorBoundary.jsx` — Top-level crash guard.
- `src/components/common/ModalErrorBoundary.jsx` — Per-modal crash guard.
- `src/components/common/ModalHelpButton.jsx` + `ModalHelpDialog.jsx` — Help button + dialog.
- `src/components/common/ModalThemeToggle.jsx` — Dark/light toggle for modals.

## `src/components/CV/`
- `src/components/CV/A4PageBox.jsx` — A4 page container / pagination frame.
- `src/components/CV/BaseSection.jsx` — Generic section wrapper (title + items + DnD).
- `src/components/CV/BaseItem.jsx` — Generic item renderer.
- `src/components/CV/SortableBulletItem.jsx` — Sortable rich-text bullet.
- `src/components/CV/SpacerBlock.jsx` — Vertical spacer block.
- `src/components/CV/SectionErrorBoundary.jsx` — Isolates section render failures.
- `src/components/CV/items/ProfileHeaderItem.jsx` — Photo + name + contact header.
- `src/components/CV/items/ProfileTitleItem.jsx` — Detached title/subtitle block.
- `src/components/CV/items/AboutItem.jsx` — Summary / about paragraph.
- `src/components/CV/items/ExperienceItem.jsx` — Job entry (role, dates, bullets).
- `src/components/CV/items/EducationItem.jsx` — Degree entry.
- `src/components/CV/items/SkillsItem.jsx` — Skill list / tag group.
- `src/components/CV/items/ProjectsItem.jsx` — Project entry + links.
- `src/components/CV/items/ContactItem.jsx` — Typed contact row (uses `contactTypes`).
- `src/components/CV/items/PhotoItem.jsx` — Standalone photo block.
- `src/components/CV/items/AwardsItem.jsx` / `CertificatesItem.jsx` / `LanguagesItem.jsx` / `MentoringItem.jsx` / `PublicationsItem.jsx` / `ReferencesItem.jsx` / `VolunteeringItem.jsx` — One-line typed entries for each category.
- `src/components/CV/items/SimpleListItem.jsx` — Fallback generic list item.
- `src/components/CV/items/SpacerItem.jsx` — Spacer as sortable item.

## `src/components/Editor/`
- `src/components/Editor/ActionMenu.jsx` + `ActionMenu/ActionMenuRoot.jsx` — Left action rail root.
- `src/components/Editor/ActionMenu/DesignPanel.jsx` + `index.js` — Design tab + barrel.
- `src/components/Editor/AppModals.jsx` — Central registry mounting all modals.
- `src/components/Editor/AddSectionModal.jsx` — Add-section picker.
- `src/components/Editor/AddBulletPoint.jsx` — Add-bullet control.
- `src/components/Editor/AIExportModal.jsx` — AI export / prompt runner.
- `src/components/Editor/AITipsSidebar.jsx` — Contextual AI suggestions panel.
- `src/components/Editor/TranslationModal.jsx` — Full-CV translation flow.
- `src/components/Editor/VersionManagerModal.jsx` + `versionManager/` (`VersionCard.jsx`, `VersionActionBar.jsx`, `VersionConfirmationDialogs.jsx`, `index.js`) — Version history hub.
- `src/components/Editor/RichTextToolbar.jsx` — Bold/italic/link toolbar for bullets.
- `src/components/Editor/InlineEdit.jsx` — Click-to-edit text field.
- `src/components/Editor/HyperlinkEdit.jsx` — Link URL editor.
- `src/components/Editor/SuggestionTooltip.jsx` — AI inline suggestion popup.
- `src/components/Editor/DroppableColumn.jsx` / `CVDragOverlay.jsx` / `DragHandle.jsx` / `DropIndicatorPlaceholder.jsx` / `ColumnResizer.jsx` — DnD + two-column layout primitives.
- `src/components/Editor/A4PageGuides.jsx` — Page-break guides overlay.
- `src/components/Editor/LayoutModeToggle.jsx` — Single / two-column switch.
- `src/components/Editor/ColorPickerSwatch.jsx` — Theme color swatch.
- `src/components/Editor/ContactTypePicker.jsx` — Contact-type selector.
- `src/components/Editor/SectionBulletStylePopover.jsx` / `SectionDeleteConfirmPopover.jsx` — Bullet styling + delete confirm.
- `src/components/Editor/ToastNotification.jsx` — Toast feedback.
- `src/components/Editor/tour/` (`tourSteps.jsx`, `mainTourSteps.jsx`, `sidebarTourSteps.jsx`, `addSectionModalTourSteps.jsx`, `aiModalTourSteps.jsx`, `importCvTourSteps.jsx`, `tourUtils.js`, `index.js`) — Guided-tour step definitions.

## `src/constants/`
- `src/constants/index.js` — Re-export hub for tokens.
- `src/constants/colors.js` — `COLOR_TOKENS`, palette.
- `src/constants/geometry.js` — A4 dims, paddings, column defaults.
- `src/constants/spacing.js` — Spacing scale.
- `src/constants/typography.js` — Font families / sizes.

## `src/context/`
- `src/context/index.js` — Barrel for all providers.
- `src/context/CVContext.jsx` — Central CV state (`useCV`).
- `src/context/hooks/useCVData.js` — Data CRUD for sections/items.
- `src/context/hooks/useCVHistory.js` — Undo/redo snapshots.
- `src/context/hooks/useCVLayout.js` — Columns, spacing, theme state.
- `src/context/hooks/useCVExport.js` — Export/print orchestration.
- `src/context/hooks/index.js` — Barrel for CV hooks.
- `src/context/TourContext.jsx` — Guided-tour state.
- `src/context/PrintModeContext.jsx` — Print vs. live rendering flag.
- `src/context/DndStatusContext.jsx` / `DndDropTargetContext.jsx` — DnD status + drop target.

## `src/data/bitacora/`
- `src/data/bitacora/items.js` — Seed knowledge entries.
- `src/data/bitacora/categories.js` — Category taxonomy.
- `src/data/bitacora/schema.sql` — Supabase table schema.

## `src/hooks/`
- `src/hooks/index.js` — Barrel.
- `src/hooks/useCVDndCoordinator.js` — Coordinates section/item DnD.
- `src/hooks/useDocumentPages.js` — Computes paginated page model.
- `src/hooks/useLiveDomHeights.js` — Measures live DOM heights for pagination.
- `src/hooks/useColumnResizer.js` — Two-column resize drag logic.
- `src/hooks/useBitacora.js` — Fetches/filters Bitácora entries.
- `src/hooks/useFocusTrap.js` — Keyboard focus trap for modals.
- `src/hooks/useModalTheme.js` — Modal-scoped theming.

## `src/locales/`
- `src/locales/index.js` — `getRules`/`getPrompts` locale loader (es/en).
- `src/locales/es/ui.json` / `en/ui.json` — UI strings.
- `src/locales/es/content.json` / `en/content.json` — Seed CV content.
- `src/locales/es/prompts.json` / `en/prompts.json` — AI prompt library.
- `src/locales/es/rules.json` / `en/rules.json` — AI tip rule set.

## `src/registry/`
- `src/registry/sectionRegistry.js` — `Map` registry + `registerSectionType`.
- `src/registry/itemFormatters.js` — Markdown/XML/plaintext item serializers.
- `src/registry/descriptors/index.js` — Aggregates `allDescriptors`.
- `src/registry/descriptors/about.js` / `experience.js` / `education.js` / `skills.js` / `projects.js` / `contact.js` / `profileHeader.js` / `titleSubtitle.js` / `photo.js` / `awards.js` / `certificates.js` / `languages.js` / `mentoring.js` / `publications.js` / `references.js` / `volunteering.js` / `simpleList.js` / `spacer.js` — Per-type schema, defaults, render hints.
- `src/registry/descriptors/idGenerator.js` — Unique section/item IDs.

## `src/services/`
- `src/services/supabaseClient.js` — Supabase client init.
- `src/services/bitacoraService.js` — Bitácora CRUD against Supabase.
- `src/services/ai/bidirectionalPromptContract.js` — AI import/export JSON contract validator.
- `src/services/print/index.js` — Print pipeline barrel.
- `src/services/print/cleanHtmlGenerator.js` — Clean static HTML for PDF.
- `src/services/print/printExecutionDriver.js` — Print-window execution driver.
- `src/services/print/printFonts.js` — Font embedding for print.
- `src/services/print/pdfTitleService.js` — PDF filename/title builder.

## `src/styles/`
- `src/styles/bundle.js` — Style bundle entry.
- `src/styles/tokens.css` — CSS variable tokens.
- `src/styles/print.css` — Print-only (`@print`) overrides.

## `src/tests/`
- `src/tests/setup.js` — Vitest global setup.
- `src/tests/registry.test.jsx` / `cvSchemaValidator.test.js` / `itemFormatters.test.js` / `seedCVTemplates.test.js` — Registry/schema/template invariants.
- `src/tests/pageDistributor.test.js` / `live_dom_distributor.test.js` / `realtime-sticky-pagination.test.jsx` / `twoColumn*.test.jsx` / `bulletPaginationFlowParity.test.jsx` — Pagination / two-column engine.
- `src/tests/cleanPrintEngineVerification.test.jsx` / `staticHtmlPdfEngine.test.js` / `atsPrintModeFidelity.test.js` / `bulletPointsNativePrint.test.jsx` — Print/PDF fidelity.
- `src/tests/ai-prompts-and-exporter.test.js` / `aiExportModal.test.jsx` / `bidirectional-prompt-contract.test.jsx` / `atsEnrichedIngestion.test.js` — AI import/export contract.
- `src/tests/*challenger*.test.jsx` + `*stress*.test.*` + `empirical-challenger-deep-audit.test.jsx` — Adversarial/stress audits (see `challenger-stress-suite`).
- `src/tests/componentDndAndInteractivity.test.jsx` / `polymorphic-dnd.test.jsx` / `liveSortDndCoordinator.test.jsx` + `tour*.test.jsx` + `version-manager-hub.test.jsx` — DnD, tour, versions UX.

## `src/utils/`
- `src/utils/schema.js` + `cvSchemaValidator.js` — CV JSON schema + validator.
- `src/utils/pageDistributor.js` + `pageGeometry.js` + `pageModelTypes.js` + `pageDeletionEngine.js` — Pagination core.
- `src/utils/staticHtmlPdfEngine.js` + `textLayerExtractor.js` — Static HTML→PDF + text layer.
- `src/utils/cvJsonAbstraction.js` + `universalJsonImporter.js` + `atsSchemaTemplate.js` — JSON abstraction / import / ATS template.
- `src/utils/aiExporter.js` + `translationEngine.js` + `richTextEngine.js` + `textSanitizer.js` — AI export, translate, rich-text, sanitize.
- `src/utils/seedCVTemplates.js` — Starter CV templates.
- `src/utils/thumbnailGenerator.js` + `fontPreloader.js` + `typographyUtils.js` + `colorUtils.js` + `bulletStyles.js` — Thumbs, fonts, type/color/bullets.
- `src/utils/dndUtils.js` + `itemAdapter.js` + `parityChecker.js` — DnD helpers, item adapter, parity check.
- `src/utils/contactTypes.js` + `phoneFormatter.js` — Contact metadata + phone format.
- `src/utils/cvLinter.js` — CV quality lint rules.
- `src/utils/bitacoraStorage.js` + `versionStorage.js` + `versionValidator.js` — Local persistence + version validation.
- `src/utils/disableNativeTooltips.js` — Global native-tooltip killer.
