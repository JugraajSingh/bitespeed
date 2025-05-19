import { Contact } from '../models/contact.model';

export function formatResponse(contact: Contact) {
  return {
    contact: {
      primaryContatctId: contact.primaryContactId,
      emails: contact.emails,
      phoneNumbers: contact.phoneNumbers,
      secondaryContactIds: contact.secondaryContactIds,
    }
  };
}