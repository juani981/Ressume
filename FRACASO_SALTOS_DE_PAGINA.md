# 🚨 FRACASO CRÓNICO DE SALTOS DE PÁGINA — LECTURA OBLIGATORIA

> **Este archivo existe porque múltiples agentes de IA, en múltiples iteraciones, reprodujeron exactamente el mismo error de paginación. Si estás leyendo esto, eres la siguiente IA en la cadena. Eres responsable de no repetir el patrón.**

---

## El Problema en Una Oración

Cada vez que un agente de IA toca el código de paginación de este proyecto, el PDF resultante tiene **más páginas de las esperadas**, con **saltos de página dentro de secciones** que deberían fluir juntas.

---

## Evidencia del Fracaso

El archivo `muestra_fracaso.pdf` en la raíz del proyecto es evidencia directa. Fue generado después de que agentes anteriores "arreglaron" la paginación, "pasaron todos los tests", y declararon el problema "resuelto". El PDF tiene **3 páginas**. Debería tener **2**. La sección Educación tiene un salto de página después de cada ítem individualmente.

Este es el ciclo que se repite:
1. Agente detecta problema de paginación.
2. Agente agrega `break-before: page` o `break-inside: avoid` en selectores incorrectos.
3. Tests de Vitest y Cypress pasan (miden presencia de atributos CSS, no comportamiento real).
4. Agente declara "paridad 1:1 resuelta". Cierra el ticket.
5. Usuario imprime. El PDF tiene 3 páginas con contenido fracturado.
6. **El ciclo se repite con el siguiente agente.**

---

## Por Qué los Modelos de IA Fallan en Este Problema

### 1. No tienen motor de impresión en su entorno de entrenamiento

Los LLMs aprenden de texto — documentación, StackOverflow, artículos. Nunca ejecutaron un motor de impresión CSS real. Cuando razonan sobre `@media print`, `break-inside: avoid`, o saltos de página A4, están **interpolando**, no sabiendo. La interpolación produce código que parece correcto pero no lo es.

### 2. JSDOM y Vitest son una trampa de falsa seguridad

`JSDOM` no tiene motor de renderizado de fuentes. No calcula `@media print`. No particiona páginas A4. No ejecuta el algoritmo de fragmentación CSS del navegador. Cuando un test de Vitest afirma que `break-inside: avoid` está presente en el HTML generado, está midiendo **sintaxis**, no **comportamiento**. Un PDF roto puede coexistir con 903 tests en verde. Este proyecto lo demuestra empíricamente.

**Prohibición absoluta**: Ningún agente puede declarar "paginación resuelta" o "paridad 1:1 lograda" basándose únicamente en que Vitest o Cypress pasan. La única validación válida es que el usuario imprima el PDF y confirme visualmente que tiene 2 páginas con el contenido correcto.

### 3. `break-before: page` en ítems de lista produce tantas páginas como ítems

Este es el error más frecuente y más dañino. Si agregas `break-before: page` o `break-before: always` a un selector que aplica a **múltiples ítems** (como `.education__content`, `.experience__content`, o cualquier `cv-block` dentro de una sección), el resultado es un salto de página **antes de cada ítem**. Una sección con 3 entradas de educación produce 3 páginas extra. Esto es lo que produjo `muestra_fracaso.pdf`.

**Regla de oro**: `break-before: page` solo puede aplicarse a un selector que represente exactamente UN elemento por documento — nunca a un selector de lista o repetido.

### 4. Los engines de pantalla y de impresión son físicamente distintos

`getBoundingClientRect()` devuelve métricas en píxeles de pantalla a la resolución del monitor. El motor de impresión del navegador (Gecko en Zen Browser, Blink en Chrome) trabaja en puntos tipográficos (pt) a 72dpi equivalentes para A4. Las fuentes web (Poppins, Roboto) tienen métricas de renderizado diferentes en pantalla vs. en el contexto de impresión vectorial. Una viñeta de 87px en pantalla puede ser 91pt en impresión. Estos ~4pt acumulados en múltiples ítems desplazan los saltos de página naturales del navegador, haciendo que el contenido caiga en páginas distintas a las calculadas por el agente.

**Prohibición absoluta**: No calcular posiciones de salto de página con `getBoundingClientRect()` de pantalla y luego inyectar `margin-top`, `padding-top`, `break-before`, o `transform` dinámicos para "compensar". Esta técnica siempre falla porque los números de pantalla nunca coinciden con los números del motor de impresión.

### 5. Cada agente llega sin memoria del parche anterior

El agente nuevo ve código con overrides que no entiende. Los "limpia" porque parecen incorrectos. Restaura el bug original. El patrón reinicia. Esto es regresión de deuda técnica circular.

---

## Las Reglas que DEBES Seguir

### ✅ LO QUE SE PUEDE HACER

- Usar `break-inside: avoid` en contenedores que NO se repiten como lista (OK en `.cv-section`, NO en `.cv-block` dentro de una sección con múltiples ítems).
- Usar `@page { margin: ... }` para definir márgenes de impresión.
- Usar `orphans` y `widows` para controlar líneas sueltas al pie/inicio de página.
- Dejar que el motor de impresión del navegador decida naturalmente dónde cortar — es más inteligente que cualquier heurística JavaScript.
- Validar SIEMPRE imprimiendo realmente y contando páginas manualmente.

### ❌ LO QUE ESTÁ PROHIBIDO

- `break-before: page` / `break-before: always` en cualquier selector que aplique a múltiples ítems de una lista.
- Inyectar `margin-top` o `padding-top` dinámicos calculados con `getBoundingClientRect()` antes de imprimir.
- Agregar `min-height` artificial al contenedor `#area-cv` multiplicando páginas por 297mm.
- Usar factores mágicos de escala (`* 0.84`, `* 0.92`) para "corregir" la diferencia pantalla-impresión.
- Declarar el problema resuelto sin que el usuario haya impreso y validado visualmente el PDF.
- Modificar `print.css`, `paginationEngine.js`, `staticHtmlPdfEngine.js`, o `usePaginationEngine.js` sin haber leído este archivo completo primero.

---

## Archivos de Alto Riesgo

Estos archivos contienen la lógica de paginación. Modificarlos sin entender el contexto completo produce regresiones inmediatas:

| Archivo | Riesgo | Motivo |
|---------|--------|--------|
| `src/styles/print.css` | 🔴 CRÍTICO | Overrides de `@media print`. Un selector mal aplicado rompe todo. |
| `src/utils/paginationEngine.js` | 🔴 CRÍTICO | Calcula dónde insertar saltos. Factores mágicos aquí = PDF roto. |
| `src/utils/staticHtmlPdfEngine.js` | 🔴 CRÍTICO | Genera el HTML que se imprime. Inflación artificial de `min-height` = páginas en blanco. |
| `src/hooks/usePaginationEngine.js` | 🟠 ALTO | Reactivo a cambios de fuente y layout. Tocar el timing rompe el cálculo de folds. |
| `src/index.css` (bloque `@media print`) | 🟠 ALTO | Compite con `print.css`. Reglas duplicadas o contradictorias producen comportamiento impredecible. |

---

## El Estándar de Validación No Negociable

**Un fix de paginación solo está completo cuando el usuario abre el PDF en su navegador (Zen Browser / Gecko / Chromium), cuenta las páginas, y confirma que el contenido está correctamente distribuido.**

Ninguna cantidad de tests verdes, ningún log de consola, ningún `pdfinfo` que diga "2 páginas", equivale a que el usuario haya validado visualmente el documento impreso.

---

## Historial de Fracasos (para que no se repita)

| Iteración | Acción del Agente | Resultado |
|-----------|-------------------|-----------|
| M1 | Purgó heurísticas de pantalla, estableció CSS Paged Media declarativo | Tests: ✅ — PDF real: no validado |
| M2 | Sincronizó sliders en print | Tests: ✅ — PDF real: no validado |
| M3 | Implementó `overflowingBullet` en `paginationEngine.js` | Tests: ✅ — PDF real: no validado |
| M4 | Escribió spec Cypress 09 (4/4 pasando) | Tests: ✅ — PDF real: no validado |
| M5 | Remediación: purgó overrides, factores 0.84, min-height inflado | Tests: ✅ 44/44 Cypress, 903 Vitest — PDF usuario: **3 páginas, sección Educación fracturada** |
| M6 | Desvío con Typst WASM desacoplado | Tests: ✅ — PDF usuario: **Estilo opinionado roto, desalineado del editor** |
| M7 | Particionado post-hoc en iframe sobre editor continuo | Tests: ✅ — PDF usuario: **Mismo fracaso estructural por discrepancia continuo vs paged** |

---

## 6. La Falacia del "Lienzo Continuo": Por Qué Todo Falló
El mayor error conceptual de los agentes fue creer que se podía ofrecer un editor de scroll continuo infinito y luego, en una fracción de segundo al hacer clic en "Imprimir", pedirle a un script o a CSS que dividiera ese árbol continuo en páginas A4 perfectas sin que se desfasara nada.
- La pantalla y el papel no comparten métricas subpíxel.
- Querer corregir en la impresión lo que el editor nunca estructuró como páginas es imposible.
- **La Solución Canónica**: 
  1. El editor debe estar compuesto nativamente por cajas fijas A4 (`.a4-page-box`).
  2. La estructura de páginas queda tallada en piedra en el editor.
  3. El motor de impresión es un renderizador pasivo determinista.

---

**Conclusión**: Las herramientas de testing automatizado disponibles son incapaces de detectar este bug. El único detector confiable es el ojo humano sobre el PDF impreso.

---

*Este archivo fue creado el 2026-09-20 después de múltiples iteraciones fallidas. Es una invariante del proyecto. No lo elimines. No lo "simplifiques". Cada línea existe porque un agente la ignoró y rompió el PDF.*
