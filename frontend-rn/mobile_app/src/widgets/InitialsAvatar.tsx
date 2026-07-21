import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { withAlpha } from '../theme/colors';

/// A circular avatar showing the initials of [name] (max two letters). Ported
/// from `InitialsAvatar`.
export function InitialsAvatar({ name, radius = 22 }: { name?: string | null; radius?: number }) {
  const { colors } = useTheme();
  const initials = computeInitials(name);
  return (
    <View
      style={{
        width: radius * 2,
        height: radius * 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius,
        backgroundColor: withAlpha(colors.accent, 0.14),
        borderWidth: 1.5,
        borderColor: colors.accent,
      }}
    >
      <Text style={{ color: colors.accent, fontSize: radius * 0.72, fontWeight: '600', letterSpacing: 0.5 }}>
        {initials}
      </Text>
    </View>
  );
}

function computeInitials(name?: string | null): string {
  const source = (name ?? '').trim();
  if (source.length === 0) return '?';
  const parts = source.split(/\s+/).filter((p) => p.length > 0);
  if (parts.length === 1) {
    const p = parts[0];
    return (p.length >= 2 ? p.substring(0, 2) : p.substring(0, 1)).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/// Formats an ISO date string as `12 Mar 1995`. Ported from `formatDate`.
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
