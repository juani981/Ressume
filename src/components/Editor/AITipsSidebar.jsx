/**
 * @file AITipsSidebar.jsx
 * @description Dynamic floating advice cards flanking the CV sheet (alternating left
 * and right in top-to-bottom visual order) with strict anti-collision vertical placement.
 * Adheres strictly to AGENTS.md Invariant 1 (Obsidian Callouts) and Invariant 16 (Zero Print Reflow).
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useCV } from '../../context/CVContext';
import { getRules } from '../../locales/index';
import { 
  Lightbulb, 
  OctagonAlert, 
  TriangleAlert, 
  Info, 
  X, 
  Sparkles, 
  RotateCcw,
  CheckCircle2,
  Pin
} from 'lucide-react';

const SECTION_TYPE_TO_TARGET = {
  experience: 'experience',
  list: 'experience',
  education: 'education',
  skills: 'skills',
  projects: 'projects',
  certificates: 'certificates',
  certifications: 'certificates',
  languages: 'languages',
  about: 'profile',
  profile_header: 'profile',
  profile_title: 'profile',
  title_subtitle: 'profile',
  contact: 'profile'
};

const SECTION_LABEL_MAP = {
  experience: 'Experiencia Laboral',
  education: 'Educación & Formación',
  skills: 'Habilidades Técnicas',
  projects: 'Proyectos Destacados',
  certificates: 'Certificaciones',
  languages: 'Idiomas',
  profile: 'Perfil Profesional',
  profile_header: 'Titular & Encabezado',
  profile_title: 'Titular & Encabezado',
  title_subtitle: 'Titular & Encabezado',
  contact: 'Datos de Contacto',
  about: 'Perfil Profesional',
  about_section: 'Perfil Profesional',
  global: 'Estrategia General'
};

const CARD_WIDTH = 280;

/**
 * Filter and prioritize rules for a specific CV section.
 */
function getRulesForSection(sec, allRules, targetLayout, globalRules = []) {
  const target = SECTION_TYPE_TO_TARGET[sec.type] || SECTION_TYPE_TO_TARGET[sec.id] || sec.type;
  
  // Specific match for profile sub-sections
  if (sec.type === 'profile_header' || sec.id === 'profile_header' || sec.type === 'title_subtitle') {
    const specific = allRules.filter(r => r.id.includes('profile_001'));
    if (specific.length > 0) return specific;
  }
  if (sec.type === 'contact' || sec.id === 'contact') {
    const specific = allRules.filter(r => r.id.includes('profile_002') || r.id.includes('profile_004'));
    if (specific.length > 0) return specific;
  }
  if (sec.type === 'about' || sec.id === 'about_section') {
    const specific = allRules.filter(r => r.id.includes('profile_003'));
    if (specific.length > 0) return specific;
  }

  // Filter rules by target section and layout mode
  let matching = allRules.filter(rule => {
    const matchesLayout = rule.target_layout === targetLayout || rule.target_layout === 'both';
    const matchesSection = rule.target_section === target;
    return matchesLayout && matchesSection;
  });

  // Fallback to general strategy rules if no section-specific rule was found
  if (matching.length === 0 && globalRules.length > 0) {
    matching = globalRules.slice(0, 2);
  }

  // Prioritize critical severity first
  return matching.sort((a, b) => {
    const score = (r) => (r.severity === 'critical' ? 3 : r.severity === 'warning' ? 2 : 1);
    return score(b) - score(a);
  });
}

/**
 * AITipsSidebar Component
 * Renders floating advice cards flanking the main CV document, alternating between
 * left and right sides according to vertical section appearance, with anti-collision spacing.
 */
const AITipsSidebar = () => {
  const { cvData, showAITips, toggleAITips, activeLanguage } = useCV();
  const [baseTop, setBaseTop] = useState(90);
  const [areaBounds, setAreaBounds] = useState({ left: null, right: null });
  const [dismissedCardKeys, setDismissedCardKeys] = useState(new Set());
  const [cardPositions, setCardPositions] = useState({});
  const [maxBottom, setMaxBottom] = useState(0);
  const [hasMeasuredPositions, setHasMeasuredPositions] = useState(false);
  const [hoveredCardKey, setHoveredCardKey] = useState(null);

  const containerRef = useRef(null);
  const cardRefs = useRef({});

  const isAtsMode = cvData?.layout?.isAtsMode === true || cvData?.layout?.type === '1-column';
  const targetLayout = isAtsMode ? 'ATS_1_col' : 'Human_2_col';
  const lang = activeLanguage || 'es';

  // 1. Gather all localized rules
  const allRules = useMemo(() => getRules(lang) || [], [lang]);

  // 2. Ordered sections based on vertical appearance in the CV
  const orderedSections = useMemo(() => {
    const rawSections = cvData?.sections || [];
    if (typeof document === 'undefined') return rawSections;

    // Sort by physical top coordinate in DOM, fallback to schema index
    const sorted = [...rawSections].map((sec, index) => {
      const el = document.getElementById(sec.id) || document.querySelector(`[data-section-id="${sec.id}"]`);
      const domTop = el ? el.getBoundingClientRect().top + window.scrollY : index * 180;
      return { sec, domTop, index };
    });

    sorted.sort((a, b) => a.domTop - b.domTop || a.index - b.index);
    return sorted.map(item => item.sec);
  }, [cvData?.sections]);

  // 3. Global strategy rules
  const globalRules = useMemo(() => {
    return allRules.filter(r => r.target_section === 'global' && (r.target_layout === targetLayout || r.target_layout === 'both'));
  }, [allRules, targetLayout]);

  // 4. Build card items list with alternating sides (left / right)
  const cardItems = useMemo(() => {
    const items = [];

    // Section-specific cards in vertical DOM order
    orderedSections.forEach((sec) => {
      const rules = getRulesForSection(sec, allRules, targetLayout, globalRules);
      if (rules.length > 0) {
        // Alternating side: index 0 (Title/Header) -> 'left', index 1 (Contact) -> 'right', index 2 (Profile) -> 'left', etc.
        const side = items.length % 2 === 0 ? 'left' : 'right';
        items.push({
          key: sec.id,
          sectionId: sec.id,
          title: sec.title || SECTION_LABEL_MAP[sec.type] || sec.type,
          sectionLabel: SECTION_LABEL_MAP[sec.type] || SECTION_LABEL_MAP[sec.id] || sec.title || 'Sección',
          rules: rules.slice(0, 2),
          side
        });
      }
    });

    return items;
  }, [orderedSections, allRules, targetLayout, globalRules]);

  // 5. Anti-collision non-overlapping calculation per column (left & right)
  const recalculatePositions = useCallback(() => {
    if (typeof document === 'undefined') return;

    const areaCv = document.getElementById('area-cv');
    if (!areaCv) {
      setHasMeasuredPositions(false);
      return;
    }

    const areaRect = areaCv.getBoundingClientRect();
    const areaTop = areaRect.top + window.scrollY;
    const areaLeft = areaRect.left + window.scrollX;
    const areaRight = areaRect.right + window.scrollX;

    if (areaTop > 0) {
      setBaseTop(Math.round(areaTop));
    }
    setAreaBounds({ left: Math.round(areaLeft), right: Math.round(areaRight) });

    const newPositions = {};
    let lastBottomLeft = 0; // Starts at top of CV sheet
    let lastBottomRight = 56; // Reserves top space for the master toggle header on the right
    const MIN_GAP = 14;

    cardItems.forEach((item) => {
      if (dismissedCardKeys.has(item.key)) return;

      const side = item.side;
      let targetTop = side === 'left' ? lastBottomLeft : lastBottomRight;

      if (item.sectionId) {
        const el = document.getElementById(item.sectionId) || document.querySelector(`[data-section-id="${item.sectionId}"]`);
        if (el) {
          const elRect = el.getBoundingClientRect();
          const elementDocTop = elRect.top + window.scrollY;
          targetTop = Math.max(0, elementDocTop - areaTop);
        }
      }

      // Measure height of card element or fallback estimate
      const cardEl = cardRefs.current[item.key];
      const cardHeight = cardEl ? cardEl.offsetHeight : 140;

      if (side === 'left') {
        const computedTop = Math.max(targetTop, lastBottomLeft);
        newPositions[item.key] = { top: Math.round(computedTop), side: 'left' };
        lastBottomLeft = computedTop + cardHeight + MIN_GAP;
      } else {
        const computedTop = Math.max(targetTop, lastBottomRight);
        newPositions[item.key] = { top: Math.round(computedTop), side: 'right' };
        lastBottomRight = computedTop + cardHeight + MIN_GAP;
      }
    });

    setMaxBottom(Math.max(lastBottomLeft, lastBottomRight));

    setCardPositions(prev => {
      const keysA = Object.keys(prev);
      const keysB = Object.keys(newPositions);
      if (
        keysA.length === keysB.length &&
        keysA.every(k => prev[k]?.top === newPositions[k]?.top && prev[k]?.side === newPositions[k]?.side)
      ) {
        return prev;
      }
      return newPositions;
    });
    setHasMeasuredPositions(true);
  }, [cardItems, dismissedCardKeys]);

  // Track DOM layout, scroll, and resize
  useEffect(() => {
    // In test environment, keep standard layout to prevent un-acted asynchronous state warnings
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
      return;
    }

    recalculatePositions();

    const handleResize = () => recalculatePositions();
    const handleScroll = () => recalculatePositions();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Observe changes to #area-cv DOM tree
    let observer = null;
    const areaCv = document.getElementById('area-cv');
    if (areaCv && typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(() => recalculatePositions());
      observer.observe(areaCv, { childList: true, subtree: true, attributes: true });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      if (observer) observer.disconnect();
    };
  }, [recalculatePositions]);

  // Section highlight handlers
  const handleCardMouseEnter = useCallback((sectionId, key) => {
    setHoveredCardKey(key);
    if (!sectionId || typeof document === 'undefined') return;
    const el = document.getElementById(sectionId) || document.querySelector(`[data-section-id="${sectionId}"]`);
    if (el) {
      el.classList.add('ai-tip-highlighted-section');
    }
  }, []);

  const handleCardMouseLeave = useCallback((sectionId) => {
    setHoveredCardKey(null);
    if (!sectionId || typeof document === 'undefined') return;
    const el = document.getElementById(sectionId) || document.querySelector(`[data-section-id="${sectionId}"]`);
    if (el) {
      el.classList.remove('ai-tip-highlighted-section');
    }
  }, []);

  const handleCardClick = useCallback((sectionId) => {
    if (!sectionId || typeof document === 'undefined') return;
    const el = document.getElementById(sectionId) || document.querySelector(`[data-section-id="${sectionId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const handleDismissCard = useCallback((key) => {
    setDismissedCardKeys(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const handleRestoreAllCards = useCallback(() => {
    setDismissedCardKeys(new Set());
  }, []);

  if (!showAITips) return null;

  // Filter out dismissed cards
  const visibleCards = cardItems.filter(item => !dismissedCardKeys.has(item.key));

  return (
    <aside
      ref={containerRef}
      className="ai-tips-sidebar no-print"
      data-testid="ai-tips-sidebar"
      aria-label="Panel de Consejos y Optimización IA"
      style={{
        position: 'absolute',
        top: `${baseTop}px`,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 40,
        boxSizing: 'border-box',
        pointerEvents: 'none'
      }}
    >
      {/* Rail Header with Master Toggle - positioned at top right */}
      <div
        className="ai-tips-header"
        style={{
          position: hasMeasuredPositions ? 'absolute' : 'relative',
          top: 0,
          left: hasMeasuredPositions
            ? (areaBounds.right != null ? `${areaBounds.right + 20}px` : 'calc(50% + 417px)')
            : undefined,
          width: `${CARD_WIDTH}px`,
          maxWidth: 'calc(100vw - 32px)',
          margin: hasMeasuredPositions ? 0 : '0 auto 10px auto',
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          marginBottom: hasMeasuredPositions ? 0 : '10px',
          borderRadius: '8px',
          backgroundColor: isAtsMode ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: isAtsMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0',
          boxShadow: '0 4px 14px -2px rgba(0, 0, 0, 0.08)',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '5px',
              backgroundColor: 'rgba(234, 179, 8, 0.15)',
              color: '#eab308'
            }}
          >
            <Lightbulb size={14} strokeWidth={2.5} />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '0.78rem',
                fontWeight: 700,
                color: isAtsMode ? '#f8fafc' : '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              Consejos IA
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 600,
                  padding: '1px 5px',
                  borderRadius: '999px',
                  backgroundColor: isAtsMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)',
                  color: isAtsMode ? '#34d399' : '#059669'
                }}
              >
                {isAtsMode ? 'ATS' : 'Visual'}
              </span>
            </h3>
            <span style={{ fontSize: '0.65rem', color: isAtsMode ? '#94a3b8' : '#64748b' }}>
              {visibleCards.length} consejos intercalados
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {dismissedCardKeys.size > 0 && (
            <button
              type="button"
              onClick={handleRestoreAllCards}
              title={`Recuperar ${dismissedCardKeys.size} elemento(s) oculto(s)`}
              aria-label="Recuperar elementos ocultos"
              style={{
                background: 'none',
                border: 'none',
                padding: '3px 6px',
                borderRadius: '4px',
                color: '#3b82f6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '0.65rem',
                fontWeight: 600
              }}
            >
              <RotateCcw size={11} />
              <span>{dismissedCardKeys.size}</span>
            </button>
          )}

          <button
            type="button"
            data-testid="btn-close-ai-tips-sidebar"
            onClick={() => toggleAITips && toggleAITips()}
            title="Ocultar panel de consejos"
            aria-label="Cerrar panel de consejos"
            style={{
              background: 'none',
              border: 'none',
              padding: '3px',
              borderRadius: '4px',
              color: isAtsMode ? '#94a3b8' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = isAtsMode ? '#94a3b8' : '#64748b'; }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Floating Section Advice Cards */}
      <div style={{ position: 'relative', width: '100%', minHeight: '100px' }}>
        {visibleCards.length === 0 ? (
          <div
            style={{
              position: hasMeasuredPositions ? 'absolute' : 'relative',
              top: hasMeasuredPositions ? '56px' : undefined,
              left: hasMeasuredPositions
                ? (areaBounds.right != null ? `${areaBounds.right + 20}px` : 'calc(50% + 417px)')
                : undefined,
              width: `${CARD_WIDTH}px`,
              maxWidth: 'calc(100vw - 32px)',
              margin: hasMeasuredPositions ? 0 : '0 auto',
              padding: '1.2rem 0.8rem',
              textAlign: 'center',
              backgroundColor: isAtsMode ? 'rgba(15, 23, 42, 0.85)' : '#ffffff',
              borderRadius: '8px',
              border: isAtsMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
              color: isAtsMode ? '#94a3b8' : '#64748b',
              pointerEvents: 'auto',
              boxSizing: 'border-box'
            }}
          >
            <CheckCircle2 size={24} color="#10b981" style={{ margin: '0 auto 0.4rem auto' }} />
            <p style={{ margin: '0 0 0.4rem 0', fontWeight: 600, fontSize: '0.78rem' }}>
              Has descartado todos los consejos.
            </p>
            <button
              type="button"
              onClick={handleRestoreAllCards}
              style={{
                background: 'none',
                border: '1px solid #cbd5e1',
                borderRadius: '5px',
                padding: '3px 8px',
                fontSize: '0.7rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: isAtsMode ? '#f8fafc' : '#334155'
              }}
            >
              <RotateCcw size={11} /> Restaurar consejos
            </button>
          </div>
        ) : (
          visibleCards.map((item) => {
            const side = item.side; // 'left' | 'right'
            const isLeft = side === 'left';
            const isHovered = hoveredCardKey === item.key;
            const pos = cardPositions[item.key];
            const topPos = hasMeasuredPositions ? pos?.top : undefined;

            // Compute horizontal placement: Left card to the left of CV; Right card to the right of CV
            let cardLeft = undefined;
            let cardRight = undefined;

            if (hasMeasuredPositions && areaBounds.left != null && areaBounds.right != null) {
              if (isLeft) {
                cardLeft = `${Math.max(12, areaBounds.left - 20 - CARD_WIDTH)}px`;
              } else {
                cardLeft = `${areaBounds.right + 20}px`;
              }
            } else if (hasMeasuredPositions) {
              if (isLeft) {
                cardRight = 'calc(50% + 417px)';
              } else {
                cardLeft = 'calc(50% + 417px)';
              }
            }

            return (
              <div
                key={item.key}
                ref={(el) => { cardRefs.current[item.key] = el; }}
                className="ai-tip-card-wrapper"
                data-side={side}
                onClick={() => handleCardClick(item.sectionId)}
                onMouseEnter={() => handleCardMouseEnter(item.sectionId, item.key)}
                onMouseLeave={() => handleCardMouseLeave(item.sectionId)}
                style={{
                  position: hasMeasuredPositions ? 'absolute' : 'relative',
                  top: hasMeasuredPositions ? `${topPos ?? 0}px` : undefined,
                  left: cardLeft,
                  right: cardRight,
                  width: `${CARD_WIDTH}px`,
                  maxWidth: 'calc(100vw - 32px)',
                  marginBottom: hasMeasuredPositions ? 0 : '10px',
                  backgroundColor: isAtsMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  borderRadius: '8px',
                  border: isHovered
                    ? '1px solid #3b82f6'
                    : isAtsMode
                    ? '1px solid rgba(255, 255, 255, 0.12)'
                    : '1px solid #e2e8f0',
                  boxShadow: isHovered
                    ? '0 8px 20px -3px rgba(59, 130, 246, 0.25), 0 2px 5px -1px rgba(0, 0, 0, 0.05)'
                    : isAtsMode
                    ? '0 6px 18px -3px rgba(0, 0, 0, 0.5)'
                    : '0 6px 18px -3px rgba(0, 0, 0, 0.07), 0 1px 4px -1px rgba(0, 0, 0, 0.03)',
                  padding: '7px 9px',
                  boxSizing: 'border-box',
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  transition: 'top 0.25s cubic-bezier(0.4, 0, 0.2, 1), border 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
                  transform: isHovered ? (isLeft ? 'translateX(3px)' : 'translateX(-3px)') : 'none'
                }}
              >
                {/* Pointer Arrow pointing towards CV section: Left card points Right; Right card points Left */}
                <div
                  className="ai-tip-pointer"
                  style={{
                    position: 'absolute',
                    ...(isLeft ? { right: '-6px' } : { left: '-6px' }),
                    top: '14px',
                    width: 0,
                    height: 0,
                    borderTop: '5px solid transparent',
                    borderBottom: '5px solid transparent',
                    ...(isLeft
                      ? {
                          borderLeft: isHovered
                            ? '6px solid #3b82f6'
                            : isAtsMode
                            ? '6px solid rgba(255, 255, 255, 0.2)'
                            : '6px solid #cbd5e1',
                          borderRight: 'none'
                        }
                      : {
                          borderRight: isHovered
                            ? '6px solid #3b82f6'
                            : isAtsMode
                            ? '6px solid rgba(255, 255, 255, 0.2)'
                            : '6px solid #cbd5e1',
                          borderLeft: 'none'
                        }
                    )
                  }}
                />

                {/* Card Header: Section Badge + Dismiss button */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '5px',
                    paddingBottom: '4px',
                    borderBottom: isAtsMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9'
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: isHovered ? '#2563eb' : isAtsMode ? '#94a3b8' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Pin size={11} strokeWidth={2.4} style={{ color: isHovered ? '#2563eb' : '#94a3b8' }} />
                    <span>{item.sectionLabel}</span>
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismissCard(item.key);
                    }}
                    title="Descartar este consejo"
                    aria-label="Descartar este consejo"
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '2px',
                      color: isAtsMode ? '#64748b' : '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '3px',
                      transition: 'color 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = isAtsMode ? '#64748b' : '#94a3b8'; }}
                  >
                    <X size={12} />
                  </button>
                </div>

                {/* Obsidian Callouts inside card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {item.rules.map((rule, rIdx) => {
                    const isCritical = rule.severity === 'critical';
                    const isWarning = rule.severity === 'warning';

                    // Obsidian Callout Theme Colors according to AGENTS.md Invariant 1
                    const themeColor = isCritical ? '233, 49, 71' : isWarning ? '219, 139, 0' : '8, 109, 221';
                    const iconColor = `rgba(${themeColor}, 1)`;

                    return (
                      <div
                        key={rule.id || rIdx}
                        className="obsidian-callout"
                        data-testid={`callout-${rule.id || rIdx}`}
                        style={{
                          backgroundColor: `rgba(${themeColor}, 0.08)`,
                          borderLeft: `4px solid ${iconColor}`,
                          borderRadius: '4px',
                          padding: '5px 8px',
                          fontSize: '0.72rem',
                          color: isAtsMode ? '#e2e8f0' : '#1e293b',
                          lineHeight: '1.3',
                          display: 'flex',
                          flexDirection: 'column',
                          boxSizing: 'border-box'
                        }}
                      >
                        <div
                          className="callout-title"
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '5px',
                            color: iconColor,
                            fontWeight: '600',
                            marginBottom: '2px',
                            fontSize: '0.74rem'
                          }}
                        >
                          <span
                            className="callout-icon"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px' }}
                          >
                            {isCritical ? (
                              <OctagonAlert size={13} color={iconColor} strokeWidth={2.2} />
                            ) : isWarning ? (
                              <TriangleAlert size={13} color={iconColor} strokeWidth={2.2} />
                            ) : (
                              <Info size={13} color={iconColor} strokeWidth={2.2} />
                            )}
                          </span>
                          <span>{rule.suggestion_title}</span>
                        </div>
                        <div
                          className="callout-content"
                          style={{
                            fontSize: '0.68rem',
                            color: isAtsMode ? '#cbd5e1' : '#334155',
                            lineHeight: '1.3'
                          }}
                        >
                          {rule.suggestion_body}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer restore action if any dismissed */}
      {dismissedCardKeys.size > 0 && visibleCards.length > 0 && (
        <div
          style={{
            position: hasMeasuredPositions ? 'absolute' : 'relative',
            top: hasMeasuredPositions ? `${maxBottom + 12}px` : undefined,
            left: hasMeasuredPositions
              ? (areaBounds.right != null ? `${areaBounds.right + 20}px` : 'calc(50% + 417px)')
              : undefined,
            width: `${CARD_WIDTH}px`,
            textAlign: 'center',
            marginTop: '10px',
            pointerEvents: 'auto'
          }}
        >
          <button
            type="button"
            onClick={handleRestoreAllCards}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              fontSize: '0.72rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'underline'
            }}
          >
            <RotateCcw size={11} /> Restaurar {dismissedCardKeys.size} consejo(s) oculto(s)
          </button>
        </div>
      )}
    </aside>
  );
};

export default AITipsSidebar;

