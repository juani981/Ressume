import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragHandle from '../Editor/DragHandle';
import InlineEdit from '../Editor/InlineEdit';
import { useCV } from '../../context/CVContext';

const CVBlock = ({ item, sectionId, sectionType }) => {
  const { updateSectionItem } = useCV();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const baseStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative'
  };

  if (sectionType === 'profile_header') {
    return (
      <div ref={setNodeRef} className="home__data bd-grid editable-item-container" style={baseStyle}>
        <DragHandle isInner={true} listeners={listeners} attributes={attributes} />
        <h1 className="home__title">
          <InlineEdit value={item.name} onSave={(val) => updateSectionItem(sectionId, item.id, 'name', val)} />
        </h1>
        <h2 className="home__subtitle">
          <InlineEdit value={item.subtitle} onSave={(val) => updateSectionItem(sectionId, item.id, 'subtitle', val)} />
        </h2>
        
        <div className="social__container bd-grid" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '1rem' }}>
          <span className="social__link"><i className='bx bx-map'></i> <InlineEdit value={item.location} onSave={(val) => updateSectionItem(sectionId, item.id, 'location', val)} /></span>
          <span className="social__link"><i className='bx bx-envelope'></i> <InlineEdit value={item.email} onSave={(val) => updateSectionItem(sectionId, item.id, 'email', val)} /></span>
          <span className="social__link"><i className='bx bx-phone'></i> <InlineEdit value={item.phone} onSave={(val) => updateSectionItem(sectionId, item.id, 'phone', val)} /></span>
          <span className="social__link"><i className='bx bxl-linkedin-square'></i> <InlineEdit value={item.linkedin} onSave={(val) => updateSectionItem(sectionId, item.id, 'linkedin', val)} /></span>
          <span className="social__link"><i className='bx bxl-github'></i> <InlineEdit value={item.github} onSave={(val) => updateSectionItem(sectionId, item.id, 'github', val)} /></span>
        </div>
      </div>
    );
  }

  if (sectionType === 'about') {
    return (
      <div ref={setNodeRef} className="profile__description editable-item-container" style={baseStyle}>
        <DragHandle isInner={true} listeners={listeners} attributes={attributes} />
        <InlineEdit value={item.description} onSave={(val) => updateSectionItem(sectionId, item.id, 'description', val)} multiline />
      </div>
    );
  }

  if (sectionType === 'simple_list') {
    return (
      <li ref={setNodeRef} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.5rem', listStyle: 'none', ...baseStyle }} className="editable-item-container">
        <DragHandle isInner={true} listeners={listeners} attributes={attributes} />
        <span style={{ display: 'inline-block', width: '5px', height: '5px', backgroundColor: 'var(--circle-color, var(--text-color))', borderRadius: '50%', margin: '8px 0.75rem 0 0', flexShrink: 0 }}></span>
        <span style={{ flex: 1 }}>
          <InlineEdit 
            value={item.text} 
            onSave={(val) => updateSectionItem(sectionId, item.id, 'text', val)} 
          />
        </span>
      </li>
    );
  }

  if (sectionType === 'skills') {
    return (
      <li ref={setNodeRef} style={{ alignItems: 'flex-start', marginBottom: '0.5rem', ...baseStyle }} className="skills__name editable-item-container">
        <DragHandle isInner={true} listeners={listeners} attributes={attributes} />
        <span className="skills__circle" style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', margin: '8px 0.75rem 0 0', flexShrink: 0, backgroundColor: 'var(--circle-color, var(--text-color))' }}></span>
        <span>
          <b>
            <InlineEdit value={item.title} onSave={(val) => updateSectionItem(sectionId, item.id, 'title', val)} />: 
          </b>{' '}
          <InlineEdit value={item.description} onSave={(val) => updateSectionItem(sectionId, item.id, 'description', val)} />
        </span>
      </li>
    );
  }

  if (sectionType === 'education') {
    return (
      <div ref={setNodeRef} className="education__content editable-item-container" style={baseStyle}>
        <DragHandle isInner={true} listeners={listeners} attributes={attributes} />
        <div className="education__time">
          <span className="education__rounder"></span>
          <span className="education__line"></span>
        </div>
        <div className="education__data bd-grid">
          <h3 className="education__title">
            <InlineEdit value={item.title} onSave={(val) => updateSectionItem(sectionId, item.id, 'title', val)} />
          </h3>
          <span className="education__studies">
            <InlineEdit value={item.subtitle} onSave={(val) => updateSectionItem(sectionId, item.id, 'subtitle', val)} />
          </span>
          <span className="education__year">
            <InlineEdit value={item.date} onSave={(val) => updateSectionItem(sectionId, item.id, 'date', val)} />
          </span>
        </div>
      </div>
    );
  }

  // default to 'list' (experience, projects)
  return (
    <div ref={setNodeRef} className="experience__content editable-item-container" style={baseStyle}>
      <DragHandle isInner={true} listeners={listeners} attributes={attributes} />
      
      <div className="experience__time">
        <span className="experience__rounder"></span>
        <span className="experience__line"></span>
      </div>

      <div className="experience__data bd-grid">
        <h3 className="experience__title">
          <InlineEdit value={item.title} onSave={(val) => updateSectionItem(sectionId, item.id, 'title', val)} />
        </h3>
        <span className="experience__company">
          <InlineEdit value={item.date} onSave={(val) => updateSectionItem(sectionId, item.id, 'date', val)} />
          {' | '}
          <InlineEdit value={item.subtitle} onSave={(val) => updateSectionItem(sectionId, item.id, 'subtitle', val)} />
        </span>
        {item.link && (
           <span className="social__container bd-grid">
             <a href={`https://${item.link.replace('https://', '')}`} className="social__link" target="_blank" rel="noreferrer" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                <i className='bx bx-link-external'></i>{' '}
                <InlineEdit value={item.link} onSave={(val) => updateSectionItem(sectionId, item.id, 'link', val)} />
             </a>
           </span>
        )}
        {item.description && (
          <p className="experience__description">
            <InlineEdit value={item.description} onSave={(val) => updateSectionItem(sectionId, item.id, 'description', val)} multiline />
          </p>
        )}
        {item.bullets && item.bullets.length > 0 && (
          <ul style={{ paddingLeft: '1.5rem', listStyleType: 'disc' }}>
            {item.bullets.map((bullet, idx) => (
              <li key={idx} style={{ marginBottom: '0.25rem' }}>
                 <InlineEdit 
                    value={bullet} 
                    onSave={(val) => {
                      const newBullets = [...item.bullets];
                      newBullets[idx] = val;
                      updateSectionItem(sectionId, item.id, 'bullets', newBullets);
                    }} 
                    multiline 
                  />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CVBlock;
