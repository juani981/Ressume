# DISPATCH: teamwork_preview_orchestrator_17

## User Request — 2026-09-20T03:28:46Z
Resolver la discrepancia dimensional y de paginación entre el editor en vivo (`#area-cv`) y la salida de impresión PDF en Ressume, garantizando una paridad 1:1 estricta donde absolutamente todos los sliders (escalas tipográficas, line-height, espaciados entre ítems y secciones, padding de página y proporción de columnas) se respeten en la impresión, eliminando desbordes asimétricos (como la partición incorrecta de viñetas entre páginas) y validando todo el comportamiento con Cypress en un navegador real.

Working directory: /home/juani/Documentos/Ressume
Integrity mode: development

## Reference Materials
- `2columnCV_TU NOMBRE Y APELLIDO_Título Profesional _ Especialidad.pdf`: Muestra empírica del desfasaje en 2 columnas.
- `CV_TU NOMBRE Y APELLIDO_Título Profesional _ Especialidad.pdf`: Muestra empírica de partición asimétrica y sangrado de viñetas.
- `AGENTS.md`: Invariantes de arquitectura (prohibición de parches heurísticos basados en coordenadas de pantalla y prohibición de certificar paridad únicamente con JSDOM).

## Requirements Summary
- R1. Paridad Geométrica y Dimensional 1:1 (Editor vs Impresión PDF)
- R2. Sincronización Estricta de Sliders y Variables de Diseño (`cvData.layout`)
- R3. Flujo Orgánico de Viñetas y Márgenes de Página Paginados (`--page-padding`, sin cortes de palabras/líneas a la mitad, márgenes en páginas subsiguientes)
- R4. Verificación End-to-End Exclusiva con Cypress en Navegador Real (`npx cypress run`)

Please consult `.agents/ORIGINAL_REQUEST.md` for verbatim requirements and acceptance criteria.
Execute the full orchestration loop with survey, planning, implementation milestones, adversarial reviews, and Cypress real-browser verification.
Update your `progress.md` and `BRIEFING.md` continuously.
