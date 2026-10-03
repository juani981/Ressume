import React, { useState, useRef, useEffect } from "react";
import ActionMenu from "./components/Editor/ActionMenu";
import LayoutModeToggle from "./components/Editor/LayoutModeToggle";
import AppModals from "./components/Editor/AppModals";
import { useCV } from "./context/CVContext";
import BaseSection from "./components/CV/BaseSection";
import { PlusCircle } from "lucide-react";
import { setupDisableNativeTooltips } from "./utils/disableNativeTooltips";
import { DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { useCVDndCoordinator } from "./hooks/useCVDndCoordinator";
import { useColumnResizer } from "./hooks/useColumnResizer";
import { useDocumentPages } from "./hooks/useDocumentPages";

import { computeTypographyTokens } from "./utils/typographyUtils";
import { getDynamicTextVariables } from "./utils/colorUtils";
import { A4PageBox } from "./components/CV/A4PageBox";
import ColumnResizer from "./components/Editor/ColumnResizer";
import CVDragOverlay from "./components/Editor/CVDragOverlay";
import DroppableColumn from "./components/Editor/DroppableColumn";
import {
   A4_WIDTH_PX,
   A4_HEIGHT_CSS,
} from "./constants";

function App() {
   const {
      cvData,
      moveItemBetweenSections,
      moveSectionToColumnAndIndex,
      updateLayout,
      activeTooltip,
      setTotalPages: setContextTotalPages,
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
      handleDragCancel,
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

   // 3. Column Resizer Hook
   const { isResizing, handleResizerMouseDown } = useColumnResizer({
      areaCvRef,
      onResize: (clamped) => updateLayout("leftColumnWidth", clamped),
      initialLeftWidth: cvData.layout?.leftColumnWidth,
   });

   // 4. Modal State
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

   // Dynamic typography and spacing tokens
   const dynamicSpacing = computeTypographyTokens(cvData.layout);

   const leftColumnWidth = cvData.layout?.leftColumnWidth;
   const leftColPercent = leftColumnWidth || 33.33;
   const gridTemplateColumns = is2Col
      ? leftColumnWidth
         ? `${leftColumnWidth}% ${100 - leftColumnWidth}%`
         : "1fr 2fr"
      : undefined;

   return (
      <>
         <ActionMenu />

         <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}>
            <main
               className="l-main bd-container"
               style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: "100%",
                  margin: "0 auto",
                  padding: "1rem 1rem 3rem 1rem",
                  position: "relative",
                  zIndex: 0,
               }}>
               {/* Top Center Layout Mode Switcher */}
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
                     zIndex: 1,
                     gap: 0,
                     rowGap: 0,
                     columnGap: 0,
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

         {/* Modals, Tour, Tooltip, Sidebar & Toast */}
         <AppModals
            isAddSectionModalOpen={isAddSectionModalOpen}
            onCloseAddSectionModal={() => setIsAddSectionModalOpen(false)}
            addSectionTargetColumn={addSectionTargetColumn}
            activeTooltip={activeTooltip}
            layoutType={cvData.layout?.type === "1-column" ? 1 : 2}
         />
      </>
   );
}

export default App;
