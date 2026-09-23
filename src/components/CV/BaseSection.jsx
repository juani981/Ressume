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
import { Lightbulb, MoreHorizontal, Trash2, Plus } from 'lucide-react';
import { getBulletClasses } from '../../utils/bulletStyles';
import SectionBulletStylePopover from '../Editor/SectionBulletStylePopover';
import { IntegratedBottomSpacer } from './SpacerBlock';
import { createContainerDragListeners } from '../../utils/dndUtils';

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
}) => {
  const ContainerTag = descriptor?.containerTag;
  const isList = isListContainerTag(ContainerTag);
  const containerClass = descriptor?.containerClass || '';
  const containerStyle = isPrint
    ? descriptor?.printContainerStyle || {}
    : descriptor?.containerStyle || {};

  const renderedItems = items.map((item, index) => (
    <BaseItem
      key={item.id || index}
      item={item}
      sectionId={sectionId}
      sectionType={sectionType}
      isPrint={isPrint}
      isLast={index === items.length - 1}
    />
  ));

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

  return (
    <section 
      className={`${descriptor.sectionClass} section cv-section${bulletClasses}${hasPageBreak ? ' break-page-before' : ''}`} 
      id={section.id}
      data-section-id={section.id}
      style={{ marginBottom: 'var(--section-gap, 20px)', color: 'var(--text-color)' }}
    >
      {descriptor.hasTitle !== false && section.title && (
        <h2 
          className={`section-title${hasTitlePageBreak ? ' break-page-before' : ''}`} 
          data-section-title={section.id}
        >
          <InlineEdit value={section.title || ''} isPrint={true} />
        </h2>
      )}

      <div className={wrapperClass}>
        <SectionItemsRenderer
          items={items}
          sectionId={section.id}
          sectionType={section.type}
          descriptor={descriptor}
          isPrint={true}
        />
      </div>

      <IntegratedBottomSpacer isPrint={true} containerId={section.id} height={section.bottomSpacing || 0} />
    </section>
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
const EditableBaseSection = ({ section }) => {
  const descriptor = getSectionDescriptor(section?.type);

  if (descriptor?.sectionComponent) {
    const CustomSection = descriptor.sectionComponent;
    return <CustomSection section={section} isPrint={false} />;
  }

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: section.id,
    data: { type: 'section', section }
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

  const [isBulletPopoverOpen, setIsBulletPopoverOpen] = useState(false);
  const [bulletTriggerRect, setBulletTriggerRect] = useState(null);

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
  const wrapperClass = resolveSectionWrapperClass(descriptor);

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
      {!section.isContinuation && (
        <DragHandle listeners={listeners} attributes={attributes} />
      )}
      
      {!section.isContinuation && (
        <div 
          className={`section-action-buttons no-print ${isTooltipOpen || isBulletPopoverOpen ? 'has-active-popover' : ''}`}
          data-editor-ui="true"
          data-testid={`section-actions-${section.id}`}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button 
            type="button"
            className={`section-tips-toggle-btn ${isTooltipOpen ? 'active' : ''}`}
            title={isTooltipOpen ? 'Ocultar consejos IA' : 'Ver consejos IA para esta sección'}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              const bounding = e.currentTarget.closest('.cv-section')?.getBoundingClientRect();
              if (typeof toggleTooltipForSection === 'function') {
                toggleTooltipForSection(section, bounding);
              }
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
              onPointerDown={(e) => e.stopPropagation()}
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
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                deleteSection(section.id);
              }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}

      {!section.isContinuation && descriptor.hasTitle !== false && Boolean(section.title) && (
        <h2 className="section-title" data-section-title={section.id}>
          <InlineEdit value={section.title || ''} onSave={(val) => updateSectionTitle(section.id, val)} />
        </h2>
      )}
      
      <div className={wrapperClass}>
        <SortableContext items={(section.items || []).map(i => i.id)} strategy={verticalListSortingStrategy}>
          <SectionItemsRenderer
            items={section.items || []}
            sectionId={section.originalSectionId || section.id}
            sectionType={section.type}
            descriptor={descriptor}
            isPrint={false}
          />
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
  const descriptor = getSectionDescriptor(props.section?.type);
  if (descriptor?.sectionComponent) {
    const CustomSection = descriptor.sectionComponent;
    return <CustomSection {...props} />;
  }
  if (props.isPrint) {
    return <PrintBaseSection {...props} />;
  }
  return <EditableBaseSection {...props} />;
};

export default BaseSection;
