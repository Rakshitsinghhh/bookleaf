const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

async function fetchWithAuth(endpoint, options = {}) {
  let token = null;
  if (typeof window !== 'undefined') {
    const isAdminRequest = options.role === 'admin' || endpoint.startsWith('/admin');
    if (isAdminRequest) {
      token = sessionStorage.getItem('bookleaf_admin_token') ||
              localStorage.getItem('bookleaf_admin_token') ||
              sessionStorage.getItem('bookleaf_token') ||
              localStorage.getItem('bookleaf_token');
    } else {
      token = localStorage.getItem('bookleaf_author_token') ||
              sessionStorage.getItem('bookleaf_author_token') ||
              localStorage.getItem('bookleaf_token');
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  let response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });
  } catch (netErr) {
    const error = new Error(`Connection to BookLeaf API service failed. ${netErr.message || ''}`);
    error.isNetworkError = true;
    error.status = 0;
    throw error;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'API request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  auth: {
    login: (email, password) =>
      fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }),
    adminLogin: (username, password) =>
      fetchWithAuth('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      }),
    authorLogin: (email, password) =>
      fetchWithAuth('/auth/author/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }),
    getMe: () => fetchWithAuth('/auth/me'),
    getTestAccounts: () => fetchWithAuth('/auth/test-accounts')
  },

  books: {
    getMyBooks: (authorId) =>
      fetchWithAuth(`/books/my-books${authorId ? `?author_id=${authorId}` : ''}`),
    getDetail: (id) => fetchWithAuth(`/books/${id}`),
    getAll: () => fetchWithAuth('/books')
  },

  tickets: {
    submit: (ticketData) =>
      fetchWithAuth('/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketData)
      }),
    getMyTickets: (authorId) =>
      fetchWithAuth(`/tickets/my-tickets${authorId ? `?author_id=${authorId}` : ''}`),
    getDetail: (ticketId) => fetchWithAuth(`/tickets/${ticketId}`),
    sendMessage: (ticketId, message, isAiAssisted = false) =>
      fetchWithAuth(`/tickets/${ticketId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message, is_ai_assisted: isAiAssisted })
      }),
    updateStatus: (ticketId, status) =>
      fetchWithAuth(`/tickets/${ticketId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }),
    getAttachmentUrl: (ticketId, download = false) =>
      `${API_URL}/tickets/${ticketId}/attachment${download ? '?download=true' : ''}`
  },

  admin: {
    getTickets: (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.urgent) params.append('urgent', 'true');
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);
      return fetchWithAuth(`/admin/tickets?${params.toString()}`);
    },
    overrideClassification: (ticketId, { category, priority }) =>
      fetchWithAuth(`/admin/tickets/${ticketId}/classification`, {
        method: 'PATCH',
        body: JSON.stringify({ category, priority })
      }),
    regenerateDraft: (ticketId, options = {}) =>
      fetchWithAuth(`/admin/tickets/${ticketId}/regenerate-draft`, {
        method: 'POST',
        role: 'admin',
        body: JSON.stringify(options)
      }),
    assignTicket: (ticketId, assigned_to) =>
      fetchWithAuth(`/admin/tickets/${ticketId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ assigned_to })
      }),
    addInternalNote: (ticketId, note) =>
      fetchWithAuth(`/admin/tickets/${ticketId}/internal-notes`, {
        method: 'POST',
        role: 'admin',
        body: JSON.stringify({ note })
      }),
    sendMessage: (ticketId, message, isAiAssisted = false, status = null) =>
      fetchWithAuth(`/admin/tickets/${ticketId}/messages`, {
        method: 'POST',
        role: 'admin',
        body: JSON.stringify({ message, is_ai_assisted: isAiAssisted, status })
      }),
    updateStatus: (ticketId, status) =>
      fetchWithAuth(`/admin/tickets/${ticketId}/status`, {
        method: 'PATCH',
        role: 'admin',
        body: JSON.stringify({ status })
      }),
    getAnalytics: () => fetchWithAuth('/admin/analytics')
  },

  database: {
    reset: () =>
      fetchWithAuth('/database/reset', {
        method: 'POST'
      })
  }
};
