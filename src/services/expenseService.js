import { apiRequest } from './apiClient';

export async function listExpensesApi(month) {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  const res = await apiRequest(`/expenses${query}`);
  return res.data || [];
}

export async function createExpenseApi(payload) {
  const res = await apiRequest('/expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function deleteExpenseApi(id) {
  await apiRequest(`/expenses/${id}`, { method: 'DELETE' });
}
