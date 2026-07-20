const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let accessToken: string | null = localStorage.getItem('shopmanager.token');

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem('shopmanager.token', token);
  } else {
    localStorage.removeItem('shopmanager.token');
  }
}

export function getAccessToken() {
  return accessToken;
}

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const { accessToken: newToken } = await res.json();
        setAccessToken(newToken);
        return newToken;
      }
      setAccessToken(null);
      return null;
    } catch {
      setAccessToken(null);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function api(path: string, opts: RequestInit = {}): Promise<Response> {
  const headers = new Headers(opts.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (!headers.has('Content-Type') && opts.body) headers.set('Content-Type', 'application/json');

  let res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && accessToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await fetch(`${API_BASE}${path}`, {
        ...opts,
        headers,
        credentials: 'include',
      });
    }
  }

  return res;
}
