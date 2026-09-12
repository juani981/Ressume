import React, { useState, useRef, useEffect } from "react";
import { Joyride } from "react-joyride";
import { CustomTooltip } from "./components/CustomTooltip";

import ActionMenu from "./components/Editor/ActionMenu";
import LayoutModeToggle from "./components/Editor/LayoutModeToggle";
import AddSectionModal from "./components/Editor/AddSectionModal";
import SuggestionTooltip from "./components/Editor/SuggestionTooltip";
import ToastNotification from "./components/Editor/ToastNotification";
import { useCV } from "./context/CVContext";
import BaseSection from "./components/CV/BaseSection";
import { PlusCircle } from "lucide-react";
import { setupDisableNativeTooltips } from "./utils/disableNativeTooltips";
import { DndContext, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { usePaginationEngine } from "./hooks/usePaginationEngine";
import { useCVDndCoordinator } from "./hooks/useCVDndCoordinator";
import { useColumnResizer } from "./hooks/useColumnResizer";
import { useBlankPageCleaner } from "./hooks/useBlankPageCleaner";

import { computeTypographyTokens } from "./utils/typographyUtils";
import { getDynamicTextVariables } from "./utils/colorUtils";
import A4PageGuides from "./components/Editor/A4PageGuides";
import ColumnResizer from "./components/Editor/ColumnResizer";
import CVDragOverlay from "./components/Editor/CVDragOverlay";

function DroppableColumn({ id, column, className, style, children }) {
   const { setNodeRef } = useDroppable({
      id,
      data: {
         type: "column",
         column,
      },
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
      moveItemBetweenSections,
      moveSectionToColumnAndIndex,
      updateLayout,
      updateSectionProperty,
      activeTooltip,
      setTotalPages: setContextTotalPages,
      paginationTrigger,
   } = useCV();


   useEffect(() => {
      setupDisableNativeTooltips();
   }, []);

   const areaCvRef = useRef(null);

   // 1. DND Coordination Hook
   const {
      sensors,
      collisionDetection,
      handleDragStart,
      handleDragOver,
      handleDragEnd,
      activeDragItem,
      activeDragSection,
   } = useCVDndCoordinator({
      cvData,
      moveItemBetweenSections,
      moveSectionToColumnAndIndex,
   });

   // 2. Pagination Engine Hook
   const { totalPages, pageBreaks } = usePaginationEngine({
      areaCvRef,
      cvData,
      setContextTotalPages,
      activeDragItem,
      activeDragSection,
      paginationTrigger,
   });

   // 3. Blank Page Cleaner — runs after pagination, removes trailing empty pages
   useBlankPageCleaner({
      areaCvRef,
      totalPages,
      pageBreaks,
      cvData,
      updateSectionProperty,
      isPrint: false,
      activeDragItem,
      activeDragSection,
   });

   // 4. Column Resizer Hook
   const { isResizing, handleResizerMouseDown } = useColumnResizer({
      areaCvRef,
      onResize: (clamped) => updateLayout("leftColumnWidth", clamped),
      initialLeftWidth: cvData.layout?.leftColumnWidth,
   });


   // Modal State
   const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
   const [addSectionTargetColumn, setAddSectionTargetColumn] = useState("right");

   const handleOpenAddSection = (column = "right") => {
      setAddSectionTargetColumn(column);
      setIsAddSectionModalOpen(true);
   };

   // Layout Modes & Class Toggles
   const isAtsMode =
      cvData.layout?.isAtsMode === true || cvData.layout?.type === "1-column";
   const is2Col =
      cvData.layout?.type === "2-column" && !cvData.layout?.isAtsMode;

   useEffect(() => {
      if (isAtsMode) {
         document.body.classList.add("ats-mode-active");
      } else {
         document.body.classList.remove("ats-mode-active");
      }
      return () => {
         document.body.classList.remove("ats-mode-active");
      };
   }, [isAtsMode]);

   const leftSections = (cvData.sections || []).filter((s) => s.column === "left");
   const rightSections = (cvData.sections || []).filter((s) => s.column === "right");

   // Dynamic typography and spacing tokens
   const dynamicSpacing = computeTypographyTokens(cvData.layout);

   const leftColumnWidth = cvData.layout?.leftColumnWidth;
   const leftColPercent = leftColumnWidth || 33.33;
   const gridTemplateColumns = is2Col
      ? leftColumnWidth
         ? `${leftColumnWidth}% ${100 - leftColumnWidth}%`
         : "1fr 2fr"
      : undefined;

   // Onboarding Tour Steps & State
   const steps = [
      {
         content: (
            <>
               <p>
                  Editá tu CV una vez, y siempre podés tenerlo en dos formatos.
               </p>
               <p>
                  Para humanos, que pueden entender el diseño y personalidad que
                  intentas demostrar. Y para Sistemas Automáticos que sólo deben
                  leer los datos de manera directa y ordenada
               </p>
            </>
         ),
         blockTargetInteraction: true,
         id: "disabled-interaction",
         placement: "right",
         skipBeacon: true,
         styles: {
            tooltipContent: {
               paddingTop: 0,
            },
         },
         target: ".layout-mode-toggle-pill",
      },
      {
         content:
            "Podés generar prompts para refinar el contenido y orden de tu CV con un sólo click!",
         target: "#ia-prompts-item",
      },
      {
         content:
            "Gestioná tus versiones para tener múltiples idiomas, enfoques, o diseños",
         target: "#versiones-item",
      },
   ];

   const [runTour, setRunTour] = useState(false);
   const [dontShowAgain, setDontShowAgain] = useState(false);

   useEffect(() => {
      if (typeof window === "undefined" || typeof localStorage === "undefined")
         return;
      if (
         typeof process !== "undefined" &&
         (process.env?.NODE_ENV === "test" || process.env?.VITEST)
      )
         return;
      try {
         const hasSeenTour = localStorage.getItem("skip_onboarding_tour");
         if (!hasSeenTour) {
            setRunTour(true);
         }
      } catch (_) {}
   }, []);

   const handleJoyrideCallback = (data) => {
      const { status, type } = data || {};
      if (
         status === "finished" ||
         status === "skipped" ||
         type === "tour:end"
      ) {
         if (
            dontShowAgain ||
            localStorage.getItem("skip_onboarding_tour") === "true"
         ) {
            localStorage.setItem("skip_onboarding_tour", "true");
         }
         setRunTour(false);
      }
   };

   return (
      <>
         <Joyride
            run={runTour}
            steps={steps}
            continuous={true}
            onEvent={handleJoyrideCallback}
            callback={handleJoyrideCallback}
            tooltipComponent={(props) => (
               <CustomTooltip
                  {...props}
                  dontShowAgain={dontShowAgain}
                  setDontShowAgain={setDontShowAgain}
               />
            )}
         />
         <ActionMenu />

         <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}>
            <main
               className="l-main bd-container"
               style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: "100%",
                  margin: "0 auto",
                  padding: "1rem 1rem 3rem 1rem",
               }}>
               {/* Top Center Layout Mode Switcher (Diseño Tradicional vs Optimizado ATS) */}
               <LayoutModeToggle />

               <div
                  className={`resume ${is2Col ? "bd-grid" : "resume__single-column"} ${isAtsMode ? "resume--ats-mode" : ""}`}
                  id="area-cv"
                  data-total-pages={totalPages}
                  ref={areaCvRef}
                  style={{
                     display: is2Col ? "grid" : "block",
                     alignItems: is2Col ? "stretch" : undefined,
                     width: "100%",
                     minWidth: "794px",
                     maxWidth: "794px",
                     margin: "0 auto",
                     padding: is2Col ? 0 : "var(--page-padding, 24px)",
                     background: is2Col
                        ? `linear-gradient(to right, ${cvData.layout?.leftBg || "#f3f4f6"} 0%, ${cvData.layout?.leftBg || "#f3f4f6"} ${leftColPercent}%, ${cvData.layout?.rightBg || "#ffffff"} ${leftColPercent}%, ${cvData.layout?.rightBg || "#ffffff"} 100%)`
                        : "#ffffff",
                     gap: 0,
                     minHeight:
                        totalPages > 1
                           ? `calc(${totalPages * 297}mm + ${(totalPages - 1) * 20}px)`
                           : `${totalPages * 297}mm`,
                     position: "relative",
                     ...(is2Col
                        ? {
                             gridTemplateColumns,
                             "--grid-template-columns": gridTemplateColumns,
                             "--left-col-percent": `${leftColPercent}%`,
                             "--left-bg":
                                cvData.layout?.leftBg ||
                                "var(--container-color-alt)",
                             "--right-bg": cvData.layout?.rightBg || "#ffffff",
                          }
                        : {}),
                     ...dynamicSpacing,
                  }}>
                  {/* Visual A4 Page Fold Guides & Margin Insets */}
                  <A4PageGuides
                     totalPages={totalPages}
                     pagePadding={cvData.layout?.pagePadding}
                  />

                  {is2Col ? (
                     <>
                        <DroppableColumn
                           id="column-left"
                           column="left"
                           className="resume__left"
                           style={{
                              background:
                                 cvData.layout?.leftBg ||
                                 "var(--container-color-alt)",
                              padding: `var(--page-padding, 2rem) var(--page-padding, 1.5rem)`,
                              minHeight: "100%",
                              height: "100%",
                              alignSelf: "stretch",
                              display: "flex",
                              flexDirection: "column",
                              boxSizing: "border-box",
                              minWidth: 0,
                              maxWidth: "100%",
                              color: "var(--text-color)",
                              ...getDynamicTextVariables(cvData.layout?.leftBg),
                           }}>
                           <SortableContext
                              items={leftSections.map((s) => s.id)}
                              strategy={verticalListSortingStrategy}>
                              {leftSections.map((section) => (
                                 <BaseSection
                                    key={section.id}
                                    section={section}
                                 />
                              ))}
                           </SortableContext>

                           <div
                              className="column-add-section no-print"
                              style={{
                                 textAlign: "center",
                                 marginTop: "1.5rem",
                              }}>
                              <button
                                 type="button"
                                 className="add-section-btn no-print"
                                 onClick={() => handleOpenAddSection("left")}
                                 title="Agregar nueva sección a la columna lateral">
                                 <PlusCircle size={16} /> Agregar
                                 Sección Lateral
                              </button>
                           </div>
                        </DroppableColumn>

                        {/* Draggable Column Divider / Resizer */}
                        <ColumnResizer
                           leftColPercent={leftColPercent}
                           isResizing={isResizing}
                           onStartResize={handleResizerMouseDown}
                        />

                        <DroppableColumn
                           id="column-right"
                           column="right"
                           className="resume__right"
                           style={{
                              background:
                                 cvData.layout?.rightBg ||
                                 "var(--container-color)",
                              padding: `var(--page-padding, 2rem) var(--page-padding, 1.5rem)`,
                              minHeight: "100%",
                              height: "100%",
                              alignSelf: "stretch",
                              display: "flex",
                              flexDirection: "column",
                              boxSizing: "border-box",
                              minWidth: 0,
                              maxWidth: "100%",
                              color: "var(--text-color)",
                              ...getDynamicTextVariables(cvData.layout?.rightBg),
                           }}>
                           <SortableContext
                              items={rightSections.map((s) => s.id)}
                              strategy={verticalListSortingStrategy}>
                              {rightSections.map((section) => (
                                 <BaseSection
                                    key={section.id}
                                    section={section}
                                 />
                              ))}
                           </SortableContext>

                           <div
                              className="column-add-section no-print"
                              style={{
                                 textAlign: "center",
                                 marginTop: "1.5rem",
                              }}>
                              <button
                                 type="button"
                                 className="add-section-btn no-print"
                                 onClick={() => handleOpenAddSection("right")}
                                 title="Agregar nueva sección a la columna principal">
                                 <PlusCircle size={16} /> Agregar
                                 Sección Principal
                              </button>
                           </div>
                        </DroppableColumn>
                     </>
                  ) : (
                     <div
                        className="resume__single-column"
                        style={{
                           display: "flex",
                           flexDirection: "column",
                           width: "100%",
                           maxWidth: "794px",
                           margin: "0 auto",
                           padding: 0,
                        }}>
                        <SortableContext
                           items={(cvData.sections || []).map((s) => s.id)}
                           strategy={verticalListSortingStrategy}>
                           {(cvData.sections || []).map((section) => (
                              <BaseSection key={section.id} section={section} />
                           ))}
                        </SortableContext>

                        <div
                           className="column-add-section no-print"
                           style={{ textAlign: "center", marginTop: "1.5rem" }}>
                           <button
                              type="button"
                              className="add-section-btn no-print"
                              onClick={() => handleOpenAddSection("left")}
                              title="Agregar nueva sección">
                              <PlusCircle size={16} /> Agregar
                              Nueva Sección
                           </button>
                        </div>
                     </div>
                  )}
               </div>
            </main>

            {/* Drag Overlay for ghost preview */}
            <CVDragOverlay
               activeDragItem={activeDragItem}
               activeDragSection={activeDragSection}
            />
         </DndContext>

         {/* Add Section Selection Modal */}
         <AddSectionModal
            isOpen={isAddSectionModalOpen}
            onClose={() => setIsAddSectionModalOpen(false)}
            targetColumn={addSectionTargetColumn}
         />

         {/* Global Singleton AI Suggestion Tooltip */}
         {activeTooltip && activeTooltip.section && activeTooltip.rect && (
            <SuggestionTooltip
               section={activeTooltip.section}
               isHovered={true}
               layoutType={cvData.layout?.type === "1-column" ? 1 : 2}
               rect={activeTooltip.rect}
            />
         )}

         {/* Ephemeral Toast Notification */}
         <ToastNotification />
      </>
   );
}

export default App;
