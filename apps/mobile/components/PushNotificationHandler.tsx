import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';

import { registerExpoPushToken, addNotificationResponseListener } from '../lib/push-token';
import { WEB_BASE_URL } from '../lib/config';

/** Registra push Expo e trata deep links / notificações. */
export function PushNotificationHandler() {
  const router = useRouter();

  useEffect(() => {
    void registerExpoPushToken();

    const notifSub = addNotificationResponseListener((path) => {
      if (path.startsWith('/tournament/')) {
        router.push('/(tabs)/tournaments' as never);
      } else if (path.includes('/social')) {
        router.push('/(tabs)/communities' as never);
      } else if (path.includes('/player')) {
        router.push('/(tabs)/profile' as never);
      } else {
        router.push('/(tabs)/judge' as never);
      }
    });

    const linkSub = Linking.addEventListener('url', ({ url }) => {
      const parsed = Linking.parse(url);
      const path = parsed.path ?? '';
      if (path.startsWith('tournament/')) {
        const id = path.replace('tournament/', '').split('/')[0];
        Linking.openURL(`${WEB_BASE_URL}/tournament/${id}`);
      } else if (path.startsWith('judge')) {
        router.push('/(tabs)/judge' as never);
      }
    });

    void Linking.getInitialURL().then((url) => {
      if (!url) return;
      const parsed = Linking.parse(url);
      if (parsed.path?.startsWith('tournament/')) {
        const id = parsed.path.replace('tournament/', '').split('/')[0];
        Linking.openURL(`${WEB_BASE_URL}/tournament/${id}`);
      }
    });

    return () => {
      notifSub.remove();
      linkSub.remove();
    };
  }, [router]);

  return null;
}
