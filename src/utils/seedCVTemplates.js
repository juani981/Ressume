import { defaultSchema } from './schema';

const seedProfiles = [
  {
    name: 'Ada Lovelace',
    subtitle: 'Matemática y pionera de la computación',
    summary: 'Matemática británica reconocida por sus notas sobre la Máquina Analítica de Charles Babbage. En 1843 publicó un método para calcular números de Bernoulli, considerado uno de los primeros algoritmos concebidos para ser ejecutados por una máquina.',
    skills: [
      ['Matemáticas', 'Álgebra, lógica y análisis'],
      ['Computación teórica', 'Algoritmos y máquinas de propósito general'],
      ['Comunicación científica', 'Traducción y anotación de trabajos técnicos'],
    ],
    experience: [
      {
        title: 'Autora de las Notas sobre la Máquina Analítica',
        subtitle: 'Publicación de Luigi Menabrea traducida y ampliada',
        date: '1843',
        bullets: [
          'Añadió un conjunto extenso de notas que explicaban las posibilidades de la máquina propuesta por Babbage.',
          'Describió un procedimiento para calcular números de Bernoulli mediante operaciones de la máquina.',
        ],
      },
    ],
    projects: [
      {
        title: 'Algoritmo para números de Bernoulli',
        subtitle: 'Máquina Analítica · Algoritmos',
        date: '1843',
        description: 'Procedimiento publicado en las Notas sobre la Máquina Analítica; la máquina nunca llegó a construirse durante su vida.',
        bullets: ['Explicó cómo una máquina programable podría manipular símbolos además de cantidades numéricas.'],
      },
    ],
    education: [
      {
        title: 'Estudios de matemáticas y ciencias',
        subtitle: 'Tutorías privadas en el Reino Unido',
        date: 'Década de 1830',
      },
    ],
  },
  {
    name: 'Alan Turing',
    subtitle: 'Matemático y teórico de la computación',
    summary: 'Matemático británico cuyas contribuciones abarcaron la computabilidad, la criptografía y el diseño de computadoras. Su trabajo durante la Segunda Guerra Mundial en Bletchley Park contribuyó al descifrado de comunicaciones cifradas con Enigma.',
    skills: [
      ['Fundamentos', 'Computabilidad, lógica y máquinas de Turing'],
      ['Criptografía', 'Criptoanálisis y métodos de descifrado'],
      ['Computación', 'Diseño conceptual de computadoras y programación'],
    ],
    experience: [
      {
        title: 'Criptoanalista',
        subtitle: 'Government Code and Cypher School · Bletchley Park',
        date: '1939–1945',
        bullets: [
          'Trabajó en métodos y máquinas para ayudar a descifrar mensajes alemanes cifrados con Enigma.',
          'Contribuyó al desarrollo de la Bombe británica junto con otros equipos de criptoanalistas e ingenieros.',
        ],
      },
      {
        title: 'Investigador y diseñador de computadoras',
        subtitle: 'National Physical Laboratory',
        date: '1945–1948',
        bullets: ['Preparó el diseño lógico de la Automatic Computing Engine (ACE), una propuesta de computadora electrónica de programa almacenado.'],
      },
    ],
    projects: [
      {
        title: 'Máquina de Turing',
        subtitle: 'Modelo matemático de computación',
        date: '1936',
        description: 'Modelo abstracto presentado en su trabajo sobre números computables y el problema de decisión.',
        bullets: ['Formalizó una manera de razonar sobre procedimientos computables y sus límites.'],
      },
    ],
    education: [
      { title: 'Licenciatura en Matemáticas', subtitle: 'King’s College, Universidad de Cambridge', date: '1934' },
      { title: 'Doctorado en Matemáticas', subtitle: 'Universidad de Princeton', date: '1938' },
    ],
  },
  {
    name: 'Grace Hopper',
    subtitle: 'Matemática, científica informática y oficial naval',
    summary: 'Matemática estadounidense y contraalmirante de la Marina de los Estados Unidos. Impulsó el desarrollo de compiladores y lenguajes de programación más cercanos al lenguaje humano, y participó en el trabajo que condujo a COBOL.',
    skills: [
      ['Lenguajes', 'Compiladores, FLOW-MATIC y COBOL'],
      ['Computación', 'Programación, documentación y sistemas'],
      ['Liderazgo', 'Estándares técnicos y formación de equipos'],
    ],
    experience: [
      {
        title: 'Programadora del Harvard Mark I',
        subtitle: 'Bureau of Ordnance · Harvard University',
        date: '1944–1949',
        bullets: ['Trabajó en la programación de la computadora electromecánica Mark I durante la Segunda Guerra Mundial.'],
      },
      {
        title: 'Investigadora y desarrolladora de compiladores',
        subtitle: 'Remington Rand y equipos de estandarización',
        date: '1952–década de 1960',
        bullets: [
          'Desarrolló el compilador A-0 y promovió la traducción de instrucciones simbólicas a código ejecutable.',
          'Desarrolló FLOW-MATIC, una influencia importante en el diseño de COBOL, y contribuyó a su estandarización.',
        ],
      },
    ],
    projects: [
      {
        title: 'FLOW-MATIC',
        subtitle: 'Lenguaje de programación orientado a aplicaciones comerciales',
        date: '1955–1959',
        description: 'Lenguaje que acercó la programación a expresiones legibles y cuya experiencia influyó en COBOL.',
        bullets: ['Ayudó a demostrar que los programas podían describirse con palabras y estructuras más accesibles.'],
      },
    ],
    education: [
      { title: 'Licenciatura en Matemáticas y Física', subtitle: 'Vassar College', date: '1928' },
      { title: 'Máster y doctorado en Matemáticas', subtitle: 'Yale University', date: '1930 y 1934' },
    ],
  },
  {
    name: 'Margaret Hamilton',
    subtitle: 'Científica informática e ingeniera de software',
    summary: 'Científica informática estadounidense que dirigió equipos de ingeniería de software en el MIT Instrumentation Laboratory. Su trabajo incluyó el software de vuelo de las misiones Apollo y ayudó a consolidar la ingeniería de software como disciplina.',
    skills: [
      ['Ingeniería de software', 'Sistemas críticos y software de vuelo'],
      ['Sistemas', 'Priorización de tareas y recuperación ante errores'],
      ['Liderazgo técnico', 'Diseño, verificación y dirección de equipos'],
    ],
    experience: [
      {
        title: 'Directora de la División de Ingeniería de Software',
        subtitle: 'MIT Instrumentation Laboratory · Programa Apollo',
        date: '1960–1970',
        bullets: [
          'Dirigió el desarrollo del software de vuelo a bordo para el programa Apollo.',
          'El diseño permitió priorizar tareas esenciales y recuperarse de sobrecargas durante el alunizaje del Apollo 11.',
        ],
      },
      {
        title: 'Fundadora y directora ejecutiva',
        subtitle: 'Hamilton Technologies, Inc.',
        date: '1986',
        bullets: ['Fundó una compañía dedicada a métodos y herramientas para el desarrollo de sistemas y software.'],
      },
    ],
    projects: [
      {
        title: 'Software de vuelo Apollo',
        subtitle: 'MIT Instrumentation Laboratory · NASA',
        date: 'Década de 1960',
        description: 'Software de navegación y control utilizado por las misiones Apollo.',
        bullets: ['Contribuyó a prácticas de ingeniería para sistemas críticos con tolerancia a fallos y priorización de tareas.'],
      },
    ],
    education: [
      { title: 'Licenciatura en Matemáticas', subtitle: 'Earlham College', date: '1958' },
    ],
  },
  {
    name: 'Dennis Ritchie',
    subtitle: 'Científico informático y creador de C',
    summary: 'Científico informático estadounidense de Bell Labs. Creó el lenguaje C y, junto con Ken Thompson y otros colaboradores, desarrolló Unix, dos aportes que influyeron profundamente en los sistemas operativos y herramientas de software.',
    skills: [
      ['Lenguajes', 'Diseño e implementación de C'],
      ['Sistemas', 'Unix, sistemas operativos y herramientas'],
      ['Investigación', 'Computación, documentación técnica y colaboración'],
    ],
    experience: [
      {
        title: 'Investigador en ciencias de la computación',
        subtitle: 'Bell Labs',
        date: '1967–2007',
        bullets: [
          'Creó C como parte del trabajo de desarrollo de sistemas en Bell Labs.',
          'Colaboró en el desarrollo de Unix, inicialmente junto con Ken Thompson y otros integrantes del equipo.',
        ],
      },
    ],
    projects: [
      {
        title: 'Lenguaje C',
        subtitle: 'Lenguaje de programación de sistemas',
        date: '1969–1973',
        description: 'Lenguaje desarrollado en Bell Labs y documentado en The C Programming Language, escrito con Brian Kernighan.',
        bullets: ['Ofreció abstracciones portables para desarrollar sistemas y herramientas de bajo nivel.'],
      },
      {
        title: 'Sistema operativo Unix',
        subtitle: 'Bell Labs · colaboración con Ken Thompson y otros',
        date: 'Desde 1969',
        description: 'Sistema operativo multiusuario y multitarea que estableció ideas y herramientas ampliamente adoptadas.',
        bullets: ['La reescritura de Unix en C facilitó su adaptación a distintas máquinas.'],
      },
    ],
    education: [
      { title: 'Licenciatura en Física y Matemáticas Aplicadas', subtitle: 'Harvard University', date: '1963' },
      { title: 'Doctorado en Matemáticas Aplicadas', subtitle: 'Harvard University', date: '1968' },
    ],
  },
  {
    name: 'Richard Stallman',
    subtitle: 'Programador y activista del software libre',
    summary: 'Programador estadounidense que inició el Proyecto GNU en 1983 y fundó la Free Software Foundation en 1985. Su trabajo y defensa de las libertades de los usuarios contribuyeron al desarrollo de herramientas GNU y a la difusión de licencias de software libre.',
    skills: [
      ['Programación', 'Compiladores, editores y herramientas de desarrollo'],
      ['Software libre', 'Licencias, copyleft y libertades de los usuarios'],
      ['Proyectos', 'Diseño y coordinación de herramientas colaborativas'],
    ],
    experience: [
      {
        title: 'Programador en el MIT Artificial Intelligence Laboratory',
        subtitle: 'Massachusetts Institute of Technology',
        date: '1971–1984',
        bullets: ['Participó en el desarrollo de software y herramientas del laboratorio antes de iniciar el Proyecto GNU.'],
      },
      {
        title: 'Fundador del Proyecto GNU y de la Free Software Foundation',
        subtitle: 'Proyecto de software libre',
        date: '1983–',
        bullets: [
          'Inició GNU para crear un sistema operativo compatible con Unix compuesto por software libre.',
          'Fundó la Free Software Foundation y promovió licencias copyleft, incluida la GNU General Public License.',
        ],
      },
    ],
    projects: [
      {
        title: 'GNU Emacs y GNU Compiler Collection',
        subtitle: 'Herramientas del Proyecto GNU',
        date: '1984 (GNU Emacs) · 1987 (GCC)',
        description: 'Herramientas de software libre que Stallman inició y desarrolló junto con comunidades de colaboradores.',
        bullets: ['Contribuyó a herramientas ampliamente utilizadas para edición de texto y compilación de programas.'],
      },
    ],
    education: [
      { title: 'Estudios de Física', subtitle: 'Harvard University', date: '1970–1974' },
    ],
  },
];

const createSeedCV = (seed) => {
  const cv = JSON.parse(JSON.stringify(defaultSchema));
  cv.profile = { name: seed.name, subtitle: seed.subtitle };
  cv.sections = [
    {
      id: 'profile_header',
      type: 'profile_header',
      title: '',
      column: 'left',
      items: [{ id: 'seed_profile', name: seed.name, subtitle: seed.subtitle }],
    },
    {
      id: 'contact',
      type: 'contact',
      title: '',
      column: 'left',
      items: [
        {
          id: 'seed_contact',
          location: 'Ciudad, País',
          email: 'tuemail@ejemplo.com',
          phone: '+00 123 456 789',
          linkedin: 'linkedin.com/in/tu-perfil',
          github: 'github.com/tu-usuario',
          contacts: [
            { id: 'c_loc', type: 'location', value: 'Ciudad, País' },
            { id: 'c_email', type: 'email', value: 'tuemail@ejemplo.com' },
            { id: 'c_phone', type: 'phone', value: '+00 123 456 789' },
            { id: 'c_linkedin', type: 'linkedin', value: 'linkedin.com/in/tu-perfil' },
            { id: 'c_github', type: 'github', value: 'github.com/tu-usuario' },
          ],
        },
      ],
    },
    {
      id: 'about_section',
      type: 'about',
      title: 'PERFIL PROFESIONAL',
      column: 'left',
      items: [{ id: 'seed_about', description: seed.summary }],
    },
    {
      id: 'skills',
      type: 'skills',
      title: 'HABILIDADES TÉCNICAS',
      column: 'left',
      items: seed.skills.map(([title, description], index) => ({
        id: `seed_skill_${index + 1}`,
        title,
        description,
      })),
    },
    {
      id: 'experience',
      type: 'list',
      title: 'EXPERIENCIA LABORAL',
      column: 'right',
      items: seed.experience.map((item, index) => ({ id: `seed_exp_${index + 1}`, ...item })),
    },
    {
      id: 'projects',
      type: 'projects',
      title: 'PROYECTOS DESTACADOS',
      column: 'right',
      items: seed.projects.map((item, index) => ({ id: `seed_project_${index + 1}`, ...item })),
    },
    {
      id: 'education',
      type: 'education',
      title: 'EDUCACIÓN',
      column: 'right',
      items: seed.education.map((item, index) => ({ id: `seed_education_${index + 1}`, ...item })),
    },
  ];
  return cv;
};

export const seedCVTemplateNames = seedProfiles.map(({ name }) => name);

export const getRandomSeedCV = (random = Math.random) => {
  const index = Math.floor(random() * seedProfiles.length);
  return createSeedCV(seedProfiles[index]);
};
