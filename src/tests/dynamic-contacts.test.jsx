import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileHeaderItem from '../components/CV/items/ProfileHeaderItem';
import ContactTypePicker from '../components/Editor/ContactTypePicker';
import { 
  CONTACT_TYPES, 
  getContactConfig, 
  normalizeItemContacts, 
  syncFlatContactFields 
} from '../utils/contactTypes';
import { generateCleanPrintHTML } from '../utils/staticHtmlPdfEngine';

describe('Dynamic Contact System & ContactTypePicker', () => {
  describe('contactTypes utilities', () => {
    it('normalizes legacy flat contact fields into contacts array', () => {
      const legacyItem = {
        name: 'Juan Perez',
        subtitle: 'Dev',
        location: 'Buenos Aires',
        email: 'juan@test.com',
        phone: '+54 11 1111',
        linkedin: 'linkedin.com/in/juan',
        github: 'github.com/juan'
      };

      const contacts = normalizeItemContacts(legacyItem);
      expect(contacts).toHaveLength(5);
      expect(contacts.map(c => c.type)).toEqual(['location', 'email', 'phone', 'linkedin', 'github']);
      expect(contacts.find(c => c.type === 'email').value).toBe('juan@test.com');
    });

    it('preserves existing contacts array when present', () => {
      const modernItem = {
        name: 'Ana Gomez',
        contacts: [
          { id: 'c1', type: 'whatsapp', value: '+54 9 11 9999' },
          { id: 'c2', type: 'leetcode', value: 'leetcode.com/ana' }
        ]
      };

      const contacts = normalizeItemContacts(modernItem);
      expect(contacts).toHaveLength(2);
      expect(contacts[0].type).toBe('whatsapp');
      expect(contacts[1].type).toBe('leetcode');
    });

    it('retrieves config for all standardized recruiter-friendly contact types', () => {
      const leetcodeCfg = getContactConfig('leetcode');
      expect(leetcodeCfg.icon).toBe('Code2');
      expect(leetcodeCfg.category).toBe('code');

      const whatsappCfg = getContactConfig('whatsapp');
      expect(whatsappCfg.icon).toBe('MessageCircle');

      const workModeCfg = getContactConfig('work_mode');
      expect(workModeCfg.icon).toBe('Laptop');

      const visaCfg = getContactConfig('citizenship');
      expect(visaCfg.icon).toBe('IdCard');

      const unknownCfg = getContactConfig('other_custom_network');
      expect(unknownCfg.icon).toBe('Link');
    });

    it('syncs flat fields for backward compatibility', () => {
      const contacts = [
        { id: '1', type: 'email', value: 'hello@world.com' },
        { id: '2', type: 'github', value: 'github.com/dev' },
        { id: '3', type: 'whatsapp', value: '+12345' }
      ];

      const flat = syncFlatContactFields(contacts);
      expect(flat.email).toBe('hello@world.com');
      expect(flat.github).toBe('github.com/dev');
      expect(flat.phone).toBe('');
    });
  });

  describe('ContactTypePicker component', () => {
    it('does not render when isOpen is false', () => {
      render(
        <ContactTypePicker 
          isOpen={false} 
          onClose={() => {}} 
          onSelectType={() => {}} 
        />
      );
      expect(screen.queryByTestId('contact-type-picker')).not.toBeInTheDocument();
    });

    it('renders and filters by search query', () => {
      const onSelectType = vi.fn();
      render(
        <ContactTypePicker 
          isOpen={true} 
          onClose={() => {}} 
          onSelectType={onSelectType} 
        />
      );

      expect(screen.getByTestId('contact-type-picker')).toBeInTheDocument();

      const searchInput = screen.getByPlaceholderText(/buscar tipo/i);
      fireEvent.change(searchInput, { target: { value: 'leetcode' } });

      expect(screen.getByTestId('contact-type-opt-leetcode')).toBeInTheDocument();
      expect(screen.queryByTestId('contact-type-opt-whatsapp')).not.toBeInTheDocument();

      // Click option
      fireEvent.click(screen.getByTestId('contact-type-opt-leetcode'));
      expect(onSelectType).toHaveBeenCalledWith(expect.objectContaining({ id: 'leetcode' }));
    });

    it('filters by category tab', () => {
      render(
        <ContactTypePicker 
          isOpen={true} 
          onClose={() => {}} 
          onSelectType={() => {}} 
        />
      );

      // Click "Web & Portfolio" tab
      const webTab = screen.getByRole('button', { name: /web & portfolio/i });
      fireEvent.click(webTab);

      expect(screen.getByTestId('contact-type-opt-portfolio')).toBeInTheDocument();
      expect(screen.getByTestId('contact-type-opt-figma')).toBeInTheDocument();
      expect(screen.queryByTestId('contact-type-opt-phone')).not.toBeInTheDocument();
    });

    it('triggers onClose on Escape key', () => {
      const onClose = vi.fn();
      render(
        <ContactTypePicker 
          isOpen={true} 
          onClose={onClose} 
          onSelectType={() => {}} 
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('ProfileHeaderItem dynamic rendering and management', () => {
    it('renders contact pills with icons and handles addition via popover', () => {
      const onUpdateItem = vi.fn();
      const item = {
        id: 'prof_test',
        name: 'Carrizo Juan',
        subtitle: 'Full-Stack Dev',
        contacts: [
          { id: 'c1', type: 'email', value: 'juan@test.com' },
          { id: 'c2', type: 'github', value: 'github.com/juani' }
        ]
      };

      render(
        <ProfileHeaderItem 
          item={item} 
          sectionId="profile_header" 
          onUpdateItem={onUpdateItem} 
        />
      );

      // Verify contact elements rendered
      expect(screen.getByText('juan@test.com')).toBeInTheDocument();
      expect(screen.getByText('github.com/juani')).toBeInTheDocument();

      // Open picker
      const addBtn = screen.getByRole('button', { name: /agregar dato de contacto/i });
      fireEvent.click(addBtn);

      expect(screen.getByTestId('contact-type-picker')).toBeInTheDocument();

      // Select Telegram
      const telegramOpt = screen.getByTestId('contact-type-opt-telegram');
      fireEvent.click(telegramOpt);

      expect(onUpdateItem).toHaveBeenCalledWith(
        'profile_header',
        'prof_test',
        expect.objectContaining({
          contacts: expect.arrayContaining([
            expect.objectContaining({ id: 'c1', value: 'juan@test.com' }),
            expect.objectContaining({ id: 'c2', value: 'github.com/juani' }),
            expect.objectContaining({ type: 'telegram', value: '' })
          ])
        })
      );
    });

    it('deletes a contact item when clicking delete button', () => {
      const onUpdateItem = vi.fn();
      const item = {
        id: 'prof_test',
        name: 'Carrizo Juan',
        subtitle: 'Dev',
        contacts: [
          { id: 'c1', type: 'email', value: 'juan@test.com' },
          { id: 'c2', type: 'phone', value: '123456' }
        ]
      };

      render(
        <ProfileHeaderItem 
          item={item} 
          sectionId="profile_header" 
          onUpdateItem={onUpdateItem} 
        />
      );

      const delBtn = screen.getByRole('button', { name: /eliminar teléfono/i });
      fireEvent.click(delBtn);

      expect(onUpdateItem).toHaveBeenCalledWith(
        'profile_header',
        'prof_test',
        expect.objectContaining({
          contacts: [expect.objectContaining({ id: 'c1', value: 'juan@test.com' })],
          phone: ''
        })
      );
    });
  });

  describe('Print engine compatibility', () => {
    it('renders dynamic contacts with correct vector BoxIcons into static clean print HTML', () => {
      const sampleCv = {
        layout: { type: '2-column' },
        sections: [
          {
            id: 'profile_header',
            type: 'profile_header',
            items: [
              {
                id: 'prof1',
                name: 'Juan Ignacio Carrizo',
                subtitle: 'Tech Lead',
                contacts: [
                  { id: 'c1', type: 'email', value: 'juan@tech.com' },
                  { id: 'c2', type: 'leetcode', value: 'leetcode.com/juan' },
                  { id: 'c3', type: 'whatsapp', value: '+5493816706133' },
                  { id: 'c4', type: 'work_mode', value: 'Remoto Full-time' }
                ]
              }
            ]
          }
        ]
      };

      const html = generateCleanPrintHTML(sampleCv, 'es');
      expect(html).toContain('juan@tech.com');
      expect(html).toContain('lucide-mail');
      expect(html).toContain('leetcode.com/juan');
      expect(html).toContain('lucide-code');
      expect(html).toContain('+5493816706133');
      expect(html).toContain('lucide-message-circle');
      expect(html).toContain('Remoto Full-time');
      expect(html).toContain('lucide-laptop');

      // Does not contain any editor buttons
      expect(html).not.toContain('add-contact-btn');
      expect(html).not.toContain('contact-del-btn');
    });
  });
});
