/** URL base do site em produção (override via EXPO_PUBLIC_WEB_URL). */
export const WEB_BASE_URL =
  process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '') ?? 'https://judgetcg.com.br';

export const WEB_ROUTES = {
  judge: '/judge',
  communities: '/social/communities',
  tournaments: '/search',
  profile: '/player/me',
} as const;

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? WEB_BASE_URL;
