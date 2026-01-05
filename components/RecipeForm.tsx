
import React, { useState } from 'react';
import { Plus, Trash2, Save, X, Clock, Users, Tag, ChevronDown, ListChecks, Info, Lightbulb, GripVertical } from 'lucide-react';
import { Recipe, RECIPE_CATEGORIES, InstructionPhase } from '../types';

interface RecipeFormProps {
  recipe: Recipe;
  onChange: (recipe: Recipe) => void;
}

const RecipeForm: React.FC<RecipeFormProps> = ({ recipe, onChange }) => {


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

  /* Phrase & Step Handlers */
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
      <div className="flex items-center justify-between border-b border-slate-100 pb-8">
        <h2 className="text-3xl font-black text-slate-900">עריכת המתכון</h2>
      </div>

      <div className="space-y-10">
        {/* Header Section */}
        <div className="grid grid-cols-1 gap-8">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">שם המתכון</label>
            <input
              type="text"
              value={recipe.title}
              onChange={(e) => onChange({ ...recipe, title: e.target.value })}
              className="w-full px-6 py-5 rounded-[1.5rem] border-2 border-slate-100 focus:border-orange-500 outline-none transition-all text-2xl font-black bg-slate-50 focus:bg-white"
              placeholder="איך קוראים למנה?"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="relative">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Tag size={12} /> קטגוריה
              </label>
              <select
                value={recipe.category}
                onChange={(e) => onChange({ ...recipe, category: e.target.value })}
                className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-orange-500 outline-none appearance-none bg-slate-50 font-bold pr-12"
              >
                {RECIPE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={20} className="absolute left-4 top-[3.2rem] text-slate-400 pointer-events-none" />
            </div>

            <div>
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

            <div>
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
    </div>
  );
};

export default RecipeForm;
