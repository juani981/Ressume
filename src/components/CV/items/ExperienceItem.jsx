import React from 'react';
import InlineEdit from '../../Editor/InlineEdit';
import HyperlinkEdit from '../../Editor/HyperlinkEdit';

const ExperienceItem = ({ item, sectionId, onUpdateItem }) => {
  return (
    <>
      <div className="experience__time">
        <span className="experience__rounder"></span>
        <span className="experience__line"></span>
      </div>

      <div className="experience__data bd-grid" style={{ width: '100%' }}>
        <h3 className="experience__title">
          <InlineEdit 
            value={item.title || ''} 
            onSave={(val) => onUpdateItem(sectionId, item.id, 'title', val)} 
          />
        </h3>
        <span className="experience__company">
          <InlineEdit 
            value={item.date || ''} 
            onSave={(val) => onUpdateItem(sectionId, item.id, 'date', val)} 
          />
          {(item.subtitle || item.date) && ' | '}
          <InlineEdit 
            value={item.subtitle || ''} 
            onSave={(val) => onUpdateItem(sectionId, item.id, 'subtitle', val)} 
          />
        </span>
        {item.link && (
          <span className="social__container bd-grid" style={{ marginTop: '0.25rem', marginBottom: '0.25rem' }}>
            <HyperlinkEdit 
              url={item.link} 
              text={item.linkText || item.link} 
              onSave={({ url, text }) => onUpdateItem(sectionId, item.id, { link: url, linkText: text })} 
              onRemove={() => onUpdateItem(sectionId, item.id, { link: '', linkText: '' })} 
            />
          </span>
        )}
        {item.description && (
          <p className="experience__description">
            <InlineEdit 
              value={item.description} 
              onSave={(val) => onUpdateItem(sectionId, item.id, 'description', val)} 
              multiline 
            />
          </p>
        )}
        {item.bullets && item.bullets.length > 0 && (
          <ul className="experience__bullets">
            {item.bullets.map((bullet, idx) => (
              <li key={idx}>
                <InlineEdit 
                  value={bullet} 
                  onSave={(val) => {
                    const newBullets = [...item.bullets];
                    newBullets[idx] = val;
                    onUpdateItem(sectionId, item.id, 'bullets', newBullets);
                  }} 
                  multiline
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default ExperienceItem;
