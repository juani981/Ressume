import React from 'react';
import InlineEdit from '../../Editor/InlineEdit';

const ReferencesItem = ({ item, sectionId, onUpdateItem }) => {
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
        <i className='bx bx-user-check' style={{ fontSize: '15px' }}></i>
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 className="education__title" style={{ margin: 0, fontWeight: 600 }}>
          <InlineEdit 
            value={item.title || item.name || ''} 
            onSave={(val) => onUpdateItem(sectionId, item.id, 'title', val)} 
            placeholder="Nombre de la Referencia..."
          />
        </h3>

        <div style={{ fontSize: 'var(--small-font-size)', color: 'inherit', marginTop: '1px' }}>
          <InlineEdit 
            value={item.subtitle || item.position || ''} 
            onSave={(val) => onUpdateItem(sectionId, item.id, 'subtitle', val)} 
            placeholder="Cargo y Empresa (ej: VP of Engineering en Globant)..."
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.25rem', fontSize: 'var(--smaller-font-size)', color: 'var(--text-color-light)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <InlineEdit 
              value={item.email || ''} 
              onSave={(val) => onUpdateItem(sectionId, item.id, 'email', val)} 
              placeholder="correo@ejemplo.com"
            />
          </span>

          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <InlineEdit 
              value={item.phone || ''} 
              onSave={(val) => onUpdateItem(sectionId, item.id, 'phone', val)} 
              placeholder="+54 9 381 ..."
            />
          </span>

          {item.relationship && (
            <span style={{ fontStyle: 'italic' }}>
              (<InlineEdit 
                value={item.relationship} 
                onSave={(val) => onUpdateItem(sectionId, item.id, 'relationship', val)} 
                placeholder="Relación (ej: Ex-Líder Técnico)"
              />)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferencesItem;
