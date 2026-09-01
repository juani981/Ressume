export const defaultSchema = {
  layout: {
    type: '2-column', // '1-column' or '2-column'
    leftBg: '', // empty means it uses CSS defaults
    rightBg: ''
  },
  profile: {
    name: "JUAN IGNACIO CARRIZO",
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
          name: "JUAN IGNACIO CARRIZO",
          subtitle: "Desarrollador Full-Stack | Backend & Bases de Datos",
          location: "San Miguel de Tucumán, Argentina",
          email: "juanicarrizo97@gmail.com",
          phone: "+54 9 381 6706133",
          linkedin: "linkedin.com/in/juan-ignacio-carrizo-juani981",
          github: "github.com/juani981"
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
          description: "Desarrollador Full-Stack con sólida experiencia en backend (.NET, C#, PHP, Laravel) y gestión avanzada de bases de datos relacionales (Oracle, PostgreSQL, MySQL). Especializado en modernización de sistemas legacy, optimización de consultas SQL/PL-SQL y automatización de flujos de trabajo mediante Docker y pipelines CI/CD con GitHub Actions. Titulado como Programador Universitario y cursando la etapa final de Ingeniería en Informática."
        }
      ]
    },
    {
      id: "experience",
      column: "right",
      type: "list",
      title: "EXPERIENCIA LABORAL",
      items: [
        {
          id: "exp1",
          title: "Desarrollador Web Full-Stack (PHP, Laravel, JS)",
          subtitle: "Dirección General de Catastro | San Miguel de Tucumán",
          date: "2025 – Actualidad",
          bullets: [
            "Lidero la modernización y refactorización de sistemas legacy desarrollados en PHP, Laravel, JavaScript y Visual Basic.",
            "Optimizo el rendimiento de bases de datos relacionales mediante el análisis de planes de ejecución, reestructuración de consultas complejas y diseño de índices.",
            "Configuro y despliego entornos de desarrollo y testing contenerizados con Docker, automatizando pipelines de CI/CD para integración continua.",
            "Estandarizo flujos de trabajo en el equipo mediante la redacción de guías técnicas de buenas prácticas en Git, pruebas y control de versiones."
          ]
        },
        {
          id: "exp2",
          title: "Pasante de Soporte Técnico (IT)",
          subtitle: "Dirección General de Catastro | San Miguel de Tucumán",
          date: "Julio 2023 – Enero 2024",
          bullets: [
            "Instalación, configuración y mantenimiento de sistemas operativos Windows y aplicaciones institucionales.",
            "Diagnóstico y reparación de hardware en estaciones de trabajo, impresoras y equipamiento de infraestructura.",
            "Despliegue y configuración de dispositivos de red local, incluyendo switches, cámaras de seguridad y puntos de acceso (Access Points)."
          ]
        },
        {
          id: "exp3",
          title: "Técnico en Electrónica y Microelectrónica",
          subtitle: "Freelance | Tucumán, Argentina",
          date: "2023 – Actualidad",
          bullets: [
            "Diagnóstico y reparación a nivel componente (SMD/THT) de equipamiento informático y circuitos electrónicos.",
            "Administración del flujo de trabajo, gestión de inventario y emisión de presupuestos mediante sistema de tickets."
          ]
        }
      ]
    },
    {
      id: "projects",
      column: "right",
      type: "list",
      title: "PROYECTOS DESTACADOS",
      items: [
        {
          id: "proj1",
          title: "Sitio Dinámico de Creación y Gestión de Encuestas (React, Laravel)",
          subtitle: "Proyecto de Graduación — Programador Universitario | Octubre 2024",
          link: "github.com/juani981/WebEncuestas-Demo",
          description: "Lideré el desarrollo Front-End para un sitio web dinámico de creación de encuestas utilizando React, Material UI y Laravel. Lideré la gestión Agile del proyecto en ClickUp. Documenté el diseño lógico de la base de datos, diagramas UML, diseño de interfaz con Figma y casos de uso. Implementé y mantuve el estandar de los flujos de git."
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
          title: "Lenguajes y Frameworks",
          description: "PHP (Laravel), C# (.NET), JavaScript (React, jQuery), Python, HTML5, CSS3, Bootstrap, Material UI."
        },
        {
          id: "skill2",
          title: "Bases de Datos",
          description: "Oracle (PL/SQL, Stored Procedures, Triggers), PostgreSQL, MySQL, SQLite, Optimización de Queries e Índices."
        },
        {
          id: "skill3",
          title: "DevOps y Herramientas",
          description: "Docker, CI/CD (GitHub Actions), Git, GitHub, Bitbucket, Linux, Ansible, Terraform."
        },
        {
          id: "skill4",
          title: "Metodologías y Gestión",
          description: "Scrum, ClickUp, Trello, Figma, Postman."
        }
      ]
    },
    {
      id: "education",
      column: "left",
      type: "education",
      title: "EDUCACIÓN",
      items: [
        {
          id: "edu1",
          title: "Ingeniería en Informática (En etapa de tesis final)",
          subtitle: "Universidad Nacional de Tucumán (UNT) – Facultad de Ciencias Exactas y Tecnología",
          date: "2023 – Actualidad"
        },
        {
          id: "edu2",
          title: "Programador Universitario (Graduado)",
          subtitle: "Universidad Nacional de Tucumán (UNT) – Facultad de Ciencias Exactas y Tecnología",
          date: "2021 – 2024"
        }
      ]
    },
    {
      id: "certificates",
      column: "right",
      type: "simple_list",
      title: "CERTIFICACIONES",
      items: [
        { id: "cert1", text: "Diplomatura en Ingeniería de Datos de Alto Rendimiento (CASE & MySQL/Percona) — UNT (2024)" },
        { id: "cert2", text: "Fundamentos de IA con IBM Watson Studio — Cisco Networking Academy (2025)" },
        { id: "cert3", text: "Introducción al Análisis de Datos con Python (Pandas, NumPy, Seaborn) — Desafío LATAM (2025)" },
        { id: "cert4", text: "Introducción a la Ciberseguridad — Cisco Networking Academy (2024)" }
      ]
    },
    {
      id: "languages",
      column: "left",
      type: "simple_list",
      title: "IDIOMAS",
      items: [
        { id: "lang1", text: "Inglés: Avanzado (C2 – Certificación EF SET)" },
        { id: "lang2", text: "Español: Nativo" }
      ]
    }
  ]
};
