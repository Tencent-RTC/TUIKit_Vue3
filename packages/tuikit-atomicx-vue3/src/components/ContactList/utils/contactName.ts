import type { Friend } from '../../../types/contact';

export function getFriendDisplayName(friend: Friend): string {
  return friend.remark || friend.nick || friend.userID || '';
}
