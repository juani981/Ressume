import React from 'react';
import InlineEdit from '../../Editor/InlineEdit';
import { UserCheck, Mail, Phone } from 'lucide-react';

const ReferencesItem = ({ item, sectionId, onUpdateItem, isPrint = false }) => {
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
        <UserCheck size={15} />
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 className="education__title" style={{ margin: 0, fontWeight: 600 }}>
          <InlineEdit 
            value={item.title || item.name || ''} 
            isPrint={isPrint}
            onSave={(val) => onUpdateItem?.(sectionId, item.id, 'title', val)} 
            placeholder="Nombre de la Referencia..."
          />
        </h3>

        <div style={{ fontSize: 'var(--body-small-font-size, var(--small-font-size))', color: 'inherit', marginTop: '1px' }}>
          <InlineEdit 
            value={item.subtitle || item.position || ''} 
            isPrint={isPrint}
            onSave={(val) => onUpdateItem?.(sectionId, item.id, 'subtitle', val)} 
            placeholder="Cargo y Empresa (ej: VP of Engineering en Globant)..."
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.25rem', fontSize: 'var(--body-smaller-font-size, var(--smaller-font-size))', color: 'var(--text-color-light)' }}>
          {(item.email || !isPrint) && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Mail size={13} />{' '}
              <InlineEdit 
                value={item.email || ''} 
                isPrint={isPrint}
                onSave={(val) => onUpdateItem?.(sectionId, item.id, 'email', val)} 
                placeholder="correo@ejemplo.com"
              />
            </span>
          )}

          {(item.phone || !isPrint) && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Phone size={13} />{' '}
              <InlineEdit 
                value={item.phone || ''} 
                isPrint={isPrint}
                onSave={(val) => onUpdateItem?.(sectionId, item.id, 'phone', val)} 
                placeholder="+54 9 381 ..."
              />
            </span>
          )}

          {item.relationship && (
            <span style={{ fontStyle: 'italic' }}>
              (<InlineEdit 
                value={item.relationship} 
                isPrint={isPrint}
                onSave={(val) => onUpdateItem?.(sectionId, item.id, 'relationship', val)} 
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
