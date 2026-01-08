import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { SavedRecipe, Recipe } from '../types';
import RecipeForm from './RecipeForm';
import ImageViewer from './ImageViewer';
import ReviewActionBar from './ReviewActionBar';
import ConfirmationModal from './ConfirmationModal';
import { dbService } from '../services/dbService';

interface ReviewModeProps {
  recipes: SavedRecipe[]; // Should be the list of recipes to review (or all, but filtered logic might be outside)
  initialIndex?: number;
  onExit: () => void;
  onUpdateRecipe: (id: string, updates: Partial<SavedRecipe>) => void; // For optimistic updates or just callback
  categories: string[];
  onAddCategory: (category: string) => Promise<void>;
  onDeleteCategory: (category: string) => Promise<void>;
}

const ReviewMode: React.FC<ReviewModeProps> = ({ recipes, initialIndex = 0, onExit, onUpdateRecipe, categories, onAddCategory, onDeleteCategory }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [currentRecipe, setCurrentRecipe] = useState<SavedRecipe | null>(null);
  const [editedRecipe, setEditedRecipe] = useState<Recipe | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<'next' | 'prev' | 'exit' | null>(null);

  // System comments modal state? Or inline? 
  // Requirement says "review tools (notes...)" in action bar. 
  // Let's implement a simple modal for notes or toggle it. 
  // For compactness, let's use a small overlay or prompt for now, or just rely on state.
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [tempNotes, setTempNotes] = useState('');

  useEffect(() => {
    if (recipes.length > 0 && currentIndex < recipes.length) {
      const r = recipes[currentIndex];
      setCurrentRecipe(r);
      // Deep copy for editing
      setEditedRecipe(JSON.parse(JSON.stringify(r.recipe)));
      setIsDirty(false);
    } else if (recipes.length === 0) {
      // No recipes to review
      onExit();
    }
  }, [recipes, currentIndex, onExit]);

  // Handle Recipe Change
  const handleRecipeChange = useCallback((updated: Recipe) => {
    setEditedRecipe(updated);
    setIsDirty(true);
  }, []);

  const handleSave = async (shouldMoveToNext: boolean = false) => {
    if (!currentRecipe || !editedRecipe) return;

    try {
      await dbService.updateRecipe(currentRecipe.id, {
        recipe: editedRecipe
      });
      // Update local parent state if needed
      onUpdateRecipe(currentRecipe.id, { recipe: editedRecipe });

      setIsDirty(false);

      if (shouldMoveToNext) {
        goToNext();
      }
    } catch (error) {
      console.error("Failed to save", error);
    }
  };

  const goToNext = () => {
    if (currentIndex < recipes.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNavigationAttempt = (direction: 'next' | 'prev' | 'exit') => {
    if (isDirty) {
      setPendingNavigation(direction);
      setShowExitModal(true);
    } else {
      if (direction === 'next') goToNext();
      if (direction === 'prev') goToPrev();
      if (direction === 'exit') onExit();
    }
  };


  const discardAndNavigate = () => {
    // Reset to original and navigate
    if (currentRecipe) {
      setEditedRecipe(JSON.parse(JSON.stringify(currentRecipe.recipe)));
      setIsDirty(false);
    }
    setShowExitModal(false);
    if (pendingNavigation === 'next') goToNext();
    if (pendingNavigation === 'prev') goToPrev();
    if (pendingNavigation === 'exit') onExit();
    setPendingNavigation(null);
  };

  const handleReset = () => {
    if (!currentRecipe) return;
    // Reset editedRecipe to original saved version
    setEditedRecipe(JSON.parse(JSON.stringify(currentRecipe.recipe)));
    setIsDirty(false);
  };

  const toggleStatus = async () => {
    if (!currentRecipe) return;
    const newStatus = currentRecipe.status === 'reviewed' ? 'unreviewed' : 'reviewed';

    // Note: status update is separate from content update? 
    // Usually if I approve, I don't imply text save unless I explicitly saved?
    // Let's assume toggle status is independent or auto-saves?
    // Requirement said: "approved/pending toggle". 
    // Let's update status in DB immediately.
    await dbService.updateRecipe(currentRecipe.id, { status: newStatus });
    onUpdateRecipe(currentRecipe.id, { status: newStatus });

    // Auto-advance if approved (optional UX)? Only if we are in flow?
    // Let's keep manual navigation for now to avoid confusion.
  };

  const toggleFavorite = async () => {
    if (!currentRecipe) return;
    const newFav = !currentRecipe.isFavorite;
    await dbService.updateRecipe(currentRecipe.id, { isFavorite: newFav });
    onUpdateRecipe(currentRecipe.id, { isFavorite: newFav });
  };

  const saveSystemComments = async () => {
    if (!currentRecipe) return;
    await dbService.updateRecipe(currentRecipe.id, { systemComments: tempNotes });
    onUpdateRecipe(currentRecipe.id, { systemComments: tempNotes });
    setShowNotesModal(false);
  };

  if (!currentRecipe || !editedRecipe) return null;

  const totalPending = recipes.filter(r => r.status === 'unreviewed').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden animate-in fade-in duration-300">

      {/* Top Bar - Minimal */}
      <div className="h-14 bg-white border-b flex items-center justify-between px-4 sm:px-8 z-40 shrink-0">
        <h1 className="font-black text-slate-700 text-lg">מצב ביקורת</h1>
        <button
          onClick={() => handleNavigationAttempt('exit')}
          className="text-slate-400 hover:text-slate-600 font-bold text-sm"
        >
          יציאה
        </button>
      </div>

      {/* Main Content - Split Screen */}
      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden relative">

        {/* Right Side - Image Viewer (50%) */}
        <div className="w-full lg:w-1/2 h-[40vh] lg:h-full bg-slate-100 relative border-b lg:border-b-0 lg:border-r border-slate-200 order-1 lg:order-2 flex flex-col justify-center overflow-hidden">
          {currentRecipe.images.length > 0 ? (
            <ImageViewer
              key={currentRecipe.id} // Forces reset when recipe changes
              images={currentRecipe.images}
              initialIndex={0}
              alt={`Recipe source`}
              className="bg-slate-900/5"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">אין תמונה זמינה</div>
          )}
        </div>

        {/* Left Side - Edit Form (50%) */}
        <div className="w-full lg:w-1/2 h-[60vh] lg:h-full overflow-y-auto bg-white p-4 sm:p-8 pb-32 lg:pb-32 order-2 lg:order-1">
          <div className="max-w-2xl mx-auto">
            <RecipeForm
              recipe={editedRecipe}
              onChange={handleRecipeChange}
              categories={categories}
              onAddCategory={onAddCategory}
              onDeleteCategory={onDeleteCategory}
            />
          </div>
        </div>

      </div>

      {/* Action Bar */}
      <ReviewActionBar
        currentRecipe={currentRecipe}
        totalPending={totalPending}
        currentIndex={currentIndex}
        totalCount={recipes.length}
        isDirty={isDirty}
        onNext={() => handleNavigationAttempt('next')}
        onPrev={() => handleNavigationAttempt('prev')}
        onSave={() => handleSave(false)}
        onReset={handleReset}
        onToggleStatus={toggleStatus}
        onToggleFavorite={toggleFavorite}
        onEditSystemComments={() => {
          setTempNotes(currentRecipe.systemComments || '');
          setShowNotesModal(true);
        }}
      />

      {/* Modals */}
      <ConfirmationModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={discardAndNavigate}
        title="שינויים שלא נשמרו"
        message="יש לך שינויים שלא נשמרו. האם לבטל את השינויים ולהמשיך?"
        confirmText="בטל שינויים והמשך"
        cancelText="ביטול"
        isDestructive={true}
      />

      {/* System Comments Modal - Simple Overlay */}
      {showNotesModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-black text-slate-800 mb-4">הערות לניהול המתכון</h3>
            <textarea
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 min-h-[150px] font-bold text-slate-700 focus:border-orange-500 outline-none resize-none"
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              placeholder="כתוב הערות לעצמך..."
            />
            <div className="flex items-center gap-3 mt-6">
              <button onClick={saveSystemComments} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold">שמור הערות</button>
              <button onClick={() => setShowNotesModal(false)} className="flex-1 bg-slate-100 text-slate-500 py-3 rounded-xl font-bold hover:bg-slate-200">ביטול</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReviewMode;
