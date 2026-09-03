import React from 'react';
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

const AddSectionModal = ({ isOpen, onClose, targetColumn = 'right' }) => {
  const { addSection } = useCV();

  if (!isOpen) return null;

  const descriptors = getAllSectionDescriptors().filter(d => d.type !== 'profile_header');

  const handleSelectType = (desc) => {
    const col = targetColumn || desc.defaultColumn || 'right';
    addSection(col, desc.type, desc.defaultTitle);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1.25rem'
    }}>
      <div style={{
        background: 'var(--container-color, #ffffff)',
        color: 'var(--title-color, #0f172a)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '820px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
        border: '1px solid rgba(150, 150, 150, 0.2)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(150, 150, 150, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(56, 116, 255, 0.03)'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={22} color="#3874ff" /> Añadir Nueva Sección al CV
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', color: 'var(--text-color-light, #64748b)' }}>
              Elige el bloque que mejor se adapte a tu perfil (columna destino: {targetColumn === 'left' ? 'Columna Izquierda / Lateral' : 'Columna Derecha / Principal'})
            </p>
          </div>

          <button
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
            <X size={20} />
          </button>
        </div>

        {/* Section Cards Grid */}
        <div style={{
          padding: '1.5rem',
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: '1rem'
        }}>
          {descriptors.map((desc) => {
            const IconComp = iconMap[desc.type] || Briefcase;

            return (
              <div
                key={desc.type}
                onClick={() => handleSelectType(desc)}
                style={{
                  padding: '1.15rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(150, 150, 150, 0.2)',
                  background: 'var(--body-color, #fafafa)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3874ff';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(56, 116, 255, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(150, 150, 150, 0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(56, 116, 255, 0.1)',
                    color: '#3874ff',
                    flexShrink: 0
                  }}>
                    <IconComp size={18} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--title-color)' }}>
                    {desc.label}
                  </h4>
                </div>

                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-color-light)', lineHeight: 1.4 }}>
                  {desc.type === 'projects' && 'Muestra desarrollos destacados, apps, repositorios GitHub, stack y logros.'}
                  {desc.type === 'list' && 'Historial laboral, puestos de trabajo, funciones y responsabilidades.'}
                  {desc.type === 'education' && 'Titulaciones universitarias, carreras, posgrados y academias.'}
                  {desc.type === 'skills' && 'Agrupación de habilidades técnicas, frameworks y herramientas.'}
                  {desc.type === 'certificates' && 'Licencias oficiales, certificaciones de la industria e IDs de verificación.'}
                  {desc.type === 'languages' && 'Idiomas dominados con badges de nivel de fluidez (CEFR / EF SET).'}
                  {desc.type === 'awards' && 'Premios, reconocimientos en hackathons, becas y distinciones.'}
                  {desc.type === 'publications' && 'Papers científicos, artículos técnicos, conferencias y enlaces DOI.'}
                  {desc.type === 'volunteering' && 'Experiencia comunitaria, causas sociales y mentoría.'}
                  {desc.type === 'references' && 'Contactos de confianza, cargos y datos de recomendación profesional.'}
                  {desc.type === 'about' && 'Resumen profesional sobre tu perfil y objetivos.'}
                  {desc.type === 'simple_list' && 'Lista simple con viñetas limpias para cursos rápidos o menciones.'}
                </p>

                <div style={{ marginTop: 'auto', paddingTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#3874ff', fontWeight: 600 }}>
                  <Plus size={14} /> Insertar sección
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AddSectionModal;
