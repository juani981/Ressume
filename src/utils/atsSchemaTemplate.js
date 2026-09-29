/**
 * src/utils/atsSchemaTemplate.js
 *
 * Canonical reference ATS 1-column schema template.
 * Moved into a dedicated module to ensure high maintainability and prevent
 * hardcoded clutter inside aiExporter.js prompt generation pipelines.
 */

export const getAtsGoldenSchemaTemplate = (lang = 'es') => {
  const isEn = lang === 'en';
  return {
    layout: {
      type: '1-column',
      isAtsMode: true,
      fontFamily: 'Inter',
      fontScale: 1.0,
      titleScale: 1.0,
      bodyScale: 1.0,
      listScale: 1.0,
      lineHeight: 1.45,
      pagePadding: 24,
      sectionGap: 20,
      itemGap: 8
    },
    profile: {
      name: isEn ? 'Margaret Hamilton' : 'Margaret Hamilton',
      subtitle: isEn ? 'Senior Lead Software & Systems Architect' : 'Arquitecta de Software y Sistemas Senior'
    },
    sections: [
      {
        id: 'profile_header',
        type: 'profile_header',
        title: '',
        column: 'left',
        items: [
          {
            id: 'prof_header_item',
            name: 'Margaret Hamilton',
            subtitle: isEn ? 'Senior Lead Software & Systems Architect' : 'Arquitecta de Software y Sistemas Senior',
            contacts: [
              { id: 'c1', type: 'email', value: 'margaret.hamilton@mit.edu' },
              { id: 'c2', type: 'phone', value: '+1 617 253 1000' },
              { id: 'c3', type: 'location', value: isEn ? 'Cambridge, MA, USA' : 'Cambridge, MA, EE.UU.' },
              { id: 'c4', type: 'linkedin', value: 'https://linkedin.com/in/margaret-hamilton' },
              { id: 'c5', type: 'github', value: 'https://github.com/m-hamilton' }
            ]
          }
        ]
      },
      {
        id: 'about_section',
        type: 'about',
        title: isEn ? 'PROFESSIONAL SUMMARY' : 'PERFIL PROFESIONAL',
        column: 'left',
        items: [
          {
            id: 'about_item',
            description: isEn
              ? 'Results-driven Senior Software Engineer with 7+ years of experience designing and operating distributed systems, high-throughput microservices, and event-driven architectures in Tier-1 tech environments.'
              : 'Ingeniero de Software Senior con más de 7 años de experiencia diseñando y operando sistemas distribuidos, microservicios de alta concurrencia y arquitecturas reactivas en entornos tecnológicos competitivos.'
          }
        ]
      },
      {
        id: 'skills',
        type: 'skills',
        title: isEn ? 'TECHNICAL SKILLS' : 'HABILIDADES TÉCNICAS',
        column: 'left',
        items: [
          {
            id: 'skill_backend',
            title: isEn ? 'Languages & Backend' : 'Lenguajes & Backend',
            description: 'Java, Python, TypeScript, Node.js, Go'
          },
          {
            id: 'skill_databases',
            title: isEn ? 'Databases & In-Memory' : 'Bases de Datos & Caché',
            description: 'PostgreSQL, MongoDB, Redis, PL/SQL'
          },
          {
            id: 'skill_cloud',
            title: isEn ? 'Cloud & DevOps' : 'Cloud, DevOps & Infraestructura',
            description: 'AWS (ECS, S3, RDS), Docker, Kubernetes, CI/CD GitHub Actions'
          }
        ]
      },
      {
        id: 'experience',
        type: 'list',
        title: isEn ? 'WORK EXPERIENCE' : 'EXPERIENCIA LABORAL',
        column: 'right',
        items: [
          {
            id: 'exp_1',
            title: isEn ? 'Senior Backend Engineer' : 'Ingeniero Backend Senior',
            subtitle: 'Tech Global Corp',
            date: isEn ? 'Jan 2022 – Present' : 'Enero 2022 – Presente',
            location: isEn ? 'Remote' : 'Remoto',
            description: isEn ? 'Architectural leadership for distributed payment processing services.' : 'Liderazgo técnico en la arquitectura de microservicios de procesamiento de pagos.',
            bullets: [
              isEn
                ? 'Architected real-time event pipeline using Kafka and Go, reducing p99 API latency by 38% under 25,000 QPS.'
                : 'Diseñé e implementé pipeline de eventos en tiempo real con Kafka y Go, reduciendo la latencia p99 en un 38% bajo 25,000 QPS.',
              isEn
                ? 'Optimized relational queries and introduced multi-tier caching with Redis, saving $45,000/year in cloud database infrastructure.'
                : 'Optimicé consultas relacionales e introduje caché multi-capa con Redis, generando un ahorro de $45,000 anuales en infraestructura cloud.'
            ]
          }
        ]
      },
      {
        id: 'projects',
        type: 'list',
        title: isEn ? 'FEATURED PROJECTS' : 'PROYECTOS DESTACADOS',
        column: 'right',
        items: [
          {
            id: 'proj_1',
            title: isEn ? 'High-Throughput Distributed Rate Limiter' : 'Limitador de Tasa Distribuido de Alto Throughput',
            subtitle: 'Go, Redis, Docker, gRPC',
            date: '2023',
            link: 'https://github.com/username/rate-limiter',
            description: isEn ? 'Open-source distributed sliding-window token bucket implementation.' : 'Implementación open-source de token bucket con ventana deslizante.',
            bullets: [
              isEn
                ? 'Engineered lock-free atomic Redis Lua scripts handling 50,000 requests/sec with zero race conditions.'
                : 'Desarrollé scripts atómicos en Lua para Redis soportando 50,000 req/s con cero condiciones de carrera.'
            ]
          }
        ]
      },
      {
        id: 'education',
        type: 'education',
        title: isEn ? 'EDUCATION' : 'EDUCACIÓN',
        column: 'right',
        items: [
          {
            id: 'edu_1',
            title: isEn ? 'B.S. in Computer Science / Software Engineering' : 'Licenciatura en Ciencias de la Computación / Ingeniería de Sistemas',
            subtitle: 'University of Buenos Aires',
            date: '2016 – 2021',
            location: 'Buenos Aires, Argentina'
          }
        ]
      },
      {
        id: 'certificates',
        type: 'simple_list',
        title: isEn ? 'CERTIFICATIONS' : 'CERTIFICACIONES',
        column: 'right',
        items: [
          {
            id: 'cert_1',
            text: 'AWS Certified Solutions Architect – Associate (2023)'
          }
        ]
      },
      {
        id: 'languages',
        type: 'simple_list',
        title: isEn ? 'LANGUAGES' : 'IDIOMAS',
        column: 'left',
        items: [
          {
            id: 'lang_1',
            text: isEn ? 'Spanish: Native' : 'Español: Nativo'
          },
          {
            id: 'lang_2',
            text: isEn ? 'English: C1 Professional / Advanced' : 'Inglés: C1 Profesional / Avanzado'
          }
        ]
      }
    ]
  };
};
