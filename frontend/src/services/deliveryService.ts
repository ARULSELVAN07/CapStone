import api from './api';
import { ApiResponse, DeliveryInfo, Order, PageResponse } from '../types';

export const deliveryService = {
  async getProfile(): Promise<any> {
    const res = await api.get<ApiResponse<any>>('/delivery/profile');
    return res.data.data;
  },

  async getMyDeliveries(params?: { page?: number; size?: number }): Promise<PageResponse<any>> {
    const res = await api.get<ApiResponse<PageResponse<any>>>('/delivery/orders', { params });
    return res.data.data;
  },

  async getDeliveryById(deliveryId: string): Promise<any> {
    const res = await api.get<ApiResponse<any>>(`/delivery/orders/${deliveryId}`);
    return res.data.data;
  },

  async updateDeliveryStatus(deliveryId: string, data: { status: string; deliveryNotes?: string; proofOfDeliveryOtp?: string; failureReason?: string }): Promise<any> {
    const res = await api.put<ApiResponse<any>>(`/delivery/orders/${deliveryId}/status`, data);
    return res.data.data;
  },

  async changePassword(oldPassword: string, newPassword: string, confirmNewPassword: string): Promise<void> {
    await api.post('/auth/change-password', { oldPassword, newPassword, confirmNewPassword });
  }
};

export default deliveryService;
