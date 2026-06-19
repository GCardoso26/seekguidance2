import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'tcg_judge_supabase_session';

export type StoredSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
};

export async function saveSession(session: StoredSession): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function loadSession(): Promise<StoredSession | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

/** Injeta sessão Supabase no localStorage do WebView (quando disponível nativamente). */
export function buildAuthInjectScript(session: StoredSession | null, supabaseUrl?: string): string {
  if (!session?.access_token || !supabaseUrl) return 'true;';
  const ref = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] ?? '';
  const storageKey = `sb-${ref}-auth-token`;
  const payload = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    token_type: 'bearer',
  });
  return `
    try {
      localStorage.setItem(${JSON.stringify(storageKey)}, ${JSON.stringify(payload)});
    } catch (e) {}
    true;
  `;
}
