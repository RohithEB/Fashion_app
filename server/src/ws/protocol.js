// WebSocket message-type constants — the frozen contract (see PROTOCOL.md).
// Envelope for every message: { type, sessionId, payload }.

// controller -> server
export const IN = {
  PAIR: 'pair',
  ACTIVITY: 'activity',
  KEEP_ALIVE: 'keep_alive',
  // command messages (relayed to the display, and each counts as activity):
  SHOW_CATALOG: 'show_catalog',
  SHOW_CART: 'show_cart',
  SHOW_PRODUCT: 'show_product',
  SHOW_DETAILS: 'show_details',
  SHOW_RELATED: 'show_related',
  SHOW_MEDIA: 'show_media',
  ZOOM: 'zoom',
  CLEAR: 'clear',
};

// server -> client(s)
export const OUT = {
  DISPLAY_REGISTERED: 'display_registered', // -> display: { displayId, pairingToken, controllerUrl, qrDataUrl }
  PAIRED: 'paired',                          // -> both:    { sessionId, displayId }
  SESSION_WARNING: 'session_warning',        // -> controller: { secondsLeft }
  SESSION_END: 'session_end',                // -> both:    { reason }
  ERROR: 'error',                            // -> sender:  { message }
};

// Command messages the server relays controller -> display.
export const RELAY_TYPES = new Set([
  IN.SHOW_CATALOG, IN.SHOW_CART, IN.SHOW_PRODUCT, IN.SHOW_DETAILS,
  IN.SHOW_RELATED, IN.SHOW_MEDIA, IN.ZOOM, IN.CLEAR,
]);

export function encode(type, sessionId, payload = {}) {
  return JSON.stringify({ type, sessionId: sessionId || null, payload });
}
