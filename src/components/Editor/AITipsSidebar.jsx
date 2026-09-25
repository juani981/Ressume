/**
 * @file AITipsSidebar.jsx
 * @description Master AI suggestions panel displayed outside the A4 sheet on the right side.
 * Renders all active rules and tips as Obsidian Callouts strictly adhering to AGENTS.md Invariant 1.
 */

import React from 'react';
import { useCV } from '../../context/CVContext';
import { getRules } from '../../locales/index';
import { Lightbulb, OctagonAlert, TriangleAlert, Info, X, CheckCircle2 } from 'lucide-react';

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
  contact: 'profile'
};

const SECTION_LABEL_MAP = {
  experience: 'Experiencia Laboral',
  education: 'Educación & Formación',
  skills: 'Habilidades Técnicas',
  projects: 'Proyectos Destacados',
  certificates: 'Certificaciones',
  languages: 'Idiomas',
  profile: 'Perfil & Contacto',
  global: 'Estrategia General & Formato'
};

/**
 * AITipsSidebar
 * Fixed/sticky right-rail suggestions panel taking advantage of all available viewport space.
 */
const AITipsSidebar = () => {
  const { cvData, showAITips, toggleAITips, activeLanguage } = useCV();

  if (!showAITips) return null;

  const isAtsMode = cvData?.layout?.isAtsMode === true || cvData?.layout?.type === '1-column';
  const targetLayout = isAtsMode ? 'ATS_1_col' : 'Human_2_col';
  const lang = activeLanguage || 'es';

  // 1. Gather all localized rules
  const allRules = getRules(lang) || [];

  // 2. Identify all active target sections from current cvData
  const activeSections = cvData?.sections || [];
  const activeTargets = new Set(['global']);
  activeSections.forEach((sec) => {
    const target = SECTION_TYPE_TO_TARGET[sec.type] || SECTION_TYPE_TO_TARGET[sec.id];
    if (target) activeTargets.add(target);
  });

  // 3. Filter rules matching current layout and active sections
  const matchingRules = allRules.filter((rule) => {
    const matchesLayout = rule.target_layout === targetLayout || rule.target_layout === 'both';
    const matchesSection = activeTargets.has(rule.target_section);
    return matchesLayout && matchesSection;
  });

  // 4. Group rules by target_section
  const groupedRules = {};
  matchingRules.forEach((rule) => {
    const groupKey = rule.target_section || 'global';
    if (!groupedRules[groupKey]) {
      groupedRules[groupKey] = [];
    }
    groupedRules[groupKey].push(rule);
  });

  // Sort groups: global first, then by priority
  const groupOrder = ['global', 'profile', 'experience', 'skills', 'projects', 'education', 'certificates', 'languages'];
  const sortedGroupKeys = Object.keys(groupedRules).sort((a, b) => {
    const idxA = groupOrder.indexOf(a);
    const idxB = groupOrder.indexOf(b);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  return (
    <aside
      className="ai-tips-sidebar no-print"
      data-testid="ai-tips-sidebar"
      aria-label="Panel de Consejos y Optimización IA"
      style={{
        position: 'fixed',
        top: '90px',
        left: 'calc(50% + 415px)',
        right: '24px',
        bottom: '24px',
        maxHeight: 'calc(100vh - 114px)',
        backgroundColor: isAtsMode ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: isAtsMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0',
        boxShadow: isAtsMode
          ? '0 20px 40px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)'
          : '0 20px 40px -10px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
        boxSizing: 'border-box',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderBottom: isAtsMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #f1f5f9',
          backgroundColor: isAtsMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(248, 250, 252, 0.8)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(234, 179, 8, 0.15)',
              color: '#eab308'
            }}
          >
            <Lightbulb size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '0.95rem',
                fontWeight: 700,
                color: isAtsMode ? '#f8fafc' : '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Consejos IA
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: isAtsMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)',
                  color: isAtsMode ? '#34d399' : '#059669'
                }}
              >
                {isAtsMode ? 'Modo ATS' : 'Modo Visual'}
              </span>
            </h3>
            <span style={{ fontSize: '0.75rem', color: isAtsMode ? '#94a3b8' : '#64748b' }}>
              {matchingRules.length} recomendaciones activas
            </span>
          </div>
        </div>

        <button
          type="button"
          data-testid="btn-close-ai-tips-sidebar"
          onClick={() => toggleAITips && toggleAITips()}
          title="Ocultar panel de consejos"
          aria-label="Cerrar panel de consejos"
          style={{
            background: 'none',
            border: 'none',
            padding: '6px',
            borderRadius: '6px',
            color: isAtsMode ? '#94a3b8' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isAtsMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
            e.currentTarget.style.color = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = isAtsMode ? '#94a3b8' : '#64748b';
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        {matchingRules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: isAtsMode ? '#94a3b8' : '#64748b' }}>
            <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 0.75rem auto' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>¡Tu CV cumple con todas las directivas de optimización!</p>
          </div>
        ) : (
          sortedGroupKeys.map((groupKey) => {
            const rulesInGroup = groupedRules[groupKey] || [];
            const groupTitle = SECTION_LABEL_MAP[groupKey] || groupKey;

            return (
              <div key={groupKey} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: isAtsMode ? '#94a3b8' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{groupTitle}</span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: '999px',
                      backgroundColor: isAtsMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                      color: isAtsMode ? '#cbd5e1' : '#64748b'
                    }}
                  >
                    {rulesInGroup.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {rulesInGroup.map((rule, idx) => {
                    const isCritical = rule.severity === 'critical';
                    const isWarning = rule.severity === 'warning';

                    // Obsidian Callout Theme Colors according to AGENTS.md Invariant 1
                    const themeColor = isCritical ? '233, 49, 71' : isWarning ? '219, 139, 0' : '8, 109, 221';
                    const iconColor = `rgba(${themeColor}, 1)`;

                    return (
                      <div
                        key={rule.id || idx}
                        className="obsidian-callout"
                        data-testid={`callout-${rule.id || idx}`}
                        style={{
                          backgroundColor: `rgba(${themeColor}, 0.1)`,
                          borderLeft: `4px solid rgba(${themeColor}, 1)`,
                          borderRadius: '6px',
                          padding: '0.75rem 0.85rem',
                          fontSize: '0.82rem',
                          color: isAtsMode ? '#e2e8f0' : '#1e293b',
                          lineHeight: '1.45',
                          display: 'flex',
                          flexDirection: 'column',
                          boxSizing: 'border-box'
                        }}
                      >
                        <div
                          className="callout-title"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: iconColor,
                            fontWeight: '600',
                            marginBottom: '4px',
                            fontSize: '0.85rem'
                          }}
                        >
                          <span
                            className="callout-icon"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            {isCritical ? (
                              <OctagonAlert size={15} color={iconColor} strokeWidth={2.2} />
                            ) : isWarning ? (
                              <TriangleAlert size={15} color={iconColor} strokeWidth={2.2} />
                            ) : (
                              <Info size={15} color={iconColor} strokeWidth={2.2} />
                            )}
                          </span>
                          <span>{rule.suggestion_title}</span>
                        </div>
                        <div
                          className="callout-content"
                          style={{
                            fontSize: '0.78rem',
                            color: isAtsMode ? '#cbd5e1' : '#334155',
                            lineHeight: '1.4'
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
    </aside>
  );
};

export default AITipsSidebar;
