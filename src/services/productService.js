import { apiRequest } from './apiClient';

export const getProductSettingsApi = async () => (await apiRequest('/product/settings')).data;
export const updateProductSettingsApi = async (payload) =>
  (await apiRequest('/product/settings', { method: 'PATCH', body: JSON.stringify(payload) })).data;

export const registerDeviceTokenApi = async (payload) =>
  (await apiRequest('/product/device-tokens', { method: 'POST', body: JSON.stringify(payload) })).data;

export const listBackupsApi = async () => (await apiRequest('/product/backups')).data || [];
export const triggerBackupApi = async (payload = {}) =>
  (await apiRequest('/product/backups/trigger', { method: 'POST', body: JSON.stringify(payload) })).data;
