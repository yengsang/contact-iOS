import { http } from './http';

function buildHeaders(qrToken: string, referralCode: string) {
  const headers: Record<string, string> = {};

  if (qrToken.trim()) {
    headers['x-tenant-qr-token'] = qrToken.trim();
  }

  if (referralCode.trim()) {
    headers['x-referral-code'] = referralCode.trim();
  }

  return headers;
}

export type PhoneContact = {
  name: string;
  phone: string;
  email?: string;
};

export type SyncContactsResult = {
  created: number;
  updated: number;
};

async function findExistingContactId(params: {
  qrToken: string;
  referralCode?: string;
  userId: number;
  phone: string;
}) {
  const response = await http.get<{ data?: Array<{ id: number }> }>(
    `/api/app-users/${params.userId}/contacts`,
    {
      params: {
        phone: params.phone,
        pageSize: 1,
      },
      headers: buildHeaders(params.qrToken, params.referralCode ?? ''),
    },
  );

  return response.data?.data?.[0]?.id ?? null;
}

function buildContactPayload(userId: number, contact: PhoneContact) {
  return {
    name: contact.name,
    phone: contact.phone,
    ...(contact.email ? { email: contact.email } : {}),
    user: {
      connect: [userId],
    },
  };
}

async function createContact(params: {
  qrToken: string;
  referralCode?: string;
  userId: number;
  contact: PhoneContact;
}) {
  await http.post(
    '/api/contacts',
    {
      data: buildContactPayload(params.userId, params.contact),
    },
    {
      headers: buildHeaders(params.qrToken, params.referralCode ?? ''),
    },
  );
}

async function updateContact(params: {
  qrToken: string;
  referralCode?: string;
  userId: number;
  contactId: number;
  contact: PhoneContact;
}) {
  await http.put(
    `/api/contacts/${params.contactId}`,
    {
      data: buildContactPayload(params.userId, params.contact),
    },
    {
      headers: buildHeaders(params.qrToken, params.referralCode ?? ''),
    },
  );
}

export async function syncContacts(params: {
  qrToken: string;
  referralCode?: string;
  userId: number;
  contacts: PhoneContact[];
  onProgress?: (current: number, total: number) => void;
}) {
  let created = 0;
  let updated = 0;

  for (let index = 0; index < params.contacts.length; index += 1) {
    const contact = params.contacts[index];
    params.onProgress?.(index + 1, params.contacts.length);

    const existingId = await findExistingContactId({
      qrToken: params.qrToken,
      referralCode: params.referralCode,
      userId: params.userId,
      phone: contact.phone,
    });

    if (existingId) {
      await updateContact({
        qrToken: params.qrToken,
        referralCode: params.referralCode,
        userId: params.userId,
        contactId: existingId,
        contact,
      });
      updated += 1;
    } else {
      await createContact({
        qrToken: params.qrToken,
        referralCode: params.referralCode,
        userId: params.userId,
        contact,
      });
      created += 1;
    }
  }

  return { created, updated } satisfies SyncContactsResult;
}
