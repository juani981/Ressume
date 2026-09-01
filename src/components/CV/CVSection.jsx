import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragHandle from '../Editor/DragHandle';
import InlineEdit from '../Editor/InlineEdit';
import { useCV } from '../../context/CVContext';
import CVBlock from './CVBlock';
import SuggestionTooltip from '../Editor/SuggestionTooltip';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

const CVSection = ({ section }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });
  const { cvData, updateSectionTitle, reorderSectionItems } = useCV();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative'
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = section.items.findIndex((i) => i.id === active.id);
      const newIndex = section.items.findIndex((i) => i.id === over.id);
      reorderSectionItems(section.id, arrayMove(section.items, oldIndex, newIndex));
    }
  };

  const sectionClass = section.type === 'skills' ? 'skills' : section.type === 'education' ? 'education' : section.type === 'profile_header' ? 'home' : section.type === 'about' ? 'profile' : 'experience';

  return (
    <section 
      ref={setNodeRef} 
      style={style} 
      className={`${sectionClass} section editable-section-container`} 
      id={section.id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SuggestionTooltip section={section} isHovered={isHovered} layoutType={cvData.layout?.columns || 2} />
      <DragHandle listeners={listeners} attributes={attributes} />
      {section.type !== 'profile_header' && (
        <h2 className="section-title">
          <InlineEdit 
            value={section.title} 
            onSave={(val) => updateSectionTitle(section.id, val)} 
          />
        </h2>
      )}
      
      <div className={section.type === 'profile_header' || section.type === 'about' ? '' : `${sectionClass}__container bd-grid`}>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={section.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {section.type === 'simple_list' ? (
              <ul style={{ color: 'var(--text-color)' }}>
                {section.items.map(item => (
                  <CVBlock key={item.id} item={item} sectionId={section.id} sectionType={section.type} />
                ))}
              </ul>
            ) : section.type === 'skills' ? (
              <ul className="skills__content bd-grid" style={{ gridTemplateColumns: '1fr' }}>
                {section.items.map(item => (
                  <CVBlock key={item.id} item={item} sectionId={section.id} sectionType={section.type} />
                ))}
              </ul>
            ) : (
              section.items.map(item => (
                <CVBlock key={item.id} item={item} sectionId={section.id} sectionType={section.type} />
              ))
            )}
          </SortableContext>
        </DndContext>
      </div>
    </section>
  );
};

export default CVSection;
