/**
 * @file bitacoraStorage.js
 * @description Client-side storage and anti-abuse verification layer for Bitácora.
 * Prepares the frontend for Supabase integration with an anti-abuse voting signature.
 */

const STORAGE_VOTES_KEY = 'ressume_bitacora_voted_ids';
const STORAGE_CUSTOM_ITEMS_KEY = 'ressume_bitacora_custom_items';
const VOTE_COOLDOWN_MS = 600;

let lastVoteTimestamp = 0;

/**
 * Get the list of item IDs already voted by the current client.
 * @returns {string[]}
 */
export const getVotedItemIds = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_VOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Error reading bitacora votes from localStorage:', err);
    return [];
  }
};

/**
 * Check if the user has already voted on a specific item.
 * @param {string} itemId
 * @returns {boolean}
 */
export const hasUserVoted = (itemId) => {
  const votedIds = getVotedItemIds();
  return votedIds.includes(itemId);
};

/**
 * Record a vote toggle for an item with client-side anti-abuse throttling.
 * @param {string} itemId
 * @returns {{ success: boolean, hasVoted: boolean, reason?: string }}
 */
export const toggleItemVote = (itemId) => {
  const now = Date.now();
  if (now - lastVoteTimestamp < VOTE_COOLDOWN_MS) {
    return { success: false, hasVoted: false, reason: 'rate_limited' };
  }
  lastVoteTimestamp = now;

  const votedIds = new Set(getVotedItemIds());
  const currentlyVoted = votedIds.has(itemId);

  if (currentlyVoted) {
    votedIds.delete(itemId);
  } else {
    votedIds.add(itemId);
  }

  try {
    localStorage.setItem(STORAGE_VOTES_KEY, JSON.stringify(Array.from(votedIds)));
    return { success: true, hasVoted: !currentlyVoted };
  } catch (err) {
    console.error('Error saving bitacora vote to localStorage:', err);
    return { success: false, hasVoted: currentlyVoted, reason: 'storage_error' };
  }
};

/**
 * Get locally saved custom items (drafts / user submissions).
 * @returns {Array}
 */
export const getCustomBitacoraItems = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_ITEMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Error reading custom bitacora items:', err);
    return [];
  }
};

/**
 * Save a newly submitted item locally (ready to sync with Supabase).
 * @param {object} item
 * @returns {boolean}
 */
export const saveCustomBitacoraItem = (item) => {
  try {
    const current = getCustomBitacoraItems();
    const updated = [item, ...current];
    localStorage.setItem(STORAGE_CUSTOM_ITEMS_KEY, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error('Error saving custom bitacora item:', err);
    return false;
  }
};
