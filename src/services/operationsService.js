import { apiRequest } from './apiClient';

export const listParkingApi = async () => (await apiRequest('/operations/parking')).data || [];
export const createParkingApi = async (payload) => (await apiRequest('/operations/parking', { method: 'POST', body: JSON.stringify(payload) })).data;

export const listStaffApi = async () => (await apiRequest('/operations/staff')).data || [];
export const createStaffApi = async (payload) => (await apiRequest('/operations/staff', { method: 'POST', body: JSON.stringify(payload) })).data;
export const updateStaffAttendanceApi = async (id, payload) =>
  (await apiRequest(`/operations/staff/${id}/attendance`, { method: 'PATCH', body: JSON.stringify(payload) })).data;

export const listParcelsApi = async () => (await apiRequest('/operations/parcels')).data || [];
export const createParcelApi = async (payload) => (await apiRequest('/operations/parcels', { method: 'POST', body: JSON.stringify(payload) })).data;
export const markParcelDeliveredApi = async (id) => (await apiRequest(`/operations/parcels/${id}/delivered`, { method: 'PATCH' })).data;

export const listDocumentsApi = async () => (await apiRequest('/operations/documents')).data || [];
export const createDocumentApi = async (payload) => (await apiRequest('/operations/documents', { method: 'POST', body: JSON.stringify(payload) })).data;

export const listEmergencyAlertsApi = async () => (await apiRequest('/operations/emergency-alerts')).data || [];
export const createEmergencyAlertApi = async (payload) =>
  (await apiRequest('/operations/emergency-alerts', { method: 'POST', body: JSON.stringify(payload) })).data;
export const updateEmergencyStatusApi = async (id, payload) =>
  (await apiRequest(`/operations/emergency-alerts/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) })).data;
