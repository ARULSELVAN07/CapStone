import api from './api';
import { ApiResponse, Order, PageResponse } from '../types';

export const orderService = {
  async placeOrder(data: {
    vehicleId?: string;
    addressId?: string;
    fulfillmentType: string;
    paymentMethod: string;
    pickupDate?: string;
    pickupTimeSlot?: string;
    notes?: string;
    address?: {
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      pincode: string;
      landmark?: string;
    };
  }): Promise<Order> {
    const res = await api.post<ApiResponse<Order>>('/orders', data);
    return res.data.data;
  },

  async getMyOrders(page = 0, size = 10): Promise<PageResponse<Order>> {
    const res = await api.get<ApiResponse<PageResponse<Order>>>('/orders/my-orders', { params: { page, size } });
    return res.data.data;
  },

  async getOrderById(id: string): Promise<Order> {
    const res = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return res.data.data;
  },

  async cancelOrder(id: string): Promise<Order> {
    const res = await api.post<ApiResponse<Order>>(`/orders/${id}/cancel`);
    return res.data.data;
  }
};

export default orderService;
