/**
 * @file AITipsSidebar.jsx
 * @description Dynamic floating advice cards flanking the CV sheet (alternating left
 * and right in top-to-bottom visual order) with strict anti-collision vertical placement.
 * Adheres strictly to AGENTS.md Invariant 1 (Obsidian Callouts) and Invariant 16 (Zero Print Reflow).
 * All-or-nothing visibility: either all tips are shown or none, without individual dismiss
 * or count indicators.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useCV } from '../../context/CVContext';
import { getRules } from '../../locales/index';
import { 
  OctagonAlert, 
  TriangleAlert, 
  Info, 
  Pin,
  ChevronDown
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
const CARD_MAX_WIDTH = 280;
const MIN_CARD_WIDTH = 120;
const GAP_FROM_CV = 14;
const VIEWPORT_MARGIN = 20;

const SECTION_MAX_RULES = {
  experience: 5,
  skills: 5,
  default: 3
};

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
    const specific = allRules.filter(r => r.id.includes('profile_002') || r.id.includes('profile_004') || r.id.includes('profile_005'));
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
    matching = globalRules.slice(0, SECTION_MAX_RULES.default);
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
  const { cvData, showAITips, activeLanguage } = useCV();
  const [baseTop, setBaseTop] = useState(90);
  const [areaBounds, setAreaBounds] = useState({ left: null, right: null });
  const [columnWidths, setColumnWidths] = useState({ left: CARD_MAX_WIDTH, right: CARD_MAX_WIDTH });
  const [cardPositions, setCardPositions] = useState({});
  const [hasMeasuredPositions, setHasMeasuredPositions] = useState(false);
  const [hoveredCardKey, setHoveredCardKey] = useState(null);
  const [hoveredSectionId, setHoveredSectionId] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  const containerRef = useRef(null);
  const cardRefs = useRef({});

  const toggleSectionExpanded = useCallback((key, e) => {
    if (e) {
      e.stopPropagation();
    }
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

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
        const maxRules = SECTION_MAX_RULES[sec.type] || SECTION_MAX_RULES[sec.id] || SECTION_MAX_RULES.default;
        items.push({
          key: sec.id,
          sectionId: sec.id,
          title: sec.title || SECTION_LABEL_MAP[sec.type] || sec.type,
          sectionLabel: SECTION_LABEL_MAP[sec.type] || SECTION_LABEL_MAP[sec.id] || sec.title || 'Sección',
          rules: rules.slice(0, maxRules),
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

    const vw = typeof window !== 'undefined'
      ? (document.documentElement?.clientWidth || window.innerWidth)
      : 1200;

    // Available horizontal space strictly restricted to prevent horizontal viewport overflow
    const availLeft = Math.max(MIN_CARD_WIDTH, Math.floor(areaLeft - GAP_FROM_CV - VIEWPORT_MARGIN));
    const availRight = Math.max(MIN_CARD_WIDTH, Math.floor(vw - areaRight - GAP_FROM_CV - VIEWPORT_MARGIN));

    const leftWidth = Math.min(CARD_MAX_WIDTH, availLeft);
    const rightWidth = Math.min(CARD_MAX_WIDTH, availRight);

    setColumnWidths(prev => {
      if (prev.left === leftWidth && prev.right === rightWidth) return prev;
      return { left: leftWidth, right: rightWidth };
    });

    const newPositions = {};
    let lastBottomLeft = 0; // Starts at top of CV sheet
    let lastBottomRight = 0; // Starts at top of CV sheet
    const MIN_GAP = 14;

    cardItems.forEach((item) => {
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

      // Measure height of card element or fallback estimate (adjusted for narrow column vertical growth)
      const cardEl = cardRefs.current[item.key];
      const cardHeight = cardEl ? cardEl.offsetHeight : (leftWidth < 220 ? 170 : 140);

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
  }, [cardItems]);

  // When column widths adjust due to viewport constraints or cards expand/collapse, measure updated card heights for vertical flow
  useEffect(() => {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
      return;
    }
    if (hasMeasuredPositions) {
      const timer = setTimeout(() => {
        recalculatePositions();
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [columnWidths.left, columnWidths.right, recalculatePositions, hasMeasuredPositions, expandedSections]);

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

  // Bidirectional Section ↔ Callout Interaction:
  // When hovering or focusing inside a section in the CV document, highlight its corresponding tip card immediately
  useEffect(() => {
    if (!showAITips || typeof document === 'undefined') return;

    let currentSectionEl = null;

    const handlePointerOver = (e) => {
      const sectionEl = e.target.closest?.('[data-section-id], .cv-section');
      if (sectionEl === currentSectionEl) return;

      if (currentSectionEl) {
        currentSectionEl.classList.remove('ai-tip-highlighted-section');
      }

      currentSectionEl = sectionEl;

      if (!sectionEl) {
        setHoveredSectionId(null);
        return;
      }

      const secId = sectionEl.getAttribute('data-section-id') || sectionEl.id;
      const canonicalId = secId ? secId.split('__cont_')[0] : null;
      setHoveredSectionId(canonicalId);
      sectionEl.classList.add('ai-tip-highlighted-section');
    };

    const handlePointerLeave = () => {
      if (currentSectionEl) {
        currentSectionEl.classList.remove('ai-tip-highlighted-section');
        currentSectionEl = null;
      }
      setHoveredSectionId(null);
    };

    const handleFocusIn = (e) => {
      const sectionEl = e.target.closest?.('[data-section-id], .cv-section');
      if (sectionEl && sectionEl !== currentSectionEl) {
        if (currentSectionEl) {
          currentSectionEl.classList.remove('ai-tip-highlighted-section');
        }
        currentSectionEl = sectionEl;
        const secId = sectionEl.getAttribute('data-section-id') || sectionEl.id;
        const canonicalId = secId ? secId.split('__cont_')[0] : null;
        setHoveredSectionId(canonicalId);
        sectionEl.classList.add('ai-tip-highlighted-section');
      }
    };

    const handleFocusOut = (e) => {
      const nextEl = e.relatedTarget?.closest?.('[data-section-id], .cv-section');
      if (!nextEl && currentSectionEl) {
        currentSectionEl.classList.remove('ai-tip-highlighted-section');
        currentSectionEl = null;
        setHoveredSectionId(null);
      }
    };

    const areaCv = document.getElementById('area-cv');
    if (areaCv) {
      areaCv.addEventListener('pointerover', handlePointerOver, { passive: true });
      areaCv.addEventListener('pointerleave', handlePointerLeave, { passive: true });
      areaCv.addEventListener('focusin', handleFocusIn, { passive: true });
      areaCv.addEventListener('focusout', handleFocusOut, { passive: true });
    }

    return () => {
      if (currentSectionEl) {
        currentSectionEl.classList.remove('ai-tip-highlighted-section');
      }
      if (areaCv) {
        areaCv.removeEventListener('pointerover', handlePointerOver);
        areaCv.removeEventListener('pointerleave', handlePointerLeave);
        areaCv.removeEventListener('focusin', handleFocusIn);
        areaCv.removeEventListener('focusout', handleFocusOut);
      }
    };
  }, [showAITips]);

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

  if (!showAITips || cardItems.length === 0) return null;

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
        maxWidth: '100vw',
        overflowX: 'clip',
        zIndex: 40,
        boxSizing: 'border-box',
        pointerEvents: 'none'
      }}
    >
      {/* Floating Section Advice Cards */}
      <div style={{ position: 'relative', width: '100%', minHeight: '100px' }}>
        {cardItems.map((item) => {
          const side = item.side; // 'left' | 'right'
          const isLeft = side === 'left';
          const isHovered = (hoveredCardKey === item.key) ||
            Boolean(hoveredSectionId && (
              hoveredSectionId === item.sectionId ||
              item.sectionId.startsWith(hoveredSectionId) ||
              hoveredSectionId.startsWith(item.sectionId)
            ));
          const pos = cardPositions[item.key];
          const topPos = hasMeasuredPositions ? pos?.top : undefined;
          const currentCardWidth = isLeft ? columnWidths.left : columnWidths.right;

          // Compute horizontal placement: Left card to the left of CV; Right card to the right of CV
          let cardLeft = undefined;
          let cardRight = undefined;

          if (hasMeasuredPositions && areaBounds.left != null && areaBounds.right != null) {
            if (isLeft) {
              cardLeft = `${Math.max(VIEWPORT_MARGIN, areaBounds.left - GAP_FROM_CV - currentCardWidth)}px`;
            } else {
              cardLeft = `${areaBounds.right + GAP_FROM_CV}px`;
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
              data-section-id={item.sectionId}
              onClick={() => handleCardClick(item.sectionId)}
              onMouseEnter={() => handleCardMouseEnter(item.sectionId, item.key)}
              onMouseLeave={() => handleCardMouseLeave(item.sectionId)}
              style={{
                position: hasMeasuredPositions ? 'absolute' : 'relative',
                top: hasMeasuredPositions ? `${topPos ?? 0}px` : undefined,
                left: cardLeft,
                right: cardRight,
                width: `${currentCardWidth}px`,
                maxWidth: isLeft
                  ? `${Math.max(60, (areaBounds.left != null ? areaBounds.left - GAP_FROM_CV : 300) - VIEWPORT_MARGIN)}px`
                  : `calc(100vw - ${(areaBounds.right != null ? areaBounds.right + GAP_FROM_CV : 1000)}px - ${VIEWPORT_MARGIN}px)`,
                height: 'auto',
                minHeight: 'fit-content',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                marginBottom: hasMeasuredPositions ? 0 : '10px',
                backgroundColor: isAtsMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '8px',
                border: isHovered
                  ? '1.5px solid #3b82f6'
                  : isAtsMode
                  ? '1px solid rgba(255, 255, 255, 0.12)'
                  : '1px solid #e2e8f0',
                boxShadow: isHovered
                  ? (isAtsMode
                      ? '0 0 16px rgba(59, 130, 246, 0.45), 0 8px 24px -4px rgba(0, 0, 0, 0.6)'
                      : '0 0 14px rgba(59, 130, 246, 0.35), 0 8px 20px -3px rgba(59, 130, 246, 0.25)')
                  : isAtsMode
                  ? '0 6px 18px -3px rgba(0, 0, 0, 0.5)'
                  : '0 6px 18px -3px rgba(0, 0, 0, 0.07), 0 1px 4px -1px rgba(0, 0, 0, 0.03)',
                padding: '7px 9px',
                boxSizing: 'border-box',
                pointerEvents: 'auto',
                cursor: 'pointer',
                transition: 'top 0.25s cubic-bezier(0.4, 0, 0.2, 1), border 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
                transform: isHovered ? (isLeft ? 'translateX(4px)' : 'translateX(-4px)') : 'none'
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

              {/* Card Header: Section Badge only */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
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
              </div>

              {/* Obsidian Callouts inside card with progressive disclosure */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(() => {
                  const isExpanded = Boolean(expandedSections[item.key]);
                  const visibleRules = isExpanded ? item.rules : item.rules.slice(0, 1);
                  const hasMoreRules = item.rules.length > 1;
                  const remainingCount = item.rules.length - 1;

                  return (
                    <>
                      {visibleRules.map((rule, rIdx) => {
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
                              boxSizing: 'border-box',
                              overflowWrap: 'break-word',
                              wordBreak: 'break-word',
                              height: 'auto'
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
                                fontSize: '0.74rem',
                                overflowWrap: 'break-word',
                                wordBreak: 'break-word'
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
                                lineHeight: '1.3',
                                overflowWrap: 'break-word',
                                wordBreak: 'break-word'
                              }}
                            >
                              {rule.suggestion_body}
                              {rule.example_bad && rule.example_good && (
                                <div
                                  className="callout-examples"
                                  style={{
                                    marginTop: '6px',
                                    paddingTop: '4px',
                                    borderTop: `1px dashed ${isAtsMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '2px',
                                    fontSize: '0.62rem'
                                  }}
                                >
                                  <div style={{ color: isAtsMode ? '#fca5a5' : '#b91c1c' }}>
                                    <strong style={{ fontWeight: 600 }}>{lang === 'en' ? 'Avoid: ' : 'Evitá: '}</strong>
                                    <span>{rule.example_bad}</span>
                                  </div>
                                  <div style={{ color: isAtsMode ? '#86efac' : '#15803d' }}>
                                    <strong style={{ fontWeight: 600 }}>{lang === 'en' ? 'Use: ' : 'Usá: '}</strong>
                                    <span>{rule.example_good}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {hasMoreRules && (
                        <button
                          type="button"
                          className="btn-toggle-tips"
                          data-testid={`btn-toggle-tips-${item.key}`}
                          onClick={(e) => toggleSectionExpanded(item.key, e)}
                          style={{
                            marginTop: '2px',
                            padding: '4px 8px',
                            fontSize: '0.66rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            borderRadius: '4px',
                            border: isAtsMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
                            backgroundColor: isAtsMode ? 'rgba(255, 255, 255, 0.06)' : '#f8fafc',
                            color: isAtsMode ? '#cbd5e1' : '#475569',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}
                        >
                          <span>
                            {isExpanded
                              ? (lang === 'en' ? 'Show fewer tips' : 'Ver menos consejos')
                              : (lang === 'en'
                                  ? `View more tips for this section (+${remainingCount})`
                                  : `Ver más consejos para esta sección (+${remainingCount})`)}
                          </span>
                          <ChevronDown
                            size={12}
                            style={{
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease'
                            }}
                          />
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default AITipsSidebar;
