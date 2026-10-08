import React from 'react';
import { useCV } from '../../../context/CVContext';
import ColorPickerSwatch from '../ColorPickerSwatch';
import { SlidersHorizontal, X, RotateCcw, Info } from 'lucide-react';
import ModalHelpButton from '../../common/ModalHelpButton';
import { TOUR_IDS } from '../../../context/TourContext';
import { DEFAULT_LINE_HEIGHT, SPACING_LIMITS } from '../../../constants/spacing';
import { COLUMN_RESIZER_LIMITS, DEFAULT_LEFT_COLUMN_WIDTH_PERCENT } from '../../../constants/geometry';
import {
  TYPOGRAPHY_SCALE_LIMITS,
  BASE_FONT_SIZES_PX,
  DEFAULT_FONT_FAMILY_NAME,
} from '../../../constants/typography';
import { COLOR_TOKENS } from '../../../constants/colors';

const formatPx = (val) => {
  const rounded = Math.round(val * 2) / 2;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} px`;
};

export const DesignPanel = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
}) => {
  const { cvData, updateLayout } = useCV();
  const layout = cvData.layout || {};

  const currentFontFamily = layout.fontFamily || DEFAULT_FONT_FAMILY_NAME;
  const fontScale = layout.fontScale ?? TYPOGRAPHY_SCALE_LIMITS.fontScale.default;
  const titleScale = layout.titleScale ?? TYPOGRAPHY_SCALE_LIMITS.titleScale.default;
  const bodyScale = layout.bodyScale ?? TYPOGRAPHY_SCALE_LIMITS.bodyScale.default;
  const listScale = layout.listScale ?? TYPOGRAPHY_SCALE_LIMITS.listScale.default;
  const lineHeight = layout.lineHeight ?? DEFAULT_LINE_HEIGHT;

  const pagePadding = layout.pagePadding ?? SPACING_LIMITS.pagePadding.default;
  const sectionGap = layout.sectionGap ?? SPACING_LIMITS.sectionGap.default;
  const itemGap = layout.itemGap ?? SPACING_LIMITS.itemGap.default;
  const leftColumnWidth = layout.leftColumnWidth || DEFAULT_LEFT_COLUMN_WIDTH_PERCENT;

  const is2Col = layout.type === '2-column' && !layout.isAtsMode;

  const handleResetTypography = () => {
    updateLayout({
      fontFamily: DEFAULT_FONT_FAMILY_NAME,
      fontScale: TYPOGRAPHY_SCALE_LIMITS.fontScale.default,
      titleScale: TYPOGRAPHY_SCALE_LIMITS.titleScale.default,
      bodyScale: TYPOGRAPHY_SCALE_LIMITS.bodyScale.default,
      listScale: TYPOGRAPHY_SCALE_LIMITS.listScale.default,
      lineHeight: DEFAULT_LINE_HEIGHT,
    });
  };

  return (
    <div
      className="design-popover no-print"
      role="region"
      aria-label="Panel de Ajustes de Diseño"
      aria-hidden={!isOpen}
      style={{
        position: 'fixed',
        left: '4.75rem',
        top: '50%',
        transform: isOpen ? 'translateY(-50%) scale(1)' : 'translateY(-50%) scale(0.96)',
        background: 'var(--container-color, #ffffff)',
        borderRadius: '14px',
        padding: '1.25rem',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        width: '320px',
        maxHeight: '90vh',
        overflowY: 'auto',
        display: isOpen ? 'flex' : 'none',
        flexDirection: 'column',
        gap: '1rem',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        visibility: isOpen ? 'visible' : 'hidden',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
      }}
      data-testid="design-submenu"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          paddingBottom: '0.5rem',
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: '0.95rem',
            color: 'var(--title-color, #111)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <SlidersHorizontal size={18} color="#6366f1" /> Ajustes de Diseño
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* <ModalHelpButton tourId={TOUR_IDS.DESIGN} /> */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel de diseño"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#888',
              padding: '4px',
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Submenu Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          background: 'rgba(0,0,0,0.04)',
          padding: '3px',
          borderRadius: '8px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('typography')}
          style={{
            flex: 1,
            padding: '0.35rem 0.4rem',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'typography' ? '#ffffff' : 'transparent',
            color: activeTab === 'typography' ? '#4f46e5' : '#64748b',
            fontWeight: activeTab === 'typography' ? 600 : 500,
            fontSize: '0.78rem',
            cursor: 'pointer',
            boxShadow: activeTab === 'typography' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s ease',
          }}
          data-testid="tab-typography"
        >
          Tipografía
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('spacing')}
          aria-label="Ajustes de Márgenes y Espaciado"
          style={{
            flex: 1,
            padding: '0.35rem 0.4rem',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'spacing' ? '#ffffff' : 'transparent',
            color: activeTab === 'spacing' ? '#4f46e5' : '#64748b',
            fontWeight: activeTab === 'spacing' ? 600 : 500,
            fontSize: '0.78rem',
            cursor: 'pointer',
            boxShadow: activeTab === 'spacing' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s ease',
          }}
          data-testid="tab-spacing"
        >
          Espaciado
        </button>

        {/* <button
          type="button"
          onClick={() => setActiveTab('colors')}
          style={{
            flex: 1,
            padding: '0.35rem 0.4rem',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'colors' ? '#ffffff' : 'transparent',
            color: activeTab === 'colors' ? '#4f46e5' : '#64748b',
            fontWeight: activeTab === 'colors' ? 600 : 500,
            fontSize: '0.78rem',
            cursor: 'pointer',
            boxShadow: activeTab === 'colors' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s ease',
          }}
          data-testid="tab-colors"
        >
          Colores
        </button> */}
      </div>

      {/* TAB 1: Typography Section */}
      <div
        style={{
          display: activeTab === 'typography' ? 'flex' : 'none',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '0.35rem',
              color: 'var(--text-color)',
            }}
          >
            Tipo de Letra (Fuente Universal)
          </label>
          <select
            value={currentFontFamily}
            onChange={(e) => updateLayout('fontFamily', e.target.value)}
            aria-label="Selector de Tipo de Letra"
            style={{
              width: '100%',
              padding: '0.45rem 0.6rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              background: '#ffffff',
              color: '#1e293b',
              cursor: 'pointer',
            }}
          >
            <option value="Poppins">Poppins (Moderna y Geométrica)</option>
            <option value="Inter">Inter (Estándar ATS y Legibilidad)</option>
            <option value="Roboto">Roboto (Clásica y Equilibrada)</option>
            <option value="Merriweather">Merriweather (Ejecutiva Serif)</option>
            <option value="JetBrains Mono">JetBrains Mono (Técnica y Código)</option>
          </select>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            background: 'rgba(99, 102, 241, 0.04)',
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid rgba(99, 102, 241, 0.12)',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#4f46e5',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Tamaño por Categoría
          </div>

          {/* Titles Scale */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                marginBottom: '0.3rem',
              }}
            >
              <span style={{ fontWeight: 500 }}>Títulos (Encabezados)</span>
              <b style={{ color: '#4f46e5' }}>
                {formatPx(BASE_FONT_SIZES_PX.h2 * fontScale * titleScale)}
              </b>
            </div>
            <input
              type="range"
              min={TYPOGRAPHY_SCALE_LIMITS.titleScale.min}
              max={TYPOGRAPHY_SCALE_LIMITS.titleScale.max}
              step={0.5 / (BASE_FONT_SIZES_PX.h2 * (fontScale || 1.0))}
              value={titleScale}
              onChange={(e) => updateLayout('titleScale', Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
              aria-label="Control de Tamaño de Títulos"
              data-testid="slider-title-scale"
            />
          </div>

          {/* Body Scale */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                marginBottom: '0.3rem',
              }}
            >
              <span style={{ fontWeight: 500 }}>Cuerpo (Descripciones)</span>
              <b style={{ color: '#4f46e5' }}>
                {formatPx(BASE_FONT_SIZES_PX.normal * fontScale * bodyScale)}
              </b>
            </div>
            <input
              type="range"
              min={TYPOGRAPHY_SCALE_LIMITS.bodyScale.min}
              max={TYPOGRAPHY_SCALE_LIMITS.bodyScale.max}
              step={0.5 / (BASE_FONT_SIZES_PX.normal * (fontScale || 1.0))}
              value={bodyScale}
              onChange={(e) => updateLayout('bodyScale', Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
              aria-label="Control de Tamaño de Cuerpo de Texto"
              data-testid="slider-body-scale"
            />
          </div>

          {/* List Scale */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                marginBottom: '0.3rem',
              }}
            >
              <span style={{ fontWeight: 500 }}>Listas (Viñetas / Habilidades)</span>
              <b style={{ color: '#4f46e5' }}>
                {formatPx(BASE_FONT_SIZES_PX.normal * fontScale * listScale)}
              </b>
            </div>
            <input
              type="range"
              min={TYPOGRAPHY_SCALE_LIMITS.listScale.min}
              max={TYPOGRAPHY_SCALE_LIMITS.listScale.max}
              step={0.5 / (BASE_FONT_SIZES_PX.normal * (fontScale || 1.0))}
              value={listScale}
              onChange={(e) => updateLayout('listScale', Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
              aria-label="Control de Tamaño de Listas"
              data-testid="slider-list-scale"
            />
          </div>
        </div>

        {/* Master Font Scale & Line Height */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ajustes Generales
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                marginBottom: '0.3rem',
              }}
            >
              <span>Escala General</span>
              <b>{fontScale.toFixed(2)}x</b>
            </div>
            <input
              type="range"
              min={TYPOGRAPHY_SCALE_LIMITS.fontScale.min}
              max={TYPOGRAPHY_SCALE_LIMITS.fontScale.max}
              step={TYPOGRAPHY_SCALE_LIMITS.fontScale.step}
              value={fontScale}
              onChange={(e) => updateLayout('fontScale', Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
              aria-label="Control de Escala de Fuente"
              data-testid="slider-font-scale"
            />
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                marginBottom: '0.3rem',
              }}
            >
              <span>Altura de Línea</span>
              <b>{lineHeight.toFixed(2)}x</b>
            </div>
            <input
              type="range"
              min={TYPOGRAPHY_SCALE_LIMITS.lineHeight.min}
              max={TYPOGRAPHY_SCALE_LIMITS.lineHeight.max}
              step={TYPOGRAPHY_SCALE_LIMITS.lineHeight.step}
              value={lineHeight}
              onChange={(e) => updateLayout('lineHeight', Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
              aria-label="Control de Altura de Línea"
              data-testid="slider-line-height"
            />
          </div>
        </div>

        <button
          type="button"
          data-testid="btn-reset-typography"
          aria-label="Restaurar Tipografía por Defecto"
          onClick={handleResetTypography}
          style={{
            marginTop: '0.25rem',
            padding: '0.45rem',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            color: '#64748b',
            fontSize: '0.78rem',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#f8fafc')}
        >
          <RotateCcw size={13} /> Reiniciar Tipografía
        </button>
      </div>

      {/* TAB 2: Spacing & Margins Section */}
      <div
        style={{
          display: activeTab === 'spacing' ? 'flex' : 'none',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div
          style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--title-color, #111)',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            paddingBottom: '0.3rem',
          }}
        >
          Espaciado y Márgenes
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              marginBottom: '0.3rem',
            }}
          >
            <span>Margen de Página</span>
            <b>{pagePadding}px</b>
          </div>
          <input
            type="range"
            min={SPACING_LIMITS.pagePadding.min}
            max={SPACING_LIMITS.pagePadding.max}
            step={SPACING_LIMITS.pagePadding.step}
            value={pagePadding}
            onChange={(e) => updateLayout('pagePadding', Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
            aria-label="Control de Margen de Página"
          />
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              marginBottom: '0.3rem',
            }}
          >
            <span>Espacio entre Secciones</span>
            <b>{sectionGap}px</b>
          </div>
          <input
            type="range"
            min={SPACING_LIMITS.sectionGap.min}
            max={SPACING_LIMITS.sectionGap.max}
            step={SPACING_LIMITS.sectionGap.step}
            value={sectionGap}
            onChange={(e) => updateLayout('sectionGap', Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
            aria-label="Control de Espacio entre Secciones"
          />
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              marginBottom: '0.3rem',
            }}
          >
            <span>Espacio entre Elementos</span>
            <b>{itemGap}px</b>
          </div>
          <input
            type="range"
            min={SPACING_LIMITS.itemGap.min}
            max={SPACING_LIMITS.itemGap.max}
            step={SPACING_LIMITS.itemGap.step}
            value={itemGap}
            onChange={(e) => updateLayout('itemGap', Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
            aria-label="Control de Espacio entre Elementos"
          />
        </div>

        {is2Col && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                marginBottom: '0.3rem',
              }}
            >
              <span>Ancho Columna Lateral</span>
              <b style={{ color: COLOR_TOKENS.primaryAccent }}>
                {Math.round(leftColumnWidth)}% / {100 - Math.round(leftColumnWidth)}%
              </b>
            </div>
            <input
              type="range"
              min={COLUMN_RESIZER_LIMITS.minPercent}
              max={COLUMN_RESIZER_LIMITS.maxPercent}
              step={COLUMN_RESIZER_LIMITS.step}
              value={leftColumnWidth}
              onChange={(e) => updateLayout('leftColumnWidth', Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
              aria-label="Control de Ancho de Columna Lateral"
              data-testid="slider-column-width"
            />
          </div>
        )}
      </div>

      {/* TAB 3: Color Picking Section */}
      <div
        style={{
          display: activeTab === 'colors' ? 'flex' : 'none',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div
          style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--title-color, #111)',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            paddingBottom: '0.3rem',
          }}
        >
          Paleta de Colores
        </div>

        {is2Col ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <ColorPickerSwatch
              label="Fondo Columna Lateral"
              ariaLabel="Fondo Columna Lateral"
              value={layout.leftBg || '#fafafa'}
              onChange={(val) => updateLayout('leftBg', val)}
              presets={['#ffffff', '#fafafa', '#f1f5f9', '#e2e8f0', '#1e293b', '#0f172a']}
            />

            <ColorPickerSwatch
              label="Fondo Columna Principal"
              ariaLabel="Fondo Columna Principal"
              value={layout.rightBg || '#ffffff'}
              onChange={(val) => updateLayout('rightBg', val)}
              presets={['#ffffff', '#fcfcfc', '#f8fafc', '#f1f5f9', '#1e293b', '#0f172a']}
            />
          </div>
        ) : (
          <div
            className="obsidian-callout"
            style={{
              background: 'rgba(8, 109, 221, 0.1)',
              borderLeft: '4px solid rgba(8, 109, 221, 1)',
              borderRadius: '6px',
              padding: '0.65rem 0.8rem',
              fontSize: '0.8rem',
            }}
          >
            <div
              className="callout-title"
              style={{
                display: 'flex',
                gap: '8px',
                fontWeight: 600,
                color: 'rgba(8, 109, 221, 1)',
                marginBottom: '4px',
                alignItems: 'center',
              }}
            >
              <Info size={15} /> Modo ATS Activo
            </div>
            <div
              className="callout-content"
              style={{
                color: 'var(--text-color, #334155)',
                fontSize: '0.76rem',
                lineHeight: 1.45,
              }}
            >
              El modo ATS utiliza un fondo blanco puro (#ffffff) y acentos sobrios optimizados para lectores de escaneo automático. Cambia a Modo 2 Columnas para personalizar colores independientes.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignPanel;
