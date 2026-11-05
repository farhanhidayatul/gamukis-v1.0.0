/**
 * In-Game Anomaly Telemetry & Admin Resolution API Client
 * Layer 1 Client Telemetry + Layer 2/3 Admin Confirmation Hub
 */
const BASE_URL = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace(/\/api\/?$/, '')
  : 'http://localhost:5000';

let lastReportTimestamp = 0;
const REPORT_THROTTLE_MS = 10000;

/**
 * Report an inGame client anomaly to the backend watchdog (Layer 1).
 * Debounced to maximum 1 report per 10s to prevent spamming.
 */
export async function reportInGameAnomaly(payload = {}) {
  const now = Date.now();
  if (now - lastReportTimestamp < REPORT_THROTTLE_MS) {
    return { throttled: true };
  }
  lastReportTimestamp = now;

  try {
    const res = await fetch(`${BASE_URL}/api/telemetry/ingame-anomaly`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...payload,
        clientReportedAt: now
      })
    });

    if (!res.ok) return { ok: false };
    return await res.json();
  } catch (err) {
    // Fail-open: telemetry never breaks client gameplay
    return { ok: false, error: err.message };
  }
}

/**
 * Fetch active unresolved anomalies for Admin Monitoring.
 */
export async function getAdminAnomalies(token, filter = {}) {
  const query = new URLSearchParams(filter).toString();
  const url = `${BASE_URL}/api/admin/anomalies${query ? `?${query}` : ''}`;

  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: 'GET',
    headers,
    credentials: 'include'
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch anomalies (${res.status})`);
  }
  return await res.json();
}

/**
 * Confirm and resolve an anomaly in Admin Monitoring.
 */
export async function resolveAdminAnomaly(token, anomalyId, action = 'acknowledge') {
  const url = `${BASE_URL}/api/admin/anomalies/${anomalyId}/resolve`;

  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ action })
  });

  if (!res.ok) {
    throw new Error(`Failed to resolve anomaly (${res.status})`);
  }
  return await res.json();
}
