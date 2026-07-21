import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';

/// Curated icon set. Ported from AppIcons (Material Symbols Rounded) onto
/// @expo/vector-icons MaterialIcons — the closest freely-bundled equivalent.
export const AppIcons = {
  // Navigation
  search: 'search',
  home: 'home',
  back: 'arrow-back-ios-new',
  forward: 'arrow-forward-ios',
  close: 'close',
  menu: 'menu',
  more: 'more-horiz',
  chevronDown: 'keyboard-arrow-down',
  // Commerce
  cart: 'shopping-bag',
  add: 'add',
  remove: 'remove',
  delete: 'delete',
  checkout: 'point-of-sale',
  payment: 'credit-card',
  tag: 'sell',
  // Showroom / display control
  showOnScreen: 'cast',
  connected: 'cast-connected',
  qrScan: 'qr-code-scanner',
  qrCode: 'qr-code-2',
  play: 'play-arrow',
  pause: 'pause',
  gallery: 'photo-library',
  video: 'movie',
  palette: 'palette',
  disconnect: 'link-off',
  zoomIn: 'zoom-in',
  sparkle: 'auto-awesome',
  // Feedback
  success: 'check-circle',
  check: 'check',
  warning: 'warning',
  error: 'error',
  info: 'info',
  empty: 'inventory-2',
  // Account
  person: 'person',
  logout: 'logout',
  lock: 'lock',
  visible: 'visibility',
  hidden: 'visibility-off',
  // Attributes
  size: 'straighten',
  favorite: 'favorite',
  filter: 'tune',
} as const;

export type AppIconName = keyof typeof AppIcons;

export function Icon({
  name,
  size = 24,
  color,
}: {
  name: AppIconName;
  size?: number;
  color: string;
}) {
  return <MaterialIcons name={AppIcons[name] as any} size={size} color={color} />;
}
