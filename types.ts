
export interface IngredientCategory {
  name: string;
  items: string[];
}

export interface Recipe {
  title: string;
  category: string; 
  prepTime: string;
  categories: IngredientCategory[]; 
  steps: string[];
  tips?: string[];
  servings?: string;
}

export type ReviewStatus = 'unreviewed' | 'reviewed';

export interface SavedRecipe {
  id: string;
  date: number;
  recipe: Recipe;
  images: string[];
  status: ReviewStatus;
  systemComments?: string;
  isFavorite?: boolean;
}

export interface AnalysisJob {
  id: string;
  images: string[];
  status: 'processing' | 'completed' | 'error';
  recipe?: Recipe;
  error?: string;
  timestamp: number;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  VIEWING = 'VIEWING',
  EDITING = 'EDITING',
  HISTORY = 'HISTORY',
  ERROR = 'ERROR'
}

export const RECIPE_CATEGORIES = [
  'מנות עיקריות',
  'מרקים',
  'ארוחת בוקר',
  'קינוחים',
  'סלטים',
  'מאפים ולחמים',
  'תוספות',
  'דגים',
  'בשרי',
  'צמחוני/טבעוני',
  'אחר'
];
