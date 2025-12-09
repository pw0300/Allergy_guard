
import React, { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { Onboarding } from './components/Onboarding';
import { ProfileCard } from './components/ProfileCard';
import { FoodAnalyzer } from './components/FoodAnalyzer';
import { LabelScanner } from './components/LabelScanner';
import { UserProfile, IntoleranceItem, HealthProfile, IntoleranceLevel, HistoryItem } from './types';
import { getProfile, saveProfile, clearProfile } from './services/storage';

export default function App() {
  // Lazy initialization: Read from storage immediately on mount
  const [profile, setProfile] = useState<UserProfile>(() => getProfile());

  // Persistence Effect: Automatically save to localStorage whenever profile changes
  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  const handleOnboardingComplete = (health: HealthProfile, intolerances: IntoleranceItem[]) => {
    setProfile(prev => ({
      ...prev,
      health,
      intolerances,
      isOnboarded: true
    }));
  };

  const handleAddIntolerance = (food: string, level: IntoleranceLevel) => {
    const newItem: IntoleranceItem = {
      id: Date.now().toString(),
      food,
      level
    };
    setProfile(prev => ({
      ...prev,
      intolerances: [...prev.intolerances, newItem]
    }));
  };

  const handleRemoveIntolerance = (id: string) => {
    setProfile(prev => ({
      ...prev,
      intolerances: prev.intolerances.filter(i => i.id !== id)
    }));
  };

  const addToHistory = (item: HistoryItem) => {
    setProfile(prev => ({
      ...prev,
      history: [item, ...(prev.history || [])].slice(0, 20) // Keep last 20
    }));
  };

  const handleLogout = () => {
    clearProfile();
    setProfile({
        intolerances: [],
        health: { condition: 'none', preference: 'balanced' },
        isOnboarded: false,
        history: []
    });
  };

  if (!profile.isOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <Layout onLogout={handleLogout}>
      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 h-full">
        
        {/* Mobile: Profile First (Top), Desktop: Sidebar (Right side or Left side depending on preference, sticking with Left) */}
        <div className="lg:col-span-4 order-1 lg:order-1">
          <div className="lg:sticky lg:top-28 lg:h-[calc(100vh-140px)] h-auto">
            <ProfileCard 
              healthCondition={profile.health.condition}
              intolerances={profile.intolerances} 
              onAdd={handleAddIntolerance}
              onRemove={handleRemoveIntolerance}
            />
          </div>
        </div>

        {/* Tools */}
        <div className="lg:col-span-8 order-2 lg:order-2 space-y-6 lg:space-y-8">
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <FoodAnalyzer profile={profile} onAnalysisComplete={addToHistory} history={profile.history || []} />
          </section>
          
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
             <LabelScanner intolerances={profile.intolerances} onAnalysisComplete={addToHistory} />
          </section>
        </div>
      </div>
    </Layout>
  );
}
