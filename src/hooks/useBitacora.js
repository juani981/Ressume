/**
 * @file useBitacora.js
 * @description State management hook for the Bitácora / Knowledge Hub.
 * Manages filtering, search, tag selection, polymorphic content detail, and anti-abuse voting.
 */

import { useState, useMemo, useCallback } from 'react';
import { BITACORA_CATEGORIES } from '../data/bitacora/categories';
import { INITIAL_BITACORA_ITEMS } from '../data/bitacora/items';
import {
  getVotedItemIds,
  toggleItemVote,
  getCustomBitacoraItems,
  saveCustomBitacoraItem,
} from '../utils/bitacoraStorage';

export const useBitacora = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [activeItem, setActiveItem] = useState(null); // For detail modal reader

  // Initialize all items (default static items + local user-submitted items)
  const [items, setItems] = useState(() => {
    const custom = getCustomBitacoraItems();
    return [...custom, ...INITIAL_BITACORA_ITEMS];
  });

  // Track which items have been voted on by this client
  const [votedIds, setVotedIds] = useState(() => new Set(getVotedItemIds()));

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
  const handleVote = useCallback((itemId) => {
    const result = toggleItemVote(itemId);
    if (!result.success) {
      return result;
    }

    setVotedIds((prev) => {
      const next = new Set(prev);
      if (result.hasVoted) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }
      return next;
    });

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          const delta = result.hasVoted ? 1 : -1;
          return {
            ...item,
            upvotes: Math.max(0, (item.upvotes || 0) + delta),
          };
        }
        return item;
      })
    );

    return result;
  }, []);

  // Add a new item (extensible for user submission)
  const addNewItem = useCallback((newItem) => {
    const createdItem = {
      ...newItem,
      id: newItem.id || `custom-${Date.now()}`,
      upvotes: 0,
      createdAt: new Date().toISOString().split('T')[0],
      author: newItem.author || {
        name: 'Tú (Borrador)',
        role: 'Colaborador',
        isOfficial: false,
      },
    };

    saveCustomBitacoraItem(createdItem);
    setItems((prev) => [createdItem, ...prev]);
    return createdItem;
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
