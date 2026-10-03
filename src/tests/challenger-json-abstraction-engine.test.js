import { describe, it, expect } from 'vitest';
import {
  generateCVLivePdfAbstraction,
  exportToAIJson,
  normalizeSectionKey,
  extractNormalizedProfile,
  extractNormalizedSections,
  analyzeCVWithATSKnowledge,
  generatePhysicalPageLayout,
  generateSchemaContractForLLM,
  CANONICAL_ATS_ORDER,
  sanitizeContactUrl
} from '../utils/cvJsonAbstraction.js';
import {
  cleanAndParseRawJSON,
  unwrapRootObject,
  normalizeAnyJSONToCVSnapshot
} from '../utils/universalJsonImporter.js';
import { sanitizeAndValidateCVSnapshot } from '../utils/cvSchemaValidator.js';
import { defaultSchema } from '../utils/schema.js';

describe('Challenger: High-Fidelity Live-Preview PDF Abstraction & Universal JSON Importer Engine', () => {

  const sampleSeniorCv = {
    profile: {
      name: 'Dr. Evelyn Turing'
    },
    layout: {
      type: '1-column',
      isAtsMode: true,
      fontFamily: 'Inter',
      fontScale: 1.0,
      titleScale: 1.1,
      bodyScale: 1.0,
      listScale: 1.0,
      lineHeight: 1.45,
      pagePadding: 24,
      sectionGap: 20,
      itemGap: 8,
      leftBg: '#fafafa',
      rightBg: '#ffffff'
    },
    sections: [
      {
        id: 'profile_header',
        column: 'left',
        type: 'profile_header',
        title: '',
        items: [{
          id: 'ph_1',
          name: 'Dr. Evelyn Turing',
          subtitle: 'Principal Distributed Systems Architect | Ex-Staff AWS',
          location: 'Seattle, WA',
          email: 'evelyn.turing@systems.org',
          phone: '+1 206 555 0199',
          linkedin: 'linkedin.com/in/evelyn-turing',
          github: 'github.com/evelyn-turing',
          contacts: [
            { id: 'c1', type: 'email', value: 'evelyn.turing@systems.org' },
            { id: 'c2', type: 'phone', value: '+1 206 555 0199' },
            { id: 'c3', type: 'linkedin', value: 'https://linkedin.com/in/evelyn-turing' },
            { id: 'c4', type: 'github', value: 'https://github.com/evelyn-turing' }
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
          description: 'Visionary Systems Architect with 12+ years designing fault-tolerant, petabyte-scale distributed streaming engines and high-concurrency cloud infrastructures.'
        }]
      },
      {
        id: 'skills',
        column: 'left',
        type: 'skills',
        title: 'TECHNICAL CORE COMPETENCIES',
        items: [
          {
            id: 'sk_1',
            title: 'Distributed Systems & Cloud',
            description: 'Kubernetes, Apache Kafka, Raft Consensus, AWS DynamoDB, gRPC, Terraform'
          },
          {
            id: 'sk_2',
            title: 'Languages & Runtimes',
            description: 'Rust, Go, C++20, Python 3.12, TypeScript, PostgreSQL'
          }
        ]
      },
      {
        id: 'experience',
        column: 'left',
        type: 'list',
        title: 'WORK EXPERIENCE',
        items: [
          {
            id: 'exp_1',
            title: 'Staff Distributed Systems Engineer',
            subtitle: 'CloudNative Core Inc. | Seattle, WA',
            date: '2021 – Present',
            link: 'https://cloudnative-core.io',
            bullets: [
              'Architected a globally replicated consensus engine handling 45M req/s with 99.999% availability, reducing P99 tail latency by 42%.',
              'Spearheaded the migration of 80+ monolithic services to Rust microservices, reducing cloud compute costs by $1.4M annually.',
              'Mentored 18 senior software engineers across 3 geographic zones in fault-injection testing and Chaos Engineering.'
            ]
          },
          {
            id: 'exp_2',
            title: 'Senior Infrastructure Engineer',
            subtitle: 'Amazon Web Services (AWS) | Seattle, WA',
            date: '2016 – 2021',
            bullets: [
              'Designed and deployed automated partition-rebalancing for multi-tenant storage clusters scaling to 25 petabytes.',
              'Refactored network I/O driver layer using eBPF, achieving 30% throughput increase across 4,000 bare-metal nodes.'
            ]
          }
        ]
      },
      {
        id: 'education',
        column: 'left',
        type: 'education',
        title: 'EDUCATION',
        items: [{
          id: 'edu_1',
          title: 'Ph.D. in Computer Science & Distributed Systems',
          subtitle: 'University of Washington',
          date: '2016',
          description: 'Doctoral Dissertation: Practical Byzantine Fault Tolerant State Machine Replication in Geo-Partitioned Networks.'
        }]
      },
      {
        id: 'certificates',
        column: 'left',
        type: 'simple_list',
        title: 'CERTIFICATIONS',
        items: [
          { id: 'cert_1', text: 'AWS Certified Solutions Architect – Professional (2024)' },
          { id: 'cert_2', text: 'Certified Kubernetes Administrator (CKA)' }
        ]
      },
      {
        id: 'languages',
        column: 'left',
        type: 'simple_list',
        title: 'LANGUAGES',
        items: [
          { id: 'lang_1', text: 'English: Native' },
          { id: 'lang_2', text: 'German: Professional Working' }
        ]
      }
    ]
  };

  // =========================================================================
  // Suite 1: Semantic Depth & Live Preview PDF Abstraction (More than 2x Depth)
  // =========================================================================
  describe('Suite 1: Semantic Depth & Live Preview PDF Abstraction', () => {

    it('T1.1: abstraction output includes all 6 core operational layers with schema version 3.0', () => {
      const abstraction = generateCVLivePdfAbstraction(sampleSeniorCv, { timestamp: '2026-09-28T00:00:00.000Z' });

      expect(abstraction.document_context).toBeDefined();
      expect(abstraction.candidate_profile).toBeDefined();
      expect(abstraction.physical_page_layout).toBeDefined();
      expect(abstraction.ats_and_ai_knowledge).toBeDefined();
      expect(abstraction.normalized_sections).toBeDefined();
      expect(abstraction.schema_contract_for_llm_import).toBeDefined();

      expect(abstraction.document_context.schema_version).toBe('3.0');
      expect(abstraction.document_context.is_live_preview_pdf_abstraction).toBe(true);
      expect(abstraction.document_context.system_notice).toContain('contextualized, deterministic 1:1 abstraction');
    });

    it('T1.2: physical_page_layout mirrors exact A4 dimensions, typography scales and page distribution', () => {
      const abstraction = generateCVLivePdfAbstraction(sampleSeniorCv);
      const layout = abstraction.physical_page_layout;

      expect(layout.standard).toBe('ISO 216 A4');
      expect(layout.dimensions_mm).toEqual({ width: 210, height: 297 });
      expect(layout.dimensions_px.width).toBe(794);
      expect(layout.dimensions_px.height).toBe(1123);
      expect(layout.layout_type).toBe('1-column');
      expect(layout.is_ats_mode).toBe(true);
      expect(layout.reading_flow).toBe('strictly_linear_top_to_bottom');

      expect(layout.typography.font_family).toBe('Inter');
      expect(layout.typography.font_scale).toBe(1.0);
      expect(layout.typography.line_height).toBe(1.45);

      expect(Array.isArray(layout.page_distribution)).toBe(true);
      expect(layout.page_distribution.length).toBeGreaterThanOrEqual(1);
      expect(layout.page_distribution[0].page_number).toBe(1);
      expect(layout.page_distribution[0].total_items_on_page).toBeGreaterThan(0);
    });

    it('T1.3: ats_and_ai_knowledge synthesizes ATS audit, Google XYZ formula and AI rules', () => {
      const abstraction = generateCVLivePdfAbstraction(sampleSeniorCv);
      const ats = abstraction.ats_and_ai_knowledge;

      expect(typeof ats.ats_compatibility_score).toBe('number');
      expect(ats.ats_compatibility_score).toBeGreaterThanOrEqual(80);
      expect(ats.ats_readiness_level).toBe('OPTIMAL');
      expect(ats.canonical_order_compliance).toBe(true);
      expect(ats.canonical_ats_sequence).toEqual(CANONICAL_ATS_ORDER);

      expect(ats.sanitization_audit.pseudo_math_dollars_found).toBe(0);
      expect(ats.sanitization_audit.disruptive_ocr_symbols_found).toBe(0);

      expect(ats.contact_completeness.has_name).toBe(true);
      expect(ats.contact_completeness.has_email).toBe(true);
      expect(ats.contact_completeness.has_linkedin).toBe(true);
      expect(ats.contact_completeness.has_github).toBe(true);

      expect(ats.content_metrics.total_experience_items).toBe(2);
      expect(ats.content_metrics.total_bullets).toBe(5);
      expect(ats.content_metrics.bullets_with_xyz_formula).toBeGreaterThanOrEqual(3);
      expect(ats.content_metrics.bullets_with_action_verbs).toBeGreaterThanOrEqual(4);
      expect(ats.content_metrics.action_verbs_detected).toContain('architected');
      expect(ats.content_metrics.action_verbs_detected).toContain('spearheaded');

      expect(Array.isArray(ats.active_knowledge_rules)).toBe(true);
      expect(ats.active_knowledge_rules.length).toBeGreaterThan(0);
    });

    it('T1.4: candidate_profile consolidates name, headline, location, summary, and clean URLs', () => {
      const profile = extractNormalizedProfile(sampleSeniorCv);

      expect(profile.full_name).toBe('Dr. Evelyn Turing');
      expect(profile.headline).toContain('Principal Distributed Systems Architect');
      expect(profile.location).toBe('Seattle, WA');
      expect(profile.professional_summary).toContain('Visionary Systems Architect');

      expect(profile.contact_channels.email).toBe('evelyn.turing@systems.org');
      expect(profile.contact_channels.phone).toBe('+1 206 555 0199');
      expect(profile.contact_channels.linkedin).toBe('https://linkedin.com/in/evelyn-turing');
      expect(profile.contact_channels.github).toBe('https://github.com/evelyn-turing');
    });

    it('T1.5: normalized_sections eliminates internal random IDs and structures item fields', () => {
      const abstraction = generateCVLivePdfAbstraction(sampleSeniorCv);
      const sections = abstraction.normalized_sections;

      expect(Array.isArray(sections)).toBe(true);
      const expSec = sections.find(s => s.section_key === 'work_experience');
      expect(expSec).toBeDefined();
      expect(expSec.display_column).toBe('left');
      expect(expSec.assigned_page).toBe(1);

      const firstRole = expSec.items[0];
      expect(firstRole.role_title).toBe('Staff Distributed Systems Engineer');
      expect(firstRole.organization).toBe('CloudNative Core Inc. | Seattle, WA');
      expect(firstRole.period).toBe('2021 – Present');
      expect(firstRole.link).toBe('https://cloudnative-core.io');
      expect(firstRole.has_metrics).toBe(true);
      expect(firstRole.detected_action_verbs).toContain('architected');
      expect(firstRole.achievements).toHaveLength(3);

      // Verify no item has an internal id hash exposed in normalized items
      expect(firstRole.id).toBeUndefined();
    });
  });

  // =========================================================================
  // Suite 2: Document Context Framing & WYSIWYG Parity
  // =========================================================================
  describe('Suite 2: Document Context Framing & WYSIWYG Parity', () => {

    it('T2.1: informs downstream LLMs beforehand of the live A4 PDF preview context', () => {
      const abstraction = generateCVLivePdfAbstraction(sampleSeniorCv);
      const notice = abstraction.document_context.system_notice;

      expect(notice).toContain('live preview');
      expect(notice).toContain('Ressume CV editor');
      expect(notice).toContain('100% idempotence');
      expect(notice).toContain('schema_contract');
    });

    it('T2.2: dual-mode separation: 2-column mode correctly reflects visual hierarchy and sidebar', () => {
      const twoColCv = {
        ...sampleSeniorCv,
        layout: {
          ...sampleSeniorCv.layout,
          type: '2-column',
          isAtsMode: false,
          leftColumnWidth: 35
        },
        sections: sampleSeniorCv.sections.map((sec, idx) => ({
          ...sec,
          column: idx % 2 === 0 ? 'left' : 'right'
        }))
      };

      const abstraction = generateCVLivePdfAbstraction(twoColCv);
      const layout = abstraction.physical_page_layout;

      expect(layout.layout_type).toBe('2-column');
      expect(layout.is_ats_mode).toBe(false);
      expect(layout.reading_flow).toBe('two_column_visual_hierarchy');
      expect(layout.columns.count).toBe(2);
      expect(layout.columns.left_column_ratio_percent).toBe(35);
      expect(layout.columns.right_column_ratio_percent).toBe(65);

      const page1 = layout.page_distribution[0];
      expect(page1).toHaveProperty('left_column_sections');
      expect(page1).toHaveProperty('right_column_sections');
    });
  });

  // =========================================================================
  // Suite 3: Section & Item Normalization Engine
  // =========================================================================
  describe('Suite 3: Section & Item Normalization Engine', () => {

    it('T3.1: maps diverse section types and localized titles to canonical semantic keys', () => {
      expect(normalizeSectionKey('profile_header', 'profile_header', '')).toBe('candidate_profile');
      expect(normalizeSectionKey('about', 'about_section', 'Perfil Profesional')).toBe('professional_summary');
      expect(normalizeSectionKey('list', 'experience', 'Experiencia Laboral')).toBe('work_experience');
      expect(normalizeSectionKey('skills', 'skills', 'Habilidades Técnicas')).toBe('skills_and_technologies');
      expect(normalizeSectionKey('education', 'education', 'Educación')).toBe('education');
      expect(normalizeSectionKey('list', 'projects', 'Proyectos')).toBe('projects');
      expect(normalizeSectionKey('simple_list', 'certificates', 'Certificaciones')).toBe('certifications');
      expect(normalizeSectionKey('simple_list', 'languages', 'Idiomas')).toBe('languages');
      expect(normalizeSectionKey('custom', 'my_custom_patents', 'Patentes')).toBe('my_custom_patents');
    });

    it('T3.2: sanitizeContactUrl enforces https:// and strips whitespace', () => {
      expect(sanitizeContactUrl('  github.com/test  ')).toBe('https://github.com/test');
      expect(sanitizeContactUrl('http://insecure.site/cv')).toBe('http://insecure.site/cv');
      expect(sanitizeContactUrl('https://valid.com/portfolio')).toBe('https://valid.com/portfolio');
      expect(sanitizeContactUrl('')).toBe('');
      expect(sanitizeContactUrl(null)).toBe('');
    });
  });

  // =========================================================================
  // Suite 4: Universal Failproof JSON Ingestion Pipeline
  // =========================================================================
  describe('Suite 4: Universal Failproof JSON Ingestion Pipeline', () => {

    it('T4.1: cleans and extracts JSON from Markdown triple backtick code blocks', () => {
      const markdownWrapped = `
Here is your updated resume in JSON format:

\`\`\`json
{
  "profile": {
    "name": "Grace Hopper"
  },
  "layout": {
    "type": "1-column"
  },
  "sections": []
}
\`\`\`

Hope this helps!
`;
      const parsed = cleanAndParseRawJSON(markdownWrapped);
      expect(parsed).toBeDefined();
      expect(parsed.profile.name).toBe('Grace Hopper');
    });

    it('T4.2: heals syntax flaws: trailing commas and smart quotes', () => {
      const flawedJSON = `
{
  “profile”: {
    “name”: “Alan Turing”,
  },
  “layout”: {
    “type”: “1-column”,
  },
  “sections”: [
    { “id”: “sec1”, “type”: “skills”, “items”: [], },
  ],
}
`;
      const parsed = cleanAndParseRawJSON(flawedJSON);
      expect(parsed).toBeDefined();
      expect(parsed.profile.name).toBe('Alan Turing');
      expect(parsed.sections).toHaveLength(1);
    });

    it('T4.3: unwraps nested envelope roots (cv, cvData, resume, data)', () => {
      const enveloped = {
        status: 'success',
        data: {
          resume: {
            profile: { name: 'Claude Shannon' },
            layout: { type: '2-column' },
            sections: [
              { id: 'profile_header', type: 'profile_header', items: [{ name: 'Claude Shannon' }] }
            ]
          }
        }
      };

      const unwrapped = unwrapRootObject(enveloped);
      expect(unwrapped.profile.name).toBe('Claude Shannon');
      expect(unwrapped.sections).toHaveLength(1);
    });

    it('T4.4: ingests snake_case layout properties and converts them cleanly to camelCase', () => {
      const snakeLayoutCV = {
        profile: { name: 'Margaret Hamilton' },
        layout: {
          type: '1-column',
          is_ats_mode: true,
          font_family: 'JetBrains Mono',
          font_scale: 1.05,
          page_padding: 30,
          section_gap: 18,
          item_gap: 6
        },
        sections: [
          { id: 'profile_header', type: 'profile_header', items: [{ name: 'Margaret Hamilton' }] }
        ]
      };

      const normalized = normalizeAnyJSONToCVSnapshot(snakeLayoutCV);
      expect(normalized.layout.isAtsMode).toBe(true);
      expect(normalized.layout.fontFamily).toBe('JetBrains Mono');
      expect(normalized.layout.fontScale).toBe(1.05);
      expect(normalized.layout.pagePadding).toBe(30);
      expect(normalized.layout.sectionGap).toBe(18);
      expect(normalized.layout.itemGap).toBe(6);
    });

    it('T4.5: ingests Rich Abstraction format and restores full native CV state', () => {
      const abstraction = generateCVLivePdfAbstraction(sampleSeniorCv);
      const jsonString = JSON.stringify(abstraction);

      const imported = normalizeAnyJSONToCVSnapshot(jsonString);
      expect(imported).toBeDefined();
      expect(imported.profile.name).toBe('Dr. Evelyn Turing');
      expect(imported.layout.type).toBe('1-column');
      expect(imported.layout.isAtsMode).toBe(true);
      expect(imported.sections.length).toBeGreaterThanOrEqual(sampleSeniorCv.sections.length);

      const expSec = imported.sections.find(s => s.id === 'experience');
      expect(expSec).toBeDefined();
      expect(expSec.items[0].title).toBe('Staff Distributed Systems Engineer');
    });

    it('T4.6: ingests LLM-generated dictionary format (without sections array)', () => {
      const llmDictFormat = {
        candidate_profile: {
          full_name: 'Linus Torvalds',
          headline: 'Creator of Linux & Git',
          location: 'Portland, OR',
          email: 'torvalds@kernel.org',
          contact_channels: {
            github: 'https://github.com/torvalds'
          }
        },
        professional_summary: 'Creator and principal architect of Linux operating system kernel and Git version control.',
        work_experience: [
          {
            role_title: 'Linux Kernel Benevolent Dictator for Life',
            organization: 'Linux Foundation',
            period: '1991 – Present',
            achievements: [
              'Developed the Linux kernel now powering 90% of global cloud infrastructure.',
              'Created Git distributed version control system in 2 weeks.'
            ]
          }
        ],
        skills_and_technologies: [
          {
            category_name: 'Systems Programming',
            technologies: ['C', 'Assembly', 'Linux Kernel', 'Git']
          }
        ],
        education: [
          {
            degree: 'M.S. in Computer Science',
            institution: 'University of Helsinki',
            period: '1996'
          }
        ]
      };

      const normalized = normalizeAnyJSONToCVSnapshot(llmDictFormat);
      expect(normalized.profile.name).toBe('Linus Torvalds');
      expect(normalized.sections.some(s => s.id === 'profile_header')).toBe(true);

      const expSec = normalized.sections.find(s => s.id === 'experience');
      expect(expSec).toBeDefined();
      expect(expSec.items[0].title).toBe('Linux Kernel Benevolent Dictator for Life');
      expect(expSec.items[0].bullets).toHaveLength(2);

      const skillsSec = normalized.sections.find(s => s.id === 'skills');
      expect(skillsSec).toBeDefined();
      expect(skillsSec.items[0].description).toBe('C, Assembly, Linux Kernel, Git');
    });

    it('T4.7: recovers safely from null, corrupted, or completely empty inputs without throwing', () => {
      const corruptInputs = [
        null,
        undefined,
        '',
        '   ',
        'NOT A JSON STRING AT ALL',
        '{ broken json: ',
        [],
        12345
      ];

      corruptInputs.forEach(input => {
        const result = normalizeAnyJSONToCVSnapshot(input);
        expect(result).toBeDefined();
        expect(result.profile).toBeDefined();
        expect(result.layout).toBeDefined();
        expect(Array.isArray(result.sections)).toBe(true);
        expect(result.sections.length).toBeGreaterThan(0);
      });
    });
  });

  // =========================================================================
  // Suite 5: Idempotency & Round-Trip Parity
  // =========================================================================
  describe('Suite 5: Idempotency & Round-Trip Parity', () => {

    it('T5.1: exportToAIJson produces byte-identical output across consecutive runs', () => {
      const fixedOptions = { timestamp: '2026-09-28T00:00:00.000Z' };
      const run1 = exportToAIJson(sampleSeniorCv, fixedOptions);
      const run2 = exportToAIJson(sampleSeniorCv, fixedOptions);
      const run3 = exportToAIJson(sampleSeniorCv, fixedOptions);

      expect(run1).toBe(run2);
      expect(run2).toBe(run3);
    });

    it('T5.2: round-trip cycle is strictly idempotent: export(import(export(cv))) === export(cv)', () => {
      const fixedOptions = { timestamp: '2026-09-28T00:00:00.000Z' };

      // Step 1: Initial Export
      const export1 = exportToAIJson(sampleSeniorCv, fixedOptions);

      // Step 2: Import back into editor model
      const imported1 = normalizeAnyJSONToCVSnapshot(export1);

      // Step 3: Re-export imported model
      const export2 = exportToAIJson(imported1, fixedOptions);

      // Step 4: Re-import second export
      const imported2 = normalizeAnyJSONToCVSnapshot(export2);

      // Step 5: Third export
      const export3 = exportToAIJson(imported2, fixedOptions);

      // Assert strict idempotency
      expect(export2).toBe(export3);
      expect(imported1.profile.name).toBe(imported2.profile.name);
      expect(imported1.sections.length).toBe(imported2.sections.length);
    });

    it('T5.3: repeated import-export cycles do not cause ID drift or section duplication', () => {
      let current = sampleSeniorCv;
      const initialSectionCount = sampleSeniorCv.sections.length;

      for (let i = 0; i < 5; i++) {
        const exported = exportToAIJson(current, { timestamp: '2026-09-28T00:00:00.000Z' });
        current = normalizeAnyJSONToCVSnapshot(exported);
      }

      expect(current.sections.length).toBe(initialSectionCount);
      expect(current.profile.name).toBe('Dr. Evelyn Turing');

      const expSec = current.sections.find(s => s.id === 'experience');
      expect(expSec.items).toHaveLength(2);
      expect(expSec.items[0].bullets).toHaveLength(3);
    });
  });
});
