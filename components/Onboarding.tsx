import React, { useState, useRef } from 'react';
import { ArrowRight, Upload, Activity, ChevronDown, ShieldCheck, FileCheck2, Check } from 'lucide-react';
import { HealthProfile, IntoleranceItem, IntoleranceLevel } from '../types';
import { parseReportDocument } from '../services/gemini';

interface OnboardingProps {
  onComplete: (health: HealthProfile, intolerances: IntoleranceItem[]) => void;
}

const COMMON_ALLERGENS = [
  { id: 'gluten', label: 'Gluten' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'peanuts', label: 'Peanuts' },
  { id: 'tree_nuts', label: 'Tree Nuts' },
  { id: 'shellfish', label: 'Shellfish' },
  { id: 'soy', label: 'Soy' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'fish', label: 'Fish' },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [health, setHealth] = useState<HealthProfile>({ condition: 'none', preference: 'balanced' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedFoods, setParsedFoods] = useState<IntoleranceItem[]>([]);
  const [manualSelections, setManualSelections] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert("File is too large. Please upload a document smaller than 20MB.");
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const resultString = reader.result as string;
        const mimeType = resultString.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)?.[0] || 'image/jpeg';
        const base64 = resultString.split(',')[1];
        
        const result = await parseReportDocument(base64, mimeType);
        
        const items: IntoleranceItem[] = result.foods.map((f, i) => ({
          id: `auto-${Date.now()}-${i}`,
          food: f.food,
          level: f.level as IntoleranceLevel
        }));
        
        setParsedFoods(items);
        setStep(3);
      } catch (err) {
        console.error(err);
        alert("Could not parse document. Please try again or skip to manual entry.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleSelection = (label: string) => {
    const newSet = new Set(manualSelections);
    if (newSet.has(label)) {
      newSet.delete(label);
    } else {
      newSet.add(label);
    }
    setManualSelections(newSet);
  };

  const finish = () => {
    // Combine parsed foods with manual selections
    const manualItems: IntoleranceItem[] = Array.from(manualSelections).map((label, i) => ({
      id: `manual-${Date.now()}-${i}`,
      food: label,
      level: IntoleranceLevel.Elevated // Default to elevated for quick selects
    }));
    
    onComplete(health, [...parsedFoods, ...manualItems]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans selection:bg-teal-500 selection:text-white">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-600/20 rounded-full blur-[128px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[128px] -ml-32 -mb-32"></div>
      </div>

      <div className="max-w-xl w-full bg-white rounded-[2rem] shadow-2xl p-8 md:p-12 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div className="flex items-center gap-3">
             <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg">
                <Activity size={22} className="stroke-[2.5px]" />
             </div>
             <span className="font-bold text-slate-900 text-lg tracking-tight font-serif">AllergyGuard</span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-2.5 rounded-full transition-all duration-500 ease-out ${i === step ? 'w-8 bg-teal-500' : i < step ? 'w-2.5 bg-teal-200' : 'w-2.5 bg-slate-100'}`} />
            ))}
          </div>
        </div>

        {/* Step 1: Health Profile */}
        {step === 1 && (
          <div className="animate-in slide-in-from-right-8 duration-500">
            <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight font-serif">Let's calibrate your profile.</h2>
            <p className="text-slate-500 mb-8 text-lg font-medium leading-relaxed">Tell us about your baseline needs so our AI can personalize its safety scoring.</p>

            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-900 uppercase tracking-widest ml-1">Medical Condition</label>
                <div className="relative group">
                  <select 
                    className="w-full p-4 pr-12 rounded-2xl border-2 border-slate-900 bg-white text-slate-900 font-bold text-lg outline-none focus:ring-4 focus:ring-slate-200 transition-all appearance-none cursor-pointer"
                    value={health.condition}
                    onChange={(e) => setHealth({...health, condition: e.target.value})}
                  >
                    <option value="none">None (General Population)</option>
                    <option value="type1-diabetes">Type 1 Diabetes</option>
                    <option value="type2-diabetes">Type 2 Diabetes</option>
                    <option value="celiac">Celiac Disease</option>
                    <option value="hypertension">Hypertension</option>
                    <option value="ibs">IBS (Irritable Bowel Syndrome)</option>
                  </select>
                  <div className="absolute right-5 top-5 text-slate-900 pointer-events-none">
                    <ChevronDown size={24} strokeWidth={3} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-900 uppercase tracking-widest ml-1">Dietary Preference</label>
                <div className="relative group">
                  <select 
                    className="w-full p-4 pr-12 rounded-2xl border-2 border-slate-900 bg-white text-slate-900 font-bold text-lg outline-none focus:ring-4 focus:ring-slate-200 transition-all appearance-none cursor-pointer"
                    value={health.preference}
                    onChange={(e) => setHealth({...health, preference: e.target.value})}
                  >
                    <option value="balanced">Balanced / No Restriction</option>
                    <option value="vegan">Vegan</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="keto">Keto</option>
                    <option value="paleo">Paleo</option>
                    <option value="mediterranean">Mediterranean</option>
                  </select>
                   <div className="absolute right-5 top-5 text-slate-900 pointer-events-none">
                    <ChevronDown size={24} strokeWidth={3} />
                   </div>
                </div>
              </div>
            </div>

            <button onClick={() => setStep(2)} className="w-full mt-10 bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all hover:scale-[1.02] hover:shadow-xl active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-slate-900/20">
              Continue <ArrowRight size={20} strokeWidth={3} />
            </button>
          </div>
        )}

        {/* Step 2: Quick Select & Upload */}
        {step === 2 && (
          <div className="animate-in slide-in-from-right-8 duration-500">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight font-serif">What do you avoid?</h2>
            <p className="text-slate-500 mb-6 font-medium">Select common triggers or upload a detailed medical report.</p>

            {/* Quick Select Grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {COMMON_ALLERGENS.map((allergen) => (
                <button
                  key={allergen.id}
                  onClick={() => toggleSelection(allergen.label)}
                  className={`p-3 rounded-xl border-2 font-bold text-sm flex items-center justify-between transition-all ${
                    manualSelections.has(allergen.label)
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {allergen.label}
                  {manualSelections.has(allergen.label) && <Check size={16} strokeWidth={3} />}
                </button>
              ))}
            </div>

            <div className="relative flex items-center justify-center mb-8">
              <div className="absolute inset-x-0 h-px bg-slate-200"></div>
              <span className="relative bg-white px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">OR</span>
            </div>

            <div 
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={`border-3 border-dashed border-slate-200 rounded-2xl h-24 flex flex-row items-center justify-center gap-4 cursor-pointer transition-all group ${isProcessing ? 'opacity-80 cursor-wait bg-slate-50 border-slate-300' : 'hover:border-indigo-400 hover:bg-indigo-50/30'}`}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
              {isProcessing ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-200 border-t-teal-600"></div>
                  <p className="font-bold text-teal-800 text-sm animate-pulse">Analyzing...</p>
                </div>
              ) : (
                <>
                   <div className="bg-indigo-100 text-indigo-500 p-2 rounded-lg">
                     <FileCheck2 size={24} />
                   </div>
                   <div className="text-left">
                      <p className="font-bold text-slate-800 text-sm">Upload Medical Report</p>
                      <p className="text-slate-400 text-xs font-medium">AI extracts your list automatically</p>
                   </div>
                </>
              )}
            </div>

            <button 
              onClick={() => setStep(3)} 
              disabled={manualSelections.size === 0 && parsedFoods.length === 0 && !isProcessing}
              className="w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Review Profile <ArrowRight size={20} strokeWidth={3} />
            </button>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="animate-in slide-in-from-right-8 duration-500 text-center pt-4">
            <div className="bg-teal-100 w-24 h-24 rounded-full flex items-center justify-center text-teal-600 mb-6 mx-auto shadow-xl shadow-teal-100 ring-8 ring-teal-50">
              <ShieldCheck size={48} strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight font-serif">Profile Ready</h2>
            <p className="text-slate-500 mb-8 text-lg font-medium">
              We've configured your AllergyGuard.
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 mb-8 text-left max-h-40 overflow-y-auto border border-slate-100 custom-scrollbar">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Triggers Set:</h4>
              <div className="flex flex-wrap gap-2">
                {[...parsedFoods, ...Array.from(manualSelections).map(s => ({food: s}))].map((item, i) => (
                  <span key={i} className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-xs font-bold text-slate-700 shadow-sm">
                    {item.food}
                  </span>
                ))}
              </div>
            </div>

            <button onClick={finish} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-xl hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95">
              Launch Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};