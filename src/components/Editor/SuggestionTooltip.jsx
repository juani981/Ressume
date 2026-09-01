import React, { useState, useEffect } from 'react';
import { getAISuggestions } from '../../ai-knowledge/index.js';

const SuggestionTooltip = ({ section, isHovered, layoutType, rect }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isHovered && rect) {
      // Calculate tooltip position
      let top = rect.top;
      let left = rect.right + 20;

      // If it overflows the right edge of the screen, place it on the left of the section
      if (left + 300 > window.innerWidth) {
        left = rect.left - 320;
      }
      
      // Keep it within vertical bounds
      if (top + 400 > window.innerHeight) {
        top = window.innerHeight - 420;
      }
      if (top < 20) top = 20;

      setPos({ top, left });

      // Map section type to target_section in our rules
      let targetSection = 'global';
      if (section.type === 'experience') targetSection = 'experience';
      if (section.type === 'education') targetSection = 'education';
      if (section.type === 'skills') targetSection = 'skills';
      if (section.type === 'projects') targetSection = 'projects';
      if (section.type === 'about' || section.type === 'profile_header') targetSection = 'profile';

      // layoutType is 1 or 2
      const targetLayout = layoutType === 1 ? 'ATS_1_col' : 'Human_2_col';

      // We'll fetch all rules matching the section and layout for 'tech' industry
      const rawSuggestions = getAISuggestions(targetSection, targetLayout, 'on_edit_description', 'tech');
      const layoutSuggestions = getAISuggestions(targetSection, targetLayout, 'layout_select', 'tech');
      const formatScanSuggestions = getAISuggestions(targetSection, targetLayout, 'format_scan', 'tech');

      let allMatching = [...rawSuggestions, ...layoutSuggestions, ...formatScanSuggestions];
      
      // Fallback if empty
      if (allMatching.length === 0) {
        allMatching = getAISuggestions(targetSection, 'both', 'on_edit_description', 'tech');
      }
      if (allMatching.length === 0) {
        allMatching = getAISuggestions(targetSection, 'both', 'format_scan', 'tech');
      }

      // Regex matching based on content (Optional simple keyword check)
      const sectionText = JSON.stringify(section).toLowerCase();
      // Weight matches based on keywords in rules
      const scoredMatches = allMatching.map(rule => {
        let score = 1; // base score
        const keywords = rule.suggestion_title.toLowerCase().split(' ').filter(w => w.length > 4);
        keywords.forEach(kw => {
            if (sectionText.includes(kw)) score += 2;
        });
        return { rule, score };
      }).sort((a, b) => b.score - a.score);

      // Pick top 2-3 to avoid overwhelming
      setSuggestions(scoredMatches.slice(0, 3).map(sm => sm.rule));
    }
  }, [isHovered, section, layoutType, rect]);

  if (!isHovered || suggestions.length === 0) return null;

  return (
    <div 
      className="suggestion-tooltip"
      style={{
        position: 'fixed',
        top: `${pos.top}px`,
        left: `${pos.left}px`, 
        width: '300px',
        backgroundColor: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        padding: '12px',
        zIndex: 9999,
        pointerEvents: 'none', // so it doesn't interrupt drag/drop
        transition: 'opacity 0.2s ease-in-out',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}
    >
      <div style={{ margin: '0 0 10px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
        <h4 style={{ margin: '0', fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
          <span role="img" aria-label="lightbulb">💡</span> AI Suggestions 
        </h4>
        <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
          For section: <strong style={{textTransform: 'capitalize'}}>{section.type.replace('_', ' ')}</strong>
        </span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {suggestions.map((s, index) => {
          const isCritical = s.severity === 'critical';
          const isWarning = s.severity === 'warning';
          
          // Obsidian Callout Theme Colors
          const themeColor = isCritical ? '233, 49, 71' : isWarning ? '219, 139, 0' : '8, 109, 221';
          
          return (
            <div 
              key={s.id || index} 
              className="obsidian-callout"
              style={{ 
                backgroundColor: `rgba(${themeColor}, 0.1)`,
                borderLeft: `4px solid rgba(${themeColor}, 1)`,
                borderRadius: '4px',
                padding: '12px 14px',
                fontSize: '13px', 
                color: '#2e3338', 
                lineHeight: '1.5',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div 
                className="callout-title"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  color: `rgba(${themeColor}, 1)`,
                  fontWeight: '600',
                  marginBottom: '6px',
                  fontSize: '14px'
                }}
              >
                <span className="callout-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>
                  {isCritical ? '🛑' : isWarning ? '⚠️' : 'ℹ️'}
                </span>
                <span>{s.suggestion_title}</span>
              </div>
              <div className="callout-content">
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
