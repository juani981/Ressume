import React from 'react';
import { useCV } from '../../context/CVContext';
import InlineEdit from '../Editor/InlineEdit';

const CVHeader = () => {
  const { cvData, updateProfile } = useCV();
  const { profile } = cvData;

  return (
    <>
      <section className="profile section" id="profile">
        <div className="home__data bd-grid">
          <h1 className="home__title">
            <InlineEdit 
              value={profile.name} 
              onSave={(val) => updateProfile('name', val)} 
            />
          </h1>
          <h2 className="home__subtitle">
            <InlineEdit 
              value={profile.subtitle} 
              onSave={(val) => updateProfile('subtitle', val)} 
            />
          </h2>
        </div>
        
        <div className="social__container bd-grid" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '1rem' }}>
          <span className="social__link">
            <i className='bx bx-map'></i> 
            <InlineEdit value={profile.location} onSave={(val) => updateProfile('location', val)} />
          </span>
          <span className="social__link">
            <i className='bx bx-envelope'></i> 
            <InlineEdit value={profile.email} onSave={(val) => updateProfile('email', val)} />
          </span>
          <span className="social__link">
            <i className='bx bx-phone'></i> 
            <InlineEdit value={profile.phone} onSave={(val) => updateProfile('phone', val)} />
          </span>
          <span className="social__link">
            <i className='bx bxl-linkedin-square'></i> 
            <InlineEdit value={profile.linkedin} onSave={(val) => updateProfile('linkedin', val)} />
          </span>
          <span className="social__link">
            <i className='bx bxl-github'></i> 
            <InlineEdit value={profile.github} onSave={(val) => updateProfile('github', val)} />
          </span>
        </div>
      </section>

      <section className="profile section" id="about">
        <h2 className="section-title">Perfil Profesional</h2>
        <p className="profile__description">
          <InlineEdit 
            value={profile.description} 
            onSave={(val) => updateProfile('description', val)} 
            multiline 
          />
        </p>
      </section>
    </>
  );
};

export default CVHeader;
