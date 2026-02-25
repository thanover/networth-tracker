const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error('Unable to reach the server. Please check your connection and try again.');
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('The server is temporarily unavailable. Please try again in a moment.');
  }

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
    let res;
    try {
      res = await fetch(`${BASE}${path}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      throw new Error('Unable to reach the server. Please check your connection and try again.');
    }
    if (!res.ok) {
      let data;
      try { data = await res.json(); } catch { data = {}; }
      throw new Error(data.error || 'The server is temporarily unavailable. Please try again in a moment.');
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
