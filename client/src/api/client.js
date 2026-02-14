const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  get:  (path)       => request(path, { method: 'GET' }),
  put:  (path, body) => request(path, { method: 'PUT',  body: JSON.stringify(body) }),
  del:  (path)       => request(path, { method: 'DELETE' }),
};
