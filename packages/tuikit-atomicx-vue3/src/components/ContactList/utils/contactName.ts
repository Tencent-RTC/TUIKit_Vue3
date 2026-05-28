import type { ContactInfo } from '@atomicxcore/core';

/**
 * Resolve the display name of a contact according to priority:
 * friend remark > nickname > userID.
 */
export function getFriendDisplayName(contact: ContactInfo): string {
  return contact.friendRemark || contact.nickname || contact.userID || '';
}
