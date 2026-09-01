import React, { useState } from 'react';
import ActionMenu from './components/Editor/ActionMenu';
import { useCV } from './context/CVContext';
import CVSection from './components/CV/CVSection';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

function App() {
  const { cvData, reorderSections, updateSectionColumn } = useCV();

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeSection = cvData.sections.find(s => s.id === active.id);
    const overSection = cvData.sections.find(s => s.id === over.id);
    
    if (activeSection && overSection && activeSection.column !== overSection.column) {
      updateSectionColumn(active.id, overSection.column);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = cvData.sections.findIndex((s) => s.id === active.id);
      const newIndex = cvData.sections.findIndex((s) => s.id === over.id);
      reorderSections(arrayMove(cvData.sections, oldIndex, newIndex));
    }
  };

  const is2Col = cvData.layout?.type === '2-column';
  const leftSections = cvData.sections.filter(s => s.column === 'left');
  const rightSections = cvData.sections.filter(s => s.column === 'right');

  // YIQ Contrast Intelligence
  const getDynamicTextColors = (hexcolor) => {
    let calcHex = hexcolor || '#ffffff';
    let hex = calcHex.replace("#", "");
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    const r = parseInt(hex.substr(0, 2), 16) || 0;
    const g = parseInt(hex.substr(2, 2), 16) || 0;
    const b = parseInt(hex.substr(4, 2), 16) || 0;
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    const adjustColor = (color, amount) => {
        return '#' + color.replace(/^#/, '').replace(/../g, c => ('0'+Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).substr(-2));
    };
    const circleColor = adjustColor(calcHex, yiq >= 128 ? -40 : 40);

    if (yiq < 128) {
      return {
        '--title-color': '#fcfcfc',
        '--text-color': '#f0efef',
        '--text-color-light': '#cccccc',
        '--container-color-alt': 'rgba(255, 255, 255, 0.1)',
        '--circle-color': circleColor
      };
    } else {
      return {
        '--title-color': '#0b0a0a',
        '--text-color': '#403a3a',
        '--text-color-light': '#707070',
        '--container-color-alt': 'rgba(0, 0, 0, 0.05)',
        '--circle-color': circleColor
      };
    }
  };

  return (
    <>
      <ActionMenu />
      
      <DndContext collisionDetection={closestCenter} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div 
          className={`resume ${is2Col ? 'bd-grid' : ''}`} 
          id="area-cv" 
          style={is2Col 
            ? { gridTemplateColumns: '1fr 2fr', padding: '0', maxWidth: '1024px' } 
            : { padding: '2rem 1.5rem', background: 'var(--container-color)' }
          }
        >
          {is2Col ? (
            <>
              <div className="resume__left" style={{ background: cvData.layout.leftBg || 'var(--container-color-alt)', padding: '2rem 1.5rem', ...getDynamicTextColors(cvData.layout.leftBg) }}>
                <SortableContext items={leftSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  {leftSections.map(section => (
                    <CVSection key={section.id} section={section} />
                  ))}
                </SortableContext>
              </div>
              <div className="resume__right" style={{ background: cvData.layout.rightBg || 'var(--container-color)', padding: '2rem 1.5rem', ...getDynamicTextColors(cvData.layout.rightBg) }}>
                <SortableContext items={rightSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  {rightSections.map(section => (
                    <CVSection key={section.id} section={section} />
                  ))}
                </SortableContext>
              </div>
            </>
          ) : (
            <SortableContext items={cvData.sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {cvData.sections.map(section => (
                <CVSection key={section.id} section={section} />
              ))}
            </SortableContext>
          )}
        </div>
      </DndContext>
    </>
  );
}

export default App;

