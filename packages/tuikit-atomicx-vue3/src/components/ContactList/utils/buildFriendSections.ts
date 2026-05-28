import type { ContactInfo } from '@atomicxcore/core';
import type { ContactLetterSection } from '../../../types/contact';
import { getFriendDisplayName } from './contactName';
import { sortByFirstChar } from './sortByFirstChar';

/**
 * Group a flat friend list into pinyin-initial based sections for display.
 */
export function buildFriendSections(friendList: ContactInfo[]): ContactLetterSection[] {
  const { groupedList } = sortByFirstChar(friendList, getFriendDisplayName);

  return Object.entries(groupedList).map(([letter, items]) => ({
    key: letter,
    title: letter,
    count: items.length,
    items,
  }));
}
