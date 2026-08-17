import type { CSSProperties } from 'react'

const API = import.meta.env.VITE_CWM_API_BASE || 'http://127.0.0.1:8787'

export function isWorkspaceId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function readWorkspaceId(): string {
  const v = localStorage.getItem('cwm_workspace') || ''
  return isWorkspaceId(v) ? v : ''
}

export async function apiJson(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data as Record<string, unknown>
}

export const studioShell: CSSProperties = {
  maxWidth: 880,
  margin: '0 auto',
  padding: '2rem 1.25rem 4rem',
  fontFamily: 'IBM Plex Sans, sans-serif',
  color: '#0e1a24',
}
