import { useState, useMemo } from 'react';
import { SavedRecipe } from '../../types';

type LibraryTab = 'review' | 'approved' | 'favorites';

export const useRecipeLibrary = (savedRecipes: SavedRecipe[], libraryTab: LibraryTab) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecipes = useMemo(() => {
    let recipes = savedRecipes;

    // 1. Filter by Tab
    switch (libraryTab) {
      case 'review':
        recipes = recipes.filter(r => r.status === 'unreviewed');
        break;
      case 'favorites':
        recipes = recipes.filter(r => r.isFavorite);
        break;
      case 'approved':
        recipes = recipes.filter(r => r.status === 'reviewed');
        break;
      default:
        recipes = recipes.filter(r => r.status === 'reviewed');
    }

    // 2. Filter by Search Query (Title)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      recipes = recipes.filter(r => r.recipe.title.toLowerCase().includes(query));
    }

    return recipes;
  }, [savedRecipes, libraryTab, searchQuery]);

  const groupedRecipes = useMemo(() => {
    const groups: Record<string, SavedRecipe[]> = {};
    filteredRecipes.forEach(r => {
      const cat = r.recipe.category || 'אחר';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(r);
    });
    return groups;
  }, [filteredRecipes]);

  return {
    searchQuery,
    setSearchQuery,
    filteredRecipes,
    groupedRecipes
  };
};
