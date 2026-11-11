/**
 * googleCloudAuth.js
 * 
 * Direct Google Identity Services (GSI) OAuth 2.0 Integration for Gamukis.
 * Eliminates Firebase Auth MAU billing and dependency.
 */

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '257611845379-hpqrv564tfrkk1210epc73ulobnka4lf.apps.googleusercontent.com';

let gsiScriptLoadedPromise = null;

export const loadGoogleIdentityScript = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (gsiScriptLoadedPromise) return gsiScriptLoadedPromise;

  gsiScriptLoadedPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('google-identity-services-script');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google?.accounts?.id));
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-identity-services-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google.accounts.id);
      } else {
        reject(new Error('Google Identity Services SDK gagal diinisialisasi.'));
      }
    };
    script.onerror = () => reject(new Error('Gagal memuat Google Identity Services script.'));
    document.head.appendChild(script);
  });

  return gsiScriptLoadedPromise;
};

/**
 * Prompts user with native Google Sign-In Popup and resolves with the ID Token (credential).
 * Uses window.google.accounts.id.prompt with explicit fallback to renderButton trigger.
 */
export const promptGoogleSignIn = async () => {
  const gsi = await loadGoogleIdentityScript();

  return new Promise((resolve, reject) => {
    let settled = false;

    try {
      gsi.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (settled) return;
          settled = true;
          if (response?.credential) {
            resolve(response.credential);
          } else {
            reject(new Error('Kredensial Google tidak ditemukan dalam respon.'));
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false
      });

      // Directly create an offscreen Google official button and click it to bypass browser pop-up blockers
      let hiddenContainer = document.getElementById('gsi-hidden-trigger-container');
      if (!hiddenContainer) {
        hiddenContainer = document.createElement('div');
        hiddenContainer.id = 'gsi-hidden-trigger-container';
        hiddenContainer.style.position = 'fixed';
        hiddenContainer.style.top = '-9999px';
        hiddenContainer.style.left = '-9999px';
        hiddenContainer.style.opacity = '0';
        hiddenContainer.style.pointerEvents = 'none';
        document.body.appendChild(hiddenContainer);
      }

      hiddenContainer.innerHTML = '';
      gsi.renderButton(hiddenContainer, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        click_listener: () => {}
      });

      // Find the inner button rendered by Google and trigger click programmatically
      setTimeout(() => {
        const googleBtn = hiddenContainer.querySelector('div[role="button"]') || hiddenContainer.querySelector('button');
        if (googleBtn) {
          googleBtn.click();
        } else {
          // Fallback to gsi.prompt if button wasn't rendered
          gsi.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              if (!settled) {
                settled = true;
                reject(new Error('Jendela login Google tidak dapat ditampilkan. Izinkan pop-up pada browser Anda.'));
              }
            }
          });
        }
      }, 50);

    } catch (err) {
      if (!settled) {
        settled = true;
        reject(err);
      }
    }
  });
};

const resolveApiUrl = () => {
  const envUrl = process.env.REACT_APP_API_URL;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("test") || host.includes("preview") || host.includes("9iuowj595")) {
      return "https://api-test.gamukis.site/api";
    }
    if (envUrl && envUrl.startsWith("http")) {
      return envUrl;
    }
    if (host.endsWith("gamukis.site") || host.includes("vercel.app")) {
      return "https://api.gamukis.site/api";
    }
  }
  return envUrl && envUrl.startsWith("http") ? envUrl : "https://api.gamukis.site/api";
};

/**
 * Sends Google credential (ID Token) to Gamukis Backend to exchange for native session JWT.
 * @param {string} idToken - Google credential JWT
 * @param {'login'|'register'} mode - Action mode ('login' strictly expects registered account; 'register' signs up new user)
 */
export const authenticateWithBackendGoogle = async (idToken, mode = 'login', extra = {}) => {
  const apiUrl = resolveApiUrl().replace(/\/+$/, '');
  const targetEndpoint = `${apiUrl}/auth/google`;
  const payload = {
    idToken,
    mode,
    ...(extra?.role ? { role: extra.role } : {}),
    ...(extra?.fullName ? { fullName: extra.fullName } : {}),
    ...(extra?.subject ? { subject: extra.subject } : {})
  };

  const response = await fetch(targetEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 404 && data?.code === 'USER_NOT_REGISTERED') {
    const notRegisteredError = new Error(data.message || 'Akun Google belum terdaftar.');
    notRegisteredError.code = 'USER_NOT_REGISTERED';
    notRegisteredError.notRegistered = true;
    notRegisteredError.googleData = {
      email: data.email,
      name: data.name,
      picture: data.picture
    };
    throw notRegisteredError;
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Verifikasi login Google di server gagal.');
  }

  return data;
};
