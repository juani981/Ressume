/**
 * @file ContactItem.jsx
 * @description Item component for the Contact section (email, phone, location, links, socials).
 *
 * Implements Open/Closed pattern:
 * - Dedicated component for candidate contact details
 * - Completely detached from name/subtitle, allowing independent layout positioning
 * - Supports dynamic contact type picker, inline editing, and deletion
 * - Renders recruiter-friendly icons and pill links in print mode
 */

import React, { useState } from 'react';
import InlineEdit from '../../Editor/InlineEdit';
import ContactTypePicker from '../../Editor/ContactTypePicker';
import { normalizeItemContacts, getContactConfig, syncFlatContactFields, ContactIcon } from '../../../utils/contactTypes';
import { Minus, Plus } from 'lucide-react';

/**
 * Print View: Pure semantic contact links and icons without interactive controls.
 */
const ContactPrintView = ({ item }) => {
  const contacts = normalizeItemContacts(item);

  return (
    <div 
      className="social__container bd-grid" 
      style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}
    >
      {contacts
        .filter(c => c && c.value && String(c.value).trim() !== '')
        .map((contact, idx) => {
          const config = getContactConfig(contact.type);
          return (
            <span 
              key={contact.id || `contact_${idx}`} 
              className="social__link contact-item-pill"
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ContactIcon name={config.icon} size={14} />{' '}
              <InlineEdit 
                value={contact.value || ''} 
                isPrint={true}
              />
            </span>
          );
        })}
    </div>
  );
};

/**
 * Edit View: Interactive contact items with inline editing, addition picker, and deletion.
 */
const ContactEditView = ({ item, sectionId, onUpdateItem }) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [triggerRect, setTriggerRect] = useState(null);

  const contacts = normalizeItemContacts(item);

  const handleUpdateContactValue = (contactId, newValue) => {
    const updated = contacts.map(c => c.id === contactId ? { ...c, value: newValue } : c);
    const flatSync = syncFlatContactFields(updated);
    if (typeof onUpdateItem === 'function') {
      onUpdateItem(sectionId, item.id, { contacts: updated, ...flatSync });
    }
  };

  const handleDeleteContact = (contactId) => {
    const updated = contacts.filter(c => c.id !== contactId);
    const flatSync = syncFlatContactFields(updated);
    if (typeof onUpdateItem === 'function') {
      onUpdateItem(sectionId, item.id, { contacts: updated, ...flatSync });
    }
  };

  const handleSelectType = (typeConfig) => {
    const newContact = {
      id: `c_${typeConfig.id}_${Date.now()}`,
      type: typeConfig.id,
      value: ''
    };
    const updated = [...contacts, newContact];
    const flatSync = syncFlatContactFields(updated);
    if (typeof onUpdateItem === 'function') {
      onUpdateItem(sectionId, item.id, { contacts: updated, ...flatSync });
    }
    setIsPickerOpen(false);
  };

  return (
    <>
      <div 
        className="social__container bd-grid" 
        style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}
      >
        {contacts.map((contact, idx) => {
          const config = getContactConfig(contact.type);
          return (
            <span 
              key={contact.id || `contact_${idx}`} 
              className="social__link contact-item-pill"
              onPointerDown={(e) => {
                if (!e.target.closest('.drag-handle')) {
                  e.stopPropagation();
                }
              }}
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ContactIcon name={config.icon} size={14} />{' '}
              <InlineEdit 
                value={contact.value || ''} 
                placeholder={config.placeholder || config.label}
                onSave={(val) => handleUpdateContactValue(contact.id, val)} 
              />
              <button
                type="button"
                className="contact-del-btn bullet-del-btn no-print"
                data-editor-ui="true"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteContact(contact.id);
                }}
                title={`Eliminar ${config.label}`}
                aria-label={`Eliminar ${config.label}`}
              >
                <Minus size={12} strokeWidth={2.5} />
              </button>
            </span>
          );
        })}

        {/* Dynamic Contact Adder Button */}
        <button
          type="button"
          className="add-contact-btn no-print"
          data-editor-ui="true"
          data-editor-add="true"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setTriggerRect(rect);
            setIsPickerOpen(prev => !prev);
          }}
          title="Agregar nuevo dato de contacto o red social"
          aria-label="Agregar dato de contacto"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 9px',
            borderRadius: '999px',
            border: '1px dashed var(--first-color, #3874ff)',
            background: 'rgba(56, 116, 255, 0.06)',
            color: 'var(--first-color, #3874ff)',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            height: '24px'
          }}
        >
          <Plus size={13} strokeWidth={2.5} />
          <span>Contacto</span>
        </button>
      </div>

      {/* Floating Category Picker Popover */}
      <ContactTypePicker 
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectType={handleSelectType}
        triggerRect={triggerRect}
      />
    </>
  );
};

/**
 * Modular ContactItem component adhering to BaseItem template contract.
 */
const ContactItem = (props) => {
  if (props.isPrint) {
    return <ContactPrintView {...props} />;
  }
  return <ContactEditView {...props} />;
};

export { ContactPrintView, ContactEditView };
export default ContactItem;
