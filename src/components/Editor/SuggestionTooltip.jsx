import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCV } from '../../context/CVContext';
import { getRules } from '../../locales/index';
import { Lightbulb, OctagonAlert, TriangleAlert, Info, X } from 'lucide-react';

const SuggestionTooltip = ({ section, isHovered, layoutType, rect, anchorRef }) => {
  const cvContext = useCV();
  const activeLanguage = cvContext?.activeLanguage || 'es';
  const closeTooltip = cvContext?.closeTooltip;
  const [suggestions, setSuggestions] = useState([]);
  const [stylePos, setStylePos] = useState({ top: 100, left: 200, width: 300, maxHeight: 'calc(100vh - 120px)' });

  /**
   * Computes tooltip position from a DOMRect object.
   * Follows AGENTS.md §3: position adjacent to element (rect.right + 20px),
   * flip to rect.left - 320px when approaching viewport boundary,
   * clamp vertically to prevent escaping window.innerHeight.
   */
  const computePosition = useCallback((r) => {
    if (!r) return;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
    const TOOLTIP_WIDTH = 300;

    let left = Math.round(r.right + 20);
    if (left + TOOLTIP_WIDTH > vw) {
      left = Math.round(r.left - 320);
    }
    if (left < 20) left = 20;

    let top = Math.round(r.top);
    if (top + 400 > vh) top = vh - 420;
    if (top < 20) top = 20;

    setStylePos({
      top,
      left,
      width: TOOLTIP_WIDTH,
      maxWidth: `calc(100vw - 24px)`,
      maxHeight: `calc(100vh - ${top + 20}px)`
    });
  }, []);

  useEffect(() => {
    if (isHovered && rect) {
      computePosition(rect);

      // Map section type & id to target_section in our rules
      let targetSection = 'global';
      if (!section) {
        targetSection = 'global';
      } else if (section.id === 'experience' || section.type === 'experience' || section.type === 'list') {
        targetSection = 'experience';
      } else if (section.id === 'education' || section.type === 'education') {
        targetSection = 'education';
      } else if (section.id === 'skills' || section.type === 'skills') {
        targetSection = 'skills';
      } else if (section.id === 'projects' || section.type === 'projects') {
        targetSection = 'projects';
      } else if (section.id === 'certificates' || section.id === 'certifications' || section.type === 'certificates') {
        targetSection = 'certificates';
      } else if (section.id === 'languages' || section.type === 'languages') {
        targetSection = 'languages';
      } else if (section.type === 'about' || section.type === 'profile_header' || section.id === 'about_section' || section.id === 'profile_header') {
        targetSection = 'profile';
      }

      // layoutType is 1 or 2
      const targetLayout = layoutType === 1 ? 'ATS_1_col' : 'Human_2_col';

      // Load localized rules for active language
      const allRules = getRules(activeLanguage) || [];
      let allMatching = allRules.filter(rule => {
        const matchesSection = rule.target_section === targetSection || rule.target_section === 'global';
        const matchesLayout = rule.target_layout === targetLayout || rule.target_layout === 'both';
        return matchesSection && matchesLayout;
      });

      // Fallbacks if empty
      if (allMatching.length === 0) {
        allMatching = allRules.filter(rule => rule.target_section === 'global');
      }

      if (allMatching.length === 0) {
        allMatching = [
          {
            id: 'default_tip',
            severity: 'info',
            suggestion_title: 'Optimización de Contenido',
            suggestion_body: 'Estructura tus logros con verbos de acción y métricas cuantificables.'
          }
        ];
      }

      // Regex matching based on content with critical severity prioritization
      const sectionText = JSON.stringify(section || {}).toLowerCase();
      const scoredMatches = allMatching.map(rule => {
        let score = rule.severity === 'critical' ? 8 : rule.severity === 'warning' ? 4 : 1;
        // Strongly prioritize rules matching this specific section over global rules
        if (rule.target_section === targetSection && targetSection !== 'global') {
          score += 10;
        }
        const keywords = ((rule.suggestion_title || '') + ' ' + (rule.suggestion_body || '')).toLowerCase().split(' ').filter(w => w.length > 4);
        keywords.forEach(kw => {
          if (sectionText.includes(kw)) score += 2;
        });
        return { rule, score };
      }).sort((a, b) => b.score - a.score);

      // Pick top 2-3 to avoid overwhelming
      setSuggestions(scoredMatches.slice(0, 3).map(sm => sm.rule));
    }
  }, [isHovered, section, layoutType, rect, activeLanguage, computePosition]);

  /**
   * Keep tooltip position live on scroll and resize (AGENTS.md §3).
   * When anchorRef is provided, recompute from getBoundingClientRect().
   * Otherwise fall back to the last known rect prop.
   */
  useEffect(() => {
    if (!isHovered) return;

    const updatePosition = () => {
      if (anchorRef?.current) {
        computePosition(anchorRef.current.getBoundingClientRect());
      } else if (rect) {
        computePosition(rect);
      }
    };

    window.addEventListener('scroll', updatePosition, { passive: true, capture: true });
    window.addEventListener('resize', updatePosition, { passive: true });
    return () => {
      window.removeEventListener('scroll', updatePosition, { capture: true });
      window.removeEventListener('resize', updatePosition);
    };
  }, [isHovered, anchorRef, rect, computePosition]);

  if (!isHovered || !rect || suggestions.length === 0) return null;

  return (
    <div
      className="suggestion-tooltip no-print"
      style={{
        position: 'fixed',
        top: `${stylePos.top}px`,
        left: `${stylePos.left}px`,
        width: `${stylePos.width}px`,
        maxWidth: stylePos.maxWidth,
        maxHeight: stylePos.maxHeight,
        backgroundColor: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '10px',
        boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.16), 0 4px 8px -2px rgba(0, 0, 0, 0.06)',
        padding: '8px 10px',
        zIndex: 99999,
        pointerEvents: 'auto',
        transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
        overflowY: 'auto',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ margin: '0 0 8px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ margin: '0', fontSize: '11.5px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
            <Lightbulb size={14} color="#eab308" /> Consejos IA
          </h4>
          {section?.type && (
            <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', display: 'block' }}>
              Sección: <strong style={{ textTransform: 'capitalize' }}>{(section.title || section.type).replace('_', ' ')}</strong>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => closeTooltip && closeTooltip()}
          title="Cerrar consejos IA"
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '2px 4px',
            fontSize: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            borderRadius: '4px',
            transition: 'color 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
        >
          <X size={13} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {suggestions.map((s, index) => {
          const isCritical = s.severity === 'critical';
          const isWarning = s.severity === 'warning';

          // Obsidian Callout Theme Colors according to AGENTS.md
          const themeColor = isCritical ? '233, 49, 71' : isWarning ? '219, 139, 0' : '8, 109, 221';

          return (
            <div
              key={s.id || index}
              className="obsidian-callout"
              style={{
                backgroundColor: `rgba(${themeColor}, 0.08)`,
                borderLeft: `4px solid rgba(${themeColor}, 1)`,
                borderRadius: '4px',
                padding: '6px 8px',
                fontSize: '11px',
                color: '#2e3338',
                lineHeight: '1.35',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div
                className="callout-title"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: `rgba(${themeColor}, 1)`,
                  fontWeight: '600',
                  marginBottom: '2px',
                  fontSize: '11.5px'
                }}
              >
                <span className="callout-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isCritical ? (
                    <OctagonAlert size={13} color={`rgba(${themeColor}, 1)`} />
                  ) : isWarning ? (
                    <TriangleAlert size={13} color={`rgba(${themeColor}, 1)`} />
                  ) : (
                    <Info size={13} color={`rgba(${themeColor}, 1)`} />
                  )}
                </span>
                <span>{s.suggestion_title}</span>
              </div>
              <div className="callout-content" style={{ fontSize: '10.5px', lineHeight: '1.3' }}>
                {s.suggestion_body}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestionTooltip;
