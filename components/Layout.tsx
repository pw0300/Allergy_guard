import React from 'react';
import { LogOut, Activity, Hexagon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900 overflow-x-hidden">
      
      {/* Background Mesh Gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-200 rounded-full blur-[120px] mix-blend-multiply filter" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200 rounded-full blur-[120px] mix-blend-multiply filter" />
      </div>

      {/* Premium Glass Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-teal-500 blur opacity-20 group-hover:opacity-40 transition-opacity rounded-xl"></div>
              <div className="relative bg-gradient-to-br from-teal-500 to-emerald-600 p-2 rounded-xl text-white shadow-lg shadow-teal-500/20">
                <Hexagon size={22} className="stroke-[2.5px] fill-white/10" />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none font-serif">
                AllergyGuard
              </h1>
              <span className="text-[10px] uppercase tracking-widest font-bold text-teal-600">AI Health OS</span>
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="group flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100/50 hover:bg-white text-slate-600 hover:text-red-500 transition-all border border-slate-200/50 hover:border-red-100 hover:shadow-md"
          >
            <span className="text-xs font-bold">Reset</span>
            <LogOut size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-28 pb-12">
        {children}
      </main>

      <footer className="relative z-10 border-t border-slate-200 bg-white/40 backdrop-blur-sm py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-3 mb-4 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
             <Activity size={24} />
             <span className="font-bold text-lg font-serif">AG</span>
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            Powered by <span className="text-teal-600">Gemini 2.5 Flash</span>
          </p>
          <p className="text-[11px] text-slate-400 max-w-md leading-relaxed">
            Safety scores are AI-generated estimates based on your provided profile and publicly available data. 
            Severe allergies require professional medical advice. Use with caution.
          </p>
        </div>
      </footer>
    </div>
  );
};