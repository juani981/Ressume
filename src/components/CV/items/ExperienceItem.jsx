import React from 'react';
import InlineEdit from '../../Editor/InlineEdit';

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
          <span className="social__container bd-grid">
            <a 
              href={`https://${item.link.replace(/^https?:\/\//, '')}`} 
              className="social__link" 
              target="_blank" 
              rel="noreferrer" 
              style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}
            >
              <i className='bx bx-link-external'></i>{' '}
              <InlineEdit 
                value={item.link} 
                onSave={(val) => onUpdateItem(sectionId, item.id, 'link', val)} 
              />
            </a>
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
