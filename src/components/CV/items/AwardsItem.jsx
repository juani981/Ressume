import React from 'react';
import InlineEdit from '../../Editor/InlineEdit';
import { Trophy } from 'lucide-react';

const AwardsItem = ({ item, sectionId, onUpdateItem, isPrint = false }) => {
  return (
    <div style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
      <span 
        style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: 'var(--container-color-alt, rgba(0, 0, 0, 0.05))',
          color: 'var(--title-color)',
          flexShrink: 0,
          marginTop: '2px'
        }}
      >
        <Trophy size={15} />
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
          <h3 className="education__title" style={{ margin: 0, fontWeight: 600 }}>
            <InlineEdit 
              value={item.title || ''} 
              isPrint={isPrint}
              onSave={(val) => onUpdateItem?.(sectionId, item.id, 'title', val)} 
              placeholder="Nombre del Premio o Reconocimiento..."
            />
          </h3>
          {item.date && (
            <span style={{ fontSize: 'var(--smaller-font-size)', color: 'var(--text-color-light)' }}>
              <InlineEdit 
                value={item.date || ''} 
                isPrint={isPrint}
                onSave={(val) => onUpdateItem?.(sectionId, item.id, 'date', val)} 
                placeholder="2025"
              />
            </span>
          )}
        </div>

        {item.subtitle && (
          <div style={{ fontSize: 'var(--small-font-size)', color: 'inherit', marginTop: '1px' }}>
            <InlineEdit 
              value={item.subtitle || ''} 
              isPrint={isPrint}
              onSave={(val) => onUpdateItem?.(sectionId, item.id, 'subtitle', val)} 
              placeholder="Organización Emisora / Competencia..."
            />
          </div>
        )}

        {item.description && (
          <p className="experience__description" style={{ marginTop: '0.2rem' }}>
            <InlineEdit 
              value={item.description} 
              multiline 
              isPrint={isPrint}
              onSave={(val) => onUpdateItem?.(sectionId, item.id, 'description', val)} 
              placeholder="Motivo de la distinción o logro alcanzado..."
            />
          </p>
        )}
      </div>
    </div>
  );
};

export default AwardsItem;
