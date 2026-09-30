/**
 * @file detachedProfileTitleAndContact.test.jsx
 * @description Unit and integration tests for the split Title-Subtitle and Contact components:
 * 1. ProfileTitleItem renders candidate name and subtitle independently.
 * 2. ContactItem renders contact details, icons, and picker independently.
 * 3. Detached layout enables placing Title-Subtitle and Contact in different columns.
 * 4. Section registry properly registers both section descriptors.
 * 5. Print engine outputs both detached sections cleanly without editor controls.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileTitleItem from '../components/CV/items/ProfileTitleItem';
import ContactItem from '../components/CV/items/ContactItem';
import ProfileHeaderItem from '../components/CV/items/ProfileHeaderItem';
import { getSectionDescriptor, getAllSectionDescriptors } from '../registry/sectionRegistry';
import { CVProvider } from '../context/CVContext';
import { generateCleanPrintHTML } from '../utils/staticHtmlPdfEngine';
import { ensureProfileHeader } from '../context/hooks/useCVData';

describe('Split Profile Header: ProfileTitleItem and ContactItem', () => {
  describe('ProfileTitleItem (TITLE-Subtitle component)', () => {
    it('renders name and subtitle in edit mode without contact elements', () => {
      const onUpdateItem = vi.fn();
      const item = {
        id: 'prof_title_1',
        name: 'Ada Lovelace',
        subtitle: 'First Computer Programmer'
      };

      render(
        <ProfileTitleItem 
          item={item} 
          sectionId="title_subtitle" 
          onUpdateItem={onUpdateItem} 
          isPrint={false} 
        />
      );

      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
      expect(screen.getByText('First Computer Programmer')).toBeInTheDocument();

      // Asserts zero contact pills or buttons exist in TitleSubtitle component
      expect(screen.queryByRole('button', { name: /contacto/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /agregar dato de contacto/i })).toBeNull();
    });

    it('renders name and subtitle in print mode as pure semantic typography', () => {
      const item = {
        id: 'prof_title_2',
        name: 'Alan Turing',
        subtitle: 'Mathematician & Cryptanalyst'
      };

      const { container } = render(
        <ProfileTitleItem 
          item={item} 
          sectionId="title_subtitle" 
          isPrint={true} 
        />
      );

      const h1 = container.querySelector('h1.home__title');
      const h2 = container.querySelector('h2.home__subtitle');
      expect(h1).toBeTruthy();
      expect(h1.textContent).toBe('Alan Turing');
      expect(h2).toBeTruthy();
      expect(h2.textContent).toBe('Mathematician & Cryptanalyst');

      const homeData = container.querySelector('.home__data');
      expect(homeData).toBeTruthy();
      expect(homeData.style.gap).toBe('1px');
      expect(h1.style.margin).toBe('0px');
      expect(h2.style.margin).toBe('0px');

      // No editor inputs or buttons
      expect(container.querySelector('button')).toBeNull();
      expect(container.querySelector('.social__container')).toBeNull();
    });
  });

  describe('ContactItem (Contact component)', () => {
    it('renders contact pills and allows adding new contact in edit mode', () => {
      const onUpdateItem = vi.fn();
      const item = {
        id: 'contact_1',
        contacts: [
          { id: 'c1', type: 'email', value: 'ada@computing.org' },
          { id: 'c2', type: 'github', value: 'github.com/adalovelace' }
        ]
      };

      render(
        <ContactItem 
          item={item} 
          sectionId="contact_sec" 
          onUpdateItem={onUpdateItem} 
          isPrint={false} 
        />
      );

      expect(screen.getByText('ada@computing.org')).toBeInTheDocument();
      expect(screen.getByText('github.com/adalovelace')).toBeInTheDocument();

      // Contact adder button is present
      const addBtn = screen.getByRole('button', { name: /agregar dato de contacto/i });
      expect(addBtn).toBeInTheDocument();

      // Standard separators exist between contact items in edit mode
      const separators = screen.getAllByText('|');
      expect(separators.length).toBe(1);

      // Asserts zero title/subtitle headings exist in Contact component
      expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
      expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
    });

    it('renders contact pills in print mode without interactive delete or add buttons', () => {
      const item = {
        id: 'contact_2',
        contacts: [
          { id: 'c1', type: 'phone', value: '+44 20 7946 0991' },
          { id: 'c2', type: 'location', value: 'London, UK' }
        ]
      };

      const { container } = render(
        <ContactItem 
          item={item} 
          sectionId="contact_sec" 
          isPrint={true} 
        />
      );

      expect(container.textContent).toContain('+44 20 7946 0991');
      expect(container.textContent).toContain('London, UK');

      // Standard separator exists in print
      expect(container.querySelectorAll('.contact-separator').length).toBe(1);

      // Zero interactive buttons in print
      expect(container.querySelector('button')).toBeNull();
      expect(container.querySelector('.contact-del-btn')).toBeNull();
      expect(container.querySelector('.add-contact-btn')).toBeNull();
    });
  });

  describe('Registry Descriptors for Detached Sections', () => {
    it('registers dedicated "contact" section descriptor in sectionRegistry', () => {
      const desc = getSectionDescriptor('contact');
      expect(desc).toBeDefined();
      expect(desc.type).toBe('contact');
      expect(desc.label).toBe('Información de Contacto');
      expect(desc.allowDelete).toBe(true);
      expect(desc.itemComponent).toBeDefined();
    });

    it('maintains "profile_header" for TITLE-Subtitle and "contact" for Contact', () => {
      const headerDesc = getSectionDescriptor('profile_header');
      expect(headerDesc).toBeDefined();
      expect(headerDesc.type).toBe('profile_header');
      expect(headerDesc.itemComponent).toBeDefined();

      const contactDesc = getSectionDescriptor('contact');
      expect(contactDesc).toBeDefined();
      expect(contactDesc.type).toBe('contact');
      expect(contactDesc.itemComponent).toBeDefined();
    });

    it('includes "contact" in available sections in AddSectionModal descriptors', () => {
      const descriptors = getAllSectionDescriptors().filter(
        d => d.type !== 'profile_header'
      );
      const contactDesc = descriptors.find(d => d.type === 'contact');
      expect(contactDesc).toBeDefined();
      expect(contactDesc.label).toBe('Información de Contacto');
    });

    it('registers dedicated "title_subtitle" section descriptor in sectionRegistry for detached Title', () => {
      const desc = getSectionDescriptor('title_subtitle');
      expect(desc).toBeDefined();
      expect(desc.type).toBe('title_subtitle');
      expect(desc.label).toBe('Título y Subtítulo');
      expect(desc.icon).toBe('UserSquare2');
      expect(desc.allowDelete).toBe(true);
      expect(desc.itemComponent).toBeDefined();
    });

    it('includes "title_subtitle" in available sections in AddSectionModal descriptors', () => {
      const descriptors = getAllSectionDescriptors().filter(
        d => d.type !== 'profile_header'
      );
      const titleDesc = descriptors.find(d => d.type === 'title_subtitle');
      expect(titleDesc).toBeDefined();
      expect(titleDesc.label).toBe('Título y Subtítulo');
    });
  });

  describe('Legacy State Migration & Separation (ensureProfileHeader)', () => {
    it('automatically splits legacy profile_header with bundled contacts into detached profile_header and contact sections', () => {
      const legacyData = {
        sections: [
          {
            id: 'profile_header',
            type: 'profile_header',
            column: 'left',
            title: '',
            items: [
              {
                id: 'prof1',
                name: 'Margaret Hamilton',
                subtitle: 'Director of Software Engineering',
                email: 'margaret@mit.edu',
                phone: '+1 617 253 1000',
                location: 'Cambridge, MA',
                contacts: [
                  { id: 'c_email', type: 'email', value: 'margaret@mit.edu' },
                  { id: 'c_phone', type: 'phone', value: '+1 617 253 1000' },
                  { id: 'c_loc', type: 'location', value: 'Cambridge, MA' }
                ]
              }
            ]
          }
        ]
      };

      const migrated = ensureProfileHeader(legacyData);

      // Verify both sections now exist
      const headerSec = migrated.sections.find(s => s.type === 'profile_header');
      const contactSec = migrated.sections.find(s => s.type === 'contact');

      expect(headerSec).toBeDefined();
      expect(contactSec).toBeDefined();

      // Verify headerSec ONLY retains candidate name and subtitle
      expect(headerSec.items[0].name).toBe('Margaret Hamilton');
      expect(headerSec.items[0].subtitle).toBe('Director of Software Engineering');
      expect(headerSec.items[0].contacts).toBeUndefined();
      expect(headerSec.items[0].email).toBeUndefined();
      expect(headerSec.items[0].phone).toBeUndefined();

      // Verify contactSec possesses extracted contacts
      expect(contactSec.items[0].contacts).toHaveLength(3);
      expect(contactSec.items[0].contacts.map(c => c.value)).toEqual(
        expect.arrayContaining(['margaret@mit.edu', '+1 617 253 1000', 'Cambridge, MA'])
      );
    });
  });

  describe('Detached Multi-Column Layout & Print Parity', () => {
    it('generates clean print HTML with detached Title in right column and Contact in left column', () => {
      const detachedCv = {
        layout: { type: '2-column' },
        sections: [
          {
            id: 'my_title_sec',
            type: 'profile_header',
            column: 'right', // Name & Subtitle in right main column!
            title: '',
            items: [
              {
                id: 'item_title',
                name: 'Grace Hopper',
                subtitle: 'Rear Admiral & Computer Scientist'
              }
            ]
          },
          {
            id: 'my_contact_sec',
            type: 'contact',
            column: 'left', // Contact in left sidebar column!
            title: '',
            items: [
              {
                id: 'item_contact',
                contacts: [
                  { id: 'c_email', type: 'email', value: 'grace@navy.mil' },
                  { id: 'c_loc', type: 'location', value: 'Arlington, VA' }
                ]
              }
            ]
          }
        ]
      };

      const html = generateCleanPrintHTML(detachedCv, 'es');

      // Check content rendered
      expect(html).toContain('Grace Hopper');
      expect(html).toContain('Rear Admiral &amp; Computer Scientist');
      expect(html).toContain('grace@navy.mil');
      expect(html).toContain('Arlington, VA');

      // Check column placement in print output
      const leftColMatch = html.indexOf('class="resume__left"');
      const rightColMatch = html.indexOf('class="resume__right"');
      const contactMatch = html.indexOf('grace@navy.mil');
      const nameMatch = html.indexOf('Grace Hopper');

      expect(leftColMatch).toBeGreaterThan(-1);
      expect(rightColMatch).toBeGreaterThan(-1);

      // Contact is inside resume__left (before resume__right)
      const leftColHtml = html.slice(leftColMatch, rightColMatch);
      expect(leftColHtml).toContain('grace@navy.mil');

      // Name is inside resume__right (after resume__right)
      const rightColHtml = html.slice(rightColMatch);
      expect(rightColHtml).toContain('Grace Hopper');

      // Zero editor artifacts
      expect(html).not.toContain('add-contact-btn');
      expect(html).not.toContain('contact-del-btn');
      expect(html).not.toContain('drag-handle');
    });
  });
});
