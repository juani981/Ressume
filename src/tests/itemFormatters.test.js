import { describe, it, expect } from 'vitest';
import {
  contactMarkdown,
  contactXML,
  contactPlainText,
  mentoringMarkdown,
  profileHeaderMarkdown,
  skillsMarkdown,
  educationMarkdown,
  simpleListMarkdown,
  languagesMarkdown,
  certificatesMarkdown,
  awardsMarkdown,
  publicationsMarkdown,
  referencesMarkdown,
  aboutMarkdown,
  baseItemMarkdown
} from '../registry/itemFormatters.js';
import { getSectionDescriptor } from '../registry/sectionRegistry.js';

describe('itemFormatters & Descriptor Granular Markdown Integration', () => {
  describe('Contact Formatters', () => {
    it('formats dynamic contacts into Markdown lines', () => {
      const item = {
        contacts: [
          { type: 'email', value: 'ada@lovelace.org' },
          { type: 'github', value: 'github.com/adalovelace' }
        ]
      };
      const md = contactMarkdown(item);
      expect(md).toContain('- **email**: ada@lovelace.org');
      expect(md).toContain('- **github**: github.com/adalovelace');
    });

    it('formats legacy flat contact fields', () => {
      const item = {
        email: 'grace@hopper.mil',
        phone: '+1 202-555-0100'
      };
      const md = contactMarkdown(item);
      expect(md).toContain('- **email**: grace@hopper.mil');
      expect(md).toContain('- **phone**: +1 202-555-0100');
    });

    it('produces clean contact XML and PlainText', () => {
      const item = {
        contacts: [{ type: 'location', value: 'London, UK' }]
      };
      const xml = contactXML(item);
      expect(xml).toContain('<contact type="location">London, UK</contact>');

      const plain = contactPlainText(item);
      expect(plain).toContain('* location: London, UK');
    });
  });

  describe('Mentoring Formatter', () => {
    it('formats mentoring item with mentee and date', () => {
      const item = {
        title: 'Compiler & Systems Engineering Mentor',
        mentee: 'Systems Research Fellows',
        date: '1980 – 2000',
        description: 'Mentored over 30 research scientists in language design.'
      };
      const md = mentoringMarkdown(item);
      expect(md).toContain('### Compiler & Systems Engineering Mentor');
      expect(md).toContain('**Systems Research Fellows** | `1980 – 2000`');
      expect(md).toContain('Mentored over 30 research scientists');
    });
  });

  describe('Profile Header Formatter', () => {
    it('formats profile header with name and subtitle', () => {
      const item = {
        name: 'Alan Turing',
        subtitle: 'Mathematician & Cryptanalyst'
      };
      const md = profileHeaderMarkdown(item);
      expect(md).toBe('# Alan Turing\n## Mathematician & Cryptanalyst');
    });
  });

  describe('Registry Descriptors Granular Wiring', () => {
    const sectionTypes = [
      'contact',
      'about',
      'skills',
      'experience',
      'education',
      'certificates',
      'awards',
      'publications',
      'references',
      'mentoring',
      'languages',
      'simple_list',
      'profile_header'
    ];

    sectionTypes.forEach(type => {
      it(`descriptor "${type}" defines a functional renderMarkdown formatter`, () => {
        const desc = getSectionDescriptor(type);
        expect(desc).toBeDefined();
        expect(typeof desc.renderMarkdown).toBe('function');
      });
    });

    it('contact descriptor delegates directly to contactMarkdown', () => {
      const desc = getSectionDescriptor('contact');
      const md = desc.renderMarkdown({ email: 'test@example.com' });
      expect(md).toContain('- **email**: test@example.com');
    });

    it('about descriptor renders about text without ad-hoc guards', () => {
      const desc = getSectionDescriptor('about');
      const md = desc.renderMarkdown({ description: 'Pioneering researcher in distributed computing.' });
      expect(md).toBe('Pioneering researcher in distributed computing.');
    });
  });
});
