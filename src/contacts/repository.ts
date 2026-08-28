import * as ExpoContacts from 'expo-contacts/legacy';
import { PhoneContact } from '../api/contactSync';

function normalizePhone(value: string) {
  return value.replace(/[\s()-]/g, '').trim();
}

export async function readPhoneContacts(): Promise<PhoneContact[]> {
  const response = await ExpoContacts.getContactsAsync({
    fields: [
      ExpoContacts.Fields.Name,
      ExpoContacts.Fields.FirstName,
      ExpoContacts.Fields.LastName,
      ExpoContacts.Fields.PhoneNumbers,
      ExpoContacts.Fields.Emails,
    ],
    pageSize: 10000,
  });

  const deduped = new Map<string, PhoneContact>();

  for (const contact of response.data) {
    const name = contact.name?.trim()
      || [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim()
      || 'Unknown Contact';
    const email = contact.emails?.[0]?.email?.trim() || undefined;

    for (const phoneEntry of contact.phoneNumbers ?? []) {
      const phone = normalizePhone(phoneEntry.number ?? '');
      if (!phone) {
        continue;
      }

      if (!deduped.has(phone)) {
        deduped.set(phone, { name, phone, email });
      }
    }
  }

  return Array.from(deduped.values());
}
