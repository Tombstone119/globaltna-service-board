const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    cache: 'no-store',
    ...options,
  });
  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
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
};
