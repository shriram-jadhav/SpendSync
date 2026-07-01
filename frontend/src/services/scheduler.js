import api from './api';

export const getEvents = (params = {}) => api.get('/scheduler/events/', { params });
export const createEvent = (data) => api.post('/scheduler/events/', data);
export const updateEvent = (id, data) => api.put(`/scheduler/events/${id}/`, data);
export const deleteEvent = (id) => api.delete(`/scheduler/events/${id}/`);