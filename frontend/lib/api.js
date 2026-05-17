const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const TOKEN_KEY = 'gtna_token';
export const USER_KEY  = 'gtna_user';
export const AUTH_EXPIRED_EVENT = 'gtna:auth-expired';

function readToken() {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

function clearAuthStorage() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {}
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = readToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    cache: 'no-store',
    ...options,
  });

  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      clearAuthStorage();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      }
    }
    const err = new Error(body.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.details = body.details;
    throw err;
  }
  return body;
}

export const api = {
  listJobs(params = {}) {
    const q = new URLSearchParams();
    if (params.category) q.set('category', params.category);
    if (params.status)   q.set('status', params.status);
    if (params.q)        q.set('q', params.q);
    const qs = q.toString();
    return request(`/api/jobs${qs ? `?${qs}` : ''}`);
  },
  getJob(id)              { return request(`/api/jobs/${id}`); },
  createJob(payload)      { return request('/api/jobs', { method: 'POST', body: JSON.stringify(payload) }); },
  updateStatus(id, status){ return request(`/api/jobs/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); },
  deleteJob(id)           { return request(`/api/jobs/${id}`, { method: 'DELETE' }); },

  auth: {
    register(payload) { return request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }); },
    login(payload)    { return request('/api/auth/login',    { method: 'POST', body: JSON.stringify(payload) }); },
    me()              { return request('/api/auth/me'); },
  },
};
