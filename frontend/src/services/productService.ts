import api from './api';
import { ApiResponse, Category, CompatibilityResponse, PageResponse, Product } from '../types';

export const productService = {
  async getCategories(): Promise<Category[]> {
    const res = await api.get<ApiResponse<Category[]>>('/categories');
    return res.data.data;
  },

  async filterProducts(params: {
    categoryId?: string;
    vehicleModelId?: string;
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    search?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }): Promise<PageResponse<Product>> {
    const res = await api.get<ApiResponse<PageResponse<Product>>>('/products', { params });
    return res.data.data;
  },

  async getProducts(params?: any): Promise<PageResponse<Product>> {
    return this.filterProducts(params || {});
  },

  async getProductById(id: string): Promise<Product> {
    const res = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return res.data.data;
  },

  async checkCompatibility(productId: string, vehicleId: string): Promise<CompatibilityResponse> {
    const res = await api.get<ApiResponse<CompatibilityResponse>>(`/products/${productId}/compatibility/${vehicleId}`);
    return res.data.data;
  }
};

export default productService;
