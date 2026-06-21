/**
 * Firebase Cloud Messaging — requer variáveis NEXT_PUBLIC_FIREBASE_* no .env
 * Ver docs/DEPLOYMENT.md
 */

type FirebaseConfig = {
  apiKey: string;
  projectId: string;
  messagingSenderId: string;
  appId: string;
};

function getConfig(): FirebaseConfig | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  if (!apiKey || !projectId || !messagingSenderId || !appId) return null;
  return { apiKey, projectId, messagingSenderId, appId };
}

export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const config = getConfig();
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!config || !vapidKey) return null;

  try {
    const { initializeApp } = await import("firebase/app");
    const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
    if (!(await isSupported())) return null;

    const app = initializeApp(config);
    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const token = await getToken(messaging, { vapidKey });
    if (token) {
      await fetch("/api/notifications/fcm-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }).catch(() => undefined);
    }
    return token;
  } catch {
    return null;
  }
}

export async function onForegroundMessage(callback: (payload: unknown) => void): Promise<void> {
  if (typeof window === "undefined") return;
  const config = getConfig();
  if (!config) return;

  try {
    const { initializeApp, getApps } = await import("firebase/app");
    const { getMessaging, onMessage, isSupported } = await import("firebase/messaging");
    if (!(await isSupported())) return;

    const app = getApps()[0] ?? initializeApp(config);
    const messaging = getMessaging(app);
    onMessage(messaging, callback);
  } catch {
    // FCM não configurado
  }
}
