/**
 * @file MentoringItem.jsx
 * @description Item component for the 'mentoring' section type.
 *
 * ## Extensibility smoke-test (M5)
 * Demonstrates the Factory + Template pattern: adding a new CV section type
 * requires ONLY:
 *   1. This item component (one new file)
 *   2. One `registerSectionType(...)` call in `sectionRegistry.js`
 *
 * Zero changes to BaseItem, BaseSection, CVContext, or App.
 *
 * @contract
 *   Props:
 *     item      {Object}  — Data: { id, title, date, mentee, description }
 *     sectionId {string}  — Parent section ID (passed by BaseItem template)
 *     isPrint   {boolean} — Print/export mode (no editor controls)
 *     isLast    {boolean} — Whether last item in section (hides timeline line)
 */

import React from 'react';
import InlineEdit from '../../Editor/InlineEdit';

/** Read-only render for print/PDF. */
const MentoringItemPrintView = ({ item, isLast = false }) => (
  <>
    <div className="experience__time">
      <span className="experience__rounder" />
      {!isLast && <span className="experience__line" />}
    </div>
    <div className="experience__data bd-grid" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
        <h3 className="experience__title">
          <InlineEdit value={item.title || ''} isPrint={true} />
        </h3>
        {item.date && (
          <span className="experience__company" style={{ fontSize: 'var(--body-smaller-font-size, var(--smaller-font-size))', color: 'var(--text-color-light)' }}>
            <InlineEdit value={item.date || ''} isPrint={true} />
          </span>
        )}
      </div>
      {item.mentee && (
        <span className="experience__company">
          <InlineEdit value={item.mentee || ''} isPrint={true} />
        </span>
      )}
      {item.description && (
        <p className="profile__description" style={{ marginTop: '4px' }}>
          <InlineEdit value={item.description || ''} isPrint={true} multiline />
        </p>
      )}
    </div>
  </>
);

/** Interactive editable render. */
const MentoringItemEditView = ({ item, sectionId, isLast = false }) => (
  <>
    <div className="experience__time">
      <span className="experience__rounder" />
      {!isLast && <span className="experience__line" />}
    </div>
    <div className="experience__data bd-grid" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
        <h3 className="experience__title">
          <InlineEdit value={item.title || ''} field="title" itemId={item.id} sectionId={sectionId} isPrint={false} placeholder="Título / Rol de Mentoría" />
        </h3>
        <InlineEdit value={item.date || ''} field="date" itemId={item.id} sectionId={sectionId} isPrint={false} placeholder="Período" />
      </div>
      <InlineEdit value={item.mentee || ''} field="mentee" itemId={item.id} sectionId={sectionId} isPrint={false} placeholder="Nombre del mentee o institución" className="experience__company" />
      <InlineEdit value={item.description || ''} field="description" itemId={item.id} sectionId={sectionId} isPrint={false} placeholder="Describe el impacto de la mentoría…" multiline className="profile__description" style={{ marginTop: '4px' }} />
    </div>
  </>
);

/**
 * MentoringItem — Strategy component resolved by the SectionDescriptor.
 * BaseItem renders this as a pure template; no `if (sectionType)` guards needed.
 * @param {{ item: Object, sectionId: string, isPrint: boolean, isLast: boolean }} props
 */
const MentoringItem = ({ item, sectionId, isPrint = false, isLast = false }) =>
  isPrint
    ? <MentoringItemPrintView item={item} isLast={isLast} />
    : <MentoringItemEditView item={item} sectionId={sectionId} isLast={isLast} />;

export default MentoringItem;
