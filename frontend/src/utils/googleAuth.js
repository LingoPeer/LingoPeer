let loadPromise = null;
let initPromise = null;

export function loadGoogleScript() {
  if (document.getElementById('google-identity-script')) {
    return loadPromise ?? Promise.resolve();
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Identity Services failed to load'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function initGoogleAuth(clientId, callback) {
  if (!initPromise) {
    initPromise = loadGoogleScript().then(() => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback,
          auto_select: false,
        });
      }
    });
  } else {
    // Already initialized; just ensure callback is fresh by re-initializing
    // Google allows re-initialize to update the callback
    loadGoogleScript().then(() => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback,
          auto_select: false,
        });
      }
    });
  }
  return initPromise;
}

export function renderGoogleButton(container, options) {
  if (!window.google?.accounts?.id || !container) return false;
  window.google.accounts.id.renderButton(container, options);
  return true;
}
