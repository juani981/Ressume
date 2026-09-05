import React, { useState, useRef, useEffect } from 'react';

import { useJoyride } from 'react-joyride';

import ActionMenu from './components/Editor/ActionMenu';
import LayoutModeToggle from './components/Editor/LayoutModeToggle';
import AddSectionModal from './components/Editor/AddSectionModal';
import SuggestionTooltip from './components/Editor/SuggestionTooltip';
import ToastNotification from './components/Editor/ToastNotification';
import { useCV } from './context/CVContext';
import CVSection from './components/CV/CVSection';
import { setupDisableNativeTooltips } from './utils/disableNativeTooltips';
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
    <div ref={setNodeRef} id={id} className={className} style={style}>
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
    addSection,
    updateLayout,
    activeTooltip,
    clearActiveTooltip
  } = useCV();

  useEffect(() => {
    setupDisableNativeTooltips();
  }, []);


  const areaCvRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!areaCvRef.current) return;
    const calculatePages = () => {
      if (!areaCvRef.current) return;
      const scrollH = areaCvRef.current.scrollHeight || 1123;
      const pages = Math.max(1, Math.ceil(scrollH / 1123));
      setTotalPages(pages);
    };

    calculatePages();
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        calculatePages();
      });
      ro.observe(areaCvRef.current);
    }
    return () => {
      if (ro) ro.disconnect();
    };
  }, [cvData]);

  const [activeDragItem, setActiveDragItem] = useState(null);
  const [activeDragSection, setActiveDragSection] = useState(null);

  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [addSectionTargetColumn, setAddSectionTargetColumn] = useState('right');

  const handleOpenAddSection = (column = 'right') => {
    setAddSectionTargetColumn(column);
    setIsAddSectionModalOpen(true);
  };

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

  const isAtsMode = cvData.layout?.isAtsMode === true || cvData.layout?.type === '1-column';
  const is2Col = cvData.layout?.type === '2-column' && !cvData.layout?.isAtsMode;

  useEffect(() => {
    if (isAtsMode) {
      document.body.classList.add('ats-mode-active');
    } else {
      document.body.classList.remove('ats-mode-active');
    }
    return () => {
      document.body.classList.remove('ats-mode-active');
    };
  }, [isAtsMode]);
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
  const titleScale = cvData.layout?.titleScale ?? 1.0;
  const bodyScale = cvData.layout?.bodyScale ?? 1.0;
  const listScale = cvData.layout?.listScale ?? 1.0;
  const lineHeight = cvData.layout?.lineHeight ?? 1.45;
  const pagePadding = cvData.layout?.pagePadding ?? 24;
  const sectionGap = cvData.layout?.sectionGap ?? 20;
  const itemGap = cvData.layout?.itemGap ?? 8;

  const dynamicSpacing = {
    '--body-font': currentFontFamily,
    '--font-scale': `${fontScale}`,
    '--title-scale': `${titleScale}`,
    '--body-scale': `${bodyScale}`,
    '--list-scale': `${listScale}`,
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

  const leftColumnWidth = cvData.layout?.leftColumnWidth;
  const leftColPercent = leftColumnWidth || 33.33;
  const gridTemplateColumns = is2Col 
    ? (leftColumnWidth ? `${leftColumnWidth}% ${100 - leftColumnWidth}%` : '1fr 2fr') 
    : undefined;

  const handleResizerMouseDown = (e) => {
    e.preventDefault();
    if (!areaCvRef.current) return;
    setIsResizing(true);

    const handleMove = (moveEvent) => {
      if (!areaCvRef.current) return;
      const rect = areaCvRef.current.getBoundingClientRect();
      const clientX = moveEvent.clientX ?? (moveEvent.touches && moveEvent.touches[0] ? moveEvent.touches[0].clientX : 0);
      const offsetX = clientX - rect.left;
      const rawPercent = (offsetX / rect.width) * 100;
      const clamped = Math.round(Math.min(55, Math.max(20, rawPercent)));
      updateLayout('leftColumnWidth', clamped);
    };

    const handleUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
  };


const steps = [
  {
    content: (
      <>
              <p>Editá tu CV una vez, y siempre podés tenerlo en dos formatos.</p>
              <p>Para humanos, que pueden entender el diseño y personalidad que intentas demostrar. Y para Sistemas Automáticos que sólo deben leer los datos de manera directa y ordenada</p>
        
      </>
    ),
    blockTargetInteraction: true,
    id: 'disabled-interaction',
    placement: 'right',
    skipBeacon: true,
    styles: {
      tooltipContent: {
        paddingTop: 0,
      },
    },
    target: '.layout-mode-toggle-pill',

  },
  { content: 'Podés generar prompts para refinar el contenido y orden de tu CV con un sólo click!', target: '#ia-prompts-item' },
  { content: 'Gestioná tus versiones para tener múltiples idiomas, enfoques, o diseños', target: '#versiones-item' },
];

  const { controls, on, Tour } = useJoyride({
    continuous: true,
    steps,
  });
  useEffect(() => {
    return on('tour:end', () => {
      console.log('Tour finished!');
    });
  }, [on]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    if (typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || process.env?.VITEST)) return;
    try {
      const navigationEntries = typeof performance !== 'undefined' && typeof performance.getEntriesByType === 'function'
        ? performance.getEntriesByType('navigation') 
        : [];

      if (navigationEntries.length > 0 && navigationEntries[0].type === 'reload') {
        localStorage.removeItem('hasSeenTour');
      }

      const hasSeenTour = localStorage.getItem('hasSeenTour');
      if (!hasSeenTour && controls?.start) {
        controls.start();
        localStorage.setItem('hasSeenTour', 'true');
      }
    } catch (e) {
      // safe fallback for test/SSR environments
    }
  }, [controls]);

  return (
    <>
      <button hidden onClick={() => controls?.start?.()}>Start Tour</button>
      {Tour}
      <ActionMenu />
      
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart}
        onDragOver={handleDragOver} 
        onDragEnd={handleDragEnd}
      >
      <main 
        className="l-main bd-container" 
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', margin: '0 auto', padding: '1rem 1rem 3rem 1rem' }}
      >
        {/* Top Center Layout Mode Switcher (Diseño Tradicional vs Optimizado ATS) */}
        <LayoutModeToggle />

        <div 
          className={`resume ${is2Col ? 'bd-grid' : 'resume__single-column'} ${isAtsMode ? 'resume--ats-mode' : ''}`} 
          id="area-cv" 
          ref={areaCvRef}
          style={is2Col 
            ? { 
                display: 'grid', 
                gridTemplateColumns, 
                position: 'relative', 
                padding: '0', 
                maxWidth: '1024px', 
                width: '100%', 
                minHeight: `${totalPages * 297}mm`,
                alignItems: 'stretch',
                margin: '0 auto', 
                color: 'var(--text-color)',
                background: `linear-gradient(to right, ${cvData.layout?.leftBg || 'var(--container-color-alt)'} 0%, ${cvData.layout?.leftBg || 'var(--container-color-alt)'} ${leftColPercent}%, ${cvData.layout?.rightBg || '#ffffff'} ${leftColPercent}%, ${cvData.layout?.rightBg || '#ffffff'} 100%)`,
                ...dynamicSpacing 
              } 
            : { display: 'block', position: 'relative', padding: `var(--page-padding, 24px)`, background: '#ffffff', color: 'var(--text-color)', maxWidth: '840px', width: '100%', minHeight: '297mm', margin: '0 auto', ...dynamicSpacing }
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
                  minHeight: '100%',
                  height: '100%',
                  alignSelf: 'stretch',
                  display: 'flex',
                  flexDirection: 'column',
                  color: 'var(--text-color)',
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
                    onClick={() => handleOpenAddSection('left')}
                    title="Agregar nueva sección a la columna lateral"
                  >
                    <i className='bx bx-plus-circle'></i> Agregar Sección Lateral
                  </button>
                </div>
              </DroppableColumn>

              {/* Draggable Column Divider / Resizer */}
              <div
                className="column-resizer no-print"
                onMouseDown={handleResizerMouseDown}
                onTouchStart={handleResizerMouseDown}
                title="Arrastra para ajustar el ancho de las columnas"
                aria-label="Divisor de columnas arrastrable"
                data-testid="column-resizer"
                style={{
                  position: 'absolute',
                  left: `calc(${leftColPercent}% - 7px)`,
                  top: 0,
                  bottom: 0,
                  width: '14px',
                  cursor: 'col-resize',
                  zIndex: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  userSelect: 'none',
                  touchAction: 'none'
                }}
              >
                <div 
                  className={`column-resizer-bar ${isResizing ? 'active' : ''}`}
                  style={{
                    width: isResizing ? '3px' : '2px',
                    height: '100%',
                    background: isResizing ? '#3874ff' : 'rgba(56, 116, 255, 0.25)',
                    boxShadow: isResizing ? '0 0 8px rgba(56, 116, 255, 0.6)' : 'none',
                    transition: 'background 0.15s ease, width 0.15s ease',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div 
                    className="column-resizer-handle"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '18px',
                      height: '32px',
                      borderRadius: '6px',
                      background: isResizing ? '#3874ff' : '#ffffff',
                      color: isResizing ? '#ffffff' : '#64748b',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                      border: isResizing ? '1px solid #3874ff' : '1px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      cursor: 'col-resize',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <i className='bx bx-dots-vertical-rounded'></i>
                  </div>
                </div>
              </div>

              <DroppableColumn 
                id="column-right" 
                column="right" 
                className="resume__right" 
                style={{ 
                  background: cvData.layout?.rightBg || 'var(--container-color)', 
                  padding: `var(--page-padding, 2rem) var(--page-padding, 1.5rem)`, 
                  minHeight: '100%',
                  height: '100%',
                  alignSelf: 'stretch',
                  display: 'flex',
                  flexDirection: 'column',
                  color: 'var(--text-color)',
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
                    onClick={() => handleOpenAddSection('right')}
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
                  onClick={() => handleOpenAddSection('left')}
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

      {/* Add Section Selection Modal */}
      <AddSectionModal 
        isOpen={isAddSectionModalOpen} 
        onClose={() => setIsAddSectionModalOpen(false)} 
        targetColumn={addSectionTargetColumn} 
      />

      {/* Global Singleton AI Suggestion Tooltip (Fixed to Container Right, Non-obstructive) */}
      {activeTooltip && activeTooltip.section && activeTooltip.rect && (
        <SuggestionTooltip 
          section={activeTooltip.section} 
          isHovered={true} 
          layoutType={cvData.layout?.type === '1-column' ? 1 : 2} 
          rect={activeTooltip.rect} 
        />
      )}

      {/* Ephemeral Toast Notification */}
      <ToastNotification />
    </>
  );
}

export default App;
