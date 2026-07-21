import React from 'react';
import { DisplayApp } from './src/app/DisplayApp';

/// Web entry (served by the box): the full customer-facing display app.
/// The native entry (App.tsx) is instead a WebView kiosk that loads THIS web
/// build from the box — so Metro must build DisplayApp for web, not the wrapper.
export default function App() {
  return <DisplayApp />;
}
