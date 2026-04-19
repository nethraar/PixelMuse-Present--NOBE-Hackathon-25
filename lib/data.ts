'use client';

import { Project, Asset, SessionScore } from './types';
import { SEED_PROJECTS, SEED_ASSETS, SEED_SESSIONS } from './seed';

const KEYS = {
  projects: 'pm_projects',
  assets: 'pm_assets',
  sessions: 'pm_sessions',
  seeded: 'pm_seeded',
};

function seed() {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(KEYS.seeded)) return;
  localStorage.setItem(KEYS.projects, JSON.stringify(SEED_PROJECTS));
  localStorage.setItem(KEYS.assets, JSON.stringify(SEED_ASSETS));
  localStorage.setItem(KEYS.sessions, JSON.stringify(SEED_SESSIONS));
  localStorage.setItem(KEYS.seeded, 'true');
}

export function initData() { seed(); }

export function getProjects(): Project[] {
  seed();
  return JSON.parse(localStorage.getItem(KEYS.projects) || '[]');
}

export function getProject(id: string): Project | null {
  return getProjects().find(p => p.id === id) ?? null;
}

export function saveProject(project: Project) {
  const projects = getProjects();
  const idx = projects.findIndex(p => p.id === project.id);
  if (idx >= 0) projects[idx] = project;
  else projects.unshift(project);
  localStorage.setItem(KEYS.projects, JSON.stringify(projects));
}

export function createProject(project: Project) {
  const projects = getProjects();
  projects.unshift(project);
  localStorage.setItem(KEYS.projects, JSON.stringify(projects));
}

export function getAssets(projectId: string): Asset[] {
  const all: Asset[] = JSON.parse(localStorage.getItem(KEYS.assets) || '[]');
  return all.filter(a => a.projectId === projectId);
}

export function saveAsset(asset: Asset) {
  const all: Asset[] = JSON.parse(localStorage.getItem(KEYS.assets) || '[]');
  all.unshift(asset);
  localStorage.setItem(KEYS.assets, JSON.stringify(all));
}

export function getSessions(): SessionScore[] {
  seed();
  return JSON.parse(localStorage.getItem(KEYS.sessions) || '[]');
}

export function addSession(avgScore: number) {
  const sessions = getSessions();
  sessions.push({ session: sessions.length + 1, date: new Date().toISOString().split('T')[0], avgScore });
  localStorage.setItem(KEYS.sessions, JSON.stringify(sessions));
}
