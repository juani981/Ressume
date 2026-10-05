import { describe, it, expect } from 'vitest';
import esPrompts from '../locales/es/prompts.json' with { type: 'json' };
import enPrompts from '../locales/en/prompts.json' with { type: 'json' };
import { ALL_PROMPTS as aiKnowledgePrompts } from '../ai-knowledge/index.js';
import { 
  exportToAIMarkdown, 
  exportToAIJson, 
  exportToAIXML, 
  exportToATSPlainText, 
  buildAIPromptPayload,
  getAtsGoldenSchemaTemplate
} from '../utils/aiExporter.js';
import { 
  sanitizeAndValidateCVSnapshot,
  validateCVSnapshot 
} from '../utils/versionValidator.js';
import { importUniversalCV } from '../utils/universalJsonImporter.js';

describe('AI Prompts Catalog & AI Exporter Test Suite', () => {

  // =========================================================================
  // Suite 1: Prompt Catalogs Schema Conformity & Bilingual Parity (R3 & R4)
  // =========================================================================
  describe('Suite 1: Prompt Catalogs Schema Conformity & Bilingual Parity', () => {

    it('T1.1: all three prompt catalog files contain exactly 13 prompts', () => {
      expect(esPrompts).toBeInstanceOf(Array);
      expect(enPrompts).toBeInstanceOf(Array);
      expect(aiKnowledgePrompts).toBeInstanceOf(Array);

      expect(esPrompts.length).toBe(13);
      expect(enPrompts.length).toBe(13);
      expect(aiKnowledgePrompts.length).toBe(13);
    });

    it('T1.2: exact 1:1 ID parity exists across ES, EN, and AI-Knowledge catalogs', () => {
      const esIds = esPrompts.map(p => p.id).sort();
      const enIds = enPrompts.map(p => p.id).sort();
      const aiIds = aiKnowledgePrompts.map(p => p.id).sort();

      expect(esIds).toEqual(enIds);
      expect(esIds).toEqual(aiIds);

      const expectedIds = [
        'behavioral_leadership_prep',
        'bring_your_own_cv',
        'career_upskilling_roadmap',
        'cold_outreach_generator',
        'job_matcher',
        'layout_advisor',
        'live_coding_coach',
        'recruiter_audit',
        'salary_negotiation_advisor',
        'star_enhancer',
        'system_design_simulator',
        'technical_interview',
        'translate_english'
      ].sort();

      expect(esIds).toEqual(expectedIds);
    });

    it('T1.3: all 6 new specialized IT tech prompts are present with valid categories', () => {
      const newTechPromptIds = [
        'system_design_simulator',
        'live_coding_coach',
        'behavioral_leadership_prep',
        'career_upskilling_roadmap',
        'cold_outreach_generator',
        'salary_negotiation_advisor'
      ];

      const validCategories = [
        'recruiter_audit',
        'customization',
        'content_enhancement',
        'interview_prep',
        'localization',
        'layout_advisor',
        'career_growth',
        'networking'
      ];

      newTechPromptIds.forEach(id => {
        const esPrompt = esPrompts.find(p => p.id === id);
        const enPrompt = enPrompts.find(p => p.id === id);
        const aiPrompt = aiKnowledgePrompts.find(p => p.id === id);

        expect(esPrompt).toBeDefined();
        expect(enPrompt).toBeDefined();
        expect(aiPrompt).toBeDefined();

        expect(validCategories).toContain(esPrompt.category);
        expect(validCategories).toContain(enPrompt.category);
        expect(validCategories).toContain(aiPrompt.category);
      });
    });

    it('T1.4: 100% of prompts have non-empty required fields and detailed output_format', () => {
      const catalogs = [
        { name: 'es', data: esPrompts },
        { name: 'en', data: enPrompts },
        { name: 'ai-knowledge', data: aiKnowledgePrompts }
      ];

      catalogs.forEach(({ name, data }) => {
        data.forEach(prompt => {
          // Required string fields
          expect(typeof prompt.id, `${name}: ${prompt.id} should have string id`).toBe('string');
          expect(prompt.id.trim().length).toBeGreaterThan(0);

          expect(typeof prompt.name, `${name}: ${prompt.id} should have string name`).toBe('string');
          expect(prompt.name.trim().length).toBeGreaterThan(0);

          expect(typeof prompt.category, `${name}: ${prompt.id} should have string category`).toBe('string');
          expect(prompt.category.trim().length).toBeGreaterThan(0);

          expect(typeof prompt.description, `${name}: ${prompt.id} should have string description`).toBe('string');
          expect(prompt.description.trim().length).toBeGreaterThan(10);

          expect(typeof prompt.system_instruction, `${name}: ${prompt.id} should have system_instruction`).toBe('string');
          expect(prompt.system_instruction.trim().length).toBeGreaterThan(20);

          expect(typeof prompt.task, `${name}: ${prompt.id} should have task`).toBe('string');
          expect(prompt.task.trim().length).toBeGreaterThan(50);

          // output_format must be defined, non-empty, and granular (> 20 chars)
          expect(typeof prompt.output_format, `${name}: ${prompt.id} must have non-empty output_format`).toBe('string');
          expect(prompt.output_format.trim().length, `${name}: ${prompt.id} output_format should be detailed`).toBeGreaterThan(20);

          expect(typeof prompt.target_output, `${name}: ${prompt.id} should have target_output`).toBe('string');
          expect(prompt.target_output.trim().length).toBeGreaterThan(0);

          // required_inputs must be an array containing appropriate inputs
          expect(Array.isArray(prompt.required_inputs), `${name}: ${prompt.id} required_inputs must be array`).toBe(true);
          if (prompt.id === 'bring_your_own_cv') {
            expect(prompt.required_inputs).toContain('cv_file_or_text');
          } else {
            expect(prompt.required_inputs).toContain('cv_abstraction');
          }
        });
      });
    });

    it('T1.5: job_matcher explicitly includes job_description in required_inputs across all catalogs', () => {
      [esPrompts, enPrompts, aiKnowledgePrompts].forEach(catalog => {
        const jm = catalog.find(p => p.id === 'job_matcher');
        expect(jm).toBeDefined();
        expect(jm.required_inputs).toContain('cv_abstraction');
        expect(jm.required_inputs).toContain('job_description');
      });
    });

    it('T1.6: translate_english specifies strict native cvData JSON code block in output_format', () => {
      [esPrompts, enPrompts, aiKnowledgePrompts].forEach(catalog => {
        const transPrompt = catalog.find(p => p.id === 'translate_english');
        expect(transPrompt).toBeDefined();
        expect(transPrompt.output_format.toLowerCase()).toContain('json');
        expect(transPrompt.output_format.toLowerCase()).toContain('cvdata');
      });
    });

    it('T1.7: prompts detail quantitative 0-100 scoring rubrics or evaluation frameworks', () => {
      const rubricPrompts = [
        'recruiter_audit',
        'job_matcher',
        'star_enhancer',
        'technical_interview',
        'layout_advisor',
        'system_design_simulator',
        'live_coding_coach'
      ];

      rubricPrompts.forEach(id => {
        const esPrompt = esPrompts.find(p => p.id === id);
        expect(esPrompt, `Prompt ${id} should exist`).toBeDefined();
        // Checks that task or output_format incorporates scoring rubrics
        const combined = `${esPrompt.task} ${esPrompt.output_format}`;
        expect(
          combined.includes('100') || combined.includes('0-10') || combined.includes('rubric') || combined.includes('Rúbrica'),
          `Prompt ${id} should contain numeric scoring rubric`
        ).toBe(true);
      });
    });
  });

  // =========================================================================
  // Suite 2: buildAIPromptPayload Assembly, Ordering & Conditionals (R5)
  // =========================================================================
  describe('Suite 2: buildAIPromptPayload Assembly, Ordering & Conditionals', () => {
    const mockCv = {
      layout: {
        type: '1-column',
        isAtsMode: true,
        fontFamily: 'Poppins',
        fontScale: 1.0,
        pagePadding: 24,
        sectionGap: 20,
        itemGap: 8,
        leftBg: '',
        rightBg: ''
      },
      profile: { name: 'Margaret Hamilton' },
      sections: [
        {
          id: 'profile_header',
          type: 'profile_header',
          items: [{
            name: 'Margaret Hamilton',
            subtitle: 'Director of Software Engineering',
            email: 'margaret@apollo.nasa.gov',
            phone: '+1 617-555-0199',
            linkedin: 'linkedin.com/in/mhamilton',
            github: 'github.com/mhamilton'
          }]
        },
        {
          id: 'about_section',
          type: 'about',
          title: 'PERFIL PROFESIONAL',
          items: [{ description: 'Pioneered asynchronous executive software architecture for mission-critical systems.' }]
        }
      ]
    };

    it('T2.1: strictly adheres to assembly sequence: role, task, output_format, then cvData', () => {
      const payload = buildAIPromptPayload(mockCv, 'recruiter_audit');

      const roleIdx = payload.indexOf('role:');
      const taskIdx = payload.indexOf('task:');
      const outFmtIdx = payload.indexOf('output_format:');
      const separatorIdx = payload.indexOf('---', outFmtIdx);
      const cvDataIdx = payload.indexOf('Margaret Hamilton');

      expect(roleIdx).toBeGreaterThan(-1);
      expect(taskIdx).toBeGreaterThan(roleIdx);
      expect(outFmtIdx).toBeGreaterThan(taskIdx);
      expect(separatorIdx).toBeGreaterThan(outFmtIdx);
      expect(cvDataIdx).toBeGreaterThan(separatorIdx);
    });

    it('T2.2: injects user_commentary when provided and cleanly omits when empty or whitespace', () => {
      // Non-empty commentary
      const withCommentary = buildAIPromptPayload(mockCv, 'recruiter_audit', {
        userCommentary: 'Focus specifically on real-time fault tolerance systems.'
      });
      expect(withCommentary).toContain('user_commentary: Focus specifically on real-time fault tolerance systems.');

      const commentIdx = withCommentary.indexOf('user_commentary:');
      const outFmtIdx = withCommentary.indexOf('output_format:');
      expect(commentIdx).toBeGreaterThan(outFmtIdx);

      // Empty string commentary
      const withEmptyCommentary = buildAIPromptPayload(mockCv, 'recruiter_audit', {
        userCommentary: ''
      });
      expect(withEmptyCommentary).not.toContain('user_commentary:');

      // Whitespace-only commentary
      const withWhitespaceCommentary = buildAIPromptPayload(mockCv, 'recruiter_audit', {
        userCommentary: '    \n   \t  '
      });
      expect(withWhitespaceCommentary).not.toContain('user_commentary:');

      // Omitted options
      const withDefaultOptions = buildAIPromptPayload(mockCv, 'recruiter_audit');
      expect(withDefaultOptions).not.toContain('user_commentary:');
    });

    it('T2.3: injects job_description exclusively when required and provided', () => {
      const testJD = 'Looking for Staff Systems Architect with real-time OS experience.';

      // job_matcher with JD provided
      const withJD = buildAIPromptPayload(mockCv, 'job_matcher', {
        jobDescription: testJD
      });
      expect(withJD).toContain(`job_description: ${testJD}`);

      // job_matcher with empty JD
      const emptyJD = buildAIPromptPayload(mockCv, 'job_matcher', {
        jobDescription: '   '
      });
      expect(emptyJD).not.toContain('job_description:');

      // recruiter_audit (does NOT require job_description) even if provided in options
      const nonJDPrompt = buildAIPromptPayload(mockCv, 'recruiter_audit', {
        jobDescription: testJD
      });
      expect(nonJDPrompt).not.toContain('job_description:');
    });

    it('T2.4: allows harmonious coexistence of user_commentary and job_description on job_matcher', () => {
      const payload = buildAIPromptPayload(mockCv, 'job_matcher', {
        userCommentary: 'Please emphasize my leadership and async scheduling work.',
        jobDescription: 'Staff Engineer needed for embedded mission control software.'
      });

      expect(payload).toContain('user_commentary: Please emphasize my leadership and async scheduling work.');
      expect(payload).toContain('job_description: Staff Engineer needed for embedded mission control software.');

      const commentIdx = payload.indexOf('user_commentary:');
      const jdIdx = payload.indexOf('job_description:');
      expect(jdIdx).toBeGreaterThan(commentIdx);
    });

    it('T2.5: injects compact native cvData JSON schema specifically for translate_english', () => {
      const transPayload = buildAIPromptPayload(mockCv, 'translate_english');

      expect(transPayload).toContain('# SCHEMA JSON NATIVO COMPACTO (cvData)');
      expect(transPayload).toContain('```json');
      expect(transPayload).toContain('"layout"');
      expect(transPayload).toContain('"sections"');
      expect(transPayload).toContain('"Margaret Hamilton"');

      // Other prompts should not contain native json schema block
      const auditPayload = buildAIPromptPayload(mockCv, 'recruiter_audit');
      expect(auditPayload).not.toContain('# SCHEMA JSON NATIVO COMPACTO (cvData)');

      const sysDesignPayload = buildAIPromptPayload(mockCv, 'system_design_simulator');
      expect(sysDesignPayload).not.toContain('# SCHEMA JSON NATIVO COMPACTO (cvData)');
    });

    it('T2.6: generates English localized payload when lang="en"', () => {
      const enPayload = buildAIPromptPayload(mockCv, 'translate_english', { lang: 'en' });
      expect(enPayload).toContain('# CANDIDATE RESUME INPUT DATA (MARKDOWN)');
      expect(enPayload).toContain('# COMPACT NATIVE JSON SCHEMA (cvData)');
    });

    it('T2.7: bring_your_own_cv injects upload/paste directives and omits active CV payload', () => {
      const esPayload = buildAIPromptPayload(mockCv, 'bring_your_own_cv', { lang: 'es' });
      expect(esPayload).toContain('# INSTRUCCIONES PARA ADJUNTAR TU CV (ARCHIVO PDF O TEXTO)');
      expect(esPayload).not.toContain('# DATOS DE ENTRADA DEL CURRÍCULUM VITAE');
      expect(esPayload).not.toContain('Margaret Hamilton');

      const enPayload = buildAIPromptPayload(mockCv, 'bring_your_own_cv', { lang: 'en' });
      expect(enPayload).toContain('# INSTRUCTIONS FOR PROVIDING YOUR CV (PDF ATTACHMENT OR TEXT)');
      expect(enPayload).not.toContain('# CANDIDATE RESUME INPUT DATA');
      expect(enPayload).not.toContain('Margaret Hamilton');

      // Extract and verify golden schema template directly from dedicated module / export
      const goldenEs = getAtsGoldenSchemaTemplate('es');
      expect(goldenEs.layout.isAtsMode).toBe(true);
      expect(goldenEs.layout.type).toBe('1-column');
      expect(goldenEs.profile).toBeDefined();
      expect(Array.isArray(goldenEs.sections)).toBe(true);

      // Verify golden template passes universalJsonImporter cleanly
      const imported = importUniversalCV(goldenEs);
      expect(imported).toBeDefined();
      expect(imported.layout.isAtsMode).toBe(true);

      // Verify imported cvData passes validateCVSnapshot
      const validation = validateCVSnapshot(imported);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });
  });

  // =========================================================================
  // Suite 3: exportToAIMarkdown Frontmatter & Markdown Body Fidelity (R2)
  // =========================================================================
  describe('Suite 3: exportToAIMarkdown Frontmatter & Markdown Body Fidelity', () => {
    const fullMockCv = {
      layout: {
        type: '2-column',
        isAtsMode: false,
        fontFamily: 'Inter',
        fontScale: 1.05,
        titleScale: 1.1,
        bodyScale: 0.95,
        listScale: 0.95,
        lineHeight: 1.5,
        pagePadding: 28,
        sectionGap: 22,
        itemGap: 10,
        leftBg: '#1e293b',
        rightBg: '#ffffff',
        leftColumnWidth: 35
      },
      profile: { name: 'Dennis Ritchie' },
      sections: [
        {
          id: 'profile_header',
          column: 'left',
          type: 'profile_header',
          bulletStyle: { size: 'normal', variant: 'bold', showLine: true },
          items: [{
            id: 'ph1',
            name: 'Dennis Ritchie',
            subtitle: 'Principal Computer Scientist & Systems Architect',
            location: 'Murray Hill, NJ',
            email: 'dmr@bell-labs.com',
            phone: '+1 908-555-0142',
            linkedin: 'linkedin.com/in/dennisritchie',
            github: 'github.com/dmr',
            contacts: [
              { id: 'c1', type: 'email', value: 'dmr@bell-labs.com' },
              { id: 'c2', type: 'linkedin', value: 'https://linkedin.com/in/dennisritchie' },
              { id: 'c3', type: 'github', value: 'https://github.com/dmr' },
              { id: 'c4', type: 'portfolio', value: 'https://cm.bell-labs.com/who/dmr' }
            ]
          }]
        },
        {
          id: 'about_section',
          column: 'left',
          type: 'about',
          title: 'SOBRE MÍ',
          items: [{ id: 'ab1', description: 'Co-creator of the UNIX operating system and creator of the C programming language.' }]
        },
        {
          id: 'skills',
          column: 'left',
          type: 'skills',
          title: 'HABILIDADES TÉCNICAS',
          items: [
            { id: 'sk1', title: 'Languages', description: 'C, B, Assembly, BCPL' },
            { id: 'sk2', title: 'Operating Systems', description: 'UNIX, Plan 9, Multics' }
          ]
        },
        {
          id: 'experience',
          column: 'right',
          type: 'list',
          title: 'EXPERIENCIA LABORAL',
          items: [{
            id: 'exp1',
            title: 'Head of System Software Research Department',
            subtitle: 'Bell Labs | Computing Sciences Research Center',
            date: '1967 – 2007',
            link: 'https://bell-labs.com',
            linkText: 'Bell Labs History',
            description: 'Directed foundational research into portable operating systems and compiler design.',
            bullets: [
              'Designed and implemented the C programming language, powering global operating systems and databases.',
              'Co-architected the UNIX operating system kernel with modular pipeline and file abstractions.'
            ]
          }]
        },
        {
          id: 'education',
          column: 'left',
          type: 'education',
          title: 'EDUCACIÓN',
          items: [{
            id: 'edu1',
            title: 'Ph.D. in Applied Mathematics & Physics',
            subtitle: 'Harvard University',
            date: '1968',
            description: 'Dissertation on Subrecursive Hierarchies of Functions.',
            bullets: ['Advised by Patrick C. Fischer']
          }]
        },
        {
          id: 'certificates',
          column: 'right',
          type: 'certificates',
          title: 'CERTIFICACIONES',
          items: [{
            id: 'cert1',
            title: 'Turing Award in Computing',
            subtitle: 'ACM',
            date: '1983',
            credentialId: 'ACM-1983-001',
            link: 'https://amturing.acm.org',
            linkText: 'Citation',
            description: 'For contributions to generic operating systems theory and the C language.'
          }]
        },
        {
          id: 'awards',
          column: 'right',
          type: 'awards',
          title: 'PREMIOS Y RECONOCIMIENTOS',
          items: [{
            id: 'aw1',
            title: 'National Medal of Technology',
            subtitle: 'President of the United States',
            date: '1999',
            description: 'For invention of the UNIX operating system and the C programming language.'
          }]
        },
        {
          id: 'publications',
          column: 'right',
          type: 'publications',
          title: 'PUBLICACIONES',
          items: [{
            id: 'pub1',
            title: 'The C Programming Language (K&R)',
            subtitle: 'Prentice Hall',
            date: '1978',
            link: 'https://archive.org/details/c-programming-kr',
            linkText: 'Read Archive',
            description: 'Canonical reference manual for the C language.'
          }]
        },
        {
          id: 'mentoring',
          column: 'right',
          type: 'mentoring',
          title: 'MENTORÍA',
          items: [{
            id: 'ment1',
            title: 'Compiler & Systems Engineering Mentor',
            mentee: 'Systems Research Fellows',
            date: '1980 – 2000',
            description: 'Mentored over 30 research scientists in language design and kernel debugging.'
          }]
        },
        {
          id: 'languages',
          column: 'left',
          type: 'languages',
          title: 'IDIOMAS',
          items: [{
            id: 'lang1',
            title: 'English',
            subtitle: 'Native',
            description: 'Fluent technical writing'
          }]
        }
      ]
    };

    it('T3.1: YAML frontmatter includes exhaustive visual, spacing, and typographic metadata', () => {
      const md = exportToAIMarkdown(fullMockCv);

      // Enclosure
      expect(md).toContain('```markdown');
      expect(md).toContain('---');

      // Layout mode
      expect(md).toContain('layout_type: "2-column"');
      expect(md).toContain('is_ats_mode: false');
      expect(md).toContain('reading_flow: "two_column_visual_hierarchy"');

      // Typography
      expect(md).toContain('font_family: "Inter"');
      expect(md).toContain('font_scale: 1.05');
      expect(md).toContain('title_scale: 1.1');
      expect(md).toContain('body_scale: 0.95');
      expect(md).toContain('list_scale: 0.95');
      expect(md).toContain('line_height: 1.5');

      // Spacing
      expect(md).toContain('page_padding: 28');
      expect(md).toContain('section_gap: 22');
      expect(md).toContain('item_gap: 10');

      // Styling & Colors
      expect(md).toContain('left_bg: "#1e293b"');
      expect(md).toContain('right_bg: "#ffffff"');
      expect(md).toContain('title_color:');
      expect(md).toContain('text_color:');

      // Candidate profile
      expect(md).toContain('Dennis Ritchie');
      expect(md).toContain('Murray Hill, NJ');
      expect(md).toContain('dmr@bell-labs.com');
    });

    it('T3.2: 1-column ATS mode frontmatter emits linear ordering and ATS attributes', () => {
      const atsCv = {
        ...fullMockCv,
        layout: {
          ...fullMockCv.layout,
          type: '1-column',
          isAtsMode: true
        }
      };

      const md = exportToAIMarkdown(atsCv);
      expect(md).toContain('layout_type: "1-column"');
      expect(md).toContain('is_ats_mode: true');
      expect(md).toContain('reading_flow: "strictly_linear_top_to_bottom"');
      expect(md).toContain('target_audience: "ATS Parsers (Workday, Taleo, Greenhouse, Lever) & Technical Recruiters"');
    });

    it('T3.3: Markdown body captures 100% of sections and item fields without omissions', () => {
      const md = exportToAIMarkdown(fullMockCv);

      // Profile header & about
      expect(md).toContain('# Dennis Ritchie');
      expect(md).toContain('**Principal Computer Scientist & Systems Architect**');
      expect(md).toContain('Co-creator of the UNIX operating system');

      // Skills
      expect(md).toContain('## HABILIDADES TÉCNICAS');
      expect(md).toContain('Languages');
      expect(md).toContain('C, B, Assembly, BCPL');

      // Experience with custom link text
      expect(md).toContain('## EXPERIENCIA LABORAL');
      expect(md).toContain('Head of System Software Research Department');
      expect(md).toContain('[Bell Labs History](https://bell-labs.com)');
      expect(md).toContain('Designed and implemented the C programming language');

      // Education with description and bullets
      expect(md).toContain('## EDUCACIÓN');
      expect(md).toContain('Harvard University');
      expect(md).toContain('Subrecursive Hierarchies of Functions');
      expect(md).toContain('Patrick C. Fischer');

      // Certificates with custom link text and credentialId
      expect(md).toContain('## CERTIFICACIONES');
      expect(md).toContain('Turing Award in Computing');
      expect(md).toContain('ACM-1983-001');
      expect(md).toContain('[Citation](https://amturing.acm.org)');

      // Awards
      expect(md).toContain('## PREMIOS Y RECONOCIMIENTOS');
      expect(md).toContain('National Medal of Technology');

      // Publications with custom link text
      expect(md).toContain('## PUBLICACIONES');
      expect(md).toContain('The C Programming Language (K&R)');
      expect(md).toContain('[Read Archive](https://archive.org/details/c-programming-kr)');

      // Mentoring with mentee field
      expect(md).toContain('## MENTORÍA');
      expect(md).toContain('Systems Research Fellows');

      // Languages
      expect(md).toContain('## IDIOMAS');
      expect(md).toContain('English');
    });
  });

  // =========================================================================
  // Suite 4: exportToAIJson & Version Manager Compatibility (R2 & R3)
  // =========================================================================
  describe('Suite 4: exportToAIJson & Version Manager Compatibility', () => {
    const validCvSnapshot = {
      profile: { name: 'Barbara Liskov' },
      layout: {
        type: '1-column',
        isAtsMode: true,
        fontFamily: 'Inter',
        fontScale: 1.0,
        pagePadding: 24,
        sectionGap: 20,
        itemGap: 8
      },
      sections: [
        {
          id: 'profile_header',
          column: 'left',
          type: 'profile_header',
          title: '',
          items: [{
            id: 'ph1',
            name: 'Barbara Liskov',
            subtitle: 'Institute Professor & Turing Laureate',
            location: 'Cambridge, MA'
          }]
        },
        {
          id: 'experience',
          column: 'left',
          type: 'list',
          title: 'WORK EXPERIENCE',
          items: [{
            id: 'exp1',
            title: 'Lead Distributed Systems Researcher',
            subtitle: 'MIT CSAIL',
            date: '1971 – Present',
            bullets: [
              'Formulated the Liskov Substitution Principle (LSP) for data abstraction and type hierarchy.',
              'Pioneered Byzantine Fault Tolerant (BFT) consensus algorithms for distributed state machines.'
            ]
          }]
        }
      ]
    };

    it('T4.1: exportToAIJson produces valid compact JSON that parses cleanly', () => {
      const jsonStr = exportToAIJson(validCvSnapshot);
      expect(typeof jsonStr).toBe('string');

      const parsed = JSON.parse(jsonStr);
      expect(parsed).toHaveProperty('profile');
      expect(parsed).toHaveProperty('layout');
      expect(parsed).toHaveProperty('sections');
      expect(parsed.profile.name).toBe('Barbara Liskov');
      expect(parsed.layout.type).toBe('1-column');
      expect(parsed.sections.length).toBe(2);
    });

    it('T4.2: exported JSON passes sanitizeAndValidateCVSnapshot cleanly', () => {
      const jsonStr = exportToAIJson(validCvSnapshot);
      const parsed = JSON.parse(jsonStr);

      const validated = sanitizeAndValidateCVSnapshot(parsed);
      expect(validated.profile.name).toBe('Barbara Liskov');
      expect(validated.layout.type).toBe('1-column');
      expect(validated.layout.fontFamily).toBe('Inter');
      expect(validated.sections.length).toBeGreaterThanOrEqual(2);

      const expSec = validated.sections.find(s => s.id === 'experience');
      expect(expSec).toBeDefined();
      expect(expSec.items[0].bullets.length).toBe(2);
    });

    it('T4.3: simulated AI translation output matching prompt specification is fully importable', () => {
      // Simulates an LLM response following the translate_english output format
      const simulatedLLMOutput = {
        layout: {
          type: '1-column',
          isAtsMode: true,
          fontFamily: 'Poppins',
          fontScale: 1.0,
          titleScale: 1.0,
          bodyScale: 1.0,
          listScale: 1.0,
          lineHeight: 1.45,
          pagePadding: 24,
          sectionGap: 20,
          itemGap: 8,
          leftBg: '',
          rightBg: ''
        },
        profile: {
          name: 'JUAN PÉREZ'
        },
        sections: [
          {
            id: 'profile_header',
            column: 'left',
            type: 'profile_header',
            title: '',
            items: [{
              id: 'prof_1',
              name: 'JUAN PÉREZ',
              subtitle: 'Senior Full Stack Engineer | Cloud & Distributed Systems',
              location: 'San Francisco, CA',
              email: 'juan.perez@example.com',
              contacts: [
                { id: 'c1', type: 'email', value: 'juan.perez@example.com' },
                { id: 'c2', type: 'linkedin', value: 'https://linkedin.com/in/juanperez' }
              ]
            }]
          },
          {
            id: 'about_section',
            column: 'left',
            type: 'about',
            title: 'PROFESSIONAL SUMMARY',
            items: [{
              id: 'about_1',
              description: 'Results-driven Senior Software Engineer with 8+ years building cloud-native distributed microservices.'
            }]
          },
          {
            id: 'experience',
            column: 'right',
            type: 'list',
            title: 'WORK EXPERIENCE',
            items: [{
              id: 'exp_1',
              title: 'Senior Software Engineer',
              subtitle: 'TechCorp USA | San Francisco, CA',
              date: 'Jan 2021 – Present',
              bullets: [
                'Architected high-throughput message pipelines handling 10M events/day with 99.99% availability.',
                'Refactored legacy monolith into Go microservices, reducing AWS infrastructure costs by 28%.'
              ]
            }]
          },
          {
            id: 'education',
            column: 'left',
            type: 'education',
            title: 'EDUCATION',
            items: [{
              id: 'edu_1',
              title: 'Associate Degree in Software Development',
              subtitle: 'State Technical University',
              date: '2018'
            }]
          }
        ]
      };

      const validated = sanitizeAndValidateCVSnapshot(simulatedLLMOutput);
      expect(validated.profile.name).toBe('JUAN PÉREZ');
      expect(validated.sections.length).toBe(4);
      expect(validated.sections.find(s => s.id === 'experience').title).toBe('WORK EXPERIENCE');
      expect(validated.sections.find(s => s.id === 'education').items[0].title).toBe('Associate Degree in Software Development');
    });
  });
});
