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
  post:  (path, body) => request(path, { method: 'POST',  body: JSON.stringify(body) }),
  get:   (path)       => request(path, { method: 'GET' }),
  put:   (path, body) => request(path, { method: 'PUT',   body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del:   (path)       => request(path, { method: 'DELETE' }),

  download: async (path, filename) => {
    const token = getToken();
    const res = await fetch(`${BASE}${path}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};
