import { PrismaClient } from '@prisma/client';
import { Contact } from '../models/contact.model';

const prisma = new PrismaClient();

export const identifyContact = async (email: string | null, phoneNumber: string | null): Promise<Contact> => {
  try {
    // Find all contacts that match either the email or phone number
    const matchingContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { email: email ?? undefined },
          { phoneNumber: phoneNumber ?? undefined }
        ],
        deletedAt: null
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    console.log('DB query successful - matching contacts:', matchingContacts);

    // If no matching contacts, create a new primary contact
    if (matchingContacts.length === 0) {
      const newContact = await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: 'primary'
        }
      });
      console.log('Created new primary contact:', newContact);

      return {
        primaryContactId: newContact.id,
        emails: newContact.email ? [newContact.email] : [],
        phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
        secondaryContactIds: []
      };
    }

    // Find the primary contact (the oldest one)
    const primaryContact = matchingContacts.find((c: { linkPrecedence: string; }) => c.linkPrecedence === 'primary') || 
                         matchingContacts[0];
    console.log('Primary contact identified:', primaryContact);

    // Find all contacts linked to this primary contact
    const allLinkedContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { id: primaryContact.id },
          { linkedId: primaryContact.id }
        ],
        deletedAt: null
      }
    });
    console.log('All linked contacts:', allLinkedContacts);

    // Check if we need to link any new information
    const hasNewEmail = email && !allLinkedContacts.some((c: { email: string | null; }) => c.email === email);
    const hasNewPhone = phoneNumber && !allLinkedContacts.some((c: { phoneNumber: string | null; }) => c.phoneNumber === phoneNumber);

    if (hasNewEmail || hasNewPhone) {
      const newSecondaryContact = await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkedId: primaryContact.id,
          linkPrecedence: 'secondary'
        }
      });
      console.log('Created new secondary contact:', newSecondaryContact);
    }

    // Check if we need to convert any primary contacts to secondary
    const otherPrimaryContacts = matchingContacts.filter(
      (c: { linkPrecedence: string; id: any; }) => c.linkPrecedence === 'primary' && c.id !== primaryContact.id
    );
    console.log('Other primary contacts to convert:', otherPrimaryContacts);

    if (otherPrimaryContacts.length > 0) {
      for (const contact of otherPrimaryContacts) {
        await prisma.contact.update({
          where: { id: contact.id },
          data: {
            linkedId: primaryContact.id,
            linkPrecedence: 'secondary',
            updatedAt: new Date()
          }
        });
        console.log(`Converted contact ${contact.id} to secondary`);

        // Also update all contacts linked to this now-secondary contact
        await prisma.contact.updateMany({
          where: { linkedId: contact.id },
          data: {
            linkedId: primaryContact.id,
            updatedAt: new Date()
          }
        });
        console.log(`Updated contacts linked to ${contact.id}`);
      }
    }

    // Get all updated linked contacts
    const updatedLinkedContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { id: primaryContact.id },
          { linkedId: primaryContact.id }
        ],
        deletedAt: null
      }
    });
    console.log('Final linked contacts:', updatedLinkedContacts);

    // Collect all unique emails and phone numbers
    const emails: string[] = Array.from(new Set(
      updatedLinkedContacts
        .map((c: { email: any; }) => c.email)
        .filter((e: string | null): e is string => e !== null)
    ));
    const phoneNumbers: string[] = Array.from(new Set(
      updatedLinkedContacts
        .map((c: { phoneNumber: any; }) => c.phoneNumber)
        .filter((p: string | null): p is string => p !== null)
    ));

    // Sort emails and phoneNumbers with primary contact's info first
    if (primaryContact.email && emails.length > 1) {
      const primaryEmailIndex = emails.indexOf(primaryContact.email);
      if (primaryEmailIndex > 0) {
        emails.splice(primaryEmailIndex, 1);
        emails.unshift(primaryContact.email);
      }
    }

    if (primaryContact.phoneNumber && phoneNumbers.length > 1) {
      const primaryPhoneIndex = phoneNumbers.indexOf(primaryContact.phoneNumber);
      if (primaryPhoneIndex > 0) {
        phoneNumbers.splice(primaryPhoneIndex, 1);
        phoneNumbers.unshift(primaryContact.phoneNumber);
      }
    }

    // Get all secondary contact IDs
    const secondaryContactIds = updatedLinkedContacts
      .filter((c: { id: any; }) => c.id !== primaryContact.id)
      .map((c: { id: any; }) => c.id);

    console.log('Returning response:', {
      primaryContactId: primaryContact.id,
      emails,
      phoneNumbers,
      secondaryContactIds
    });

    return {
      primaryContactId: primaryContact.id,
      emails,
      phoneNumbers,
      secondaryContactIds
    };

  } catch (error) {
    console.error('DB operation failed:', error);
    throw error;
  }
};