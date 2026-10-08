/**
 * @file useBitacora.js
 * @description State management hook for the Bitácora / Knowledge Hub.
 * Manages filtering, search, tag selection, polymorphic content detail, and anti-abuse voting.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { BITACORA_CATEGORIES } from '../data/bitacora/categories';
import { INITIAL_BITACORA_ITEMS } from '../data/bitacora/items';
import {
  getVotedItemIds,
  getCustomBitacoraItems,
} from '../utils/bitacoraStorage';
import {
  fetchBitacoraPosts,
  toggleVote as toggleVoteService,
  submitBitacoraPost,
} from '../services/bitacoraService';
import { isSupabaseConfigured } from '../services/supabaseClient';

export const useBitacora = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [activeItem, setActiveItem] = useState(null); // For detail modal reader
  const [isLoading, setIsLoading] = useState(false);

  // Initialize all items (default static items + local user-submitted items)
  const [items, setItems] = useState(() => {
    const custom = getCustomBitacoraItems();
    return [...custom, ...INITIAL_BITACORA_ITEMS];
  });

  // Track which items have been voted on by this client
  const [votedIds, setVotedIds] = useState(() => new Set(getVotedItemIds()));

  // Fetch posts from Supabase only if remote backend is configured
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let isMounted = true;
    const loadPosts = async () => {
      try {
        setIsLoading(true);
        const { data, source } = await fetchBitacoraPosts();
        if (isMounted && source === 'supabase' && data && data.length > 0) {
          setItems(data);
        }
      } catch (err) {
        console.warn('Bitacora: error fetching posts from Supabase:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    loadPosts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Count items per category
  const categoryCounts = useMemo(() => {
    const counts = { all: items.length };
    items.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [items]);

  // All unique tags across all items
  const allTags = useMemo(() => {
    const tagSet = new Set();
    items.forEach((item) => {
      if (Array.isArray(item.tags)) {
        item.tags.forEach((t) => tagSet.add(t));
      }
    });
    return Array.from(tagSet);
  }, [items]);

  // Filter items by category, search query, and tag
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      // 1. Category match
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // 2. Tag match
      if (selectedTag && (!Array.isArray(item.tags) || !item.tags.includes(selectedTag))) {
        return false;
      }

      // 3. Search query match
      if (query) {
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesSummary = item.summary?.toLowerCase().includes(query);
        const matchesContent = item.content?.toLowerCase().includes(query);
        const matchesTags = item.tags?.some((t) => t.toLowerCase().includes(query));
        const matchesAuthor = item.author?.name?.toLowerCase().includes(query);

        if (!matchesTitle && !matchesSummary && !matchesContent && !matchesTags && !matchesAuthor) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedCategory, selectedTag, searchQuery]);

  // Upvote / Useful vote handler with anti-abuse check
  const handleVote = useCallback(
    async (itemId) => {
      // Determine optimistic toggle
      const wasVoted = votedIds.has(itemId);
      const willBeVoted = !wasVoted;

      // Optimistic state update
      setVotedIds((prev) => {
        const next = new Set(prev);
        if (willBeVoted) {
          next.add(itemId);
        } else {
          next.delete(itemId);
        }
        return next;
      });

      setItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id === itemId) {
            const delta = willBeVoted ? 1 : -1;
            return {
              ...item,
              upvotes: Math.max(0, (item.upvotes || 0) + delta),
            };
          }
          return item;
        })
      );

      // Call service (Supabase RPC or local fallback)
      const result = await toggleVoteService(itemId);

      if (!result.success) {
        // Rollback optimistic update on error or rate-limit
        setVotedIds((prev) => {
          const rollback = new Set(prev);
          if (wasVoted) rollback.add(itemId);
          else rollback.delete(itemId);
          return rollback;
        });

        setItems((prevItems) =>
          prevItems.map((item) => {
            if (item.id === itemId) {
              const delta = wasVoted ? 1 : -1;
              return {
                ...item,
                upvotes: Math.max(0, (item.upvotes || 0) + delta),
              };
            }
            return item;
          })
        );
        return result;
      }

      // If backend returned authoritative upvotes count, synchronize it
      if (typeof result.upvotes === 'number') {
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === itemId ? { ...item, upvotes: result.upvotes } : item
          )
        );
      }

      return result;
    },
    [votedIds]
  );

  // Add a new item (persists to Supabase or local storage)
  const addNewItem = useCallback(async (newItem) => {
    const result = await submitBitacoraPost(newItem);
    if (result.success && result.item) {
      setItems((prev) => [result.item, ...prev]);
      return result.item;
    }
    return null;
  }, []);

  return {
    categories: BITACORA_CATEGORIES,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    allTags,
    items: filteredItems,
    totalCount: items.length,
    filteredCount: filteredItems.length,
    categoryCounts,
    votedIds,
    handleVote,
    activeItem,
    setActiveItem,
    addNewItem,
  };
};

export default useBitacora;
