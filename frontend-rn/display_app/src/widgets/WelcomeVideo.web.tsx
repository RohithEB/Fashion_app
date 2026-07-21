import React, { useEffect, useRef } from 'react';

/// Web build of WelcomeVideo. Renders a raw HTML5 <video> with the inline
/// `muted`/`autoplay`/`playsinline` attributes that Android System WebView
/// reliably autoplays — expo-video's player sets `muted` asynchronously, which
/// the WebView's autoplay gate rejects, leaving the surface blank. Metro picks
/// this `.web.tsx` for the web bundle; native keeps the expo-video version.
export function WelcomeVideo({ url }: { url: string }) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = ref.current;
    if (v == null) return;
    v.muted = true;
    const tryPlay = () => v.play().catch(() => {});
    tryPlay();
    v.addEventListener('canplay', tryPlay);
    return () => v.removeEventListener('canplay', tryPlay);
  }, [url]);

  return React.createElement('video', {
    ref,
    src: url,
    autoPlay: true,
    muted: true,
    loop: true,
    playsInline: true,
    preload: 'auto',
    // Older WebViews honour the hyphenated attribute:
    'webkit-playsinline': 'true',
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      backgroundColor: '#171614',
      display: 'block',
    },
  });
}
