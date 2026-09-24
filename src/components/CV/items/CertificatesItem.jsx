import React from 'react';
import InlineEdit from '../../Editor/InlineEdit';
import HyperlinkEdit from '../../Editor/HyperlinkEdit';
import { BadgeCheck } from 'lucide-react';

const CertificatesItem = ({ item, sectionId, onUpdateItem, isPrint = false }) => {
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
        <BadgeCheck size={15} />
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
          <h3 className="education__title" style={{ margin: 0, fontWeight: 600 }}>
            <InlineEdit 
              value={item.title || ''} 
              isPrint={isPrint}
              onSave={(val) => onUpdateItem?.(sectionId, item.id, 'title', val)} 
              placeholder="Nombre de la Certificación..."
            />
          </h3>
          {item.date && (
            <span style={{ fontSize: 'var(--body-smaller-font-size, var(--smaller-font-size))', color: 'var(--text-color-light)' }}>
              <InlineEdit 
                value={item.date || ''} 
                isPrint={isPrint}
                onSave={(val) => onUpdateItem?.(sectionId, item.id, 'date', val)} 
                placeholder="2025"
              />
            </span>
          )}
        </div>

        <div style={{ fontSize: 'var(--body-small-font-size, var(--small-font-size))', color: 'inherit', marginTop: '1px' }}>
          <InlineEdit 
            value={item.subtitle || ''} 
            isPrint={isPrint}
            onSave={(val) => onUpdateItem?.(sectionId, item.id, 'subtitle', val)} 
            placeholder="Entidad Emisora (ej: AWS, Cisco, Microsoft)..."
          />
          {item.credentialId && (
            <>
              {' · '}
              <span style={{ color: 'var(--text-color-light)', fontSize: 'var(--body-smaller-font-size, var(--smaller-font-size))' }}>
                ID: <InlineEdit 
                  value={item.credentialId || ''} 
                  isPrint={isPrint}
                  onSave={(val) => onUpdateItem?.(sectionId, item.id, 'credentialId', val)} 
                  placeholder="Código o Credencial..."
                />
              </span>
            </>
          )}
        </div>

        {item.link && (
          <div className="social__container bd-grid" style={{ marginTop: '0.15rem' }}>
            <HyperlinkEdit 
              url={item.link} 
              text={item.linkText || item.link || 'Ver credencial'} 
              isPrint={isPrint}
              onSave={({ url, text }) => onUpdateItem?.(sectionId, item.id, { link: url, linkText: text })} 
              onRemove={() => onUpdateItem?.(sectionId, item.id, { link: '', linkText: '' })} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificatesItem;
