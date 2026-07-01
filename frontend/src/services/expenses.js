import api from './api';

export const getTransactions = (params = {}) => api.get('/expenses/transactions/', { params });
export const createTransaction = (data) => api.post('/expenses/transactions/', data);
export const updateTransaction = (id, data) => api.put(`/expenses/transactions/${id}/`, data);
export const deleteTransaction = (id) => api.delete(`/expenses/transactions/${id}/`);
export const getSummary = () => api.get('/expenses/transactions/summary/');
export const getByCategory = () => api.get('/expenses/transactions/by_category/');

export const getCategories = () => api.get('/expenses/categories/');
export const createCategory = (data) => api.post('/expenses/categories/', data);
export const deleteCategory = (id) => api.delete(`/expenses/categories/${id}/`);