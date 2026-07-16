import os from 'node:os';

// Best-effort LAN IPv4 so the QR encodes a URL other devices on the WiFi can reach.
export function lanIp() {
  const ifaces = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(ifaces)) {
    for (const net of ifaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) candidates.push(net.address);
    }
  }
  // Prefer common private ranges (192.168.x, 10.x) over anything else.
  const preferred = candidates.find((a) => a.startsWith('192.168.') || a.startsWith('10.'));
  return preferred || candidates[0] || '127.0.0.1';
}
