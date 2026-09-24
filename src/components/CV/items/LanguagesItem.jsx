import React from 'react';
import InlineEdit from '../../Editor/InlineEdit';

const LanguagesItem = ({ item, sectionId, onUpdateItem, isPrint = false }) => {
  return (
    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
        <span 
          style={{ 
            display: 'inline-block', 
            width: '6px', 
            height: '6px', 
            backgroundColor: 'var(--circle-color, var(--text-color-light))', 
            borderRadius: '50%', 
            flexShrink: 0 
          }} 
        />
        <div style={{ minWidth: 0 }}>
          <span style={{ fontWeight: 600, fontSize: 'var(--list-font-size, var(--normal-font-size))', color: 'var(--title-color)' }}>
            <InlineEdit 
              value={item.title || item.language || ''} 
              isPrint={isPrint}
              onSave={(val) => onUpdateItem?.(sectionId, item.id, 'title', val)} 
              placeholder="Idioma (ej: Inglés, Alemán)..."
            />
          </span>
          {item.description && (
            <div style={{ fontSize: 'var(--body-smaller-font-size, var(--smaller-font-size))', color: 'var(--text-color-light)' }}>
              <InlineEdit 
                value={item.description} 
                isPrint={isPrint}
                onSave={(val) => onUpdateItem?.(sectionId, item.id, 'description', val)} 
                placeholder="Detalle o certificación (ej: EF SET C2)..."
              />
            </div>
          )}
        </div>
      </div>

      <span 
        style={{ 
          fontSize: 'var(--body-small-font-size, var(--small-font-size))', 
          fontWeight: 500,
          padding: '2px 8px',
          borderRadius: '12px',
          background: 'var(--container-color-alt, rgba(0, 0, 0, 0.05))',
          color: 'var(--title-color)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}
      >
        <InlineEdit 
          value={item.subtitle || item.level || 'B2 Intermedio'} 
          isPrint={isPrint}
          onSave={(val) => onUpdateItem?.(sectionId, item.id, 'subtitle', val)} 
          placeholder="Nivel (ej: Bilingüe, C1, Nativo)..."
        />
      </span>
    </div>
  );
};

export default LanguagesItem;
