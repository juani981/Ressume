import React, { useState } from 'react';
import InlineEdit from '../../Editor/InlineEdit';
import ContactTypePicker from '../../Editor/ContactTypePicker';
import { normalizeItemContacts, getContactConfig, syncFlatContactFields, ContactIcon } from '../../../utils/contactTypes';
import { Minus, Plus } from 'lucide-react';

const ProfileHeaderPrintView = ({ item }) => {
  const contacts = normalizeItemContacts(item);

  return (
    <>
      <h1 className="home__title">
        <InlineEdit 
          value={item.name || ''} 
          isPrint={true}
        />
      </h1>
      <h2 className="home__subtitle">
        <InlineEdit 
          value={item.subtitle || ''} 
          isPrint={true}
        />
      </h2>
      
      <div 
        className="social__container bd-grid" 
        style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginTop: '1rem' }}
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
    </>
  );
};

const ProfileHeaderItemEditView = ({ item, sectionId, onUpdateItem }) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [triggerRect, setTriggerRect] = useState(null);

  const contacts = normalizeItemContacts(item);

  const handleUpdateContactValue = (contactId, newValue) => {
    const updated = contacts.map(c => c.id === contactId ? { ...c, value: newValue } : c);
    const flatSync = syncFlatContactFields(updated);
    onUpdateItem(sectionId, item.id, { contacts: updated, ...flatSync });
  };

  const handleDeleteContact = (contactId) => {
    const updated = contacts.filter(c => c.id !== contactId);
    const flatSync = syncFlatContactFields(updated);
    onUpdateItem(sectionId, item.id, { contacts: updated, ...flatSync });
  };

  const handleSelectType = (typeConfig) => {
    const newContact = {
      id: `c_${typeConfig.id}_${Date.now()}`,
      type: typeConfig.id,
      value: ''
    };
    const updated = [...contacts, newContact];
    const flatSync = syncFlatContactFields(updated);
    onUpdateItem(sectionId, item.id, { contacts: updated, ...flatSync });
    setIsPickerOpen(false);
  };

  return (
    <>
      <h1 className="home__title">
        <InlineEdit 
          value={item.name || ''} 
          onSave={(val) => onUpdateItem(sectionId, item.id, 'name', val)} 
        />
      </h1>
      <h2 className="home__subtitle">
        <InlineEdit 
          value={item.subtitle || ''} 
          onSave={(val) => onUpdateItem(sectionId, item.id, 'subtitle', val)} 
        />
      </h2>
      
      <div 
        className="social__container bd-grid" 
        style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginTop: '1rem' }}
      >
        {contacts.map((contact, idx) => {
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
                placeholder={config.placeholder || config.label}
                onSave={(val) => handleUpdateContactValue(contact.id, val)} 
              />
              <button
                type="button"
                className="contact-del-btn bullet-del-btn no-print"
                data-editor-ui="true"
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

const ProfileHeaderItem = (props) => {
  if (props.isPrint) {
    return <ProfileHeaderPrintView {...props} />;
  }
  return <ProfileHeaderItemEditView {...props} />;
};

export { ProfileHeaderPrintView, ProfileHeaderItemEditView };
export default ProfileHeaderItem;
