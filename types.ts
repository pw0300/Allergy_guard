
export enum IntoleranceLevel {
  Normal = 'normal',
  Borderline = 'borderline',
  Elevated = 'elevated'
}

export interface IntoleranceItem {
  id: string;
  food: string;
  level: IntoleranceLevel;
}

export interface HealthProfile {
  condition: string;
  preference: string;
}

export interface HistoryItem {
  id: string;
  type: 'scan' | 'search';
  query: string; // The search term or the product name from scan
  timestamp: number;
  safetyScore: number;
  summary: string;
}

export interface UserProfile {
  intolerances: IntoleranceItem[];
  health: HealthProfile;
  isOnboarded: boolean;
  history: HistoryItem[];
}

export interface WebSource {
  title: string;
  uri: string;
}

export interface AnalysisResult {
  safetyScore: number; // 1-10
  glycemicScore?: number; // 1-10
  summary: string;
  foundAllergens: string[];
  ingredientsText?: string; // Full extracted text
  sources?: string[]; // Legacy text sources
  webSources?: WebSource[]; // New structured grounding sources
  healthNote?: string;
  boundingBox?: number[]; // [ymin, xmin, ymax, xmax]
}

export interface MealPlan {
  breakfast: string;
  lunch: string;
  dinner: string;
  explanation: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
