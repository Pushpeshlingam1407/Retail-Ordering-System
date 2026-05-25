import api from './axios';
import type { CouponRequest, CouponResponse } from '../types';

export const getCoupons = () => api.get<CouponResponse[]>('/api/coupons').then(r => r.data);
export const getCouponById = (id: number) => api.get<CouponResponse>(`/api/coupons/${id}`).then(r => r.data);
export const getCouponByCode = (code: string) => api.get<CouponResponse>(`/api/coupons/code/${code}`).then(r => r.data);
export const createCoupon = (data: CouponRequest) => api.post<CouponResponse>('/api/coupons', data).then(r => r.data);
export const updateCoupon = (id: number, data: CouponRequest) => api.put<CouponResponse>(`/api/coupons/${id}`, data).then(r => r.data);
export const setCouponActive = (id: number, active: boolean) =>
  api.patch<CouponResponse>(`/api/coupons/${id}/active`, null, { params: { active } }).then(r => r.data);
export const deleteCoupon = (id: number) => api.delete(`/api/coupons/${id}`);
