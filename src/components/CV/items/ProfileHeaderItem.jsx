import React from 'react';
import InlineEdit from '../../Editor/InlineEdit';

const ProfileHeaderItem = ({ item, sectionId, onUpdateItem }) => {
  return (
    <>
      <h1 className="home__title">
        <InlineEdit 
          value={item.name || ''} 
          onSave={(val) => onUpdateItem(sectionId, item.id, 'name', val)} 
        />
      </h1>
      <h2 className="home__subtitle">
        <InlineEdit 
          value={item.subtitle || ''} 
          onSave={(val) => onUpdateItem(sectionId, item.id, 'subtitle', val)} 
        />
      </h2>
      
      <div className="social__container bd-grid" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '1rem' }}>
        <span className="social__link">
          <i className='bx bx-map'></i>{' '}
          <InlineEdit 
            value={item.location || ''} 
            onSave={(val) => onUpdateItem(sectionId, item.id, 'location', val)} 
          />
        </span>
        <span className="social__link">
          <i className='bx bx-envelope'></i>{' '}
          <InlineEdit 
            value={item.email || ''} 
            onSave={(val) => onUpdateItem(sectionId, item.id, 'email', val)} 
          />
        </span>
        <span className="social__link">
          <i className='bx bx-phone'></i>{' '}
          <InlineEdit 
            value={item.phone || ''} 
            onSave={(val) => onUpdateItem(sectionId, item.id, 'phone', val)} 
          />
        </span>
        <span className="social__link">
          <i className='bx bxl-linkedin-square'></i>{' '}
          <InlineEdit 
            value={item.linkedin || ''} 
            onSave={(val) => onUpdateItem(sectionId, item.id, 'linkedin', val)} 
          />
        </span>
        <span className="social__link">
          <i className='bx bxl-github'></i>{' '}
          <InlineEdit 
            value={item.github || ''} 
            onSave={(val) => onUpdateItem(sectionId, item.id, 'github', val)} 
          />
        </span>
      </div>
    </>
  );
};

export default ProfileHeaderItem;
