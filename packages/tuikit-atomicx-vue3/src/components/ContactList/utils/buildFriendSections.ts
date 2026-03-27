import type { ContactLetterSection, Friend } from '../../../types/contact';
import { getFriendDisplayName } from './contactName';
import { sortByFirstChar } from './sortByFirstChar';

export function buildFriendSections(friendList: Friend[]): ContactLetterSection[] {
  const { groupedList } = sortByFirstChar(friendList, getFriendDisplayName);

  return Object.entries(groupedList).map(([letter, items]) => ({
    key: letter,
    title: letter,
    count: items.length,
    items,
  }));
}
