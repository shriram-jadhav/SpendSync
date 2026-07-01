import api from './api';

export const getPeople = () => api.get('/ledger/people/');
export const createPerson = (data) => api.post('/ledger/people/', data);
export const deletePerson = (id) => api.delete(`/ledger/people/${id}/`);

export const getLedgerEntries = (params = {}) => api.get('/ledger/entries/', { params });
export const createLedgerEntry = (data) => api.post('/ledger/entries/', data);
export const deleteLedgerEntry = (id) => api.delete(`/ledger/entries/${id}/`);