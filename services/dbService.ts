
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc
} from "firebase/firestore";
import {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject
} from "firebase/storage";
import { db, storage } from "./firebase";
import { SavedRecipe } from "../types";

const COLLECTION_NAME = "recipes";

export const dbService = {
  // Save a recipe (uploads images -> save metadata)
  async saveRecipe(recipe: SavedRecipe, imageFiles: string[]): Promise<void> {
    try {
      // 1. Upload images to Firebase Storage
      const imageUrls = await Promise.all(
        imageFiles.map(async (base64String, index) => {
          // If it's already a URL (e.g. from an edit of an existing recipe), keep it
          if (base64String.startsWith('http')) return base64String;

          const imageRef = ref(storage, `recipes/${recipe.id}/${index}_${Date.now()}.jpg`);
          await uploadString(imageRef, base64String, 'data_url');
          return getDownloadURL(imageRef);
        })
      );

      // 2. Save recipe metadata to Firestore with URLs
      // Filter out undefined values as Firestore doesn't support them
      const recipeToSave: any = {
        ...recipe,
        images: imageUrls
      };

      // Remove undefined keys
      Object.keys(recipeToSave).forEach(key => {
        if (recipeToSave[key] === undefined) {
          delete recipeToSave[key];
        }
      });

      await setDoc(doc(db, COLLECTION_NAME, recipe.id), recipeToSave);

    } catch (error) {
      console.error("Error saving recipe:", error);
      throw error;
    }
  },

  // Update specific fields of a recipe (e.g. status, isFavorite)
  async updateRecipe(id: string, updates: Partial<SavedRecipe>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error("Error updating recipe:", error);
      throw error;
    }
  },

  // Subscribe to real-time updates
  subscribeToRecipes(callback: (recipes: SavedRecipe[]) => void) {
    const q = query(collection(db, COLLECTION_NAME), orderBy("date", "desc"));

    return onSnapshot(q, (snapshot) => {
      const recipes = snapshot.docs.map(doc => doc.data() as SavedRecipe);
      callback(recipes);
    });
  },

  // Delete a recipe and its images
  async deleteRecipe(id: string, imageUrls: string[]): Promise<void> {
    try {
      // 1. Delete images from Storage
      const imageDeletePromises = imageUrls.map(url => {
        try {
          const imageRef = ref(storage, url);
          return deleteObject(imageRef);
        } catch (e) {
          console.error("Error creating ref for deletion", url, e);
          return Promise.resolve();
        }
      });

      // 2. Delete Firestore document
      const docDeletePromise = deleteDoc(doc(db, COLLECTION_NAME, id));

      // Execute all
      await Promise.all([...imageDeletePromises, docDeletePromise]);

    } catch (error) {
      console.error("Error deleting recipe:", error);
      throw error;
    }
  },

  // --- Category Management ---

  // Get categories from 'settings/categories' or return empty (caller handles defaults)
  async getCategories(): Promise<string[]> {
    try {
      const docRef = doc(db, 'settings', 'categories');
      const unsubscribe = onSnapshot(docRef, () => { });
      return [];
    } catch (e) {
      return [];
    }
  },

  subscribeToCategories(callback: (categories: string[]) => void) {
    const docRef = doc(db, 'settings', 'categories');
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data().list || []);
      } else {
        callback([]); // Caller should handle default if empty
      }
    });
  },

  async updateCategories(newCategories: string[]): Promise<void> {
    const docRef = doc(db, 'settings', 'categories');
    await setDoc(docRef, { list: newCategories }, { merge: true });
  }
};

