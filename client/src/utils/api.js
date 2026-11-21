const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const SAVED_KEY = 'savedCenters';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
};

export const getSavedIds = () => {
  try {
    const ids = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
};

export const setSavedIds = (ids) => {
  localStorage.setItem(SAVED_KEY, JSON.stringify(Array.from(new Set(ids))));
};

/** Store the auth response returned by /api/users/login or /register. */
export const setSession = (data) => {
  if (data?.token) localStorage.setItem(TOKEN_KEY, data.token);
  if (data) localStorage.setItem(USER_KEY, JSON.stringify(data));
  if (Array.isArray(data?.savedCenters)) {
    setSavedIds(data.savedCenters.map((center) =>
      typeof center === 'string' ? center : center._id
    ));
  }
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Saved centres stay on this device so guests do not lose their shortlist.
};

/**
 * Small wrapper around fetch that adds the JWT when available and throws a
 * useful error message from the API response.
 */
export const apiFetch = async (path, options = {}) => {
  const token = getToken();
  const headers = { ...(options.headers || {}) };

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = path.startsWith('http') ? path : `/api${path}`;
  const response = await fetch(url, { ...options, headers });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Some endpoints may return an empty body.
  }

  if (!response.ok) {
    const message =
      data?.error ||
      data?.errors?.[0]?.msg ||
      `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

/** Save or unsave a centre locally, and keep the server in sync when signed in. */
export const toggleSavedCenter = async (centerId) => {
  const current = getSavedIds();
  const wasSaved = current.includes(centerId);
  const next = wasSaved
    ? current.filter((id) => id !== centerId)
    : [...current, centerId];

  setSavedIds(next);

  if (!getToken()) {
    return { isSaved: !wasSaved, ids: next };
  }

  try {
    const result = await apiFetch(`/users/saved/${centerId}`, { method: 'POST' });
    if (Array.isArray(result.saved)) {
      setSavedIds(result.saved.map((id) => (typeof id === 'string' ? id : id._id)));
    }
    return { isSaved: result.isSaved, ids: getSavedIds() };
  } catch (error) {
    // Roll back the optimistic change if the server rejected it.
    setSavedIds(current);
    throw error;
  }
};

/**
 * Merge the signed-in user's saved centres with any saved on this device.
 * This means a guest shortlist is not lost after registering.
 */
export const syncSavedFromServer = async () => {
  if (!getToken()) return getSavedIds();

  try {
    const centers = await apiFetch('/users/saved');
    const serverIds = centers.map((center) =>
      typeof center === 'string' ? center : center._id
    );
    const merged = Array.from(new Set([...serverIds, ...getSavedIds()]));
    setSavedIds(merged);
    return merged;
  } catch {
    return getSavedIds();
  }
};
