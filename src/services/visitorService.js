import { apiRequest } from './apiClient';

export async function listVisitorsApi() {
  const res = await apiRequest('/visitors');
  return res.data || [];
}

export async function createVisitorApi(payload) {
  const res = await apiRequest('/visitors', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateVisitorStatusApi(id, status) {
  const res = await apiRequest(`/visitors/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return res.data;
}

export async function deleteVisitorApi(id) {
  await apiRequest(`/visitors/${id}`, { method: 'DELETE' });
}
