import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { buildAuthInjectScript, loadSession } from '../lib/auth-inject';
import { handleWebViewMessage } from '../lib/offline-cache';
import { WEB_BASE_URL } from '../lib/config';
import { colors } from '../app/theme';

type Props = {
  path: string;
};

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

export function WebViewScreen({ path }: Props) {
  const webRef = useRef<WebView>(null);
  const [authScript, setAuthScript] = useState('true;');
  const uri = `${WEB_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  useEffect(() => {
    void loadSession().then((session) => {
      setAuthScript(buildAuthInjectScript(session, SUPABASE_URL));
    });
  }, []);

  const onMessage = (event: WebViewMessageEvent) => {
    void handleWebViewMessage(event.nativeEvent.data);
  };

  return (
    <View style={styles.root}>
      <WebView
        ref={webRef}
        source={{ uri }}
        style={styles.web}
        injectedJavaScriptBeforeContentLoaded={authScript}
        onMessage={onMessage}
        allowsBackForwardNavigationGestures
        sharedCookiesEnabled
        thirdPartyCookiesEnabled={Platform.OS === 'android'}
        setSupportMultipleWindows={false}
        pullToRefreshEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.gold} size="large" />
          </View>
        )}
        applicationNameForUserAgent="JudgeTCGApp"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  web: { flex: 1, backgroundColor: colors.bg },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
