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
        left: 8,
        bottom: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: isWeb ? 'rgba(91,158,120,0.92)' : 'rgba(0,0,0,0.6)',
      }}
    >
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
        {`${label}  ·  ${mode}`}
      </Text>
    </View>
  );
}
