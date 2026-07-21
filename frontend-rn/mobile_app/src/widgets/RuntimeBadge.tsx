import React from 'react';
import { Platform, Text, View } from 'react-native';
import { AppConfig } from '../config/appConfig';

/// A tiny always-on badge showing whether this build is running NATIVE or as a
/// WEB VIEW (react-native-web), plus the backend host + mode. Lets you verify at
/// a glance which surface is on screen. Remove for production.
export function RuntimeBadge() {
  const isWeb = Platform.OS === 'web';
  const label = isWeb ? 'WEB VIEW' : `NATIVE · ${Platform.OS}`;
  const mode = AppConfig.backendMode ? `backend ${AppConfig.backendHost}` : 'offline';
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 6,
        bottom: 6,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: isWeb ? 'rgba(63,122,91,0.92)' : 'rgba(20,18,16,0.82)',
      }}
    >
      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
        {`${label}  ·  ${mode}`}
      </Text>
    </View>
  );
}
