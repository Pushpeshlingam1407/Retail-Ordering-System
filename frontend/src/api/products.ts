import api from './axios';
import type { Product, ProductRequest } from '../types';

export const getProducts = () => api.get<Product[]>('/api/products').then(r => r.data);
export const createProduct = (data: ProductRequest) => api.post<Product>('/api/products', data).then(r => r.data);
export const updateProduct = (id: number, data: ProductRequest) => api.put<Product>(`/api/products/${id}`, data).then(r => r.data);
export const deleteProduct = (id: number) => api.delete(`/api/products/${id}`);
