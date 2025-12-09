import React, { useRef, useState } from 'react';
import { Camera, Upload, ScanLine, XCircle, CheckCircle2, Maximize2, FileText } from 'lucide-react';
import { AnalysisResult, IntoleranceItem, HistoryItem } from '../types';
import { analyzeProductLabel } from '../services/gemini';

interface LabelScannerProps {
  intolerances: IntoleranceItem[];
  onAnalysisComplete: (item: HistoryItem) => void;
}

export const LabelScanner: React.FC<LabelScannerProps> = ({ intolerances, onAnalysisComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPreview(base64);
      setLoading(true);
      setResult(null);
      
      try {
        const base64Data = base64.split(',')[1];
        const data = await analyzeProductLabel(base64Data, intolerances);
        setResult(data);
        
        onAnalysisComplete({
          id: Date.now().toString(),
          type: 'scan',
          query: 'Label Scan',
          timestamp: Date.now(),
          safetyScore: data.safetyScore,
          summary: data.summary
        });
      } catch (error) {
        console.error("Scan failed", error);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const highlightIngredients = (text: string, allergens: string[]) => {
    if (!allergens || allergens.length === 0) return text;
    
    // Create a regex that matches any of the allergens (case insensitive)
    const escapedAllergens = allergens.map(a => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`(${escapedAllergens.join('|')})`, 'gi');
    
    // Split text by the pattern
    const parts = text.split(pattern);

    return parts.map((part, i) => {
      const isMatch = allergens.some(a => a.toLowerCase() === part.toLowerCase());
      return isMatch ? (
        <span key={i} className="bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-md mx-0.5 shadow-sm inline-block">
          {part}
        </span>
      ) : (
        part
      );
    });
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-white p-6 md:p-8 flex flex-col h-full relative z-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 border border-indigo-100">
              <ScanLine size={24} strokeWidth={2.5} />
          </div>
          <div>
              <h2 className="font-bold text-xl text-slate-800 font-serif">Ingredients Scanner</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Detect hidden allergens</p>
          </div>
        </div>
      </div>

      <div className="flex-1">
        {!preview ? (
          <div 
            onClick={() => !loading && fileInputRef.current?.click()}
            className="h-full min-h-[240px] border-3 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:bg-indigo-50/20 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-20"></div>
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg border border-slate-100 relative z-10">
               <Camera size={32} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </div>
            <span className="text-base font-bold text-slate-700 relative z-10">Click to Snap or Upload</span>
            <span className="text-xs font-semibold text-slate-400 mt-2 relative z-10 bg-white/80 px-3 py-1 rounded-full">Supports Clear Text Images</span>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative rounded-3xl overflow-hidden border-4 border-slate-900 aspect-video bg-slate-900 shadow-2xl">
              <img src={preview} alt="Product Label" className="w-full h-full object-contain opacity-90" />
              
              {/* Camera UI Overlays */}
              <div className="absolute top-4 left-4 border-t-2 border-l-2 border-white/50 w-8 h-8 rounded-tl-lg"></div>
              <div className="absolute top-4 right-4 border-t-2 border-r-2 border-white/50 w-8 h-8 rounded-tr-lg"></div>
              <div className="absolute bottom-4 left-4 border-b-2 border-l-2 border-white/50 w-8 h-8 rounded-bl-lg"></div>
              <div className="absolute bottom-4 right-4 border-b-2 border-r-2 border-white/50 w-8 h-8 rounded-br-lg"></div>

              {loading && (
                <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center text-white backdrop-blur-sm z-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-white/20 border-t-teal-400 mb-4"></div>
                    <span className="text-sm font-bold tracking-widest uppercase animate-pulse">Analyzing Label...</span>
                </div>
              )}
              
              <button 
                onClick={() => { setPreview(null); setResult(null); }}
                className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-all z-30"
              >
                <XCircle size={20} />
              </button>
              
              {/* Laser Scan Animation Overlay */}
              {loading && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_20px_rgba(45,212,191,0.8)] absolute animate-scan-laser top-0"></div>
                </div>
              )}

              {/* Bounding Box Overlay */}
              {!loading && result?.boundingBox && (
                <div 
                    className="absolute border-2 border-teal-400 bg-teal-400/20 shadow-[0_0_20px_rgba(45,212,191,0.4)] transition-all duration-700 ease-out z-10"
                    style={{
                        top: `${result.boundingBox[0]}%`,
                        left: `${result.boundingBox[1]}%`,
                        height: `${result.boundingBox[2] - result.boundingBox[0]}%`,
                        width: `${result.boundingBox[3] - result.boundingBox[1]}%`
                    }}
                >
                  <div className="absolute -top-3 left-0 bg-teal-400 text-teal-950 text-[10px] font-bold px-2 rounded-sm shadow-sm">
                    Ingredients Detected
                  </div>
                </div>
              )}
            </div>

            {result && (
              <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4">
                {/* Analysis Score Card */}
                <div className={`p-6 rounded-2xl border-l-4 shadow-lg ${
                  result.safetyScore > 7 
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900' 
                    : result.safetyScore > 4
                    ? 'bg-amber-50 border-amber-500 text-amber-900'
                    : 'bg-red-50 border-red-500 text-red-900'
                }`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-bold flex items-center gap-2 text-lg font-serif">
                        {result.safetyScore > 7 ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                        Verdict
                      </span>
                      <span className="text-sm font-black bg-white/80 px-3 py-1 rounded-lg shadow-sm border border-black/5">
                        {result.safetyScore}/10
                      </span>
                    </div>
                    
                    <p className="text-sm font-medium leading-relaxed mb-4 opacity-90">{result.summary}</p>
                    
                    {result.foundAllergens && result.foundAllergens.length > 0 && (
                      <div className="pt-4 border-t border-black/5">
                        <span className="text-[10px] uppercase font-black tracking-widest opacity-60 block mb-3">Detected Risks</span>
                        <div className="flex flex-wrap gap-2">
                          {result.foundAllergens.map((item, idx) => (
                            <span key={idx} className="text-xs font-bold px-3 py-1.5 bg-white/90 rounded-lg border border-black/5 shadow-sm">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* Highlighted Ingredients Text */}
                {result.ingredientsText && (
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                       <FileText size={16} className="text-slate-400" />
                       <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Read from Label</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      {highlightIngredients(result.ingredientsText, result.foundAllergens)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};