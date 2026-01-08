
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

interface CategorySelectProps {
  value: string;
  categories: string[];
  onChange: (category: string) => void;
  onAddNew: () => void;
}

const CategorySelect: React.FC<CategorySelectProps> = ({ value, categories, onChange, onAddNew }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (category: string) => {
    onChange(category);
    setIsOpen(false);
  };

  return (
    <div
      className="relative flex-grow group"
      ref={dropdownRef}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-100 hover:border-orange-200 outline-none bg-slate-50 font-bold transition-all cursor-pointer text-slate-700 relative"
      >
        <span className="truncate block text-right">{value || 'בחר קטגוריה...'}</span>
        <ChevronDown size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-orange-500' : 'group-hover:text-orange-500'}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-2xl shadow-xl border-2 border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 max-h-60 overflow-y-auto custom-scrollbar">
          {(categories || []).map(c => (
            <div
              key={c}
              onClick={() => handleSelect(c)}
              className={`px-6 py-3 cursor-pointer transition-colors font-bold ${value === c ? 'bg-orange-50 text-orange-600' : 'hover:bg-slate-50 text-slate-700'}`}
            >
              {c}
            </div>
          ))}
          <div className="h-px bg-slate-100 my-1"></div>
          <div
            onClick={() => {
              onAddNew();
              setIsOpen(false);
            }}
            className="px-6 py-4 cursor-pointer hover:bg-orange-50 text-orange-600 font-black flex items-center justify-center gap-2 transition-colors border-t-2 border-slate-50 sticky bottom-0 bg-white"
          >
            הוסף קטגוריה
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySelect;
