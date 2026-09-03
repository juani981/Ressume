import React from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragHandle from '../Editor/DragHandle';
import InlineEdit from '../Editor/InlineEdit';
import { useCV } from '../../context/CVContext';
import BaseItem from './BaseItem';
import { getSectionDescriptor } from '../../registry/sectionRegistry';
import { Lightbulb } from 'lucide-react';

const BaseSection = ({ section }) => {
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
    addSectionItem, 
    deleteSection, 
    activeTooltip,
    toggleTooltipForSection
  } = useCV();
  
  const descriptor = getSectionDescriptor(section.type);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    opacity: isDragging ? 0.4 : 1,
    marginBottom: 'max(10px, var(--section-gap, 20px))'
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

  return (
    <section 
      ref={setNodeRef} 
      style={style} 
      className={`${sectionClass} section editable-section-container cv-section`} 
      id={section.id}
    >
      <DragHandle listeners={listeners} attributes={attributes} />
      
      {/* AI Tips Toggle Lightbulb Button (Manual On-Demand Click) */}
      <button 
        type="button"
        className={`section-tips-toggle-btn no-print ${isTooltipOpen ? 'active' : ''}`}
        title={isTooltipOpen ? 'Ocultar consejos IA' : 'Ver consejos IA para esta sección'}
        onClick={(e) => {
          e.stopPropagation();
          const bounding = e.currentTarget.closest('.cv-section')?.getBoundingClientRect();
          if (typeof toggleTooltipForSection === 'function') {
            toggleTooltipForSection(section, bounding);
          }
        }}
      >
        <Lightbulb size={14} color={isTooltipOpen ? '#ffffff' : '#eab308'} />
      </button>

      {/* Delete Section Button in Top-Right */}
      {allowDelete && (
        <button 
          type="button"
          className="round-btn-del section-del-btn no-print"
          title={`Eliminar sección ${section.title || section.id}`}
          onClick={(e) => {
            e.stopPropagation();
            deleteSection(section.id);
          }}
        >
          <i className='bx bx-trash' style={{ fontSize: '14px' }}></i>
        </button>
      )}

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
        <div className="section-add-container no-print" style={{ display: 'flex', justifyContent: 'center', marginTop: '0.75rem' }}>
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
    </section>
  );
};

export default BaseSection;
