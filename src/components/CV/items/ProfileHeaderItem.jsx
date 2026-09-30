/**
 * @file ProfileHeaderItem.jsx
 * @description Composite profile header component for backwards compatibility.
 * Composes the separated ProfileTitleItem (TITLE-Subtitle) and ContactItem (Contacts).
 *
 * Implements Open/Closed pattern:
 * - When used in detached layout, ProfileTitleItem and ContactItem can be used as independent sections.
 * - When used as composite ProfileHeaderItem, seamlessly coordinates both sub-components.
 */

import React from 'react';
import ProfileTitleItem, { ProfileTitlePrintView, ProfileTitleEditView } from './ProfileTitleItem';
import ContactItem, { ContactPrintView, ContactEditView } from './ContactItem';
import { normalizeItemContacts } from '../../../utils/contactTypes';

/**
 * Print View: Composes ProfileTitlePrintView and ContactPrintView.
 */
const ProfileHeaderPrintView = (props) => {
  const contacts = normalizeItemContacts(props.item);
  const hasContacts = contacts.some(c => c && c.value && String(c.value).trim() !== '');

  return (
    <>
      <ProfileTitlePrintView {...props} />
      {hasContacts && (
        <div style={{ marginTop: '3px' }}>
          <ContactPrintView {...props} />
        </div>
      )}
    </>
  );
};

/**
 * Edit View: Composes ProfileTitleEditView and ContactEditView.
 */
const ProfileHeaderItemEditView = (props) => {
  const contacts = normalizeItemContacts(props.item);
  const hasContacts = contacts.length > 0;

  return (
    <>
      <ProfileTitleEditView {...props} />
      {hasContacts && (
        <div style={{ marginTop: '3px' }}>
          <ContactEditView {...props} />
        </div>
      )}
    </>
  );
};

/**
 * Composite ProfileHeaderItem component.
 */
const ProfileHeaderItem = (props) => {
  if (props.isPrint) {
    return <ProfileHeaderPrintView {...props} />;
  }
  return <ProfileHeaderItemEditView {...props} />;
};

export { 
  ProfileHeaderPrintView, 
  ProfileHeaderItemEditView, 
  ProfileTitleItem, 
  ContactItem 
};
export default ProfileHeaderItem;
