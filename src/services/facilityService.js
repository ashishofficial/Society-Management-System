import { apiRequest } from './apiClient';

export async function listFacilitiesApi() {
  const res = await apiRequest('/facilities');
  return res.data || [];
}

export async function listFacilityBookingsApi() {
  const res = await apiRequest('/facilities/bookings');
  return res.data || [];
}

export async function createFacilityBookingApi(payload) {
  const res = await apiRequest('/facilities/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateFacilityBookingStatusApi(id, status) {
  const res = await apiRequest(`/facilities/bookings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return res.data;
}
