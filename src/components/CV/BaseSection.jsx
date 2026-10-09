/**
 * BaseSection.jsx
 *
 * Generic template component for CV sections, driven 100% by SectionDescriptor
 * from sectionRegistry. Implements Factory/Strategy & Template pattern with
 * ZERO section.type conditional guards.
 *
 * Dispatches to custom section components (e.g. SpacerBlock), manages section titles,
 * floating action buttons (tips, bullet style popover, delete), DnD sortable context,
 * bullet customization, and integrated bottom spacers.
 */

import React, { useState } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragHandle from '../Editor/DragHandle';
import InlineEdit from '../Editor/InlineEdit';
import { useCV } from '../../context/CVContext';
import BaseItem from './BaseItem';
import { getSectionDescriptor } from '../../registry/sectionRegistry';
import { List, Trash2, Plus } from 'lucide-react';
import { getBulletClasses } from '../../utils/bulletStyles';
import SectionBulletStylePopover from '../Editor/SectionBulletStylePopover';
import SectionDeleteConfirmPopover from '../Editor/SectionDeleteConfirmPopover';
import { IntegratedBottomSpacer } from './SpacerBlock';
import { createContainerDragListeners } from '../../utils/dndUtils';
import { PrintModeContext, usePrintMode } from '../../context/PrintModeContext';
import { useDndStatus } from '../../context/DndStatusContext';
import { DEFAULT_SECTION_GAP_PX } from '../../constants';
import SectionErrorBoundary from './SectionErrorBoundary';

/**
 * Checks whether the container tag should be rendered as a list container (ul/ol).
 *
 * @param {string} tag
 * @returns {boolean}
 */
export const isListContainerTag = (tag) => tag === 'ul' || tag === 'ol';

/**
 * Resolves the CSS wrapper class for a section based on its descriptor.
 *
 * @param {Object} descriptor
 * @returns {string}
 */
export const resolveSectionWrapperClass = (descriptor) =>
  descriptor?.wrapperClass !== undefined
    ? descriptor.wrapperClass
    : `${descriptor?.sectionClass || ''}__container bd-grid`;

/**
 * Shared renderer for section item lists in both interactive and print modes.
 *
 * @param {Object} props
 * @param {Array} props.items
 * @param {string} props.sectionId
 * @param {string} props.sectionType
 * @param {Object} props.descriptor
 * @param {boolean} [props.isPrint=false]
 * @returns {React.ReactElement|React.ReactElement[]}
 */
export const SectionItemsRenderer = ({
  items = [],
  sectionId,
  sectionType,
  descriptor,
  isPrint = false,
  hasContinuation = false,
}) => {
  const ContainerTag = descriptor?.containerTag;
  const isList = isListContainerTag(ContainerTag);
  const containerClass = descriptor?.containerClass || '';
  const containerStyle = isPrint
    ? descriptor?.printContainerStyle || {}
    : descriptor?.containerStyle || {};

  const renderedItems = items.map((item, index) => {
    const isItemLast = (index === items.length - 1) && !hasContinuation && !item?.isPartialItem;
    return (
      <BaseItem
        key={item.id || index}
        item={item}
        sectionId={sectionId}
        sectionType={sectionType}
        isPrint={isPrint}
        isLast={isItemLast}
      />
    );
  });

  if (isList && ContainerTag) {
    return (
      <ContainerTag className={containerClass} style={containerStyle}>
        {renderedItems}
      </ContainerTag>
    );
  }

  return renderedItems;
};

/**
 * PrintBaseSection
 * Pure template for rendering a section in static print / PDF mode.
 *
 * @param {Object} props
 * @param {Object} props.section - CV section data model
 * @returns {React.ReactElement|null}
 */
export const PrintBaseSection = ({ section }) => {
  if (!section) return null;
  const descriptor = getSectionDescriptor(section.type);

  if (descriptor?.sectionComponent) {
    const CustomSection = descriptor.sectionComponent;
    return <CustomSection section={section} isPrint={true} />;
  }

  const items = section.items || [];
  const bulletClasses = section.bulletStyle ? ` ${getBulletClasses(section.bulletStyle)}` : '';
  const wrapperClass = resolveSectionWrapperClass(descriptor);

  const hasPageBreak = Boolean(section.pageBreak === 'before' || section.breakBefore || section.isForcedBreak);
  const hasTitlePageBreak = Boolean(section.titlePageBreak === 'before' || section.isTitleForcedBreak);
  const isContinuation = Boolean(section.isContinuation);

  return (
    <PrintModeContext.Provider value={true}>
      <section 
        className={`${descriptor.sectionClass} section cv-section${bulletClasses}${hasPageBreak ? ' break-page-before' : ''}${section.hasContinuation ? ' section-has-continuation' : ''}${isContinuation ? ' section-is-continuation' : ''}`} 
        id={section.id}
        data-section-id={section.id}
        data-has-continuation={section.hasContinuation ? 'true' : undefined}
        data-is-continuation={isContinuation ? 'true' : undefined}
        style={{ marginBottom: `var(--section-gap, ${DEFAULT_SECTION_GAP_PX}px)`, color: 'var(--text-color)' }}
      >
        {descriptor.hasTitle !== false && !isContinuation && Boolean(section.title) && (
          <h2 
            className={`section-title${hasTitlePageBreak ? ' break-page-before' : ''}`} 
            data-section-title={section.id}
          >
            <InlineEdit value={section.title || ''} isPrint={true} />
          </h2>
        )}

        <div className={wrapperClass}>
          <SectionErrorBoundary sectionId={section.id} sectionTitle={section.title}>
            <SectionItemsRenderer
              items={items}
              sectionId={section.originalSectionId || section.id}
              sectionType={section.type}
              descriptor={descriptor}
              isPrint={true}
              hasContinuation={Boolean(section.hasContinuation)}
            />
          </SectionErrorBoundary>
        </div>

        <IntegratedBottomSpacer isPrint={true} containerId={section.id} height={section.bottomSpacing || 0} />
      </section>
    </PrintModeContext.Provider>
  );
};

/**
 * EditableBaseSection
 * Interactive CV section in live editor with drag handles, title editing,
 * floating actions, item reordering, add buttons, and bottom spacer.
 *
 * @param {Object} props
 * @param {Object} props.section - CV section data model
 * @returns {React.ReactElement}
 */
const EditableBaseSection = ({ section, hideDragAffordance = false }) => {
  const descriptor = getSectionDescriptor(section?.type);

  if (descriptor?.sectionComponent) {
    const CustomSection = descriptor.sectionComponent;
    return <CustomSection section={section} isPrint={false} />;
  }

  const isMoveDisabled = Boolean(
    descriptor?.isMoveDisabled ||
    descriptor?.allowSectionDrag === false ||
    ['profile_header', 'title_subtitle', 'contact', 'about'].includes(section?.type) ||
    ['profile_header', 'title_subtitle', 'contact', 'about_section', 'about'].includes(section?.id)
  );

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: section.id,
    disabled: isMoveDisabled,
    data: { type: 'section', section, isMoveDisabled }
  });

  const { 
    cvData,
    updateSectionTitle, 
    updateSectionBulletStyle,
    addSectionItem, 
    deleteSection, 
    updateSectionProperty,
  } = useCV();

  const { justDroppedId } = useDndStatus();

  const [isBulletPopoverOpen, setIsBulletPopoverOpen] = useState(false);
  const [bulletTriggerRect, setBulletTriggerRect] = useState(null);
  const [bulletTriggerElement, setBulletTriggerElement] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTriggerRect, setDeleteTriggerRect] = useState(null);
  const [deleteTriggerElement, setDeleteTriggerElement] = useState(null);

  const style = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    opacity: isDragging ? undefined : 1,
    zIndex: isDragging ? 100 : undefined,
    marginBottom: `var(--section-gap, ${DEFAULT_SECTION_GAP_PX}px)`,
    color: 'var(--text-color)',
    minWidth: 0,
    maxWidth: '100%',
    width: '100%',
    boxSizing: 'border-box'
  };

  const allowDelete = descriptor.allowDelete !== false;
  const allowAddItem = descriptor.allowAddItem !== false;
  const allowBulletCustomization = Boolean(descriptor.supportsBulletCustomization);
  const containerDragListeners = !isMoveDisabled ? createContainerDragListeners(listeners, false) : {};
  const wrapperClass = resolveSectionWrapperClass(descriptor);

  const isJustDropped = Boolean(justDroppedId && (justDroppedId === section.id || justDroppedId === section.originalSectionId));

  return (
    <section 
        ref={setNodeRef} 
        style={style} 
        className={`${descriptor.sectionClass} section editable-section-container cv-section ${getBulletClasses(section.bulletStyle)}${section.hasContinuation ? ' section-has-continuation' : ''}${section.isContinuation ? ' section-is-continuation' : ''}${isMoveDisabled ? ' section-fixed' : ''}${hideDragAffordance ? ' drag-affordance-hidden' : ''}${isDragging ? ' is-dragging-placeholder dnd-placeholder-sombra' : ''}${isJustDropped ? ' dnd-dropped-settle' : ''}`} 
        id={section.id}
        data-section-id={section.id}
        data-drag-disabled={isMoveDisabled ? 'true' : undefined}
        data-has-continuation={section.hasContinuation ? 'true' : undefined}
        data-is-continuation={section.isContinuation ? 'true' : undefined}
        {...attributes}
        {...containerDragListeners}
      >
      {!section.isContinuation && !isMoveDisabled && (
        <DragHandle listeners={listeners} attributes={attributes} />
      )}
      
      {!section.isContinuation && (
        <div 
          className={`section-action-buttons no-print ${isBulletPopoverOpen ? 'has-active-popover' : ''}`}
          data-editor-ui="true"
          data-testid={`section-actions-${section.id}`}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {allowBulletCustomization && (
            <button 
              type="button"
              className={`section-bullet-style-btn ${isBulletPopoverOpen ? 'active' : ''}`}
              title="Estilo de viñetas (Recomendado ATS: Círculo)"
              aria-label="Estilo de viñetas (Recomendado ATS: Círculo)"
              data-testid={`btn-bullet-style-${section.id}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setBulletTriggerRect(e.currentTarget.getBoundingClientRect());
                setBulletTriggerElement(e.currentTarget);
                setIsBulletPopoverOpen(prev => !prev);
              }}
            >
              <List size={14} color={isBulletPopoverOpen ? '#ffffff' : '#0f172a'} />
            </button>
          )}

          {allowDelete && (
            <button 
              type="button"
              className="round-btn-del section-del-btn"
              title={`Eliminar sección ${section.title || section.id}`}
              data-testid={`btn-delete-section-${section.id}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTriggerRect(e.currentTarget.getBoundingClientRect());
                setDeleteTriggerElement(e.currentTarget);
                setIsDeleteConfirmOpen(true);
              }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}

      {descriptor.hasTitle !== false && !section.isContinuation && Boolean(section.title) && (
        <h2 
          className="section-title" 
          data-section-title={section.id}
        >
          <InlineEdit value={section.title || ''} onSave={(val) => updateSectionTitle(section.originalSectionId || section.id, val)} />
        </h2>
      )}
      
      <div className={wrapperClass} style={{ minWidth: 0, maxWidth: '100%', width: '100%', boxSizing: 'border-box' }}>
        <SortableContext items={(section.items || []).map(i => i.id)} strategy={verticalListSortingStrategy}>
          <SectionErrorBoundary sectionId={section.id} sectionTitle={section.title}>
            <SectionItemsRenderer
              items={section.items || []}
              sectionId={section.originalSectionId || section.id}
              sectionType={section.type}
              descriptor={descriptor}
              isPrint={false}
              hasContinuation={Boolean(section.hasContinuation)}
            />
          </SectionErrorBoundary>
        </SortableContext>
      </div>

      {allowAddItem && (
        <div className="section-add-container no-print" data-editor-ui="true" data-editor-add="true">
          <button 
            type="button"
            className="round-btn-add no-print"
            data-editor-ui="true"
            data-editor-add="true"
            title={`Agregar nuevo elemento a ${section.title || 'esta sección'}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              addSectionItem(section.originalSectionId || section.id);
            }}
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {allowBulletCustomization && (
        <SectionBulletStylePopover
          isOpen={isBulletPopoverOpen}
          onClose={() => setIsBulletPopoverOpen(false)}
          bulletStyle={section.bulletStyle}
          onUpdateStyle={(newStyle) => updateSectionBulletStyle(section.originalSectionId || section.id, newStyle)}
          triggerRect={bulletTriggerRect}
          triggerElement={bulletTriggerElement}
        />
      )}

      {allowDelete && (
        <SectionDeleteConfirmPopover
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={() => deleteSection(section.originalSectionId || section.id)}
          sectionTitle={section.title || descriptor.title || section.id}
          triggerRect={deleteTriggerRect}
          triggerElement={deleteTriggerElement}
        />
      )}

      <IntegratedBottomSpacer
        containerId={section.originalSectionId || section.id}
        height={section.bottomSpacing || 0}
        onUpdateHeight={(newH) => {
          if (typeof updateSectionProperty === 'function') {
            updateSectionProperty(section.originalSectionId || section.id, 'bottomSpacing', newH);
          }
        }}
      />
    </section>
  );
};

/**
 * BaseSection
 * Main entry point delegating to PrintBaseSection or EditableBaseSection.
 * Supports custom section components registered on the section descriptor.
 *
 * @param {Object} props
 * @param {Object} props.section - CV section data model
 * @param {boolean} [props.isPrint=false] - Whether rendering in print mode
 * @returns {React.ReactElement|null}
 */
const BaseSection = (props) => {
  const contextIsPrint = usePrintMode();
  const effectiveIsPrint = props.isPrint ?? contextIsPrint;
  const descriptor = getSectionDescriptor(props.section?.type);
  if (descriptor?.sectionComponent) {
    const CustomSection = descriptor.sectionComponent;
    return <CustomSection {...props} isPrint={effectiveIsPrint} />;
  }
  if (effectiveIsPrint) {
    return <PrintBaseSection {...props} isPrint={true} />;
  }
  return <EditableBaseSection {...props} />;
};

export default BaseSection;
