/**
 * Raksha-Setu Client-side API Service
 * Attaches JWT Bearer tokens to requests and handles RBAC responses
 */

const TOKEN_KEY = 'raksha_auth_token';
const USER_KEY = 'raksha_auth_user';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Core Fetch Wrapper
 */
async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(endpoint, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const error = new Error(data.error || `HTTP error ${res.status}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    console.warn(`API request to ${endpoint} failed:`, err.message);
    throw err;
  }
}

export const api = {
  // --- Auth Endpoints ---
  async login(credentials) {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data.token && data.user) {
      setStoredToken(data.token);
      setStoredUser(data.user);
    }
    return data;
  },

  async register(registrationData) {
    const data = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(registrationData),
    });
    if (data.token && data.user) {
      setStoredToken(data.token);
      setStoredUser(data.user);
    }
    return data;
  },

  async getMe() {
    return request('/api/auth/me');
  },

  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      clearAuthStorage();
    }
  },

  // --- Disaster Reporting (Citizen / Admin) ---
  async reportDisaster(reportData) {
    return request('/api/disasters/report', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  },

  async getMyReports() {
    return request('/api/disasters/my-reports');
  },

  // --- Disaster Response (Responder / Admin) ---
  async respondToIncident(incidentId, status, note = '') {
    return request('/api/disasters/respond', {
      method: 'POST',
      body: JSON.stringify({ incidentId, status, note }),
    });
  },

  async getIncidents() {
    return request('/api/disasters/incidents');
  },

  // --- Administrative User Management (Admin Only) ---
  async getUsers() {
    return request('/api/users/manage');
  },

  async createUser(userData) {
    return request('/api/users/manage', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async deleteUser(userId) {
    return request(`/api/users/${userId}`, {
      method: 'DELETE',
    });
  },

  async getSystemStats() {
    return request('/api/admin/system-stats');
  },
};
