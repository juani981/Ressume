# Hoja de Ruta de Refactorización Arquitectónica y Mejora de Contratos

**Proyecto:** Ressume  
**Fecha de Creación:** 29 de Septiembre, 2026  
**Objetivo:** Incrementar la mantenibilidad, calidad de código, legibilidad y solidez de contratos entre módulos sin introducir regresiones funcionales ni visuales.  
**Estado Base:** 79 archivos de test, 1,171 tests en verde (100% de aprobación). Documentación histórica purgada y alineada con Invariantes 15, 16 y 17 de `AGENTS.md`.

---

## 1. DIAGNÓSTICO DE LA ARQUITECTURA ACTUAL

Tras la auditoría exhaustiva y la purga de documentación obsoleta, el estado del código es altamente sólido pero presenta oportunidades concretas de simplificación y desacoplamiento:

1. **Código Muerto Residual (Legacy Fallbacks)**:
   - `src/utils/paginationEngine.js` (544 líneas) contiene algoritmos heurísticos multi-pase (`executePaginationAlgorithm`, `auditForbiddenBoundaryZones`, `applySplitComponentVisualDecorations`) que ya no son consumidos en ningún flujo de producción.
   - En `src/services/print/cleanHtmlGenerator.js`, la función `enforceTwoColumnComponentPagination` (~220 líneas) está marcada explícitamente como `@deprecated` y se conservó únicamente para tests sintéticos antiguos.
2. **Re-exportación y Dispersión de Constantes (SSOT)**:
   - `src/constants/` implementa el SSOT canónico (`geometry.js`, `spacing.js`, `typography.js`, `colors.js`).
   - Sin embargo, `src/utils/pageGeometry.js` actúa como capa puente re-exportando constantes y mezclando utilidades métricas con constantes directas.
3. **Superficie Extensa en el Facade de Contexto (`CVContext.jsx`)**:
   - El hook `useCV()` expone una superficie de más de 45 miembros (mutaciones, getters, estados de layout, utilidades de exportación). Aunque modularizado internamente con hooks especializados, varios componentes consumen más miembros de los que necesitan.
4. **Bottleneck de Rendimiento en Tests**:
   - La suite de pruebas de Vitest completa toma ~43 segundos, de los cuales más de 25 segundos son consumidos por un único archivo monolítico: `src/tests/empirical-challenger-deep-audit.test.jsx`.

---

## 2. FASES DE LA HOJA DE RUTA

```
┌────────────────────────────────────────────────────────────────────────┐
│ Fase 1: Retiro de Código Muerto de Paginación Heurística               │
│ - Extraer resetForcedPageBreaks a pageDeletionEngine.js                │
│ - Eliminar src/utils/paginationEngine.js                               │
│ - Purgar enforceTwoColumnComponentPagination de cleanHtmlGenerator.js  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Fase 2: Consolidación Directa del SSOT de Constantes                   │
│ - Normalizar importaciones desde @constants / src/constants/           │
│ - Delimitar src/utils/pageGeometry.js exclusivamente a cálculos puros  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Fase 3: Endurecimiento de Contratos de Interfaz entre Módulos          │
│ - Declarar contratos JSDoc @typedef en modelos de datos (cvData, Page) │
│ - Crear selectores granulares (useCVLayoutState, useCVExportActions)   │
│ - Contrato estricto entre Editor y Print Services                      │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Fase 4: Optimización y Particionado de Suites de Prueba Lentas         │
│ - Descomponer empirical-challenger-deep-audit.test.jsx                 │
│ - Reducir el tiempo total de npm test a <15 segundos                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

### FASE 1: Retiro de Código Muerto de Paginación Heurística [COMPLETADA]
- **Estado**: **100% COMPLETADA**.
- **Resultados Alcanzados**:
  1. `resetForcedPageBreaks` extraído y consolidado directamente en `src/utils/pageDeletionEngine.js`.
  2. Eliminado `src/utils/paginationEngine.js` (-544 líneas de heurísticas obsoletas).
  3. Eliminado `enforceTwoColumnComponentPagination` de `src/services/print/cleanHtmlGenerator.js` (-230 líneas).
  4. Purgadas suites de prueba legacy (`m3-parity-and-forbidden-zones.test.jsx`, `m5-pagination-forbidden-zones-adversarial.test.jsx`) y desacoplados los tests de `m2-modularization-utilities.test.jsx`, `architecture-solid-invariants.test.jsx` y `bulletPaginationFlowParity.test.jsx`.
  5. **Verificación Anti-Regresión**: 77 archivos de test, 1,132 tests pasando al 100% en verde, build de producción exitoso en 4.08s.

---

### FASE 2: Consolidación Directa del SSOT de Constantes [COMPLETADA]
- **Estado**: **100% COMPLETADA**.
- **Resultados Alcanzados**:
  1. Incorporados los objetos de especificación canónicos (`PRINT_PAGE_SIZE`, `EDITOR_PAGE_SIZE`, `A4_PAGE_SIZE`, y `A4_GEOMETRY.cssVariables`) directamente en `src/constants/geometry.js` como Single Source of Truth unificado.
  2. Migradas todas las importaciones de componentes y servicios en producción (`src/App.jsx`, `src/components/CV/A4PageBox.jsx`, `src/components/Editor/A4PageGuides.jsx`, `src/hooks/useDocumentPages.js`, `src/services/print/cleanHtmlGenerator.js`, `src/services/print/printExecutionDriver.js`, `src/utils/cvJsonAbstraction.js`, `src/utils/pageDeletionEngine.js`, `src/utils/pageDistributor.js`, `src/utils/typographyUtils.js`) para consumir constantes directamente desde `src/constants/`.
  3. `src/utils/pageGeometry.js` depurado y delimitado a funciones puras de medición de DOM y cálculo en tiempo de ejecución (`getRulerHeightPx`, `getRelativeBounds`, `getForbiddenZone`, `isInForbiddenBoundaryZone`), conservando re-exportaciones de compatibilidad hacia atrás sin duplicidad de datos.
  4. **Verificación Anti-Regresión**: 77 suites de prueba, 1,132 tests pasando al 100% en verde; build de producción exitoso en 3.69s.

---

### FASE 3: Endurecimiento de Contratos de Interfaz entre Módulos [COMPLETADA]
- **Estado**: **100% COMPLETADA**.
- **Resultados Alcanzados**:
  1. **Contratos de Dominio Documentados (`src/utils/pageModelTypes.js`)**:
     - Definidos contratos JSDoc `@typedef` completos y canónicos para `CVItem`, `CVSection`, `CVProfile`, `CVLayout`, `CVSnapshot` y `PageModel`.
     - Validaciones de inmutabilidad estricta (`createPageModel`, `isValidPageModel`, `deepFreeze`) con verificación de claves fijas (`PAGE_MODEL_KEYS`).
  2. **Contrato de Servicio de Impresión (`src/services/print/printExecutionDriver.js`)**:
     - Definidos `@typedef EditorSnapshot` y función `validateSnapshotContract(candidate)` para garantizar que snapshots externos o manuales normalicen `totalPages >= 1` y preserven la integridad de los metadatos sin fallos en tiempo de ejecución.
     - Documentada la firma completa de `executeCleanPrint(cvData, lang, customSnapshot)`.
  3. **Selectores de Contexto Granulares (`src/context/CVContext.jsx` y `src/context/index.js`)**:
     - Implementados selectores desacoplados para modularizar el consumo de estado:
       - `useCVLayoutState()`: acceso a propiedades de grid y actualización de layout.
       - `useCVExportActions()`: funciones de exportación (PDF/JSON) y control de alertas/toasts.
       - `useCVPagesState()`: métricas de paginación A4 discreta y eliminación de páginas.
       - `useCVHistoryState()`: flags y handlers de undo / redo.
       - `useCVDataActions()`: operaciones CRUD sobre secciones e ítems.
     - `useCV()` se mantiene intacto para 100% de compatibilidad hacia atrás.
  4. **Verificación Anti-Regresión**:
     - Creada suite dedicada [`src/tests/interface-contracts-and-selectors.test.jsx`](file:///C:/Users/usuariodgc/Documents/Ressume/src/tests/interface-contracts-and-selectors.test.jsx) (11 tests unitarios específicos).
     - **Vitest**: **78 suites de prueba, 1,143 tests pasando al 100% en verde** (0 fallos).
     - **Vite Build**: Compilación para producción exitosa en **3.87 segundos**.

---

### FASE 4: Optimización de Rendimiento en Tests
- **Meta**: Reducir el tiempo de ejecución de la suite completa de 43s a menos de 15s.
- **Acciones Específicas**:
  1. Analizar `src/tests/empirical-challenger-deep-audit.test.jsx` (25.5s):
     - El archivo monta el árbol completo de `<App />` con múltiples proveedores en 29 tests secuenciales.
     - Dividir en 3 suites especializadas: `layoutModeTransitions.test.jsx`, `dndPolymorphicFlow.test.jsx`, y `stateRehydrationIntegrity.test.jsx`.
     - Utilizar arneses de test ligeros (renderizado de `<A4PageBox>` aislado en lugar del árbol completo de la aplicación cuando no se requiera la barra de navegación o el tour).

---

## 3. MATRIZ DE RIESGO Y CONTROL DE NO-REGRESIÓN

| Fase | Riesgo Potencial | Mecanismo de Mitigación | Validación |
| :--- | :--- | :--- | :--- |
| **Fase 1 (Código Muerto)** | Falsa rotura en tests que importaban funciones legacy | Inlining de funciones mínimas de saneamiento en `pageDeletionEngine.js` | `npm test` 100% verde |
| **Fase 2 (SSOT Constantes)** | Path de importación roto | Verificación estática con linter y ejecución de suite completa | `npm test` + build `npm run build` |
| **Fase 3 (Contratos)** | Incompatibilidad de argumentos en funciones | Validación JSDoc en tiempo de desarrollo y pruebas de integración | Vitest + Cypress E2E |
| **Fase 4 (Optimización Tests)**| Pérdida de cobertura de aserciones al dividir suites | Verificación de que el número total de tests se preserve o incremente | Conteo de tests y tiempos de ejecución |

---

## 4. CRONOGRAMA DE EJECUCIÓN RECOMENDADO

1. **Sprint Actual**: Completadas Fase 0 (Auditoría, purga de documentos obsoletos, eliminación de tests innecesarios/muertos, actualización de `BRAIN.md`, `arquitectura.md` y especificación estricta de requisitos).
2. **Siguiente Iteración**: Ejecutar Fase 1 (Retiro de `paginationEngine.js` y `enforceTwoColumnComponentPagination`).
3. **Iteraciones Posteriores**: Fase 2 (SSOT Constantes), Fase 3 (Contratos y sub-hooks), Fase 4 (Optimización de suite de tests).
