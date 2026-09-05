import React from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragHandle from '../Editor/DragHandle';
import InlineEdit from '../Editor/InlineEdit';
import { useCV } from '../../context/CVContext';
import BaseItem from './BaseItem';
import { getSectionDescriptor } from '../../registry/sectionRegistry';
import { Lightbulb, MoreHorizontal } from 'lucide-react';
import { getBulletClasses, supportsBulletCustomization } from '../../utils/bulletStyles';
import SectionBulletStylePopover from '../Editor/SectionBulletStylePopover';

export const PrintBaseSection = ({ section }) => {
  if (!section) return null;
  const descriptor = getSectionDescriptor(section.type);
  const items = section.items || [];
  const isProfile = section.type === 'profile_header';

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

  const bulletClasses = section.bulletStyle ? ` ${getBulletClasses(section.bulletStyle)}` : '';

  return (
    <section 
      className={`${sectionClass} section cv-section${bulletClasses}`} 
      id={section.id}
      style={{ marginBottom: 'var(--section-gap, 20px)', color: 'var(--text-color)' }}
    >
      {!isProfile && section.title && (
        <h2 className="section-title">
          <InlineEdit value={section.title || ''} isPrint={true} />
        </h2>
      )}

      <div className={isProfile || section.type === 'about' ? '' : `${sectionClass}__container bd-grid`}>
        {section.type === 'simple_list' ? (
          <ul className="experience__bullets simple-list-ul" style={{ color: 'var(--text-color)', paddingLeft: '1.15rem', marginTop: '0.25rem', marginBottom: 0, listStyleType: 'disc' }}>
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
          </ul>
        ) : section.type === 'skills' ? (
          <ul className="skills__content bd-grid" style={{ gridTemplateColumns: '1fr', padding: 0, margin: 0, listStyle: 'none' }}>
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
          </ul>
        ) : descriptor?.containerTag === 'ul' ? (
          <ul className={descriptor.containerClass || ''} style={{ padding: 0, margin: 0, listStyle: 'none' }}>
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
          </ul>
        ) : (
          items.map((item, index) => (
            <BaseItem 
              key={item.id || index} 
              item={item} 
              sectionId={section.id} 
              sectionType={section.type} 
              isPrint={true} 
              isLast={index === items.length - 1} 
            />
          ))
        )}
      </div>
    </section>
  );
};

const EditableBaseSection = ({ section }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: section.id,
    data: {
      type: 'section',
      section
    }
  });

  const { 
    cvData, 
    updateSectionTitle, 
    updateSectionBulletStyle,
    addSectionItem, 
    deleteSection, 
    activeTooltip,
    toggleTooltipForSection
  } = useCV();

  const [isBulletPopoverOpen, setIsBulletPopoverOpen] = React.useState(false);
  const [bulletTriggerRect, setBulletTriggerRect] = React.useState(null);
  
  const descriptor = getSectionDescriptor(section.type);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    opacity: isDragging ? 0.4 : 1,
    marginBottom: 'var(--section-gap, 20px)',
    color: 'var(--text-color)'
  };

  const sectionClass = section.type === 'skills' 
    ? 'skills' 
    : section.type === 'education' 
      ? 'education' 
      : section.type === 'profile_header' 
        ? 'home' 
        : section.type === 'about' 
          ? 'profile' 
          : 'experience';

  const isTooltipOpen = activeTooltip?.section?.id === section.id;
  const allowDelete = section.type !== 'profile_header' && descriptor.allowDelete !== false;
  const allowAddItem = section.type !== 'profile_header' && descriptor.allowAddItem !== false;
  const allowBulletCustomization = supportsBulletCustomization(section.type);

  return (
    <section 
      ref={setNodeRef} 
      style={style} 
      className={`${sectionClass} section editable-section-container cv-section ${getBulletClasses(section.bulletStyle)}`} 
      id={section.id}
    >
      <DragHandle listeners={listeners} attributes={attributes} />
      
      {/* Floating Action Buttons Group: TOOLTIPS - 3 PUNTITOS - ELIMINAR */}
      <div 
        className={`section-action-buttons no-print ${isTooltipOpen || isBulletPopoverOpen ? 'has-active-popover' : ''}`}
        data-testid={`section-actions-${section.id}`}
      >
        {/* 1. TOOLTIPS Button */}
        <button 
          type="button"
          className={`section-tips-toggle-btn ${isTooltipOpen ? 'active' : ''}`}
          title={isTooltipOpen ? 'Ocultar consejos IA' : 'Ver consejos IA para esta sección'}
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

        {/* 2. 3 PUNTITOS Button (Timeline Circle Styling) */}
        {allowBulletCustomization && (
          <button
            type="button"
            className={`section-bullet-style-btn ${isBulletPopoverOpen ? 'active' : ''}`}
            title="Personalizar círculo del título"
            aria-label="Personalizar círculo del título"
            data-testid={`btn-bullet-style-${section.id}`}
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              setBulletTriggerRect(rect);
              setIsBulletPopoverOpen(prev => !prev);
            }}
          >
            <MoreHorizontal size={14} color={isBulletPopoverOpen ? '#ffffff' : '#0f172a'} />
          </button>
        )}

        {/* 3. ELIMINAR Button */}
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

      {/* Section Title */}
      {section.type !== 'profile_header' && (
        <h2 className="section-title">
          <InlineEdit 
            value={section.title || ''} 
            onSave={(val) => updateSectionTitle(section.id, val)} 
          />
        </h2>
      )}
      
      {/* Items Container */}
      <div className={section.type === 'profile_header' || section.type === 'about' ? '' : `${sectionClass}__container bd-grid`}>
        <SortableContext items={(section.items || []).map(i => i.id)} strategy={verticalListSortingStrategy}>
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
        </SortableContext>
      </div>

      {/* Add Item Button below Container */}
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

      {/* Bullet & Timeline Styling Popover */}
      {allowBulletCustomization && (
        <SectionBulletStylePopover
          isOpen={isBulletPopoverOpen}
          onClose={() => setIsBulletPopoverOpen(false)}
          bulletStyle={section.bulletStyle}
          onUpdateStyle={(newStyle) => updateSectionBulletStyle(section.id, newStyle)}
          triggerRect={bulletTriggerRect}
        />
      )}
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
