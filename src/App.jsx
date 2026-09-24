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

import { useCVDndCoordinator } from "./hooks/useCVDndCoordinator";
import { useColumnResizer } from "./hooks/useColumnResizer";
import { useDocumentPages } from "./hooks/useDocumentPages";

import { computeTypographyTokens } from "./utils/typographyUtils";
import { getDynamicTextVariables } from "./utils/colorUtils";
import { A4PageBox } from "./components/CV/A4PageBox";
import ColumnResizer from "./components/Editor/ColumnResizer";
import CVDragOverlay from "./components/Editor/CVDragOverlay";
import {
   A4_PAGE_SIZE,
   A4_WIDTH_PX,
   A4_HEIGHT_MM,
   A4_HEIGHT_CSS,
   EDITOR_PAGE_HEIGHT_MM,
   A4_GAP_PX,
} from "./utils/pageGeometry";

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
      deletePage,
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

   // 2. Reactive Discrete A4 Document Pages Hook (Invariants 15 & 16)
   const { pages, totalPages } = useDocumentPages({ cvData });

   // Keep context synchronized with document page count
   useEffect(() => {
      if (typeof setContextTotalPages === "function" && totalPages) {
         setContextTotalPages(totalPages);
      }
   }, [totalPages, setContextTotalPages]);

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
                   className={`resume ${is2Col ? "bd-grid" : "resume__single-column"} ${isAtsMode ? "resume--ats-mode" : ""} has-a4-page-boxes`}
                   id="area-cv"
                   data-total-pages={totalPages}
                   ref={areaCvRef}
                   style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      width: "100%",
                      minWidth: `${A4_WIDTH_PX}px`,
                      maxWidth: `${A4_WIDTH_PX}px`,
                      margin: "0 auto",
                      padding: 0,
                      background: "transparent",
                      boxShadow: "none",
                      borderRadius: 0,
                      border: "none",
                      minHeight: "auto",
                      position: "relative",
                      ...(is2Col
                         ? {
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
                   {pages.map((pageModel) => (
                      <A4PageBox
                         key={`page-${pageModel.pageNumber}`}
                         pageNumber={pageModel.pageNumber}
                         totalPages={pages.length}
                         is2Col={is2Col}
                         isAtsMode={isAtsMode}
                         leftBg={cvData.layout?.leftBg || "#f3f4f6"}
                         rightBg={cvData.layout?.rightBg || "#ffffff"}
                         leftColPercent={leftColPercent}
                         gridTemplateColumns={gridTemplateColumns}
                         pageHeight={A4_HEIGHT_CSS}
                         pagePadding={cvData.layout?.pagePadding != null ? `${cvData.layout.pagePadding}px` : undefined}
                         onDeletePage={deletePage}
                      >
                         {is2Col ? (
                            <>
                               <DroppableColumn
                                  id={pageModel.pageNumber === 1 ? "column-left" : `column-left-page-${pageModel.pageNumber}`}
                                  column="left"
                                  className="resume__left"
                                  style={{
                                     background:
                                        cvData.layout?.leftBg ||
                                        "var(--container-color-alt)",
                                     padding: cvData.layout?.pagePadding != null ? `${cvData.layout.pagePadding}px` : "var(--page-padding, 24px)",
                                     minHeight: "100%",
                                     height: "100%",
                                     alignSelf: "stretch",
                                     display: "flex",
                                     flexDirection: "column",
                                     boxSizing: "border-box",
                                     minWidth: 0,
                                     maxWidth: "100%",
                                     overflowWrap: "break-word",
                                     wordBreak: "break-word",
                                     color: "var(--text-color)",
                                     ...getDynamicTextVariables(cvData.layout?.leftBg),
                                  }}>
                                  <SortableContext
                                     items={pageModel.leftSections.map((s) => s.id)}
                                     strategy={verticalListSortingStrategy}>
                                     {pageModel.leftSections.map((section) => (
                                        <BaseSection
                                           key={section.id}
                                           section={section}
                                        />
                                     ))}
                                  </SortableContext>

                                  {pageModel.pageNumber === pages.length && (
                                     <div
                                        className="column-add-section no-print"
                                        data-editor-ui="true"
                                        data-editor-add="true"
                                        style={{
                                           textAlign: "center",
                                           marginTop: "1.5rem",
                                        }}>
                                        <button
                                           type="button"
                                           className="add-section-btn no-print"
                                           data-editor-add="true"
                                           onClick={() => handleOpenAddSection("left")}
                                           title="Agregar nueva sección a la columna lateral">
                                           <PlusCircle size={16} /> Agregar
                                           Sección Lateral
                                        </button>
                                     </div>
                                  )}
                               </DroppableColumn>

                               {/* Draggable Column Divider / Resizer on Page 1 */}
                               {pageModel.pageNumber === 1 && (
                                  <ColumnResizer
                                     leftColPercent={leftColPercent}
                                     isResizing={isResizing}
                                     onStartResize={handleResizerMouseDown}
                                  />
                               )}

                               <DroppableColumn
                                  id={pageModel.pageNumber === 1 ? "column-right" : `column-right-page-${pageModel.pageNumber}`}
                                  column="right"
                                  className="resume__right"
                                  style={{
                                     background:
                                        cvData.layout?.rightBg ||
                                        "var(--container-color)",
                                     padding: cvData.layout?.pagePadding != null ? `${cvData.layout.pagePadding}px` : "var(--page-padding, 24px)",
                                     minHeight: "100%",
                                     height: "100%",
                                     alignSelf: "stretch",
                                     display: "flex",
                                     flexDirection: "column",
                                     boxSizing: "border-box",
                                     minWidth: 0,
                                     maxWidth: "100%",
                                     overflowWrap: "break-word",
                                     wordBreak: "break-word",
                                     color: "var(--text-color)",
                                     ...getDynamicTextVariables(cvData.layout?.rightBg),
                                  }}>
                                  <SortableContext
                                     items={pageModel.rightSections.map((s) => s.id)}
                                     strategy={verticalListSortingStrategy}>
                                     {pageModel.rightSections.map((section) => (
                                        <BaseSection
                                           key={section.id}
                                           section={section}
                                        />
                                     ))}
                                  </SortableContext>

                                  {pageModel.pageNumber === pages.length && (
                                     <div
                                        className="column-add-section no-print"
                                        data-editor-ui="true"
                                        data-editor-add="true"
                                        style={{
                                           textAlign: "center",
                                           marginTop: "1.5rem",
                                        }}>
                                        <button
                                           type="button"
                                           className="add-section-btn no-print"
                                           data-editor-add="true"
                                           onClick={() => handleOpenAddSection("right")}
                                           title="Agregar nueva sección a la columna principal">
                                           <PlusCircle size={16} /> Agregar
                                           Sección Principal
                                        </button>
                                     </div>
                                  )}
                               </DroppableColumn>
                            </>
                         ) : (
                            <DroppableColumn
                               id={pageModel.pageNumber === 1 ? "column-single" : `column-single-page-${pageModel.pageNumber}`}
                               column="single"
                               className="resume__single-column"
                               style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  width: "100%",
                                  minHeight: "100%",
                                  height: "100%",
                                  padding: 0,
                               }}>
                               <SortableContext
                                  items={pageModel.singleSections.map((s) => s.id)}
                                  strategy={verticalListSortingStrategy}>
                                  {pageModel.singleSections.map((section) => (
                                     <BaseSection key={section.id} section={section} />
                                  ))}
                               </SortableContext>

                               {pageModel.pageNumber === pages.length && (
                                  <div
                                     className="column-add-section no-print"
                                     data-editor-ui="true"
                                     data-editor-add="true"
                                     style={{ textAlign: "center", marginTop: "1.5rem" }}>
                                     <button
                                        type="button"
                                        className="add-section-btn no-print"
                                        data-editor-add="true"
                                        onClick={() => handleOpenAddSection("left")}
                                        title="Agregar nueva sección">
                                        <PlusCircle size={16} /> Agregar
                                        Nueva Sección
                                     </button>
                                  </div>
                               )}
                            </DroppableColumn>
                         )}
                      </A4PageBox>
                   ))}
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
