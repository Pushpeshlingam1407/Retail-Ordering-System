import api from './axios';
import type { OrderRequest, OrderResponse, OrderStatus } from '../types';

export const getOrders = () => api.get<OrderResponse[]>('/api/orders').then(r => r.data);
export const getOrderById = (id: number) => api.get<OrderResponse>(`/api/orders/${id}`).then(r => r.data);
export const getOrdersByUser = (userId: number) => api.get<OrderResponse[]>(`/api/orders/user/${userId}`).then(r => r.data);
export const createOrder = (data: OrderRequest) => api.post<OrderResponse>('/api/orders', data).then(r => r.data);
export const updateOrder = (id: number, data: OrderRequest) => api.put<OrderResponse>(`/api/orders/${id}`, data).then(r => r.data);
export const updateOrderStatus = (id: number, status: OrderStatus) =>
  api.patch<OrderResponse>(`/api/orders/${id}/status`, null, { params: { status } }).then(r => r.data);
export const deleteOrder = (id: number) => api.delete(`/api/orders/${id}`);
