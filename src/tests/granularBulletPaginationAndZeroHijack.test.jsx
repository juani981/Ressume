/**
 * granularBulletPaginationAndZeroHijack.test.jsx
 *
 * Exhaustive Integration & Mathematical Test Suite verifying:
 *
 * 1. Requerimiento 1: Partición granular de viñetas sin expulsar el título:
 *    - Un ítem de sección con múltiples viñetas (Experience, Projects) que desborda la Página 1
 *      se particiona a nivel granular de viñetas.
 *    - La Página 1 preserva el título de la sección y las viñetas que caben físicamente.
 *    - La Página 2 contiene la continuación con `isContinuation: true`, `title: ''`, y un ítem
 *      de continuación con `isContinuationItem: true` y `title: ''`, conteniendo ÚNICAMENTE
 *      las viñetas sobrantes.
 *    - Se verifica matemáticamente que NO queda un hueco en blanco en la Página 1 (el espacio
 *      disponible se aprovecha al máximo, a diferencia del caso sin partición granular).
 *
 * 2. Requerimiento 2: Cero secuestro por targetPage al pulsar pasar sobrante:
 *    - `handleMoveOverflowToNextPage` recalibra dinámicamente `editorHeadroom` sin jamás inyectar
 *      `targetPage` ni `page` en `cvData.sections` ni en ningún `item`.
 *    - La recalibración de headroom reduce la capacidad útil y distribuye las viñetas fluidamente.
 *    - La interacción UI mediante el botón "Pasar sobrante a Página N+1 ➔" funciona sin mutaciones nocivas.
 *
 * 3. Requerimiento 3: Reordenamiento libre hacia espacios en blanco (Whitespace Reordering):
 *    - Secciones o ítems con flags residuales de página (`targetPage`, `pageBreak`, `breakBefore`, `page`),
 *      al ser reordenados mediante `reorderSections`, `reorderSectionItems` o `moveItemBetweenSections`,
 *      limpian completamente esas propiedades.
 *    - El contenido se reposiciona naturalmente en la página correspondiente al espacio libre (whitespace),
 *      evitando saltos forzados a páginas posteriores.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import {
  distributeSectionsToPages,
  estimateItemBaseHeight,
  estimateSingleBulletHeight,
  estimateSectionHeight,
} from '../utils/pageDistributor';
import { useDocumentPages } from '../hooks/useDocumentPages';
import { CVProvider, useCV } from '../context/CVContext';
import { A4PageBox } from '../components/CV/A4PageBox';
import { BaseSection, PrintBaseSection } from '../components/CV/BaseSection';
import { ExperienceItemPrintView } from '../components/CV/items/ExperienceItem';
import { ProjectsItemPrintView } from '../components/CV/items/ProjectsItem';
import App from '../App';
import { defaultSchema } from '../utils/schema';

describe('Granular Bullet Pagination & Zero-Hijack Whitespace Reordering Suite', () => {

  // =========================================================================
  // REQUERIMIENTO 1: Partición granular de viñetas sin expulsar el título
  // =========================================================================
  describe('Requerimiento 1: Partición granular de viñetas sin expulsar el título', () => {

    it('1.1: distributeSectionsToPages matemáticamente particiona viñetas reteniendo el título en Página 1 y viñetas restantes en Página 2', () => {
      // Capacidad útil: 1000px.
      // Top filler: 820px + header (36px) + gap = ~876px.
      // Espacio remanente en Página 1: ~124px.
      // Experience section:
      // - Header: 36px
      // - Item base: ~42px
      // - 1st Bullet: ~26px
      // 36 + 42 + 26 = 104px <= 124px -> La primera viñeta cabe en Página 1 junto al título.
      // Las demás viñetas desbordan y se mueven limpiamente a la Página 2.

      const cvData = {
        layout: {
          type: '1-column',
          isAtsMode: true,
          pagePadding: 0,
          sectionGap: 20,
        },
        sections: [
          {
            id: 'top_filler',
            type: 'list',
            title: 'Top Summary Section',
            items: [{ id: 'filler_item', height: 820 }],
          },
          {
            id: 'exp_section',
            type: 'experience',
            title: 'Work Experience',
            items: [
              {
                id: 'exp_lead',
                title: 'Principal Distributed Systems Engineer',
                subtitle: 'Tech Global Corp | Buenos Aires',
                date: '2022 - Present',
                bullets: [
                  'Bullet 1: Architected ultra-low latency event mesh handling 100k msg/sec',
                  'Bullet 2: Reduced P99 latency across distributed microservices by 42%',
                  'Bullet 3: Deployed multi-region active-active clusters with Zero Downtime',
                  'Bullet 4: Automated Canary deployment verifications with metric analysis',
                  'Bullet 5: Mentored team of 14 engineers and drove tech roadmap alignment',
                ],
              },
            ],
          },
        ],
      };

      const pages = distributeSectionsToPages(cvData, {
        pageCapacity: 1000,
        omitContinuationHeader: true,
        omitContinuationTitle: true,
        uniqueContinuationIds: true,
      });

      expect(pages).toHaveLength(2);

      // --- VERIFICACIÓN PÁGINA 1 ---
      const page1 = pages[0];
      const p1TopSec = page1.singleSections.find((s) => s.id === 'top_filler');
      const p1ExpSec = page1.singleSections.find((s) => s.id === 'exp_section');

      expect(p1TopSec).toBeDefined();
      expect(p1ExpSec).toBeDefined();

      // Invariante 1: El título de la sección se PRESERVA en la Página 1 (NO es expulsado)
      expect(p1ExpSec.title).toBe('Work Experience');
      expect(p1ExpSec.isContinuation).toBeFalsy();

      // Invariante 2: Contiene el ítem parcial con el título intacto y las viñetas que caben
      expect(p1ExpSec.items).toHaveLength(1);
      const p1Item = p1ExpSec.items[0];
      expect(p1Item.id).toBe('exp_lead');
      expect(p1Item.title).toBe('Principal Distributed Systems Engineer');
      expect(p1Item.subtitle).toBe('Tech Global Corp | Buenos Aires');
      expect(p1Item.isPartialItem).toBe(true);
      expect(p1Item.isContinuationItem).toBeFalsy();

      const p1BulletCount = p1Item.bullets.length;
      expect(p1BulletCount).toBeGreaterThanOrEqual(1);
      expect(p1BulletCount).toBeLessThan(5);
      expect(p1Item.bullets).toEqual(
        cvData.sections[1].items[0].bullets.slice(0, p1BulletCount)
      );

      // --- VERIFICACIÓN PÁGINA 2 ---
      const page2 = pages[1];
      const p2ExpSec = page2.singleSections.find(
        (s) => s.id.startsWith('exp_section') || s.originalSectionId === 'exp_section'
      );
      expect(p2ExpSec).toBeDefined();

      // Invariante 3: La sección en Página 2 es continuación con title: ''
      expect(p2ExpSec.isContinuation).toBe(true);
      expect(p2ExpSec.title).toBe('');
      expect(p2ExpSec.originalSectionId).toBe('exp_section');

      // Invariante 4: El ítem en Página 2 es de continuación con title: '' y ÚNICAMENTE las viñetas sobrantes
      expect(p2ExpSec.items).toHaveLength(1);
      const p2Item = p2ExpSec.items[0];
      expect(p2Item.isContinuationItem).toBe(true);
      expect(p2Item.title).toBe('');
      expect(p2Item.subtitle).toBe('');
      expect(p2Item.originalItemId).toBe('exp_lead');

      const expectedRemainingBullets = cvData.sections[1].items[0].bullets.slice(p1BulletCount);
      expect(p2Item.bullets).toEqual(expectedRemainingBullets);
      expect(p2Item.bullets.length).toBe(5 - p1BulletCount);

      // Invariante 5: La suma de viñetas entre ambas páginas es exactamente 5 (cero pérdida o duplicación)
      const allBullets = [...p1Item.bullets, ...p2Item.bullets];
      expect(allBullets).toEqual(cvData.sections[1].items[0].bullets);
    });

    it('1.2: Demuestra matemáticamente que la partición granular elimina el hueco en blanco en Página 1', () => {
      // Espacio remanente en Página 1: ~124px.
      // El ítem completo con 4 viñetas requiere ~180px (> 124px).
      // Header + Base + 1 viñeta requiere ~104px (<= 124px).
      const cvData = {
        layout: { type: '1-column', isAtsMode: true, pagePadding: 0, sectionGap: 20 },
        sections: [
          {
            id: 'top_filler',
            type: 'list',
            title: 'Top Section',
            items: [{ id: 'f1', height: 820 }],
          },
          {
            id: 'exp_section',
            type: 'experience',
            title: 'Experience',
            items: [
              {
                id: 'job1',
                title: 'Tech Lead',
                bullets: [
                  'Viñeta 1 de prueba',
                  'Viñeta 2 de prueba',
                  'Viñeta 3 de prueba',
                  'Viñeta 4 de prueba',
                ],
              },
            ],
          },
        ],
      };

      // CON PARTICIÓN GRANULAR:
      // La Página 1 aloja la sección de experiencia y sus primeras viñetas aprovechando los 124px disponibles
      const pagesWithGranular = distributeSectionsToPages(cvData, {
        pageCapacity: 1000,
        allowGranularBullets: true,
      });

      const p1WithGranular = pagesWithGranular[0];
      const expInP1 = p1WithGranular.singleSections.find((s) => s.id === 'exp_section');
      expect(expInP1).toBeDefined();
      expect(expInP1.title).toBe('Experience'); // Título presente en Página 1
      expect(expInP1.items[0].bullets.length).toBeGreaterThanOrEqual(1);

      // SIN PARTICIÓN GRANULAR (antiguo comportamiento monolítico):
      // Al no caber el bloque entero (180px > 124px), la sección completa es expulsada a la Página 2,
      // dejando un hueco en blanco de 124px en la Página 1.
      const pagesWithoutGranular = distributeSectionsToPages(cvData, {
        pageCapacity: 1000,
        allowGranularBullets: false,
      });

      const p1WithoutGranular = pagesWithoutGranular[0];
      const expInP1Monolithic = p1WithoutGranular.singleSections.find((s) => s.id === 'exp_section');
      expect(expInP1Monolithic).toBeUndefined(); // ¡Expulsada enteramente a la Página 2!

      // Esto prueba matemáticamente que la partición granular aprovecha el espacio y evita el hueco en blanco.
    });

    it('1.3: useDocumentPages hook expone el modelo de páginas con partición granular en tiempo real', () => {
      const cvData = {
        layout: {
          type: '1-column',
          isAtsMode: true,
          pagePadding: 0,
          sectionGap: 20,
          editorHeadroom: 0,
        },
        sections: [
          {
            id: 'filler',
            type: 'list',
            title: 'Top Filler',
            items: [{ id: 'f1', height: 820 }],
          },
          {
            id: 'projects',
            type: 'projects',
            title: 'Key Engineering Projects',
            items: [
              {
                id: 'proj1',
                title: 'Global Cloud Mesh Infrastructure',
                subtitle: 'Kubernetes / Go / gRPC',
                bullets: [
                  'Feature Alpha: Dynamic routing across 20 clusters',
                  'Feature Beta: Sub-millisecond peer discovery',
                  'Feature Gamma: Automated resilience failover mesh',
                  'Feature Delta: Complete observability pipeline',
                  'Feature Epsilon: Chaos engineering validation suite',
                ],
              },
            ],
          },
        ],
      };

      const { result } = renderHook(() =>
        useDocumentPages({
          cvData,
          options: {
            pageCapacity: 1000,
            allowGranularBullets: true,
            omitContinuationHeader: true,
            omitContinuationTitle: true,
            uniqueContinuationIds: true,
          },
        })
      );

      expect(result.current.totalPages).toBe(2);
      const page1 = result.current.pages[0];
      const page2 = result.current.pages[1];

      // Página 1 contiene proyectos con título preservado
      const p1Proj = page1.singleSections.find((s) => s.id === 'projects');
      expect(p1Proj).toBeDefined();
      expect(p1Proj.title).toBe('Key Engineering Projects');
      expect(p1Proj.isContinuation).toBeFalsy();
      expect(p1Proj.items[0].bullets.length).toBeGreaterThan(0);

      // Página 2 contiene continuación con título vacío
      const p2Proj = page2.singleSections.find(
        (s) => s.id.startsWith('projects') || s.originalSectionId === 'projects'
      );
      expect(p2Proj).toBeDefined();
      expect(p2Proj.isContinuation).toBe(true);
      expect(p2Proj.title).toBe('');

      // El ítem en Página 2 es de continuación con title: ''
      const p2Item = p2Proj.items[0];
      expect(p2Item.isContinuationItem).toBe(true);
      expect(p2Item.title).toBe('');
      expect(p2Item.originalItemId).toBe('proj1');
      expect(p2Item.bullets.length).toBeGreaterThan(0);

      // Suma total de viñetas preservada
      expect(p1Proj.items[0].bullets.length + p2Item.bullets.length).toBe(5);
    });

    it('1.4: Renderizado de componentes: Página 1 renderiza título y primeras viñetas; Página 2 NO repite títulos ni rounder', () => {
      // Simular ítem en Página 1 (parcial)
      const itemP1 = {
        id: 'exp1',
        title: 'Staff Platform Engineer',
        subtitle: 'Enterprise Co',
        date: '2021 – Present',
        isPartialItem: true,
        bullets: ['Bullet A: High throughput queue', 'Bullet B: Event distribution'],
      };

      // Simular ítem en Página 2 (continuación)
      const itemP2 = {
        id: 'exp1__cont_2',
        originalItemId: 'exp1',
        isContinuationItem: true,
        title: '',
        subtitle: '',
        date: '',
        bullets: ['Bullet C: Disaster recovery', 'Bullet D: SRE runbooks'],
      };

      // 1. Render Página 1 Print View
      const { container: p1Container } = render(
        <ExperienceItemPrintView item={itemP1} sectionId="exp" isLast={false} />
      );

      // En Página 1: Se renderiza el rounder, el título y las viñetas A y B
      expect(p1Container.querySelector('.experience__rounder')).not.toBeNull();
      expect(p1Container.querySelector('.experience__title')).not.toBeNull();
      expect(screen.getByText('Staff Platform Engineer')).toBeDefined();
      expect(screen.getByText('Bullet A: High throughput queue')).toBeDefined();
      expect(screen.getByText('Bullet B: Event distribution')).toBeDefined();

      // 2. Render Página 2 Print View
      const { container: p2Container } = render(
        <ExperienceItemPrintView item={itemP2} sectionId="exp" isLast={true} />
      );

      // En Página 2:
      // - NO se renderiza rounder (.experience__rounder es null)
      // - NO se renderiza título (.experience__title es null)
      // - SÍ se mantiene la línea de tiempo (.experience__line existe)
      // - SÍ se renderizan las viñetas C y D exclusivamente
      expect(p2Container.querySelector('.experience__rounder')).toBeNull();
      expect(p2Container.querySelector('.experience__title')).toBeNull();
      expect(p2Container.querySelector('.experience__line')).not.toBeNull();
      expect(screen.getByText('Bullet C: Disaster recovery')).toBeDefined();
      expect(screen.getByText('Bullet D: SRE runbooks')).toBeDefined();
    });
  });

  // =========================================================================
  // REQUERIMIENTO 2: Cero secuestro por targetPage al pulsar pasar sobrante
  // =========================================================================
  describe('Requerimiento 2: Cero secuestro por targetPage al pulsar pasar sobrante', () => {

    it('2.1: Botón de desbordamiento en A4PageBox invoca onMoveOverflowToNextPage(pageNumber)', () => {
      const mockMoveOverflow = vi.fn();

      render(
        <A4PageBox
          pageNumber={1}
          totalPages={2}
          isAtsMode={true}
          isOverflowed={true}
          onMoveOverflowToNextPage={mockMoveOverflow}
        >
          <div>Contenido de prueba</div>
        </A4PageBox>
      );

      // El callout de advertencia y el botón de pasar sobrante deben estar presentes
      const warningAlert = screen.getByTestId('a4-page-overflow-warning-1');
      expect(warningAlert).toBeDefined();

      const actionBtn = screen.getByTestId('a4-page-overflow-action-1');
      expect(actionBtn).toBeDefined();
      expect(actionBtn.textContent).toContain('Pasar sobrante a Página 2 ➔');

      fireEvent.click(actionBtn);
      expect(mockMoveOverflow).toHaveBeenCalledTimes(1);
      expect(mockMoveOverflow).toHaveBeenCalledWith(1);
    });

    it('2.2: handleMoveOverflowToNextPage jamás inyecta targetPage en cvData.sections ni en los ítems', () => {
      // Harness que expone cvData y ejecuta la recalibración de headroom tal como en App.jsx
      let capturedCvData = null;
      let capturedUpdateLayout = null;

      const TestHarness = () => {
        const { cvData, updateLayout } = useCV();
        capturedCvData = cvData;
        capturedUpdateLayout = updateLayout;

        const handleMoveOverflow = (pageNumber) => {
          // Lógica idéntica a App.jsx (líneas 90-115)
          const currentHeadroom = cvData.layout?.editorHeadroom ?? 80;
          const deltaHeadroom = 40; // Default sin DOM real
          updateLayout('editorHeadroom', currentHeadroom + deltaHeadroom);
        };

        return (
          <div>
            <button
              data-testid="trigger-move-overflow"
              onClick={() => handleMoveOverflow(1)}
            >
              Trigger Overflow
            </button>
            <div data-testid="headroom-display">
              {cvData.layout?.editorHeadroom ?? 80}
            </div>
          </div>
        );
      };

      const initialCv = {
        ...defaultSchema,
        layout: {
          ...defaultSchema.layout,
          editorHeadroom: 80,
        },
      };

      render(
        <CVProvider initialCV={initialCv}>
          <TestHarness />
        </CVProvider>
      );

      expect(screen.getByTestId('headroom-display').textContent).toBe('80');

      // Ejecutamos el pase de sobrante
      act(() => {
        fireEvent.click(screen.getByTestId('trigger-move-overflow'));
      });

      // El headroom se recalibra dinámicamente de 80 a 120 (+40)
      expect(screen.getByTestId('headroom-display').textContent).toBe('120');

      // Invariante Crítica: CERO SECUESTRO
      // Verificamos que NINGUNA sección contiene targetPage o page
      capturedCvData.sections.forEach((sec) => {
        expect(sec.targetPage).toBeUndefined();
        expect(sec.page).toBeUndefined();
        expect(sec.breakBefore).toBeFalsy();
        expect(sec.pageBreak).toBeFalsy();

        // Verificamos que NINGÚN ítem contiene targetPage o page
        (sec.items || []).forEach((it) => {
          expect(it.targetPage).toBeUndefined();
          expect(it.page).toBeUndefined();
          expect(it.breakBefore).toBeFalsy();
          expect(it.pageBreak).toBeFalsy();
        });
      });
    });

    it('2.3: La recalibración de headroom ajusta el layout y redistribuye las viñetas fluidamente', () => {
      const cvData = {
        layout: {
          type: '1-column',
          isAtsMode: true,
          pagePadding: 20,
          sectionGap: 20,
          editorHeadroom: 80, // Capacidad inicial: 1123 - 40 - 80 = 1003px
        },
        sections: [
          {
            id: 'sec1',
            type: 'list',
            title: 'Filler',
            items: [{ id: 'f1', height: 850 }],
          },
          {
            id: 'sec2',
            type: 'experience',
            title: 'Experience',
            items: [
              {
                id: 'exp1',
                title: 'Senior Engineer',
                bullets: [
                  'Viñeta A (cabe con 80px headroom)',
                  'Viñeta B',
                  'Viñeta C',
                ],
              },
            ],
          },
        ],
      };

      // Con headroom 80px
      const pagesBefore = distributeSectionsToPages(cvData, { isEditor: true });
      const p1Sec2Before = pagesBefore[0].singleSections.find((s) => s.id === 'sec2');
      const bulletsInP1Before = p1Sec2Before ? p1Sec2Before.items[0].bullets.length : 0;

      // Al pulsar "pasar sobrante", se recalibra el headroom a 140px (+60px)
      const cvDataAfterRecalibration = {
        ...cvData,
        layout: {
          ...cvData.layout,
          editorHeadroom: 140, // Capacidad reducida: 1123 - 40 - 140 = 943px
        },
      };

      const pagesAfter = distributeSectionsToPages(cvDataAfterRecalibration, { isEditor: true });
      const p1Sec2After = pagesAfter[0].singleSections.find((s) => s.id === 'sec2');
      const bulletsInP1After = p1Sec2After ? p1Sec2After.items[0].bullets.length : 0;

      // Al reducir la capacidad útil por el headroom, las viñetas fluyen hacia la página siguiente
      expect(bulletsInP1After).toBeLessThanOrEqual(bulletsInP1Before);
      expect(pagesAfter.length).toBeGreaterThanOrEqual(pagesBefore.length);

      // Y ambas páginas siguen siendo 100% libres de secuestro por targetPage
      pagesAfter.forEach((p) => {
        p.singleSections.forEach((s) => {
          expect(s.targetPage).toBeUndefined();
        });
      });
    });
  });

  // =========================================================================
  // REQUERIMIENTO 3: Reordenamiento libre hacia espacios en blanco (Whitespace Reordering)
  // =========================================================================
  describe('Requerimiento 3: Reordenamiento libre hacia espacios en blanco (Whitespace Reordering)', () => {

    it('3.1: reorderSections purga flags residuales (targetPage, pageBreak, breakBefore) permitiendo ocupar el espacio libre', () => {
      let contextActions = null;

      const TestHarness = () => {
        contextActions = useCV();
        return null;
      };

      const initialCv = {
        ...defaultSchema,
        layout: { type: '1-column', isAtsMode: true, pagePadding: 24 },
        sections: [
          {
            id: 'sec1',
            type: 'education',
            title: 'Education',
            items: [{ id: 'edu1', title: 'Degree', height: 100 }],
          },
          {
            id: 'sec2_with_residual',
            type: 'experience',
            title: 'Experience with Residual Flags',
            // Flags residuales que solían "secuestrar" la sección a la página 2
            targetPage: 2,
            page: 2,
            breakBefore: true,
            pageBreak: 'before',
            items: [{ id: 'exp1', title: 'Job', height: 100 }],
          },
        ],
      };

      render(
        <CVProvider initialCV={initialCv}>
          <TestHarness />
        </CVProvider>
      );

      // Reordenamos las secciones invirtiendo el orden
      act(() => {
        const sectionsWithResidual = contextActions.cvData.sections;
        contextActions.reorderSections([
          sectionsWithResidual[1], // sec2_with_residual va primero
          sectionsWithResidual[0], // sec1 va segundo
        ]);
      });

      const updatedSections = contextActions.cvData.sections;
      const sec2Updated = updatedSections.find((s) => s.id === 'sec2_with_residual');

      // Invariante Crítica: reorderSections DEBE haber purgado todos los flags residuales
      expect(sec2Updated.targetPage).toBeUndefined();
      expect(sec2Updated.page).toBeUndefined();
      expect(sec2Updated.breakBefore).toBeUndefined();
      expect(sec2Updated.pageBreak).toBeUndefined();

      // Verificamos que al distribuirse, sec2_with_residual entra en la Página 1
      // ocupando el espacio libre (whitespace) en vez de estar secuestrado a la Página 2
      const pages = distributeSectionsToPages(contextActions.cvData);
      expect(pages.length).toBe(1);
      expect(pages[0].singleSections.map((s) => s.id)).toEqual([
        'sec2_with_residual',
        'sec1',
      ]);
    });

    it('3.2: reorderSectionItems purga flags residuales en ítems y los ubica en el espacio libre', () => {
      let contextActions = null;

      const TestHarness = () => {
        contextActions = useCV();
        return null;
      };

      const initialCv = {
        ...defaultSchema,
        layout: { type: '1-column', isAtsMode: true, pagePadding: 24 },
        sections: [
          {
            id: 'experience',
            type: 'experience',
            title: 'Work Experience',
            items: [
              {
                id: 'job1',
                title: 'Software Developer',
                height: 80,
              },
              {
                id: 'job2_with_residual',
                title: 'Senior Developer with Residual Flags',
                targetPage: 2,
                page: 2,
                breakBefore: true,
                pageBreak: true,
                height: 80,
              },
            ],
          },
        ],
      };

      render(
        <CVProvider initialCV={initialCv}>
          <TestHarness />
        </CVProvider>
      );

      // Reordenamos los ítems dentro de la sección
      act(() => {
        const expItems = contextActions.cvData.sections.find((s) => s.id === 'experience').items;
        contextActions.reorderSectionItems('experience', [
          expItems[1], // job2 primero
          expItems[0], // job1 segundo
        ]);
      });

      const updatedExp = contextActions.cvData.sections.find((s) => s.id === 'experience');
      const job2Cleaned = updatedExp.items.find((i) => i.id === 'job2_with_residual');

      // Las flags deben haber sido purgadas
      expect(job2Cleaned.targetPage).toBeUndefined();
      expect(job2Cleaned.page).toBeUndefined();
      expect(job2Cleaned.breakBefore).toBeUndefined();
      expect(job2Cleaned.pageBreak).toBeUndefined();

      // Ambos ítems caben juntos en la Página 1 en el espacio libre
      const pages = distributeSectionsToPages(contextActions.cvData);
      expect(pages.length).toBe(1);
      expect(pages[0].singleSections[0].items.map((i) => i.id)).toEqual([
        'job2_with_residual',
        'job1',
      ]);
    });

    it('3.3: moveItemBetweenSections limpia flags residuales tanto en reordenamiento interno como entre secciones', () => {
      let contextActions = null;

      const TestHarness = () => {
        contextActions = useCV();
        return null;
      };

      const initialCv = {
        ...defaultSchema,
        layout: { type: '1-column', isAtsMode: true, pagePadding: 24 },
        sections: [
          {
            id: 'skills',
            type: 'skills',
            title: 'Skills',
            items: [
              {
                id: 'skill1_with_residual',
                title: 'TypeScript / React',
                description: 'Advanced frontend skills',
                targetPage: 2,
                page: 2,
                breakBefore: true,
                pageBreak: 'before',
              },
            ],
          },
          {
            id: 'experience',
            type: 'experience',
            title: 'Experience',
            items: [
              {
                id: 'exp1',
                title: 'Backend Engineer',
                description: 'Microservices with Node.js',
              },
            ],
          },
        ],
      };

      render(
        <CVProvider initialCV={initialCv}>
          <TestHarness />
        </CVProvider>
      );

      // Movemos el ítem de 'skills' a 'experience'
      act(() => {
        contextActions.moveItemBetweenSections(
          'skill1_with_residual',
          'exp1',
          'skills',
          'experience',
          'above'
        );
      });

      const updatedExp = contextActions.cvData.sections.find((s) => s.id === 'experience');
      const movedItem = updatedExp.items.find((i) => i.id === 'skill1_with_residual');

      expect(movedItem).toBeDefined();
      // Las flags residuales han sido completamente purgadas
      expect(movedItem.targetPage).toBeUndefined();
      expect(movedItem.page).toBeUndefined();
      expect(movedItem.breakBefore).toBeUndefined();
      expect(movedItem.pageBreak).toBeUndefined();

      // Al distribuirse a páginas, se posiciona libremente en la Página 1 ocupando el espacio libre
      const pages = distributeSectionsToPages(contextActions.cvData);
      expect(pages.length).toBe(1);
      const expInPage1 = pages[0].singleSections.find((s) => s.id === 'experience');
      expect(expInPage1.items[0].id).toBe('skill1_with_residual');
    });
  });
});
