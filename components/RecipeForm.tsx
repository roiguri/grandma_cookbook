import React, { useState } from 'react';
import { Plus, Trash2, X, Clock, Users, Tag, ChevronDown, ListChecks, Info, Lightbulb, Check, Settings } from 'lucide-react';
import { Recipe } from '../types';
import CategorySelect from './CategorySelect';

interface RecipeFormProps {
  recipe: Recipe;
  onChange: (recipe: Recipe) => void;
  categories: string[];
  onAddCategory: (newCategory: string) => Promise<void>;
  onDeleteCategory?: (category: string) => Promise<void>;
}

const RecipeForm: React.FC<RecipeFormProps> = ({ recipe, onChange, categories, onAddCategory, onDeleteCategory }) => {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddNewCategory = async () => {
    if (newCategoryName.trim()) {
      await onAddCategory(newCategoryName.trim());
      setNewCategoryName('');
      setIsAddingCategory(false);
      onChange({ ...recipe, category: newCategoryName.trim() });
    }
  };

  /* Phrase & Helper Handlers */

  const handleAddCategory = () => {
    onChange({
      ...recipe,
      categories: [...recipe.categories, { name: 'חלק חדש (למשל: לרוטב)', items: [''] }]
    });
  };

  const handleRemoveCategory = (idx: number) => {
    const newCategories = recipe.categories.filter((_, i) => i !== idx);
    onChange({ ...recipe, categories: newCategories });
  };

  const handleAddIngredient = (catIdx: number) => {
    const newCategories = [...recipe.categories];
    newCategories[catIdx].items.push('');
    onChange({ ...recipe, categories: newCategories });
  };

  const handleIngredientChange = (catIdx: number, itemIdx: number, value: string) => {
    const newCategories = [...recipe.categories];
    newCategories[catIdx].items[itemIdx] = value;
    onChange({ ...recipe, categories: newCategories });
  };

  const handleRemoveIngredient = (catIdx: number, itemIdx: number) => {
    const newCategories = [...recipe.categories];
    newCategories[catIdx].items = newCategories[catIdx].items.filter((_, i) => i !== itemIdx);
    onChange({ ...recipe, categories: newCategories });
  };

  const handleAddPhase = () => {
    onChange({
      ...recipe,
      steps: [...recipe.steps, { name: 'חלק חדש', steps: [''] }]
    });
  };

  const handleRemovePhase = (phaseIdx: number) => {
    if (recipe.steps.length <= 1) return; // Prevent removing the last phase
    const newSteps = recipe.steps.filter((_, i) => i !== phaseIdx);
    onChange({ ...recipe, steps: newSteps });
  };

  const handlePhaseNameChange = (phaseIdx: number, value: string) => {
    const newSteps = [...recipe.steps];
    newSteps[phaseIdx].name = value;
    onChange({ ...recipe, steps: newSteps });
  };

  const handleAddStep = (phaseIdx: number) => {
    const newSteps = [...recipe.steps];
    newSteps[phaseIdx].steps.push('');
    onChange({ ...recipe, steps: newSteps });
  };

  const handleStepChange = (phaseIdx: number, stepIdx: number, value: string) => {
    const newSteps = [...recipe.steps];
    newSteps[phaseIdx].steps[stepIdx] = value;
    onChange({ ...recipe, steps: newSteps });
  };

  const handleRemoveStep = (phaseIdx: number, stepIdx: number) => {
    const newSteps = [...recipe.steps];
    newSteps[phaseIdx].steps = newSteps[phaseIdx].steps.filter((_, i) => i !== stepIdx);
    onChange({ ...recipe, steps: newSteps });
  };

  const handleAddTip = () => {
    onChange({ ...recipe, tips: [...(recipe.tips || []), ''] });
  };

  const handleTipChange = (idx: number, value: string) => {
    const newTips = [...(recipe.tips || [])];
    newTips[idx] = value;
    onChange({ ...recipe, tips: newTips });
  };

  const handleRemoveTip = (idx: number) => {
    const newTips = (recipe.tips || []).filter((_, i) => i !== idx);
    onChange({ ...recipe, tips: newTips });
  };

  return (
    <div className="bg-white rounded-[2rem] sm:rounded-[4rem] shadow-2xl border border-slate-100 p-8 sm:p-12 space-y-12 animate-in fade-in zoom-in-95 duration-500">
      <div className="relative group">
        <input
          type="text"
          value={recipe.title}
          onChange={(e) => onChange({ ...recipe, title: e.target.value })}
          placeholder="שם המתכון"
          className="w-full text-3xl sm:text-4xl font-black text-slate-800 placeholder:text-slate-300 border-b-4 border-slate-100 hover:border-orange-200 focus:border-orange-500 bg-transparent py-4 px-2 outline-none transition-all placeholder:font-black"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="relative sm:col-span-5">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Tag size={12} /> קטגוריה
          </label>

          {isAddingCategory ? (
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                className="w-full px-4 py-4 rounded-2xl border-2 border-orange-500 outline-none bg-white font-bold"
                placeholder="שם קטגוריה חדשה..."
              />
              <button onClick={handleAddNewCategory} className="p-3 bg-orange-600 text-white rounded-xl"><Check size={20} /></button>
              <button onClick={() => setIsAddingCategory(false)} className="p-3 bg-slate-200 text-slate-600 rounded-xl"><X size={20} /></button>
            </div>
          ) : (
            <div className="flex gap-2 relative">
              <CategorySelect
                value={recipe.category}
                categories={categories}
                onChange={(cat) => onChange({ ...recipe, category: cat })}
                onAddNew={() => setIsAddingCategory(true)}
              />
              <button
                onClick={() => setIsManagingCategories(true)}
                className="p-4 bg-slate-50 border-2 border-slate-100 text-slate-400 hover:text-slate-600 hover:border-slate-200 hover:bg-slate-100 rounded-2xl transition-all"
                title="ניהול קטגוריות"
              >
                <Settings size={20} />
              </button>
            </div>
          )}

          {/* Manage Categories Modal */}
          {isManagingCategories && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsManagingCategories(false)}>
              <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black text-slate-800">ניהול קטגוריות</h3>
                  <button onClick={() => setIsManagingCategories(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar pr-2">
                  {categories.map(cat => (
                    <div key={cat} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 group">
                      <span className="font-bold text-slate-700">{cat}</span>
                      <button
                        onClick={() => {
                          if (confirm(`האם למחוק את הקטגוריה "${cat}"?`)) {
                            onDeleteCategory && onDeleteCategory(cat);
                          }
                        }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sm:col-span-4">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Clock size={12} /> זמן הכנה
          </label>
          <input
            type="text"
            value={recipe.prepTime}
            onChange={(e) => onChange({ ...recipe, prepTime: e.target.value })}
            className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-orange-500 outline-none bg-slate-50 font-bold"
          />
        </div>

        <div className="sm:col-span-3">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Users size={12} /> כמות מנות
          </label>
          <input
            type="text"
            value={recipe.servings || ''}
            onChange={(e) => onChange({ ...recipe, servings: e.target.value })}
            className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-orange-500 outline-none bg-slate-50 font-bold"
            placeholder="למשל: 4 מנות"
          />
        </div>
      </div>


      {/* Ingredients by Components/Stages */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-xl text-white"><Info size={20} /></div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">מצרכים לפי שלבים</h3>
          </div>
          <button
            onClick={handleAddCategory}
            className="flex items-center gap-2 text-orange-600 font-bold hover:bg-orange-50 px-4 py-2 rounded-xl transition-all"
          >
            <Plus size={18} /> הוסף שלב/חלק
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {recipe.categories.map((cat, catIdx) => (
            <div key={catIdx} className="bg-slate-50 p-6 sm:p-8 rounded-[2rem] border-2 border-slate-100 relative group">
              <button
                onClick={() => handleRemoveCategory(catIdx)}
                className="absolute top-4 left-4 p-2 text-slate-300 hover:text-red-500 transition-colors"
                title="הסר חלק זה"
              >
                <Trash2 size={20} />
              </button>

              <input
                type="text"
                value={cat.name}
                onChange={(e) => {
                  const newCats = [...recipe.categories];
                  newCats[catIdx].name = e.target.value;
                  onChange({ ...recipe, categories: newCats });
                }}
                className="bg-transparent border-b-2 border-slate-200 focus:border-orange-500 outline-none text-xl font-black text-orange-700 mb-6 px-1 py-1 w-full sm:w-auto"
              />

              <div className="space-y-3">
                {cat.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-300 flex-shrink-0"></div>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleIngredientChange(catIdx, itemIdx, e.target.value)}
                      className="flex-grow bg-white px-4 py-2 rounded-xl border border-slate-200 focus:border-orange-400 outline-none font-bold text-slate-700"
                      placeholder="כמות ומצרך..."
                    />
                    <button
                      onClick={() => handleRemoveIngredient(catIdx, itemIdx)}
                      className="p-2 text-slate-300 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleAddIngredient(catIdx)}
                  className="flex items-center gap-2 text-slate-400 hover:text-orange-600 font-bold text-sm mt-4 mr-5 transition-colors"
                >
                  <Plus size={16} /> הוסף מצרך לחלק זה
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Preparation Steps */}
      {/* Preparation Steps by Phases */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-xl text-white"><ListChecks size={20} /></div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">אופן ההכנה</h3>
          </div>
          <button
            onClick={handleAddPhase}
            className="flex items-center gap-2 text-slate-500 font-bold hover:bg-slate-50 px-4 py-2 rounded-xl transition-all border border-slate-200"
          >
            <Plus size={18} /> הוסף חלק (למשל: לקרם)
          </button>
        </div>

        <div className="space-y-10">
          {recipe.steps.map((phase, phaseIdx) => (
            <div key={phaseIdx} className="bg-slate-50 p-6 sm:p-8 rounded-[2rem] border-2 border-slate-100 relative group">
              {/* Phase Header */}
              <div className="flex items-center gap-4 mb-6">
                <input
                  type="text"
                  value={phase.name}
                  onChange={(e) => handlePhaseNameChange(phaseIdx, e.target.value)}
                  className="bg-transparent border-b-2 border-slate-200 focus:border-orange-500 outline-none text-xl font-black text-orange-700 px-1 py-1 w-full sm:w-auto flex-grow"
                  placeholder="שם החלק..."
                />
                {recipe.steps.length > 1 && (
                  <button
                    onClick={() => handleRemovePhase(phaseIdx)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors bg-white rounded-xl shadow-sm border border-slate-100"
                    title="הסר חלק זה"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {phase.steps.map((step, stepIdx) => (
                  <div key={stepIdx} className="flex gap-4 group items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-400 flex items-center justify-center font-black text-lg">
                      {stepIdx + 1}
                    </div>
                    <div className="flex-grow">
                      <textarea
                        value={step}
                        onChange={(e) => handleStepChange(phaseIdx, stepIdx, e.target.value)}
                        className="w-full bg-white px-6 py-4 rounded-2xl border border-slate-200 focus:border-orange-400 outline-none font-bold text-slate-700 min-h-[80px]"
                        placeholder={`שלב ${stepIdx + 1}...`}
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveStep(phaseIdx, stepIdx)}
                      className="mt-3 p-2 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleAddStep(phaseIdx)}
                className="flex items-center gap-2 text-orange-600 font-bold hover:bg-orange-100/50 px-4 py-2 rounded-xl transition-all mt-4 w-full justify-center border-2 border-dashed border-orange-200 hover:border-orange-300"
              >
                <Plus size={18} /> הוסף שלב ל{phase.name}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Tips and Comments Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2 rounded-xl text-white"><Lightbulb size={20} /></div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">טיפים והערות</h3>
          </div>
          <button
            onClick={handleAddTip}
            className="flex items-center gap-2 text-amber-600 font-bold hover:bg-amber-50 px-4 py-2 rounded-xl transition-all"
          >
            <Plus size={18} /> הוסף טיפ
          </button>
        </div>

        <div className="space-y-4">
          {(recipe.tips || []).map((tip, idx) => (
            <div key={idx} className="flex gap-4 group items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-50 text-amber-400 flex items-center justify-center">
                <Lightbulb size={18} />
              </div>
              <div className="flex-grow">
                <input
                  type="text"
                  value={tip}
                  onChange={(e) => handleTipChange(idx, e.target.value)}
                  className="w-full bg-white px-6 py-4 rounded-2xl border border-slate-200 focus:border-amber-400 outline-none font-bold text-slate-700"
                  placeholder="טיפ או הערה..."
                />
              </div>
              <button
                onClick={() => handleRemoveTip(idx)}
                className="mt-2 p-2 text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default RecipeForm;
