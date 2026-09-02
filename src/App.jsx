import React, { useState } from 'react';
import ActionMenu from './components/Editor/ActionMenu';
import { useCV } from './context/CVContext';
import CVSection from './components/CV/CVSection';
import { 
  DndContext, 
  closestCorners, 
  PointerSensor, 
  KeyboardSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
  useDroppable
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy, 
  arrayMove, 
  sortableKeyboardCoordinates 
} from '@dnd-kit/sortable';

function DroppableColumn({ id, column, className, style, children }) {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: 'column',
      column
    }
  });

  return (
    <div ref={setNodeRef} className={className} style={style}>
      {children}
    </div>
  );
}

function App() {
  const { 
    cvData, 
    reorderSections, 
    updateSectionColumn, 
    moveItemBetweenSections, 
    moveSectionToColumnAndIndex,
    addSection 
  } = useCV();

  const [activeDragItem, setActiveDragItem] = useState(null);
  const [activeDragSection, setActiveDragSection] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5 // Avoids triggering drag on simple clicks or text selection
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const data = active.data.current;

    if (data?.type === 'item') {
      setActiveDragItem(data);
      setActiveDragSection(null);
    } else if (data?.type === 'section') {
      setActiveDragSection(data);
      setActiveDragItem(null);
    }
  };

  const handleDragOver = (event) => {
    // Keep drag over lightweight to avoid re-rendering layout during active drag gesture
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveDragItem(null);
    setActiveDragSection(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // 1. Moving an Item (Within same section, cross-section, or cross-column)
    if (activeData?.type === 'item') {
      const activeItemId = active.id;
      const activeSectionId = activeData.sectionId;

      let targetSectionId = null;
      let overItemId = null;

      if (overData?.type === 'item') {
        targetSectionId = overData.sectionId;
        overItemId = over.id;
      } else if (overData?.type === 'section') {
        targetSectionId = over.id;
        overItemId = null;
      } else if (overData?.type === 'column') {
        const colSections = cvData.sections.filter(s => s.column === overData.column);
        if (colSections.length > 0) {
          targetSectionId = colSections[colSections.length - 1].id;
        }
      } else {
        // Find which section contains over.id
        const foundSec = cvData.sections.find(s => s.id === over.id || (s.items || []).some(i => i.id === over.id));
        if (foundSec) {
          targetSectionId = foundSec.id;
          if (foundSec.id !== over.id) {
            overItemId = over.id;
          }
        }
      }

      if (activeSectionId && targetSectionId) {
        moveItemBetweenSections(activeItemId, overItemId, activeSectionId, targetSectionId);
      }
      return;
    }

    // 2. Moving a Section (Cross-column or intra-column reordering)
    if (activeData?.type === 'section') {
      const activeSectionId = active.id;
      const activeSection = cvData.sections.find(s => s.id === activeSectionId);
      if (!activeSection) return;

      let targetColumn = activeSection.column;
      let overSectionId = null;

      if (overData?.type === 'column') {
        targetColumn = overData.column;
        overSectionId = null;
      } else if (overData?.type === 'section') {
        const overSection = cvData.sections.find(s => s.id === over.id);
        if (overSection) {
          targetColumn = overSection.column;
          overSectionId = overSection.id;
        }
      } else if (overData?.type === 'item') {
        const overSection = cvData.sections.find(s => s.id === overData.sectionId);
        if (overSection) {
          targetColumn = overSection.column;
          overSectionId = overSection.id;
        }
      } else {
        const foundSec = cvData.sections.find(s => s.id === over.id || (s.items || []).some(i => i.id === over.id));
        if (foundSec) {
          targetColumn = foundSec.column;
          overSectionId = foundSec.id;
        }
      }

      moveSectionToColumnAndIndex(activeSectionId, targetColumn, overSectionId);
    }
  };

  const is2Col = cvData.layout?.type === '2-column';
  const leftSections = cvData.sections.filter(s => s.column === 'left');
  const rightSections = cvData.sections.filter(s => s.column === 'right');

  const fontFamilies = {
    'Poppins': "'Poppins', sans-serif",
    'Inter': "'Inter', sans-serif",
    'Roboto': "'Roboto', sans-serif",
    'Merriweather': "'Merriweather', serif",
    'JetBrains Mono': "'JetBrains Mono', monospace"
  };
  const currentFontFamily = fontFamilies[cvData.layout?.fontFamily] || cvData.layout?.fontFamily || "'Poppins', sans-serif";
  const fontScale = cvData.layout?.fontScale ?? 1.0;
  const lineHeight = cvData.layout?.lineHeight ?? 1.45;
  const pagePadding = cvData.layout?.pagePadding ?? 24;
  const sectionGap = cvData.layout?.sectionGap ?? 20;
  const itemGap = cvData.layout?.itemGap ?? 8;

  const dynamicSpacing = {
    '--body-font': currentFontFamily,
    '--font-scale': `${fontScale}`,
    '--line-height': `${lineHeight}`,
    '--page-padding': `${pagePadding}px`,
    '--section-gap': `${sectionGap}px`,
    '--item-gap': `${itemGap}px`
  };

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
      
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart}
        onDragOver={handleDragOver} 
        onDragEnd={handleDragEnd}
      >
      <main className="l-main bd-container" style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '0 auto', padding: '2rem 1rem' }}>
        <div 
          className={`resume ${is2Col ? 'bd-grid' : ''}`} 
          id="area-cv" 
          style={is2Col 
            ? { display: 'grid', gridTemplateColumns: '1fr 2fr', padding: '0', maxWidth: '1024px', width: '100%', margin: '0 auto', ...dynamicSpacing } 
            : { display: 'block', padding: `var(--page-padding, 24px)`, background: 'var(--container-color)', maxWidth: '840px', width: '100%', margin: '0 auto', ...dynamicSpacing }
          }
        >
          {is2Col ? (
            <>
              <DroppableColumn 
                id="column-left" 
                column="left" 
                className="resume__left" 
                style={{ 
                  background: cvData.layout?.leftBg || 'var(--container-color-alt)', 
                  padding: `var(--page-padding, 2rem) var(--page-padding, 1.5rem)`, 
                  minHeight: '200px',
                  ...getDynamicTextColors(cvData.layout?.leftBg) 
                }}
              >
                <SortableContext items={leftSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  {leftSections.map(section => (
                    <CVSection key={section.id} section={section} />
                  ))}
                </SortableContext>
                
                <div className="column-add-section no-print" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <button 
                    type="button" 
                    className="add-section-btn no-print"
                    onClick={() => addSection('left', 'simple_list', 'NUEVA SECCIÓN')}
                    title="Agregar nueva sección a la columna izquierda"
                  >
                    <i className='bx bx-plus-circle'></i> Agregar Sección Lateral
                  </button>
                </div>
              </DroppableColumn>

              <DroppableColumn 
                id="column-right" 
                column="right" 
                className="resume__right" 
                style={{ 
                  background: cvData.layout?.rightBg || 'var(--container-color)', 
                  padding: `var(--page-padding, 2rem) var(--page-padding, 1.5rem)`, 
                  minHeight: '200px',
                  ...getDynamicTextColors(cvData.layout?.rightBg) 
                }}
              >
                <SortableContext items={rightSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  {rightSections.map(section => (
                    <CVSection key={section.id} section={section} />
                  ))}
                </SortableContext>

                <div className="column-add-section no-print" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <button 
                    type="button" 
                    className="add-section-btn no-print"
                    onClick={() => addSection('right', 'list', 'NUEVA SECCIÓN')}
                    title="Agregar nueva sección a la columna principal"
                  >
                    <i className='bx bx-plus-circle'></i> Agregar Sección Principal
                  </button>
                </div>
              </DroppableColumn>
            </>
          ) : (
            <div className="resume__single-column" style={{ width: '100%', maxWidth: '840px', margin: '0 auto' }}>
              <SortableContext items={cvData.sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                {cvData.sections.map(section => (
                  <CVSection key={section.id} section={section} />
                ))}
              </SortableContext>

              <div className="column-add-section no-print" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="add-section-btn no-print"
                  onClick={() => addSection('left', 'list', 'NUEVA SECCIÓN')}
                  title="Agregar nueva sección"
                >
                  <i className='bx bx-plus-circle'></i> Agregar Nueva Sección
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

        {/* Drag Overlay for smooth 60fps ghost preview without DOM clipping */}
        <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeDragItem ? (
            <div style={{ 
              background: 'var(--container-color, #ffffff)', 
              padding: '0.75rem 1rem', 
              borderRadius: '8px', 
              boxShadow: '0 12px 28px rgba(0,0,0,0.22)',
              border: '2px solid var(--first-color, #3874ff)',
              opacity: 0.95,
              maxWidth: '400px'
            }}>
              <div style={{ fontWeight: 600, color: 'var(--title-color, #111)' }}>
                {activeDragItem.item?.title || activeDragItem.item?.text || activeDragItem.item?.name || 'Elemento'}
              </div>
              {activeDragItem.item?.subtitle && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-color-light, #666)' }}>
                  {activeDragItem.item.subtitle}
                </div>
              )}
            </div>
          ) : activeDragSection ? (
            <div style={{ 
              background: 'var(--container-color, #ffffff)', 
              padding: '1rem 1.25rem', 
              borderRadius: '10px', 
              boxShadow: '0 16px 36px rgba(0,0,0,0.25)',
              border: '2px solid var(--first-color, #3874ff)',
              opacity: 0.95,
              minWidth: '280px'
            }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--title-color, #111)' }}>
                {activeDragSection.section?.title || activeDragSection.section?.id}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-color-light, #666)' }}>
                {activeDragSection.section?.items?.length || 0} elementos
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}

export default App;
