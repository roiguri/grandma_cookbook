
import React, { useState, useCallback, useEffect, useMemo, useLayoutEffect } from 'react';
import {
  ChefHat, Library, Edit2, RefreshCw, Check, Sparkles, UtensilsCrossed,
  BookOpen, ArrowRight, LayoutGrid, List, Loader2, AlertCircle, X,
  ZoomIn, Clock, Tag, ChevronDown, ChevronUp, Copy, FileText, Save,
  ChevronRight, ChevronLeft, Trash2, Download, Heart, MessageSquare, ShieldCheck, LogOut, Calendar, Plus
} from 'lucide-react';
import { analyzeRecipeImage } from './services/geminiService';
import { compressImage } from './services/imageUtils';
import { Recipe, AppState, SavedRecipe, RECIPE_CATEGORIES, AnalysisJob, ReviewStatus, InstructionPhase } from './types';
import RecipeDisplay from './components/RecipeDisplay';
import RecipeForm from './components/RecipeForm';
import ImageUploader from './components/ImageUploader';
import { dbService } from './services/dbService';
import { useAuth, signOut } from './services/authService';
import LoginScreen from './components/LoginScreen';
import FullscreenImageViewer from './components/FullscreenImageViewer';
import ConfirmationModal from './components/ConfirmationModal';
import ReviewMode from './components/ReviewMode';


const STORAGE_KEY = 'recipe_genie_saved_recipes';

type LibraryTab = 'review' | 'approved' | 'favorites';
type ViewMode = 'category' | 'date';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [originalRecipe, setOriginalRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recipeImages, setRecipeImages] = useState<string[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState<number | null>(null);
  const [activeSavedId, setActiveSavedId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, recipeId: string | null }>({ isOpen: false, recipeId: null });

  const [libraryTab, setLibraryTab] = useState<LibraryTab>('approved');
  const [viewMode, setViewMode] = useState<ViewMode>('category');

  // Jobs state for background processing
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [notifications, setNotifications] = useState<{ id: string, message: string, type: 'success' | 'info' }[]>([]);
  const [uploaderKey, setUploaderKey] = useState(0);

  // Library view options
  const [isLibraryCompact, setIsLibraryCompact] = useState(false);
  const [collapsedLibraryCats, setCollapsedLibraryCats] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Only subscribe if user is logged in
    if (!user) return;

    // Subscribe to Firestore updates
    const unsubscribe = dbService.subscribeToRecipes((recipes) => {
      setSavedRecipes(recipes);
    });
    return () => unsubscribe();
    return () => unsubscribe();
  }, [user]);

  const activeSavedRecipe = useMemo(() =>
    savedRecipes.find(r => r.id === activeSavedId),
    [savedRecipes, activeSavedId]
  );

  const filteredRecipes = useMemo(() => {
    switch (libraryTab) {
      case 'review':
        return savedRecipes.filter(r => r.status === 'unreviewed');
      case 'favorites':
        return savedRecipes.filter(r => r.isFavorite);
      case 'approved':
        return savedRecipes.filter(r => r.status === 'reviewed');
      default:
        return savedRecipes.filter(r => r.status === 'reviewed');
    }
  }, [savedRecipes, libraryTab]);

  const groupedRecipes = useMemo(() => {
    const groups: Record<string, SavedRecipe[]> = {};
    filteredRecipes.forEach(r => {
      const cat = r.recipe.category || 'אחר';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(r);
    });
    return groups;
  }, [filteredRecipes]);

  const activeJobsCount = useMemo(() => jobs.filter(j => j.status === 'processing').length, [jobs]);

  const addNotification = (message: string, type: 'success' | 'info' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const toggleLibraryCategory = (cat: string) => {
    setCollapsedLibraryCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleImagesSelect = useCallback(async (base64Array: string[]) => {
    if (base64Array.length === 0) return;

    const jobId = Date.now().toString();
    const newJob: AnalysisJob = {
      id: jobId,
      images: base64Array,
      status: 'processing',
      timestamp: Date.now()
    };

    setJobs(prev => [newJob, ...prev]);
    addNotification("מתחיל בפענוח המתכון ברקע...", "info");
    setUploaderKey(prev => prev + 1); // Reset uploader immediately

    setState(AppState.IDLE);

    try {
      const compressedImages = await Promise.all(
        base64Array.map(img => compressImage(img, 1200, 1200))
      );

      const result = await analyzeRecipeImage(compressedImages);

      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'completed', recipe: result, images: compressedImages } : j));

      const newSavedRecipe: SavedRecipe = {
        id: jobId,
        date: Date.now(),
        recipe: result,
        images: [], // Will be filled by dbService on save
        status: 'unreviewed',
        isFavorite: false
      };

      // Auto-save to DB
      await dbService.saveRecipe(newSavedRecipe, compressedImages);

      addNotification(`המתכון "${result.title}" פוענח ונשמר לביקורת בספרייה!`, "success");
    } catch (err: any) {
      console.error("Analysis Error for job", jobId, err);
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'error', error: err.message || 'שגיאה לא ידועה' } : j));
      addNotification("שגיאה בפענוח אחד המתכונים", "info");
    }
  }, []);

  const updateManagementField = async (id: string, updates: Partial<SavedRecipe>) => {
    // Optimistic update (optional, but good for UI responsiveness)
    // Actually we can rely on real-time subscription for simplicity unless latency is an issue
    await dbService.updateRecipe(id, updates);
  };

  const handleSaveToLibrary = async () => {
    if (!recipe || recipeImages.length === 0) return;
    setIsSaving(true);

    try {
      const recipeToSave: SavedRecipe = {
        id: activeSavedId || Date.now().toString(),
        date: activeSavedRecipe?.date || Date.now(),
        recipe: recipe,
        images: [], // Handled by service
        status: activeSavedRecipe?.status || 'reviewed',
        isFavorite: activeSavedRecipe?.isFavorite || false,
        systemComments: activeSavedRecipe?.systemComments
      };

      await dbService.saveRecipe(recipeToSave, recipeImages);

      if (!activeSavedId) {
        setActiveSavedId(recipeToSave.id);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error("Failed to save", e);
      addNotification("שגיאה בשמירה", "info");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteModal({ isOpen: true, recipeId: id });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.recipeId) return;

    const id = deleteModal.recipeId;
    const recipeToDelete = savedRecipes.find(r => r.id === id);

    if (recipeToDelete) {
      try {
        await dbService.deleteRecipe(id, recipeToDelete.images);
        addNotification("המתכון נמחק מהספרייה", "success");

        // If we are currently viewing/editing the deleted recipe, reset to home
        if (activeSavedId === id) {
          handleReset();
        }
      } catch (error) {
        console.error("Failed to delete recipe:", error);
        addNotification("שגיאה במחיקת המתכון", "info");
      }
    }

    setDeleteModal({ isOpen: false, recipeId: null });
  };

  const handleViewSaved = (saved: SavedRecipe) => {
    setRecipe(saved.recipe);
    setRecipeImages(saved.images);
    setActiveSavedId(saved.id);
    setState(AppState.VIEWING);
  };

  const handleEdit = () => {
    // Backup current recipe state
    setOriginalRecipe(recipe ? JSON.parse(JSON.stringify(recipe)) : null);

    // Ensure we have at least one phase (logic moved from controlled RecipeForm)
    if (recipe && (!recipe.steps || recipe.steps.length === 0)) {
      const defaultSteps: InstructionPhase[] = [{ name: 'אופן ההכנה', steps: [''] }];
      setRecipe({ ...recipe, steps: defaultSteps });
    }
    setState(AppState.EDITING);
  };

  const handleCancelEdit = () => {
    if (originalRecipe) {
      setRecipe(originalRecipe);
    }
    setState(AppState.VIEWING);
    setOriginalRecipe(null);
  };

  const handleSaveEdit = (updatedRecipe: Recipe) => {
    setRecipe(updatedRecipe);
    // If we are editing an existing one, auto-save to DB
    if (activeSavedId) {
      dbService.updateRecipe(activeSavedId, { recipe: updatedRecipe });
      addNotification("השינויים נשמרו", "success");
    }
    setState(AppState.VIEWING);
  };

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [state, libraryTab, viewMode]);

  const handleReset = () => {
    setState(AppState.IDLE);
    setRecipe(null);
    setRecipeImages([]);
    setError(null);
    setActiveSavedId(null);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const copyForDocs = async () => {
    if (!recipe) return;
    const htmlSnippet = `
      <div dir="rtl" style="font-family: sans-serif;">
        <h1 style="color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 10px;">${recipe.title}</h1>
        <p><strong>קטגוריה:</strong> ${recipe.category}</p>
        <p><strong>זמן הכנה:</strong> ${recipe.prepTime}</p>
        ${recipe.servings ? `<p><strong>כמות:</strong> ${recipe.servings}</p>` : ''}
        <h2 style="color: #475569;">מצרכים</h2>
        ${recipe.categories.map(cat => `
          <h3 style="color: #ea580c;">${cat.name}</h3>
          <ul>${cat.items.map(item => `<li>${item}</li>`).join('')}</ul>
        `).join('')}
        <h2 style="color: #475569;">אופן ההכנה</h2>
        <ol>${recipe.steps.map(step => `<li style="margin-bottom: 8px;">${step}</li>`).join('')}</ol>
      </div>
    `;

    try {
      const blob = new Blob([htmlSnippet], { type: 'text/html' });
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      const plainText = `${recipe.title}\n\nמצרכים:\n${recipe.categories.map(c => `${c.name}:\n${c.items.join('\n')}`).join('\n\n')}\n\nהוראות:\n${recipe.steps.join('\n')}`;
      await navigator.clipboard.writeText(plainText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  const downloadHtml = () => {
    if (!recipe) return;
    const content = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"></head><body style="font-family: sans-serif; padding: 40px; max-width: 800px; margin: auto; line-height: 1.6;"><h1>${recipe.title}</h1><p><b>קטגוריה:</b> ${recipe.category}</p><p><b>זמן הכנה:</b> ${recipe.prepTime}</p><h2>מצרכים</h2>${recipe.categories.map(c => `<h3>${c.name}</h3><ul>${c.items.map(i => `<li>${i}</li>`).join('')}</ul>`).join('')}<h2>אופן ההכנה</h2><ol>${recipe.steps.map(s => `<li>${s}</li>`).join('')}</ol></body></html>`;
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recipe.title}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAllAsJson = () => {
    if (savedRecipes.length === 0) return;
    // savedRecipes now contains URLs, so the JSON will be small
    const dataStr = JSON.stringify(savedRecipes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recipe_genie_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addNotification("גיבוי JSON הורד בהצלחה (קישורים לענן)", "success");
  };

  const renderRecipeCard = (saved: SavedRecipe) => (
    <div
      key={saved.id}
      onClick={() => handleViewSaved(saved)}
      className={`group relative bg-white border cursor-pointer hover:shadow-2xl transition-all duration-500 overflow-hidden ${isLibraryCompact
        ? 'flex items-center gap-3 p-3 rounded-2xl border-slate-100'
        : 'flex flex-col rounded-[2.5rem] sm:rounded-[3rem] border-slate-100 transform hover:-translate-y-2'
        }`}
    >
      {/* Thumbnail/Image */}
      <div className={`${isLibraryCompact ? 'w-14 h-14 rounded-xl' : 'aspect-[16/10]'} overflow-hidden bg-slate-100 relative`}>
        <img src={saved.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
        {!isLibraryCompact && (
          <>
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-col gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); updateManagementField(saved.id, { isFavorite: !saved.isFavorite }); }}
                className={`p-2.5 sm:p-3 rounded-2xl shadow-xl transition-all ${saved.isFavorite ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-400 hover:text-red-500'}`}
              >
                <Heart size={18} className="sm:w-5 sm:h-5" fill={saved.isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
              {saved.status === 'unreviewed' && (
                <span className="bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <RefreshCw size={10} className="animate-spin" /> לביקורת
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className={`${isLibraryCompact ? 'flex-grow min-w-0' : 'p-6 sm:p-8 flex flex-col gap-3 sm:gap-4'}`}>
        <h4 className={`font-black text-slate-800 leading-tight group-hover:text-orange-600 transition-colors ${isLibraryCompact ? 'truncate text-base sm:text-lg' : 'line-clamp-2 text-xl sm:text-2xl min-h-[3.5rem] sm:min-h-[4rem]'}`}>{saved.recipe.title}</h4>
        <div className={`flex items-center gap-4 text-slate-500 font-bold ${isLibraryCompact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
          <div className="flex items-center gap-1.5"><Clock size={isLibraryCompact ? 14 : 18} className="text-orange-600" /> {saved.recipe.prepTime}</div>
          {saved.systemComments && !isLibraryCompact && (
            <div className="flex items-center gap-1.5 text-blue-500"><MessageSquare size={16} /> הערת מערכת</div>
          )}
        </div>
      </div>

      {/* Actions (Compact or Hover) */}
      <div className={`flex items-center gap-2 ${isLibraryCompact ? '' : 'absolute bottom-4 left-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity'}`}>
        {isLibraryCompact && (
          <button
            onClick={(e) => { e.stopPropagation(); updateManagementField(saved.id, { isFavorite: !saved.isFavorite }); }}
            className={`p-3 rounded-xl ${saved.isFavorite ? 'text-red-500' : 'text-slate-300 hover:text-red-500'}`}
          >
            <Heart size={18} fill={saved.isFavorite ? 'currentColor' : 'none'} />
          </button>
        )}
        <button
          onClick={(e) => handleDeleteSaved(saved.id, e)}
          className="p-3 rounded-xl bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
          title="מחק מתכון"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 size={48} className="text-orange-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  // Access Control Gate
  const allowedEmail = import.meta.env.VITE_ALLOWED_USER_EMAIL;
  if (allowedEmail && user.email !== allowedEmail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100 max-w-md w-full shadow-xl">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={32} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">אין גישה</h2>
          <p className="text-slate-600 mb-8 font-medium leading-relaxed">
            החשבון <strong>{user.email}</strong> אינו מורשה לגשת לאפליקציה זו.
            <br />
            זוהי אפליקציה פרטית.
          </p>
          <button
            onClick={signOut}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-lg active:scale-95"
          >
            התנתק ונסה חשבון אחר
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 antialiased">
      {state !== AppState.REVIEW && (
        <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95" onClick={handleReset}>
              <div className={`bg-orange-600 p-2 rounded-xl text-white shadow-lg shadow-orange-200 ${isSaving ? 'animate-pulse' : ''}`}><ChefHat size={22} /></div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">Recipe Genie</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => {
                  setState(AppState.HISTORY);
                  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all relative ${state === AppState.HISTORY ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}
                title="ספריית מתכונים"
              >
                <Library size={18} />
                <span className="hidden sm:inline">הספרייה שלי</span>
                {activeJobsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
                )}
              </button>

              {state !== AppState.IDLE && (
                <button onClick={handleReset} className="p-2.5 rounded-xl text-orange-600 hover:bg-orange-100 transition-colors" title="מתכון חדש">
                  <Plus size={20} />
                </button>
              )}
              <div className="w-px h-8 bg-slate-200 mx-1"></div>
              <button onClick={signOut} className="p-2.5 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="התנתק">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Background Notifications */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-full max-w-sm px-4">
        {notifications.map(n => (
          <div key={n.id} className={`p-4 rounded-2xl shadow-xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${n.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-white border-slate-100 text-slate-800'}`}>
            {n.type === 'success' ? <Check className="text-green-500" /> : <Sparkles className="text-orange-500" />}
            <span className="font-bold text-sm">{n.message}</span>
          </div>
        ))}
      </div>

      {state === AppState.REVIEW && (
        <ReviewMode
          recipes={savedRecipes.filter(r => r.status === 'unreviewed')}
          onExit={() => {
            setState(AppState.HISTORY);
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          }}
          onUpdateRecipe={(id, updates) => {
            // Update local state to reflect changes immediately
            setSavedRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updates, recipe: updates.recipe || r.recipe } : r));
          }}
        />
      )}

      <main className={`max-w-5xl mx-auto px-4 pt-8 ${state === AppState.REVIEW ? 'hidden' : ''}`}>
        {state === AppState.IDLE && (
          <div className="text-center py-16">
            <div className="mb-6 inline-block p-4 bg-orange-100 rounded-[2rem] text-orange-600">
              <UtensilsCrossed size={48} />
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-6 tracking-tight text-slate-900">הופכים תמונה למתכון ברגע</h2>
            <p className="text-slate-500 mb-14 text-xl max-w-2xl mx-auto leading-relaxed font-medium">
              צלמו דפי מתכון ישנים, ספרי בישול או אפילו רשימת מצרכים. הבינה המלאכותית שלנו תהפוך אותם למתכון דיגיטלי מסודר לפי קטגוריות.
            </p>
            <ImageUploader key={uploaderKey} onImagesSelected={handleImagesSelect} />

            {savedRecipes.length > 0 && (
              <div className="mt-24 text-right animate-in fade-in slide-in-from-bottom-12 duration-1000">
                <div className="flex items-center justify-between mb-10 border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="text-orange-600" size={32} />
                    <h3 className="text-2xl font-black text-slate-800">הצצה לספרייה שלך</h3>
                  </div>
                  <button onClick={() => setState(AppState.HISTORY)} className="text-orange-600 font-black flex items-center gap-2 group">
                    כל המתכונים
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6">
                  {savedRecipes.slice(0, 5).map(saved => (
                    <div
                      key={saved.id}
                      onClick={() => handleViewSaved(saved)}
                      className="group cursor-pointer bg-white p-4 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
                    >
                      <div className="aspect-square rounded-[2rem] overflow-hidden mb-4 bg-slate-100 ring-1 ring-slate-100">
                        <img src={saved.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                      </div>
                      <div className="px-1">
                        <span className="text-[10px] font-black text-orange-600 uppercase block mb-1 tracking-widest">{saved.recipe.category}</span>
                        <h4 className="font-bold text-sm truncate text-slate-800">{saved.recipe.title}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {state === AppState.HISTORY && (
          <div className="space-y-8 sm:space-y-12 animate-in fade-in duration-500 pb-20">
            <div className="space-y-6 sm:space-y-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-slate-200 pb-6 sm:pb-8">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">הספרייה שלך</h2>
                  <p className="text-slate-500 font-medium text-sm sm:text-base">ניהול וארגון המתכונים שלך</p>
                </div>
                <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
                  <div className="flex gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex bg-slate-200 p-1 rounded-2xl">
                      <button
                        onClick={() => setViewMode('category')}
                        className={`p-2 sm:px-3 rounded-xl transition-all flex items-center gap-2 ${viewMode === 'category' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        title="לפי קטגוריות"
                      >
                        <Tag size={20} />
                      </button>
                      <button
                        onClick={() => setViewMode('date')}
                        className={`p-2 sm:px-3 rounded-xl transition-all flex items-center gap-2 ${viewMode === 'date' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        title="לפי תאריך (מהחדש לישן)"
                      >
                        <Calendar size={20} />
                      </button>
                    </div>

                    <div className="flex bg-slate-200 p-1 rounded-2xl">
                      <button
                        onClick={() => setIsLibraryCompact(false)}
                        className={`p-2 sm:px-3 rounded-xl transition-all flex-1 sm:flex-none flex justify-center ${!isLibraryCompact ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        title="תצוגת גריד"
                      >
                        <LayoutGrid size={20} />
                      </button>
                      <button
                        onClick={() => setIsLibraryCompact(true)}
                        className={`p-2 sm:px-3 rounded-xl transition-all flex-1 sm:flex-none flex justify-center ${isLibraryCompact ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        title="תצוגת שורות קומפקטית"
                      >
                        <List size={20} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={exportAllAsJson}
                    className="bg-white text-orange-600 border-2 border-orange-100 hover:border-orange-500 p-3 rounded-2xl font-black transition-all shadow-sm hover:shadow-md active:scale-95 w-fit" // Added w-fit to prevent full width
                    title="ייצא גיבוי JSON"
                  >
                    <Download size={20} />
                  </button>
                </div>
              </div>

              {/* Tab Navigation - Mobile Optimized */}
              <div className="flex flex-wrap items-center gap-4 w-full">
                {savedRecipes.filter(r => r.status === 'unreviewed').length > 0 && (
                  <button
                    onClick={() => setState(AppState.REVIEW)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-[1.5rem] font-black hover:bg-black transition-all shadow-xl shadow-slate-200 order-first sm:order-last ml-auto animate-in zoom-in-95"
                  >
                    <RefreshCw size={18} className="animate-spin-slow" />
                    התחל סבב בדיקה ({savedRecipes.filter(r => r.status === 'unreviewed').length})
                  </button>
                )}

                <div className="flex items-center gap-2 sm:gap-4 bg-slate-100 p-1.5 rounded-[2rem] w-full sm:w-fit overflow-x-auto no-scrollbar scroll-smooth flex-grow sm:flex-grow-0">
                  <button
                    onClick={() => setLibraryTab('review')}
                    className={`flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 rounded-[1.5rem] font-black transition-all whitespace-nowrap flex-1 sm:flex-none text-sm sm:text-base ${libraryTab === 'review' ? 'bg-orange-600 text-white shadow-lg sm:shadow-xl shadow-orange-100' : 'text-slate-500 hover:bg-slate-200'}`}
                  >
                    <RefreshCw size={16} className="sm:w-5 sm:h-5" />
                    לביקורת
                    {savedRecipes.filter(r => r.status === 'unreviewed').length > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-1 animate-pulse">
                        {savedRecipes.filter(r => r.status === 'unreviewed').length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setLibraryTab('favorites')}
                    className={`flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 rounded-[1.5rem] font-black transition-all whitespace-nowrap flex-1 sm:flex-none text-sm sm:text-base ${libraryTab === 'favorites' ? 'bg-red-600 text-white shadow-lg sm:shadow-xl shadow-red-100' : 'text-slate-500 hover:bg-slate-200'}`}
                  >
                    <Heart size={16} className="sm:w-5 sm:h-5" fill={libraryTab === 'favorites' ? 'currentColor' : 'none'} />
                    מועדפים
                  </button>
                  <button
                    onClick={() => setLibraryTab('approved')}
                    className={`flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 rounded-[1.5rem] font-black transition-all whitespace-nowrap flex-1 sm:flex-none text-sm sm:text-base ${libraryTab === 'approved' ? 'bg-green-600 text-white shadow-lg sm:shadow-xl shadow-green-100' : 'text-slate-500 hover:bg-slate-200'}`}
                  >
                    <Check size={16} className="sm:w-5 sm:h-5" />
                    מאושרים
                  </button>
                </div>
              </div>
            </div>

            {jobs.some(j => j.status !== 'completed') && (
              <section className="bg-orange-50/50 p-4 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border-2 border-dashed border-orange-200 space-y-4 sm:space-y-6">
                <div className="flex items-center gap-3 text-orange-700">
                  <Loader2 className="animate-spin" />
                  <h3 className="text-lg sm:text-xl font-black">מעבד מתכונים חדשים...</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {jobs.filter(j => j.status !== 'completed').map(job => (
                    <div key={job.id} className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 sm:gap-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                        <img src={job.images[0]} className="w-full h-full object-cover grayscale opacity-50" alt="" />
                      </div>
                      <div className="flex-grow">
                        {job.status === 'processing' ? (
                          <div className="space-y-2">
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-500 w-1/2 animate-[shimmer_2s_infinite]"></div>
                            </div>
                            <p className="text-xs font-bold text-slate-400">מפענח טקסט ותמונות...</p>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-red-500 text-xs font-bold">
                              <AlertCircle size={14} /> שגיאה בעיבוד
                            </div>
                            <button onClick={() => setJobs(prev => prev.filter(j => j.id !== job.id))} className="text-slate-300 hover:text-slate-500"><X size={16} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {Object.entries(groupedRecipes).length === 0 && filteredRecipes.length === 0 ? (
              <div className="text-center py-20 sm:py-32 bg-white rounded-[2rem] sm:rounded-[3rem] border-2 border-dashed border-slate-200 shadow-inner px-4">
                <Library size={60} className="mx-auto text-slate-200 mb-6 sm:w-20 sm:h-20" />
                <p className="text-slate-400 font-black text-xl sm:text-2xl">אין מתכונים בתצוגה זו</p>
                <button onClick={handleReset} className="mt-6 sm:mt-8 bg-slate-900 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-2xl font-black text-base sm:text-lg hover:bg-black transition-all w-full sm:w-auto">צור מתכון חדש</button>
              </div>
            ) : (
              viewMode === 'date' ? (
                <div className={`animate-in fade-in slide-in-from-top-2 duration-500 ${isLibraryCompact ? 'space-y-2' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10'}`}>
                  {filteredRecipes.map(saved => renderRecipeCard(saved))}
                </div>
              ) : (
                (Object.entries(groupedRecipes) as [string, SavedRecipe[]][])
                  .sort((a, b) => {
                    const idxA = RECIPE_CATEGORIES.indexOf(a[0]);
                    const idxB = RECIPE_CATEGORIES.indexOf(b[0]);
                    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
                  })
                  .map(([cat, items]) => {
                    const isCollapsed = collapsedLibraryCats.has(cat);
                    return (
                      <section key={cat} className="space-y-4">
                        <div
                          onClick={() => toggleLibraryCategory(cat)}
                          className="flex items-center gap-3 sm:gap-4 sticky top-16 bg-slate-50/95 backdrop-blur-lg py-4 sm:py-6 z-10 border-b border-transparent cursor-pointer group"
                        >
                          <div className="h-8 w-2 sm:h-10 sm:w-2.5 bg-orange-600 rounded-full shadow-lg shadow-orange-100 group-hover:scale-y-110 transition-transform"></div>
                          <h3 className="text-2xl sm:text-3xl font-black text-slate-800">{cat}</h3>
                          <div className="flex-grow h-px bg-gradient-to-l from-slate-200 to-transparent"></div>
                          <span className="bg-slate-200 text-slate-700 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-black ring-1 ring-slate-300/20 whitespace-nowrap">{items.length} <span className="hidden sm:inline">מתכונים</span></span>
                          {isCollapsed ? <ChevronDown size={24} className="text-slate-400 sm:w-7 sm:h-7" /> : <ChevronUp size={24} className="text-slate-400 sm:w-7 sm:h-7" />}
                        </div>

                        {!isCollapsed && (
                          <div className={`animate-in fade-in slide-in-from-top-2 duration-500 ${isLibraryCompact ? 'space-y-2' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10'}`}>
                            {items.map(saved => renderRecipeCard(saved))}
                          </div>
                        )}
                      </section>
                    );
                  })
              )
            )}
          </div>
        )}

        {(state === AppState.VIEWING || state === AppState.EDITING) && recipe && (
          <div className="flex flex-col lg:flex-row gap-12 animate-in fade-in slide-in-from-bottom-10 duration-700 pb-32">
            <div className="w-full lg:w-96 space-y-8 lg:sticky lg:top-24 self-start">
              <div className="group relative rounded-[4rem] overflow-hidden shadow-2xl aspect-square bg-slate-200 border-[12px] border-white cursor-zoom-in ring-1 ring-slate-100" onClick={() => setFullscreenImageIndex(0)}>
                <img src={recipeImages[0]} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <ZoomIn className="text-white" size={60} />
                </div>
              </div>

              {/* Management Controls */}
              {activeSavedId && activeSavedRecipe && (
                <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck size={16} /> ניהול מתכון
                    </h4>
                    <button
                      onClick={() => updateManagementField(activeSavedId, { isFavorite: !activeSavedRecipe.isFavorite })}
                      className={`p-2 rounded-xl transition-all ${activeSavedRecipe.isFavorite ? 'text-red-500 bg-red-50' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
                    >
                      <Heart size={24} fill={activeSavedRecipe.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                      <button
                        onClick={() => updateManagementField(activeSavedId, { status: 'unreviewed' })}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeSavedRecipe.status === 'unreviewed' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        <RefreshCw size={14} className={activeSavedRecipe.status === 'unreviewed' ? 'animate-spin' : ''} /> לביקורת
                      </button>
                      <button
                        onClick={() => updateManagementField(activeSavedId, { status: 'reviewed' })}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeSavedRecipe.status === 'reviewed' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        <Check size={14} /> מאושר
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase px-1">הערות ניהול מערכת</label>
                      <textarea
                        value={activeSavedRecipe.systemComments || ''}
                        onChange={(e) => updateManagementField(activeSavedId, { systemComments: e.target.value })}
                        className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 focus:border-blue-300 outline-none font-bold text-slate-700 text-sm min-h-[80px]"
                        placeholder="כתוב כאן הערות לעצמך על המתכון..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {recipeImages.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-4 px-2 no-scrollbar scroll-smooth">
                  {recipeImages.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setFullscreenImageIndex(idx)}
                      className={`flex-shrink-0 w-24 h-24 rounded-3xl overflow-hidden border-4 cursor-zoom-in transition-all hover:scale-110 shadow-xl ring-1 ring-slate-100 ${idx === 0 ? 'border-orange-500' : 'border-white'}`}
                    >
                      <img src={img} className="w-full h-full object-cover" alt="" />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-4">
                {!activeSavedId && (
                  <button
                    onClick={handleSaveToLibrary}
                    className="w-full flex items-center justify-center gap-3 bg-orange-600 text-white py-6 rounded-3xl font-black text-2xl shadow-2xl shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 group"
                  >
                    <Save size={28} className="group-hover:rotate-12 transition-transform" />
                    שמור לספרייה
                  </button>
                )}


                {state === AppState.VIEWING && activeSavedId && (
                  <button
                    onClick={handleEdit}
                    className="w-full flex items-center justify-center gap-2 text-slate-600 border-2 border-slate-200 hover:bg-slate-50 py-4 rounded-3xl font-bold transition-all text-lg"
                  >
                    <Edit2 size={20} />
                    ערוך מתכון
                  </button>
                )}

                {activeSavedId && state === AppState.EDITING && (
                  <div className="flex flex-col gap-4">
                    <button
                      onClick={() => recipe && handleSaveEdit(recipe)}
                      className="w-full flex items-center justify-center gap-3 bg-orange-600 text-white py-6 rounded-3xl font-black text-2xl shadow-2xl shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 group"
                    >
                      <Save size={28} className="group-hover:rotate-12 transition-transform" />
                      שמור שינויים
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="w-full flex items-center justify-center gap-2 text-slate-500 border-2 border-slate-200 hover:bg-slate-50 py-4 rounded-3xl font-bold transition-all text-sm"
                    >
                      <X size={18} />
                      ביטול
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={copyForDocs} className="flex items-center justify-center gap-3 bg-indigo-600 text-white py-5 rounded-3xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 text-xs">
                    <Copy size={18} /> העתק Docs
                  </button>
                  <button onClick={downloadHtml} className="flex items-center justify-center gap-3 bg-white text-slate-800 border-2 border-slate-100 py-5 rounded-3xl font-black shadow-sm hover:bg-slate-50 transition-all active:scale-95 text-xs">
                    <FileText size={18} className="text-orange-600" /> הורד HTML
                  </button>
                </div>

                <button
                  onClick={(e) => handleDeleteSaved(activeSavedId, e)}
                  className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-600 hover:bg-red-50 py-4 rounded-3xl font-bold transition-all text-sm"
                >
                  <Trash2 size={18} />
                  מחק מתכון זה
                </button>
              </div>
            </div>
            <div className="flex-grow lg:h-[calc(100vh-140px)] lg:overflow-y-auto custom-scrollbar lg:sticky lg:top-24 pb-8 pl-4">
              {state === AppState.EDITING ? (
                <RecipeForm
                  recipe={recipe}
                  onChange={setRecipe}
                />
              ) : (
                <RecipeDisplay recipe={recipe} />
              )}
            </div>
          </div>
        )}
      </main>

      {fullscreenImageIndex !== null && (
        <FullscreenImageViewer
          images={recipeImages}
          initialIndex={fullscreenImageIndex}
          onClose={() => setFullscreenImageIndex(null)}
        />
      )}

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, recipeId: null })}
        onConfirm={handleConfirmDelete}
        title="מחיקת מתכון"
        message="האם אתה בטוח שברצונך למחוק את המתכון? פעולה זו אינה הפיכה."
        confirmText="כן, מחק מתכון"
        isDestructive={true}
      />

      {(copySuccess || saveSuccess) && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-2xl text-white px-12 py-6 rounded-[3rem] flex items-center gap-5 shadow-[0_30px_70px_rgba(0,0,0,0.5)] z-[100] copy-toast border border-white/20 ring-4 ring-white/10 animate-in slide-in-from-bottom-full">
          <div className="bg-green-500 p-2.5 rounded-full shadow-lg shadow-green-500/40 animate-pulse">
            <Check className="text-white" size={24} />
          </div>
          <span className="font-black text-2xl tracking-tight">{copySuccess ? 'הועתק ללוח!' : 'נשמר בהצלחה!'}</span>
        </div>
      )}
    </div>
  );
};

export default App;
