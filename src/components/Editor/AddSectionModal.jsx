import React, { useState, useEffect } from 'react';
import { useCV } from '../../context/CVContext';
import { getAllSectionDescriptors } from '../../registry/sectionRegistry';
import { 
  X, 
  Briefcase, 
  FolderGit2, 
  GraduationCap, 
  Wrench, 
  Award, 
  Languages, 
  Trophy, 
  BookOpen, 
  HeartHandshake, 
  Users, 
  ListCheck, 
  UserSquare2,
  Plus
} from 'lucide-react';

const iconMap = {
  'profile_header': UserSquare2,
  'about': UserSquare2,
  'list': Briefcase,
  'projects': FolderGit2,
  'education': GraduationCap,
  'skills': Wrench,
  'certificates': Award,
  'languages': Languages,
  'awards': Trophy,
  'publications': BookOpen,
  'volunteering': HeartHandshake,
  'references': Users,
  'simple_list': ListCheck
};

/**
 * AddSectionModal — Floating Section Selection Panel (Epic 3)
 *
 * Positions floating to the right of #area-cv container using available viewport space
 * instead of centering over the CV document. Strictly follows AGENTS.md Rule 3.
 */
const AddSectionModal = ({ isOpen, onClose, targetColumn = 'right' }) => {
  const { addSection } = useCV();
  const [initialBulletStyle, setInitialBulletStyle] = useState({
    size: 'normal',
    variant: 'bold',
    showLine: true
  });
  const [panelStyle, setPanelStyle] = useState({
    position: 'fixed',
    right: '20px',
    top: '20px',
    width: '360px',
    maxHeight: 'calc(100vh - 40px)',
    zIndex: 1000
  });

  useEffect(() => {
    if (!isOpen) return;

    const computePosition = () => {
      const areaCv = document.getElementById('area-cv');
      const winWidth = window.innerWidth || 1024;
      const winHeight = window.innerHeight || 768;

      if (areaCv) {
        const cvRect = areaCv.getBoundingClientRect();
        const availableRight = winWidth - cvRect.right;

        // If sufficient space exists between #area-cv and viewport right edge
        if (availableRight >= 260) {
          // Float to the right of #area-cv without overlaying it
          const left = cvRect.right + 16;
          const width = Math.min(380, Math.max(260, availableRight - 32));
          const top = Math.max(16, Math.min(cvRect.top, winHeight - 480));
          const maxHeight = Math.min(winHeight - top - 16, 720);

          setPanelStyle({
            position: 'fixed',
            left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            maxHeight: `${maxHeight}px`,
            zIndex: 1000
          });
        } else {
          // Narrow viewport fallback: dock to the right side of the screen
          setPanelStyle({
            position: 'fixed',
            right: '16px',
            top: '16px',
            width: 'min(360px, calc(100vw - 32px))',
            maxHeight: 'calc(100vh - 32px)',
            zIndex: 1000
          });
        }
      } else {
        setPanelStyle({
          position: 'fixed',
          right: '24px',
          top: '24px',
          width: '360px',
          maxHeight: 'calc(100vh - 48px)',
          zIndex: 1000
        });
      }
    };

    computePosition();
    window.addEventListener('resize', computePosition);
    window.addEventListener('scroll', computePosition);
    return () => {
      window.removeEventListener('resize', computePosition);
      window.removeEventListener('scroll', computePosition);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const descriptors = getAllSectionDescriptors().filter(d => d.type !== 'profile_header');

  const handleSelectType = (desc) => {
    const col = targetColumn || desc.defaultColumn || 'right';
    addSection(col, desc.type, desc.defaultTitle, initialBulletStyle);
    onClose();
  };

  return (
    <>
      {/* Non-obstructive transparent backdrop for closing on outside click */}
      <div 
        onClick={onClose}
        data-testid="add-section-backdrop"
        className="add-section-backdrop no-print"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.05)',
          zIndex: 999
        }}
      />

      {/* Floating Panel Docked to the Right of #area-cv */}
      <div 
        data-testid="add-section-modal"
        className="add-section-floating-panel no-print"
        style={{
          ...panelStyle,
          background: 'var(--container-color, #ffffff)',
          color: 'var(--title-color, #0f172a)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 48px -8px rgba(0, 0, 0, 0.22)',
          border: '1px solid rgba(0, 0, 0, 0.12)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid rgba(150, 150, 150, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(56, 116, 255, 0.04)'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} color="#3874ff" /> Añadir Sección al CV
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: 'var(--text-color-light, #64748b)' }}>
              Destino: {targetColumn === 'left' ? 'Columna Lateral' : 'Columna Principal'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-color-light, #888)',
              padding: '0.35rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Bullet & Timeline Initial Style Selector */}
        <div 
          style={{ 
            padding: '0.5rem 1rem 0.5rem 1rem', 
            borderBottom: '1px solid rgba(0,0,0,0.06)', 
            background: 'var(--container-color-alt, #f8fafc)',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '5px' 
          }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-color-light, #64748b)' }}>
            Estilo del círculo (título timeline):
          </div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {/* Size toggle */}
            <button
              type="button"
              onClick={() => setInitialBulletStyle(prev => ({ ...prev, size: prev.size === 'large' ? 'normal' : 'large' }))}
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '4px',
                border: initialBulletStyle.size === 'large' ? '1.5px solid #0f172a' : '1px solid rgba(0,0,0,0.12)',
                background: initialBulletStyle.size === 'large' ? '#0f172a' : 'var(--container-color, #ffffff)',
                color: initialBulletStyle.size === 'large' ? '#ffffff' : 'var(--text-color, #475569)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Alternar tamaño del círculo"
            >
              {initialBulletStyle.size === 'large' ? '● Grande' : '• Normal'}
            </button>
            {/* Variant buttons */}
            {[
              { id: 'bold', label: 'Negro' },
              { id: 'gray', label: 'Gris' },
              { id: 'circle', label: 'Anillo' }
            ].map(v => {
              const isActive = initialBulletStyle.variant === v.id || 
                (v.id === 'bold' && initialBulletStyle.variant === 'black') || 
                (v.id === 'circle' && initialBulletStyle.variant === 'ring');
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setInitialBulletStyle(prev => ({ ...prev, variant: v.id }))}
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: isActive ? '1.5px solid #0f172a' : '1px solid rgba(0,0,0,0.12)',
                    background: isActive ? '#0f172a' : 'var(--container-color, #ffffff)',
                    color: isActive ? '#ffffff' : 'var(--text-color, #475569)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {v.label}
                </button>
              );
            })}
            {/* Line toggle */}
            <button
              type="button"
              onClick={() => setInitialBulletStyle(prev => ({ ...prev, showLine: !prev.showLine }))}
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '4px',
                border: initialBulletStyle.showLine ? '1.5px solid #0f172a' : '1px solid rgba(0,0,0,0.12)',
                background: initialBulletStyle.showLine ? '#0f172a' : 'var(--container-color, #ffffff)',
                color: initialBulletStyle.showLine ? '#ffffff' : 'var(--text-color, #475569)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Alternar línea conectora vertical"
            >
              {initialBulletStyle.showLine ? 'Con línea' : 'Sin línea'}
            </button>
          </div>
        </div>

        {/* Section Cards List */}
        <div style={{
          padding: '1rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem'
        }}>
          {descriptors.map((desc) => {
            const IconComp = iconMap[desc.type] || Briefcase;

            return (
              <div
                key={desc.type}
                onClick={() => handleSelectType(desc)}
                data-testid={`add-section-card-${desc.type}`}
                className="add-section-card"
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(150, 150, 150, 0.18)',
                  background: 'var(--body-color, #fafafa)',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: 'rgba(56, 116, 255, 0.1)',
                      color: '#3874ff',
                      flexShrink: 0
                    }}>
                      <IconComp size={16} />
                    </div>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--title-color)' }}>
                      {desc.label}
                    </span>
                  </div>

                  <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.74rem', color: '#3874ff', fontWeight: 600 }}>
                    <Plus size={13} /> Añadir
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-color-light, #64748b)', lineHeight: 1.35 }}>
                  {desc.type === 'projects' && 'Muestra desarrollos destacados, apps, repositorios GitHub y stack.'}
                  {desc.type === 'list' && 'Historial laboral, puestos de trabajo, funciones y responsabilidades.'}
                  {desc.type === 'education' && 'Titulaciones universitarias, carreras, posgrados y academias.'}
                  {desc.type === 'skills' && 'Agrupación de habilidades técnicas, frameworks y herramientas.'}
                  {desc.type === 'certificates' && 'Licencias oficiales, certificaciones de la industria e IDs.'}
                  {desc.type === 'languages' && 'Idiomas dominados con badges de nivel de fluidez (CEFR / EF SET).'}
                  {desc.type === 'awards' && 'Premios, reconocimientos en hackathons y distinciones.'}
                  {desc.type === 'publications' && 'Papers científicos, artículos técnicos y conferencias.'}
                  {desc.type === 'volunteering' && 'Experiencia comunitaria, voluntariado y causas sociales.'}
                  {desc.type === 'references' && 'Contactos de confianza y datos de recomendación.'}
                  {desc.type === 'about' && 'Resumen profesional sobre tu perfil y objetivos.'}
                  {desc.type === 'simple_list' && 'Lista simple con viñetas limpias para cursos rápidos o menciones.'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default AddSectionModal;
