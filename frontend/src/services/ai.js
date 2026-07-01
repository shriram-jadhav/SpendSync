import api from './api';

export const parseTransaction = (text) => api.post('/ai/parse-transaction/', { text });