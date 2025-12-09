import React, { useState } from 'react';
import { Plus, X, ShieldAlert, AlertTriangle, CheckCircle2, UserCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { IntoleranceItem, IntoleranceLevel } from '../types';

interface ProfileCardProps {
  intolerances: IntoleranceItem[];
  onAdd: (food: string, level: IntoleranceLevel) => void;
  onRemove: (id: string) => void;
  healthCondition: string;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ intolerances, onAdd, onRemove, healthCondition }) => {
  const [newFood, setNewFood] = useState('');
  const [newLevel, setNewLevel] = useState<IntoleranceLevel>(IntoleranceLevel.Elevated);
  const [isAdding, setIsAdding] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAdd = () => {
    if (newFood.trim()) {
      onAdd(newFood.trim(), newLevel);
      setNewFood('');
      setIsAdding(false);
    }
  };

  const renderBadge = (item: IntoleranceItem) => {
    const styles = {
      [IntoleranceLevel.Elevated]: 'bg-white text-red-700 border-red-100 shadow-sm hover:border-red-200',
      [IntoleranceLevel.Borderline]: 'bg-white text-amber-700 border-amber-100 shadow-sm hover:border-amber-200',
      [IntoleranceLevel.Normal]: 'bg-white text-emerald-700 border-emerald-100 shadow-sm hover:border-emerald-200'
    };

    return (
      <div 
        key={item.id} 
        className={`group flex items-center justify-between px-3 py-2.5 rounded-xl border ${styles[item.level]} transition-all`}
      >
        <span className="text-sm font-bold truncate pr-2">{item.food}</span>
        <button 
          onClick={() => onRemove(item.id)}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded-md transition-all text-slate-400 hover:text-slate-600"
        >
          <X size={14} />
        </button>
      </div>
    );
  };

  const elevatedItems = intolerances.filter(i => i.level === IntoleranceLevel.Elevated);
  const borderlineItems = intolerances.filter(i => i.level === IntoleranceLevel.Borderline);
  const normalItems = intolerances.filter(i => i.level === IntoleranceLevel.Normal);

  return (
    <div className={`bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white overflow-hidden flex flex-col transition-all duration-300 ${isExpanded ? 'h-auto' : 'h-auto'}`}>
      
      {/* Passport Header - Clickable on Mobile */}
      <div 
        className="bg-slate-900 p-6 text-white relative overflow-hidden cursor-pointer lg:cursor-default"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/5">
              <UserCircle2 size={28} className="text-teal-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight tracking-tight font-serif">Health Passport</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">
                {healthCondition === 'none' ? 'General Profile' : healthCondition}
              </p>
            </div>
          </div>
          <div className="lg:hidden text-slate-400">
             {isExpanded ? <ChevronUp /> : <ChevronDown />}
          </div>
        </div>
      </div>

      {/* Content Area - Collapsible on Mobile, Always Visible on Desktop */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isExpanded ? 'block' : 'hidden lg:flex'}`}>
        <div className="p-6 flex-1 overflow-y-auto space-y-8 custom-scrollbar max-h-[60vh] lg:max-h-[calc(100vh-320px)]">
          
          {/* Critical Alerts Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
               <h3 className="flex items-center gap-2 text-xs font-black text-red-600 uppercase tracking-widest">
                <ShieldAlert size={14} /> Critical
              </h3>
              <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{elevatedItems.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {elevatedItems.length > 0 ? elevatedItems.map(renderBadge) : (
                <div className="p-4 rounded-xl border-2 border-dashed border-slate-100 text-center">
                   <span className="text-xs text-slate-400 font-medium">No critical triggers</span>
                </div>
              )}
            </div>
          </div>

          {/* Cautionary Section */}
          {(borderlineItems.length > 0 || normalItems.length > 0) && (
            <div className="border-t border-slate-100 pt-6">
              
              {/* Borderline */}
              <div className="mb-6">
                 <div className="flex items-center justify-between mb-3">
                    <h3 className="flex items-center gap-2 text-xs font-black text-amber-600 uppercase tracking-widest">
                      <AlertTriangle size={14} /> Caution
                    </h3>
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">{borderlineItems.length}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {borderlineItems.map(renderBadge)}
                  </div>
              </div>
              
              {/* Normal */}
              <div>
                 <div className="flex items-center justify-between mb-3">
                    <h3 className="flex items-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-widest">
                      <CheckCircle2 size={14} /> Safe List
                    </h3>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">{normalItems.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {normalItems.length > 0 ? normalItems.map(item => (
                      <span key={item.id} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-200">
                        {item.food}
                      </span>
                    )) : <span className="text-xs text-slate-400 italic">No safe foods logged yet.</span>}
                  </div>
              </div>
            </div>
          )}
        </div>

        {/* Add New Action */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 backdrop-blur-sm">
          {!isAdding ? (
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 text-sm font-bold hover:bg-white hover:border-teal-400 hover:text-teal-600 transition-all flex items-center justify-center gap-2 group"
            >
              <Plus size={18} className="group-hover:scale-110 transition-transform" /> Add Intolerance
            </button>
          ) : (
            <div className="animate-in slide-in-from-bottom-2 fade-in bg-white p-3 rounded-2xl shadow-lg border border-slate-100">
              <div className="flex gap-2 mb-2">
                <input 
                  autoFocus
                  type="text" 
                  value={newFood}
                  onChange={(e) => setNewFood(e.target.value)}
                  placeholder="Food name..."
                  className="flex-1 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <button onClick={() => setIsAdding(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">
                  <X size={18} />
                </button>
              </div>
              <div className="flex gap-2">
                <select 
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value as IntoleranceLevel)}
                  className="flex-1 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 focus:border-teal-500 outline-none cursor-pointer"
                >
                  <option value={IntoleranceLevel.Elevated}>Critical (Elevated)</option>
                  <option value={IntoleranceLevel.Borderline}>Caution (Borderline)</option>
                  <option value={IntoleranceLevel.Normal}>Safe (Normal)</option>
                </select>
                <button 
                  onClick={handleAdd}
                  className="bg-slate-900 text-white px-4 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg whitespace-nowrap"
                >
                  Add Food
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};