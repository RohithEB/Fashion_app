import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useDeps } from '../../app/providers';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/// Logs the associate out after 5 min of no touch input on the controller. On
/// timeout it first closes the session (display returns to idle + QR), then
/// signs the associate out (the route guard returns to the login screen).
export function IdleSessionWatcher({ children }: { children: React.ReactNode }) {
  const { connection, auth } = useDeps();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const restart = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (connection.isConnected) await connection.endSession();
      if (auth.isAuthenticated) await auth.logout();
    }, IDLE_TIMEOUT_MS);
  };

  useEffect(() => {
    restart();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1 }} onTouchStart={restart} onStartShouldSetResponderCapture={() => { restart(); return false; }}>
      {children}
    </View>
  );
}
