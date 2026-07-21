import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

/// Kiosk shell: a full-screen React Native WebView that loads the box-served
/// display web app. The box is the server; this native wrapper just hosts the
/// web view — no browser chrome, no URL bar. Runs on the box, so `localhost` is
/// the box's own Node server (backend mode).
const KIOSK_URL = 'http://localhost:3000/?backend=1';

export default function App() {
  const webRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const retriesRef = useRef(0);

  // On cold boot the server may not be listening yet; retry a few times.
  const onError = useCallback(() => {
    if (retriesRef.current < 20) {
      retriesRef.current += 1;
      setTimeout(() => webRef.current?.reload(), 1500);
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <WebView
        ref={webRef}
        source={{ uri: KIOSK_URL }}
        style={styles.web}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        overScrollMode="never"
        bounces={false}
        setBuiltInZoomControls={false}
        onLoadEnd={() => {
          retriesRef.current = 0;
          setLoading(false);
        }}
        onError={onError}
        onHttpError={onError}
        renderError={() => <View style={styles.web} />}
      />
      {loading && (
        <View style={styles.loader} pointerEvents="none">
          <ActivityIndicator color="#C9A97E" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E0D0C' },
  web: { flex: 1, backgroundColor: '#0E0D0C' },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E0D0C',
  },
});
