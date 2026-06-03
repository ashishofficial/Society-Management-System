import { apiRequest } from './apiClient';

export async function listMembersApi() {
  const res = await apiRequest('/members');
  return res.data || [];
}

export async function createMemberApi(payload) {
  const res = await apiRequest('/members', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function createMemberLoginApi(id, password) {
  const res = await apiRequest(`/members/${id}/login`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  return res.data;
}

export async function updateMemberApi(id, payload) {
  const res = await apiRequest(`/members/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function deleteMemberApi(id) {
  await apiRequest(`/members/${id}`, { method: 'DELETE' });
}
