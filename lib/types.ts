export type Mode = 'professional' | 'personal';
export type Category = 'school' | 'club' | 'internship' | 'casual';
export type Platform = 'google-slides' | 'powerpoint' | null;
export type Style = 'minimal' | 'corporate' | 'academic' | 'fun' | 'meme';

export interface PromptScore {
  specificity: number;
  style: number;
  context: number;
  overall: number;
  tip: string;
}

export interface Asset {
  id: string;
  projectId: string;
  url: string;
  prompt: string;
  mode: Mode;
  createdAt: string;
  promptScore: PromptScore;
}

export interface ProgressStatus {
  cover: boolean;
  diagram: boolean;
  divider: boolean;
  extras: boolean;
}

export interface Project {
  id: string;
  title: string;
  category: Category;
  platform: Platform;
  mode: Mode;
  style: Style;
  createdAt: string;
  updatedAt: string;
  progressStatus: ProgressStatus;
}

export interface SessionScore {
  session: number;
  date: string;
  avgScore: number;
}
