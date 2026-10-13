/**
 * @file bitacoraService.js
 * @description Decoupled data access service for Bitácora.
 * Seamlessly interfaces with Supabase when configured, or transparently falls back
 * to local persistence and curated knowledge items when offline or in local development.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { INITIAL_BITACORA_ITEMS } from '../data/bitacora/items';
import {
  getCustomBitacoraItems,
  saveCustomBitacoraItem,
  toggleItemVote as toggleLocalVote,
} from '../utils/bitacoraStorage';

const VOTER_TOKEN_KEY = 'Easy CV Editor_voter_token';

/**
 * Get or create a persistent anonymous client voter token for anti-abuse.
 * @returns {string}
 */
export const getClientVoterToken = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return 'anonymous-token';
  }
  try {
    let token = localStorage.getItem(VOTER_TOKEN_KEY);
    if (!token) {
      token = 'guest_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
      localStorage.setItem(VOTER_TOKEN_KEY, token);
    }
    return token;
  } catch (err) {
    return 'fallback-token';
  }
};

/**
 * Fetch all published bitacora posts.
 * Tries Supabase first; if unconfigured or error, returns local items.
 * @returns {Promise<{ data: Array, source: 'supabase' | 'local', error?: any }>}
 */
export const fetchBitacoraPosts = async () => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('bitacora_posts')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch failed, falling back to local items:', error);
      } else if (data && data.length > 0) {
        // Map database fields to application shape if needed
        const mapped = data.map((item) => ({
          ...item,
          readTimeMinutes: item.read_time_minutes ?? item.readTimeMinutes ?? 2,
          createdAt: item.created_at ? item.created_at.split('T')[0] : item.createdAt,
        }));
        return { data: mapped, source: 'supabase' };
      }
    } catch (err) {
      console.warn('Error querying Supabase bitacora_posts:', err);
    }
  }

  // Local fallback
  const customItems = getCustomBitacoraItems();
  return {
    data: [...customItems, ...INITIAL_BITACORA_ITEMS],
    source: 'local',
  };
};

/**
 * Toggle an upvote for a specific post.
 * In Supabase: invokes atomic RPC `toggle_bitacora_vote`.
 * In Local: records in localStorage with client-side throttle.
 * @param {string} postId
 * @returns {Promise<{ success: boolean, hasVoted: boolean, upvotes?: number, error?: any }>}
 */
export const toggleVote = async (postId) => {
  const voterToken = getClientVoterToken();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('toggle_bitacora_vote', {
        p_post_id: postId,
        p_voter_token: voterToken,
      });

      if (!error && data) {
        // Synchronize local cache
        toggleLocalVote(postId);
        return {
          success: true,
          hasVoted: data.has_voted,
          upvotes: data.upvotes,
        };
      }
      console.warn('Supabase vote RPC error, falling back to local:', error);
    } catch (err) {
      console.warn('Error calling Supabase toggle_bitacora_vote:', err);
    }
  }

  // Local fallback
  const localResult = toggleLocalVote(postId);
  return {
    success: localResult.success,
    hasVoted: localResult.hasVoted,
  };
};

/**
 * Submit / create a new bitacora item.
 * @param {object} itemData
 * @returns {Promise<{ success: boolean, item: object, error?: any }>}
 */
export const submitBitacoraPost = async (itemData) => {
  const id = itemData.id || `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const formattedItem = {
    id,
    category: itemData.category || 'strategy',
    title: itemData.title.trim(),
    summary: itemData.summary.trim(),
    read_time_minutes: Number(itemData.readTimeMinutes || 2),
    readTimeMinutes: Number(itemData.readTimeMinutes || 2),
    callout: itemData.callout?.text ? itemData.callout : null,
    content: itemData.content?.trim() || null,
    links: Array.isArray(itemData.links) ? itemData.links : [],
    author: itemData.author || {
      name: 'Comunidad Easy CV Editor',
      role: 'Colaborador',
      isOfficial: false,
    },
    tags: Array.isArray(itemData.tags) ? itemData.tags : [],
    upvotes: 0,
    status: 'published',
    created_at: now,
    createdAt: now.split('T')[0],
  };

  // Always save in local storage for immediate persistence on client
  saveCustomBitacoraItem(formattedItem);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('bitacora_posts').insert([
        {
          id: formattedItem.id,
          category: formattedItem.category,
          title: formattedItem.title,
          summary: formattedItem.summary,
          read_time_minutes: formattedItem.read_time_minutes,
          callout: formattedItem.callout,
          content: formattedItem.content,
          links: formattedItem.links,
          author: formattedItem.author,
          tags: formattedItem.tags,
          upvotes: 0,
          status: 'published',
          created_at: now,
        },
      ]);

      if (error) {
        console.warn('Supabase post insert failed (saved locally):', error);
      }
    } catch (err) {
      console.warn('Error inserting post into Supabase:', err);
    }
  }

  return { success: true, item: formattedItem };
};
