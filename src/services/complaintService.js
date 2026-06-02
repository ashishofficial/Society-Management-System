import { apiRequest } from './apiClient';

export async function listComplaintsApi() {
  const res = await apiRequest('/complaints');
  return res.data || [];
}

export async function createComplaintApi(payload) {
  const res = await apiRequest('/complaints', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateComplaintStatusApi(id, status) {
  const res = await apiRequest(`/complaints/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return res.data;
}

export async function deleteComplaintApi(id) {
  await apiRequest(`/complaints/${id}`, { method: 'DELETE' });
}
