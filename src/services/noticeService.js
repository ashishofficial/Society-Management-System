import { apiRequest } from './apiClient';

export async function listNoticesApi() {
  const res = await apiRequest('/notices');
  return res.data || [];
}

export async function createNoticeApi(payload) {
  const res = await apiRequest('/notices', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateNoticeApi(id, payload) {
  const res = await apiRequest(`/notices/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function deleteNoticeApi(id) {
  await apiRequest(`/notices/${id}`, { method: 'DELETE' });
}
