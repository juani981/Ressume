import { SPACING_LIMITS, DEFAULT_LINE_HEIGHT } from '../constants/spacing.js';
import { TYPOGRAPHY_SCALE_LIMITS, DEFAULT_FONT_FAMILY_NAME } from '../constants/typography.js';

export const defaultSchema = {
  layout: {
    type: '2-column', // '1-column' (ATS Optimized) or '2-column' (Visual Recruiter)
    isAtsMode: false, // true when ATS 1-column mode is activated
    leftBg: '', // empty means it uses CSS defaults
    rightBg: '',
    leftColumnWidth: null, // null defaults to 1fr 2fr (approx 33% / 67%)
    fontFamily: DEFAULT_FONT_FAMILY_NAME, // 'Poppins' | 'Inter' | 'Roboto' | 'Merriweather' | 'JetBrains Mono'
    fontScale: TYPOGRAPHY_SCALE_LIMITS.fontScale.default, // 0.85 to 1.25 (Master overall scale)
    titleScale: TYPOGRAPHY_SCALE_LIMITS.titleScale.default, // 0.80 to 1.40 (Global Titles scale)
    bodyScale: TYPOGRAPHY_SCALE_LIMITS.bodyScale.default, // 0.80 to 1.30 (Global Body text scale)
    listScale: TYPOGRAPHY_SCALE_LIMITS.listScale.default, // 0.80 to 1.30 (Global Lists and bullets scale)
    lineHeight: DEFAULT_LINE_HEIGHT, // 1.15 to 1.85
    pagePadding: SPACING_LIMITS.pagePadding.default,
    sectionGap: SPACING_LIMITS.sectionGap.default,
    itemGap: SPACING_LIMITS.itemGap.default
  },
  profile: {
    name: "TU NOMBRE Y APELLIDO",
  },
  sections: [
    {
      id: "profile_header",
      column: "left",
      type: "profile_header",
      title: "",
      items: [
        {
          id: "prof1",
          name: "TU NOMBRE Y APELLIDO",
          subtitle: "Título Profesional / Especialidad"
        }
      ]
    },
    {
      id: "contact",
      column: "left",
      type: "contact",
      title: "",
      items: [
        {
          id: "contact1",
          location: "Ciudad, País",
          email: "tuemail@ejemplo.com",
          phone: "+00 123 456 789",
          linkedin: "linkedin.com/in/tu-perfil",
          github: "github.com/tu-usuario",
          contacts: [
            { id: "c_loc", type: "location", value: "Ciudad, País" },
            { id: "c_email", type: "email", value: "tuemail@ejemplo.com" },
            { id: "c_phone", type: "phone", value: "+00 123 456 789" },
            { id: "c_linkedin", type: "linkedin", value: "linkedin.com/in/tu-perfil" },
            { id: "c_github", type: "github", value: "github.com/tu-usuario" }
          ]
        }
      ]
    },
    {
      id: "about_section",
      column: "left",
      type: "about",
      title: "Perfil Profesional",
      items: [
        {
          id: "about1",
          description: "Resumen profesional destacando tus fortalezas, años de experiencia clave y objetivos profesionales. Haz clic en este texto para redactar tu presentación profesional."
        }
      ]
    },
    {
      id: "skills",
      column: "left",
      type: "skills",
      title: "HABILIDADES TÉCNICAS",
      items: [
        {
          id: "skill1",
          title: "Habilidades Técnicas",
          description: "Herramienta 1, Lenguaje 2, Tecnología 3, Framework 4, Metodologías."
        },
        {
          id: "skill2",
          title: "Habilidades Blandas",
          description: "Liderazgo, Trabajo en Equipo, Comunicación Efectiva, Resolución de Problemas."
        }
      ]
    },
    {
      id: "experience",
      column: "right",
      type: "list",
      title: "EXPERIENCIA LABORAL",
      bulletStyle: { size: "normal", variant: "bold", showLine: true },
      items: [
        {
          id: "exp1",
          title: "Cargo o Puesto de Trabajo",
          subtitle: "Nombre de la Empresa o Institución | Ubicación",
          date: "2023 – Actualidad",
          bullets: [
            "Describe una responsabilidad clave o logro alcanzado en el puesto.",
            "Detalla proyectos liderados, optimizaciones o impacto cuantitativo alcanzado."
          ]
        }
      ]
    },
    {
      id: "projects",
      column: "right",
      type: "list",
      title: "PROYECTOS DESTACADOS",
      bulletStyle: { size: "normal", variant: "bold", showLine: true },
      items: [
        {
          id: "proj1",
          title: "Nombre del Proyecto",
          subtitle: "Rol en el proyecto | Tecnologías clave",
          link: "enlace-o-repositorio.com",
          description: "Breve descripción del problema abordado, tecnologías implementadas y resultados obtenidos."
        }
      ]
    },
    {
      id: "education",
      column: "left",
      type: "education",
      title: "EDUCACIÓN",
      bulletStyle: { size: "normal", variant: "bold", showLine: true },
      items: [
        {
          id: "edu1",
          title: "Título Académico o Grado",
          subtitle: "Universidad o Entidad Educativa",
          date: "Año de Graduación"
        }
      ]
    },
    {
      id: "certificates",
      column: "right",
      type: "simple_list",
      title: "CERTIFICACIONES",
      items: [
        { id: "cert1", text: "Certificación Profesional o Diplomatura (Institución, Año)" }
      ]
    },
    {
      id: "languages",
      column: "left",
      type: "simple_list",
      title: "IDIOMAS",
      items: [
        { id: "lang1", text: "Español: Nativo" },
        { id: "lang2", text: "Inglés: Profesional" }
      ]
    }
  ]
};

export const defaultLayout = defaultSchema.layout;

export const blankSchema = JSON.parse(JSON.stringify(defaultSchema));
