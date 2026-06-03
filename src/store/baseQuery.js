import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { isLiveMode } from '../config/appMode';
import { getCurrentMonth } from '../utils/formatDate';
import * as demo from '../services/demoBackend';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Live HTTP query: attaches the bearer token (same auth as the old apiClient).
const httpBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('auth_token');
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

// Demo query: emulates the backend with the in-memory demoBackend store so RTK Query works
// offline (VITE_APP_MODE !== 'live') exactly like the live API.
function demoBaseQuery(args) {
  const url = typeof args === 'string' ? args : args.url;
  const method = ((typeof args === 'object' && args.method) || 'GET').toUpperCase();
  const body = typeof args === 'object' ? args.body : undefined;

  try {
    // --- Complaints ---
    if (url === '/complaints' && method === 'GET') {
      return { data: demo.list('complaints') };
    }
    if (url === '/complaints' && method === 'POST') {
      const created = demo.create(
        'complaints',
        { ...body, status: 'open', escalated: false, assignedTo: 'RWA Committee', date: `${getCurrentMonth()}-15` },
        'cmp',
      );
      return { data: created };
    }
    const statusMatch = url.match(/^\/complaints\/(.+)\/status$/);
    if (statusMatch && method === 'PATCH') {
      const patch = { status: body.status };
      if (body.status === 'resolved' || body.status === 'closed') patch.resolvedDate = `${getCurrentMonth()}-15`;
      return { data: demo.update('complaints', statusMatch[1], patch) };
    }
    const idMatch = url.match(/^\/complaints\/(.+)$/);
    if (idMatch && method === 'DELETE') {
      demo.remove('complaints', idMatch[1]);
      return { data: null };
    }

    return { error: { status: 404, data: { message: `Demo route not handled: ${method} ${url}` } } };
  } catch (e) {
    return { error: { status: 500, data: { message: e.message } } };
  }
}

// Single entry point used by the RTK Query api slice.
export async function baseQuery(args, api, extraOptions) {
  if (!isLiveMode) return demoBaseQuery(args);
  return httpBaseQuery(args, api, extraOptions);
}
