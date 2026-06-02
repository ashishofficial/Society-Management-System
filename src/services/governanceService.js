import { apiRequest } from './apiClient';

export const listPollsApi = async () => (await apiRequest('/governance/polls')).data || [];
export const createPollApi = async (payload) => (await apiRequest('/governance/polls', { method: 'POST', body: JSON.stringify(payload) })).data;
export const votePollApi = async (id, payload) =>
  (await apiRequest(`/governance/polls/${id}/vote`, { method: 'POST', body: JSON.stringify(payload) })).data;
export const closePollApi = async (id) => (await apiRequest(`/governance/polls/${id}/close`, { method: 'PATCH' })).data;

export const listEventsApi = async () => (await apiRequest('/governance/events')).data || [];
export const createEventApi = async (payload) => (await apiRequest('/governance/events', { method: 'POST', body: JSON.stringify(payload) })).data;
export const rsvpEventApi = async (id, payload) =>
  (await apiRequest(`/governance/events/${id}/rsvp`, { method: 'POST', body: JSON.stringify(payload) })).data;

export const listAnnouncementsApi = async () => (await apiRequest('/governance/announcements')).data || [];
export const createAnnouncementApi = async (payload) =>
  (await apiRequest('/governance/announcements', { method: 'POST', body: JSON.stringify(payload) })).data;

export const escalateComplaintsApi = async () => (await apiRequest('/complaints/escalate-overdue', { method: 'POST' })).data;
