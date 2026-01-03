
import React from 'react';
import { Clock, Users, Utensils, Tag, ListChecks, Info, Lightbulb } from 'lucide-react';
import { Recipe } from '../types';

interface RecipeDisplayProps {
  recipe: Recipe;
}

const RecipeDisplay: React.FC<RecipeDisplayProps> = ({ recipe }) => {
  return (
    <div className="bg-white rounded-[2rem] sm:rounded-[4rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-10 sm:p-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">

      {/* Header */}
      <div className="mb-14 text-right">
        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-6 py-2 rounded-full text-xs font-black mb-6 uppercase tracking-widest shadow-sm ring-1 ring-orange-200/50">
          <Tag size={16} />
          {recipe.category || 'כללי'}
        </div>
        <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-10 leading-tight tracking-tight">
          {recipe.title}
        </h2>

        <div className="flex flex-wrap items-center gap-10 text-slate-500 justify-start">
          <div className="flex items-center gap-4 group">
            <div className="bg-orange-50 p-4 rounded-3xl group-hover:bg-orange-600 group-hover:text-white transition-all duration-500 shadow-sm"><Clock size={24} /></div>
            <div className="flex flex-col items-start">
              <span className="text-[11px] uppercase font-black text-slate-400 tracking-wider">זמן הכנה</span>
              <span className="text-xl font-black text-slate-800">{recipe.prepTime}</span>
            </div>
          </div>
          {recipe.servings && (
            <div className="flex items-center gap-4 group">
              <div className="bg-blue-50 p-4 rounded-3xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm"><Users size={24} className="text-blue-500 group-hover:text-white" /></div>
              <div className="flex flex-col items-start">
                <span className="text-[11px] uppercase font-black text-slate-400 tracking-wider">מנות</span>
                <span className="text-xl font-black text-slate-800">{recipe.servings}</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4 group">
            <div className="bg-emerald-50 p-4 rounded-3xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-sm"><Utensils size={24} className="text-emerald-500 group-hover:text-white" /></div>
            <div className="flex flex-col items-start">
              <span className="text-[11px] uppercase font-black text-slate-400 tracking-wider">סגנון</span>
              <span className="text-xl font-black text-slate-800">ביתי</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-20">
        {/* Ingredients Section - Grouped by stage/component */}
        <section>
          <div className="flex items-center gap-6 mb-12">
            <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-lg"><Info size={24} /></div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">מצרכים</h3>
            <div className="flex-grow h-px bg-gradient-to-l from-slate-200 to-transparent"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {recipe.categories.map((cat, idx) => (
              <div key={idx} className="bg-slate-50/70 backdrop-blur-sm p-8 rounded-[3rem] border border-slate-100 hover:border-orange-200 hover:bg-white transition-all duration-500 shadow-sm">
                <h4 className="font-black text-orange-700 mb-6 text-2xl border-b-2 border-orange-100/50 pb-3 inline-block">
                  {cat.name}
                </h4>
                <ul className="space-y-5">
                  {cat.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-4 text-slate-700 font-bold text-lg group">
                      <div className="mt-2 w-2 h-2 rounded-full bg-orange-400 flex-shrink-0 group-hover:scale-150 group-hover:bg-orange-600 transition-all"></div>
                      <span className="leading-relaxed tracking-tight">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Steps Section */}
        <section>
          <div className="flex items-center gap-6 mb-12">
            <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-lg"><ListChecks size={24} /></div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">אופן ההכנה</h3>
            <div className="flex-grow h-px bg-gradient-to-l from-slate-200 to-transparent"></div>
          </div>
          <div className="space-y-12">
            {recipe.steps.map((phase, phaseIdx) => (
              <div key={phaseIdx} className="bg-white/50 rounded-3xl p-6 sm:p-8">
                {recipe.steps.length > 1 && (
                  <h4 className="text-2xl font-black text-orange-700 mb-6 border-r-4 border-orange-400 pr-4">
                    {phase.name}
                  </h4>
                )}
                <div className="space-y-8">
                  {phase.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-8 group">
                      <div className="flex-shrink-0 w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center font-black text-2xl group-hover:bg-orange-600 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-orange-200 group-hover:rotate-6">
                        {idx + 1}
                      </div>
                      <div className="flex-grow pt-3 text-slate-700 leading-relaxed text-xl font-bold tracking-tight border-b border-slate-50 pb-6 group-last:border-0">
                        {step}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tips Section */}
        {recipe.tips && recipe.tips.length > 0 && (
          <section className="bg-amber-50 rounded-[3rem] p-10 sm:p-14 border border-amber-100 shadow-inner">
            <div className="flex items-center gap-6 mb-8">
              <div className="bg-amber-500 p-3 rounded-2xl text-white shadow-lg"><Lightbulb size={24} /></div>
              <h3 className="text-3xl font-black text-amber-900 tracking-tight">טיפים והערות</h3>
            </div>
            <ul className="space-y-6">
              {recipe.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-4 text-amber-800 text-lg font-bold leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"></span>
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="mt-20 pt-10 border-t border-slate-100 text-center">
        <p className="text-slate-400 font-black italic text-sm">בתאבון! נוצר על ידי Recipe Genie</p>
      </div>
    </div>
  );
};

export default RecipeDisplay;
