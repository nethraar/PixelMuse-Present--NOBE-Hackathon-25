import { Project, Asset, SessionScore } from './types';

export const SEED_PROJECTS: Project[] = [
  {
    id: 'demo-1',
    title: 'Biology Final Presentation',
    category: 'school',
    platform: 'google-slides',
    mode: 'professional',
    style: 'academic',
    createdAt: '2026-04-14',
    updatedAt: '2026-04-17',
    progressStatus: { cover: true, diagram: false, divider: false, extras: false },
  },
  {
    id: 'demo-2',
    title: 'Group Chat Birthday Meme Pack',
    category: 'casual',
    platform: null,
    mode: 'personal',
    style: 'fun',
    createdAt: '2026-04-16',
    updatedAt: '2026-04-16',
    progressStatus: { cover: true, diagram: false, divider: false, extras: false },
  },
];

export const SEED_ASSETS: Asset[] = [
  {
    id: 'a1',
    projectId: 'demo-1',
    url: 'https://placehold.co/400x300/1e3a5f/ffffff?text=Cell+Division+Diagram',
    prompt: 'Clean minimalist cell division diagram, blue and white, academic style',
    mode: 'professional',
    createdAt: '2026-04-14',
    promptScore: { specificity: 78, style: 71, context: 85, overall: 78, tip: 'Try adding a color temperature directive to push above 85.' },
  },
  {
    id: 'a2',
    projectId: 'demo-1',
    url: 'https://placehold.co/400x300/2d5a8e/ffffff?text=Title+Slide+Background',
    prompt: 'Title slide background, biology theme, minimal',
    mode: 'professional',
    createdAt: '2026-04-14',
    promptScore: { specificity: 55, style: 40, context: 72, overall: 56, tip: "Add a visual style and palette — e.g. 'muted teal, flat design' — to improve specificity." },
  },
  {
    id: 'a3',
    projectId: 'demo-2',
    url: 'https://placehold.co/400x300/f59e0b/ffffff?text=Birthday+Meme',
    prompt: 'Funny birthday celebration meme, bright colors, cartoon style',
    mode: 'personal',
    createdAt: '2026-04-16',
    promptScore: { specificity: 65, style: 80, context: 60, overall: 68, tip: 'Add a specific character or scene to boost specificity above 80.' },
  },
];

export const SEED_SESSIONS: SessionScore[] = [
  { session: 1, date: '2026-04-14', avgScore: 42 },
  { session: 2, date: '2026-04-15', avgScore: 58 },
  { session: 3, date: '2026-04-17', avgScore: 67 },
];
