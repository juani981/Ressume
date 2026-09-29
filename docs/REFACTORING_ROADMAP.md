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

### FASE 1: Retiro de Código Muerto de Paginación Heurística
- **Meta**: Eliminar más de 750 líneas de heurísticas obsoletas de la base de código.
- **Acciones Específicas**:
  1. Identificar que `src/utils/pageDeletionEngine.js` únicamente requiere la función auxiliar de saneamiento DOM `resetForcedPageBreaks`.
  2. Mover la función `resetForcedPageBreaks` directamente a `pageDeletionEngine.js` o a un módulo de saneamiento DOM ligero.
  3. Eliminar `src/utils/paginationEngine.js`.
  4. Retirar `enforceTwoColumnComponentPagination` de `src/services/print/cleanHtmlGenerator.js` y de `src/services/print/index.js`.
  5. Ajustar las aserciones de `src/tests/architecture-solid-invariants.test.jsx` que verificaban la existencia de `enforceTwoColumnComponentPagination`.
- **Garantía Anti-Regresión**: Ejecutar `npm test` para asegurar que los 79 archivos de test sigan pasando al 100%.

---

### FASE 2: Consolidación Directa del SSOT de Constantes
- **Meta**: Unificar todos los puntos de consumo de tokens y dimensiones métricas directamente en `src/constants/`.
- **Acciones Específicas**:
  1. Revisar componentes en `src/components/CV/`, `src/components/Editor/` y servicios en `src/services/print/`.
  2. Sustituir importaciones indirectas desde `src/utils/pageGeometry.js` por importaciones directas desde:
     - `src/constants/geometry.js`
     - `src/constants/spacing.js`
     - `src/constants/typography.js`
     - `src/constants/colors.js`
  3. Dejar en `src/utils/pageGeometry.js` únicamente funciones de medición de DOM en tiempo de ejecución (como `getRulerHeightPx` y `getRelativeBounds`).

---

### FASE 3: Endurecimiento de Contratos de Interfaz entre Módulos
- **Meta**: Establecer interfaces explícitas y tipadas mediante JSDoc `@typedef` para blindar la comunicación entre subsistemas.
- **Acciones Específicas**:
  1. **Contrato de Modelo de Página (`PageModel`)**:
     ```javascript
     /**
      * @typedef {Object} PageModel
      * @property {number} pageNumber - Número 1-indexado de la página A4
      * @property {Array<Section>} leftSections - Secciones asignadas a columna izquierda
      * @property {Array<Section>} rightSections - Secciones asignadas a columna derecha / única
      * @property {number} estimatedHeightLeft - Altura calculada en píxeles para columna izquierda
      * @property {number} estimatedHeightRight - Altura calculada en píxeles para columna derecha
      */
     ```
  2. **Contrato de Servicio de Impresión (`PrintServiceContract`)**:
     - Separar claramente la entrada del clon del DOM (`#area-cv`) y la entrada de configuración de diseño.
     - Garantizar que `printExecutionDriver.js` reciba un objeto inmutable `{ htmlContent, title, lang }` sin dependencias del estado de React.
  3. **Hooks de Selección Granular en `CVContext`**:
     - Ofrecer sub-hooks de conveniencia para componentes que solo leen configuración de diseño (`useCVLayoutSettings()`) o que solo disparan exportación (`useCVExportActions()`), evitando re-renders innecesarios provocados por mutaciones de texto en el documento.

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
