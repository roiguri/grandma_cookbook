import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, Heart, Save, StickyNote, ChevronUp, ChevronDown, Undo2 } from 'lucide-react';
import { SavedRecipe } from '../types';

interface ReviewActionBarProps {
  currentRecipe: SavedRecipe;
  totalPending: number;
  currentIndex: number;
  totalCount: number;
  isDirty: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSave: () => void;
  onReset: () => void;
  onToggleStatus: () => void;
  onToggleFavorite: () => void;
  onEditSystemComments: () => void;
}

const ReviewActionBar: React.FC<ReviewActionBarProps> = ({
  currentRecipe,
  totalPending,
  currentIndex,
  totalCount,
  isDirty,
  onNext,
  onPrev,
  onSave,
  onReset,
  onToggleStatus,
  onToggleFavorite,
  onEditSystemComments
}) => {
  const [isHidden, setIsHidden] = useState(false);
  const isReviewed = currentRecipe.status === 'reviewed';

  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 transition-all duration-300 ${isHidden ? 'translate-y-[calc(100%-1.75rem)]' : 'translate-y-0'
      }`}>

      {/* Hide/Show Toggle Button - Above action bar */}
      <button
        onClick={() => setIsHidden(!isHidden)}
        className="bg-slate-900/80 backdrop-blur-xl px-4 py-1 rounded-full border border-white/10 shadow-lg text-white/70 hover:text-white transition-all flex items-center gap-1 text-xs font-bold"
      >
        {isHidden ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {isHidden ? 'הצג' : 'הסתר'}
      </button>

      {/* Compact Action Bar */}
      <div
        className={`bg-slate-900/80 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 shadow-2xl flex items-center gap-1 pointer-events-auto transition-opacity duration-300 ${isHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
      >

        {/* Navigation - Prev */}
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
          title="הקודם"
        >
          <ChevronRight size={18} />
        </button>

        {/* Counter */}
        <span className="text-white/60 text-xs font-mono px-1">
          {currentIndex + 1}/{totalCount}
        </span>

        {/* Navigation - Next */}
        <button
          onClick={onNext}
          disabled={currentIndex === totalCount - 1}
          className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
          title="הבא"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="w-px h-5 bg-white/20 mx-1"></div>

        {/* Favorite */}
        <button
          onClick={onToggleFavorite}
          className={`p-2 rounded-full transition-all ${currentRecipe.isFavorite ? 'text-red-500' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
          title={currentRecipe.isFavorite ? "הסר ממועדפים" : "הוסף למועדפים"}
        >
          <Heart size={16} fill={currentRecipe.isFavorite ? 'currentColor' : 'none'} />
        </button>

        {/* Notes */}
        <button
          onClick={onEditSystemComments}
          className={`p-2 rounded-full transition-all relative ${currentRecipe.systemComments ? 'text-amber-400' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
          title="הערות ניהול"
        >
          <StickyNote size={16} />
          {currentRecipe.systemComments && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
          )}
        </button>

        <div className="w-px h-5 bg-white/20 mx-1"></div>

        {/* Approve/Review Status */}
        <button
          onClick={onToggleStatus}
          className={`p-2 rounded-full transition-all ${isReviewed
            ? 'text-green-400 bg-green-500/20'
            : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          title={isReviewed ? "סמן כלא מבוקר" : "אשר מתכון"}
        >
          <Check size={16} />
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          disabled={!isDirty}
          className={`p-2 rounded-full transition-all ${isDirty ? 'text-red-400 bg-red-500/20 hover:bg-red-500/30' : 'text-white/20 cursor-not-allowed'}`}
          title="שחזר שינויים"
        >
          <Undo2 size={16} />
        </button>

        {/* Save */}
        <button
          onClick={onSave}
          disabled={!isDirty}
          className={`p-2 rounded-full transition-all ${isDirty ? 'text-orange-400 bg-orange-500/20 hover:bg-orange-500/30' : 'text-white/20 cursor-not-allowed'}`}
          title="שמור שינויים"
        >
          <Save size={16} />
        </button>
      </div>
    </div>
  );
};

export default ReviewActionBar;
