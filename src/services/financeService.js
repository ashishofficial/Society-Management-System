import { apiRequest } from './apiClient';

export const listBudgetsApi = async (financialYear) =>
  (await apiRequest(`/finance/budgets${financialYear ? `?financialYear=${encodeURIComponent(financialYear)}` : ''}`)).data || [];

export const createBudgetApi = async (payload) =>
  (await apiRequest('/finance/budgets', { method: 'POST', body: JSON.stringify(payload) })).data;

export const getBudgetVarianceApi = async (financialYear) =>
  (await apiRequest(`/finance/budgets/variance?financialYear=${encodeURIComponent(financialYear)}`)).data || [];

export const listReconciliationApi = async () => (await apiRequest('/finance/reconciliation')).data || [];
export const createReconciliationApi = async (payload) =>
  (await apiRequest('/finance/reconciliation', { method: 'POST', body: JSON.stringify(payload) })).data;
export const autoMatchReconciliationApi = async () =>
  (await apiRequest('/finance/reconciliation/auto-match', { method: 'POST' })).data;

export const getComplianceSummaryApi = async (month) =>
  (await apiRequest(`/finance/compliance-summary${month ? `?month=${encodeURIComponent(month)}` : ''}`)).data;
