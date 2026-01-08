
import React from 'react';
import { ChefHat, ArrowLeft } from 'lucide-react';
import { signInWithGoogle } from '../services/authService';

const LoginScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 antialiased relative overflow-hidden">

      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vh] h-[50vh] bg-orange-200 rounded-full blur-[100px] opacity-40 animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vh] h-[50vh] bg-blue-200 rounded-full blur-[100px] opacity-40 animate-pulse delay-1000"></div>

      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl p-8 rounded-[3rem] shadow-2xl border border-white/50 text-center relative z-10">
        <div className="inline-block p-5 bg-orange-600 rounded-3xl text-white shadow-lg shadow-orange-200 mb-8 transform hover:rotate-12 transition-transform duration-500">
          <ChefHat size={48} />
        </div>

        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Recipe Genie</h1>
        <p className="text-slate-500 text-lg mb-10 font-medium leading-relaxed">
          הספרייה הדיגיטלית למתכונים של סבתא.
          <br />
          להפוך תמונות של מתכונים לטקסט חי בקליק.
        </p>

        <button
          onClick={signInWithGoogle}
          className="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl hover:shadow-2xl active:scale-95 group"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 bg-white rounded-full p-0.5" />
          <span>התחבר באמצעות Google</span>
          <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
        </button>

        <p className="mt-8 text-xs text-slate-400 font-bold uppercase tracking-widest">
          פרויקט פרטי • שמור ומאובטח
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
