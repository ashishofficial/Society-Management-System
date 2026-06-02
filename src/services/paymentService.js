import { apiRequest } from './apiClient';

export async function listPaymentsApi(month) {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  const res = await apiRequest(`/payments${query}`);
  return res.data || [];
}

export async function createPaymentApi(payload) {
  const res = await apiRequest('/payments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function markPaymentPaidApi(id, payload) {
  const res = await apiRequest(`/payments/${id}/mark-paid`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data;
}
