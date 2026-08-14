import api from './api';
import { ApiResponse, Cart } from '../types';

export const cartService = {
  async getCart(): Promise<Cart> {
    const res = await api.get<ApiResponse<Cart>>('/cart');
    return res.data.data;
  },

  async addToCart(productId: string, quantity: number): Promise<Cart> {
    const res = await api.post<ApiResponse<Cart>>('/cart/items', { productId, quantity });
    return res.data.data;
  },

  async updateCartItem(itemId: string, quantity: number): Promise<Cart> {
    const res = await api.put<ApiResponse<Cart>>(`/cart/items/${itemId}`, { quantity });
    return res.data.data;
  },

  async removeCartItem(itemId: string): Promise<Cart> {
    const res = await api.delete<ApiResponse<Cart>>(`/cart/items/${itemId}`);
    return res.data.data;
  },

  async clearCart(): Promise<void> {
    await api.delete('/cart');
  }
};

export default cartService;
