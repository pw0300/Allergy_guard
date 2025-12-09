import React, { useState } from 'react';
import { Search, Sparkles, ChefHat, ArrowRight, Activity, UtensilsCrossed, Globe, ExternalLink, Clock, RotateCcw } from 'lucide-react';
import { AnalysisResult, HealthProfile, IntoleranceItem, MealPlan, HistoryItem } from '../types';
import { analyzeFoodSafety, generateMealPlan } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

interface FoodAnalyzerProps {
  profile: {
    intolerances: IntoleranceItem[];
    health: HealthProfile;
  };
  onAnalysisComplete: (item: HistoryItem) => void;
  history: HistoryItem[];
}

export const FoodAnalyzer: React.FC<FoodAnalyzerProps> = ({ profile, onAnalysisComplete, history }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'analyze' | 'plan'>('analyze');

  const handleCheck = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setMealPlan(null);
    try {
      const data = await analyzeFoodSafety(query, profile.intolerances, profile.health);
      setResult(data);
      
      onAnalysisComplete({
        id: Date.now().toString(),
        type: 'search',
        query: query,
        timestamp: Date.now(),
        safetyScore: data.safetyScore,
        summary: data.summary
      });

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (item: HistoryItem) => {
    setQuery(item.query);
    // Optionally trigger analysis immediately or just pre-fill
  };

  const handleGeneratePlan = async () => {
    setLoading(true);
    setResult(null);
    setMealPlan(null);
    try {
      const safeFoods = profile.intolerances
        .filter(i => i.level === 'normal')
        .map(i => i.food);
      
      const plan = await generateMealPlan(safeFoods, profile.health);
      setMealPlan(plan);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderScoreGauge = (score: number) => {
    const r = 40;
    const c = 2 * Math.PI * r;
    const offset = c - (score / 10) * c;
    
    let color = 'text-red-500';
    let label = 'Unsafe';
    let bg = 'bg-red-50';
    
    if (score >= 8) { 
      color = 'text-emerald-500'; 
      label = 'Safe'; 
      bg = 'bg-emerald-50';
    } else if (score >= 5) { 
      color = 'text-amber-500'; 
      label = 'Caution'; 
      bg = 'bg-amber-50';
    }

    return (
      <div className={`relative flex items-center justify-center w-32 h-32 rounded-full ${bg} transition-colors duration-500`}>
        <svg className="transform -rotate-90 w-32 h-32">
          <circle cx="64" cy="64" r={r} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-black/5" />
          <circle cx="64" cy="64" r={r} stroke="currentColor" strokeWidth="6" fill="transparent" 
            strokeDasharray={c} 
            strokeDashoffset={offset} 
            strokeLinecap="round"
            className={`${color} transition-all duration-1000 ease-out`} 
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-4xl font-bold font-serif ${color}`}>{score}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">{label}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white overflow-hidden min-h-auto md:min-h-[600px] flex flex-col relative z-20">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-100 bg-slate-50/50">
        <button 
          onClick={() => setActiveTab('analyze')}
          className={`flex-1 py-5 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'analyze' 
            ? 'text-teal-600 bg-white border-b-2 border-teal-500 shadow-sm' 
            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
          }`}
        >
          <Activity size={18} /> Instant Analysis
        </button>
        <button 
          onClick={() => setActiveTab('plan')}
          className={`flex-1 py-5 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'plan' 
            ? 'text-teal-600 bg-white border-b-2 border-teal-500 shadow-sm' 
            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
          }`}
        >
          <UtensilsCrossed size={18} /> Meal Planner
        </button>
      </div>

      <div className="p-4 sm:p-6 md:p-8 flex-1 flex flex-col">
        {activeTab === 'analyze' ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight font-serif">What's on your plate?</h2>
              <p className="text-slate-500 font-medium">Real-time AI analysis powered by Google Search.</p>
            </div>

            {/* Hero Search Bar */}
            <div className="relative max-w-2xl mx-auto w-full mb-6 group z-30">
              <div className={`absolute -inset-1 bg-gradient-to-r from-teal-400 to-indigo-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-500 ${loading ? 'animate-pulse opacity-50' : ''}`}></div>
              <div className="relative flex bg-white rounded-2xl shadow-xl shadow-slate-200/50 items-center overflow-hidden">
                <div className="pl-5 text-slate-400">
                  <Search size={24} />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                  placeholder="e.g. Starbucks Oat Milk Latte..."
                  className="flex-1 px-4 py-4 text-lg font-medium outline-none text-slate-800 placeholder:text-slate-300 bg-transparent min-w-0 font-serif"
                />
                <div className="p-2">
                  <button 
                    onClick={handleCheck}
                    disabled={loading || !query.trim()}
                    className="bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-xl transition-all active:scale-95 disabled:opacity-80 disabled:active:scale-100 disabled:cursor-not-allowed shadow-lg flex items-center justify-center w-12 h-12"
                  >
                    {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" /> : <ArrowRight size={20} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Recent History Chips */}
            {!result && history.length > 0 && (
               <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-2xl mx-auto">
                 {history.slice(0, 3).map((item) => (
                    <button 
                      key={item.id} 
                      onClick={() => handleHistoryClick(item)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-full text-xs font-semibold text-slate-500 hover:text-teal-600 transition-all"
                    >
                      <RotateCcw size={12} /> {item.query}
                    </button>
                 ))}
               </div>
            )}

            {/* Results Area */}
            <div className="flex-1">
              {result ? (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-lg shadow-slate-200/50 flex flex-col gap-8">
                    
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                      {/* Gauge Section */}
                      <div className="flex flex-col items-center gap-4 min-w-[140px] mx-auto md:mx-0">
                        {renderScoreGauge(result.safetyScore)}
                        <span className="text-xs font-semibold text-slate-400 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                          AI Confidence: High
                        </span>
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 space-y-5 w-full">
                        <div>
                          <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2 font-serif">
                            Analysis Report
                            <span className="bg-teal-50 text-teal-700 text-[10px] px-2 py-0.5 rounded-full border border-teal-100 uppercase tracking-wide font-sans">Live Data</span>
                          </h3>
                          <div className="prose prose-slate prose-sm text-slate-600 leading-relaxed max-w-none font-sans">
                              <ReactMarkdown>{result.summary}</ReactMarkdown>
                          </div>
                        </div>

                        {/* Triggers & Notes Grid */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          {/* Triggers */}
                          <div className={`rounded-2xl p-4 border ${result.foundAllergens && result.foundAllergens.length > 0 ? 'bg-red-50/50 border-red-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                              <h4 className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide mb-3 ${result.foundAllergens && result.foundAllergens.length > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                                <Sparkles size={14} className="stroke-[2.5px]" /> 
                                {result.foundAllergens && result.foundAllergens.length > 0 ? 'Detected Triggers' : 'Allergen Check'}
                              </h4>
                              {result.foundAllergens && result.foundAllergens.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {result.foundAllergens.map((a, i) => (
                                    <span key={i} className="px-2.5 py-1.5 bg-white border border-red-100 text-red-700 text-xs font-bold rounded-lg shadow-sm">
                                      {a}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-sm font-medium text-emerald-800">No profile triggers found.</span>
                              )}
                          </div>

                          {/* Health Note */}
                          {result.healthNote && (
                            <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100">
                              <h4 className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wide mb-3">
                                <Activity size={14} className="stroke-[2.5px]" /> Health Insight
                              </h4>
                              <p className="text-sm text-indigo-900 leading-snug">"{result.healthNote}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Grounding Sources */}
                    {result.webSources && result.webSources.length > 0 && (
                      <div className="pt-6 border-t border-slate-100">
                         <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                           <Globe size={14} /> Verified Sources
                         </h4>
                         <div className="flex flex-wrap gap-2">
                            {result.webSources.map((source, idx) => (
                              <a 
                                key={idx} 
                                href={source.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:text-teal-600 transition-colors group"
                              >
                                <span className="max-w-[150px] truncate">{source.title}</span>
                                <ExternalLink size={10} className="opacity-50 group-hover:opacity-100" />
                              </a>
                            ))}
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                !loading && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60 py-12 md:py-0">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <Search size={32} className="text-slate-200" />
                    </div>
                    <p className="font-semibold text-lg">Search any dish or food item</p>
                    <p className="text-sm">We'll check ingredients against your profile</p>
                  </div>
                )
              )}
            </div>
          </>
        ) : (
          <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
             <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-2 font-serif">Safe Meal Planner</h2>
              <p className="text-slate-500 font-medium">Generate a custom day plan based on your <strong className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">{profile.intolerances.filter(i => i.level === 'normal').length}</strong> safe foods.</p>
            </div>

            {!mealPlan ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 md:py-0">
                 <button 
                  onClick={handleGeneratePlan}
                  disabled={loading}
                  className="group relative inline-flex items-center justify-center px-8 py-5 font-bold text-white transition-all duration-200 bg-slate-900 text-lg rounded-2xl hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1 focus:outline-none ring-offset-2 focus:ring-2 ring-slate-900"
                >
                  {loading ? (
                    <span className="flex items-center gap-3">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Curating Menu...
                    </span>
                  ) : (
                    <span className="flex items-center gap-3">
                      <ChefHat size={24} /> Generate Today's Plan
                    </span>
                  )}
                </button>
                <p className="mt-6 text-xs font-medium text-slate-400 uppercase tracking-widest text-center">
                  Tailored for {profile.health.preference} Diet
                </p>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 grid md:grid-cols-3 gap-6">
                {['breakfast', 'lunch', 'dinner'].map((meal, idx) => (
                  <div key={meal} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 transition-all relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-50 to-transparent rounded-bl-[100px] -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                     <h4 className="text-xs font-black uppercase tracking-widest text-teal-600 mb-4">{meal}</h4>
                     <p className="font-medium text-slate-800 leading-relaxed text-lg">
                       {/* @ts-ignore */}
                       {mealPlan[meal]}
                     </p>
                  </div>
                ))}
                <div className="md:col-span-3 mt-4 bg-indigo-50 p-6 rounded-3xl border border-indigo-100 text-center relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-200"></div>
                  <p className="text-indigo-900 font-medium italic relative z-10">"{mealPlan.explanation}"</p>
                  <button onClick={() => setMealPlan(null)} className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline relative z-10">
                    Generate New Plan
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};