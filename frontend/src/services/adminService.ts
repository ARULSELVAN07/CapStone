import api from './api';
import { ApiResponse, AuditLog, Category, InventoryItem, Order, PageResponse, Product, UserProfile, VehicleModel } from '../types';

export const adminService = {
  // Dashboard Metrics
  async getDashboardStats(): Promise<any> {
    const res = await api.get<ApiResponse<any>>('/admin/dashboard');
    return res.data.data;
  },

  // Users Management
  async getCustomers(): Promise<UserProfile[]> {
    const res = await api.get<ApiResponse<UserProfile[]>>('/admin/customers');
    return res.data.data;
  },

  async getTechnicians(): Promise<UserProfile[]> {
    const res = await api.get<ApiResponse<UserProfile[]>>('/admin/technicians');
    return res.data.data;
  },

  async createTechnician(data: any): Promise<UserProfile> {
    const res = await api.post<ApiResponse<UserProfile>>('/admin/technicians', data);
    return res.data.data;
  },

  async getDeliveryExecutives(): Promise<UserProfile[]> {
    const res = await api.get<ApiResponse<UserProfile[]>>('/admin/delivery-executives');
    return res.data.data;
  },

  async createDeliveryExecutive(data: any): Promise<UserProfile> {
    const res = await api.post<ApiResponse<UserProfile>>('/admin/delivery-executives', data);
    return res.data.data;
  },

  async getAdmins(): Promise<UserProfile[]> {
    const res = await api.get<ApiResponse<UserProfile[]>>('/admin/admins');
    return res.data.data;
  },

  async createAdmin(data: any): Promise<UserProfile> {
    const res = await api.post<ApiResponse<UserProfile>>('/admin/admins', data);
    return res.data.data;
  },

  async updateUserStatus(userId: string, status: string): Promise<UserProfile> {
    const res = await api.put<ApiResponse<UserProfile>>(`/admin/users/${userId}/status?status=${status}`);
    return res.data.data;
  },

  // Products Management
  async createProduct(data: any): Promise<Product> {
    const res = await api.post<ApiResponse<Product>>('/admin/products', data);
    return res.data.data;
  },

  async updateProduct(id: string, data: any): Promise<Product> {
    const res = await api.put<ApiResponse<Product>>(`/admin/products/${id}`, data);
    return res.data.data;
  },

  async deactivateProduct(id: string): Promise<void> {
    await api.delete(`/admin/products/${id}`);
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await api.get<ApiResponse<Category[]>>('/categories');
    return res.data.data;
  },

  // Get ALL categories for admin (including inactive)
  async getAllCategoriesAdmin(): Promise<Category[]> {
    try {
      const res = await api.get<ApiResponse<Category[]>>('/admin/categories/all');
      return res.data.data;
    } catch {
      // Fallback to public endpoint if admin endpoint not available
      const res = await api.get<ApiResponse<Category[]>>('/categories');
      return res.data.data;
    }
  },

  async createCategory(data: any): Promise<Category> {
    const res = await api.post<ApiResponse<Category>>('/admin/categories', data);
    return res.data.data;
  },

  async updateCategory(id: string, data: any): Promise<Category> {
    const res = await api.put<ApiResponse<Category>>(`/admin/categories/${id}`, data);
    return res.data.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/admin/categories/${id}`);
  },

  // Vehicle Models
  async getVehicleModels(): Promise<VehicleModel[]> {
    const res = await api.get<ApiResponse<VehicleModel[]>>('/vehicle-models');
    return res.data.data;
  },

  async createVehicleModel(data: any): Promise<VehicleModel> {
    const res = await api.post<ApiResponse<VehicleModel>>('/admin/vehicle-models', data);
    return res.data.data;
  },

  async updateVehicleModel(id: string, data: any): Promise<VehicleModel> {
    const res = await api.put<ApiResponse<VehicleModel>>(`/admin/vehicle-models/${id}`, data);
    return res.data.data;
  },

  // Compatibility
  async addCompatibility(productId: string, vehicleModelId: string, notes?: string): Promise<void> {
    const url = `/admin/products/${productId}/compatibility/${vehicleModelId}` + (notes ? `?notes=${encodeURIComponent(notes)}` : '');
    await api.post(url);
  },

  async removeCompatibility(productId: string, vehicleModelId: string): Promise<void> {
    await api.delete(`/admin/products/${productId}/compatibility/${vehicleModelId}`);
  },

  // Inventory
  async getInventory(params?: { page?: number; size?: number }): Promise<PageResponse<InventoryItem>> {
    const res = await api.get<ApiResponse<PageResponse<InventoryItem>>>('/admin/inventory', { params });
    return res.data.data;
  },

  async getLowStockInventory(params?: { page?: number; size?: number }): Promise<PageResponse<InventoryItem>> {
    const res = await api.get<ApiResponse<PageResponse<InventoryItem>>>('/admin/inventory/low-stock', { params });
    return res.data.data;
  },

  async updateStock(productId: string, data: { availableQuantity: number; minimumStockThreshold?: number }): Promise<InventoryItem> {
    const res = await api.put<ApiResponse<InventoryItem>>(`/admin/inventory/${productId}`, data);
    return res.data.data;
  },

  // Orders Management
  async getAllOrders(params?: { status?: string; fulfillmentType?: string; search?: string; page?: number; size?: number }): Promise<PageResponse<Order>> {
    const res = await api.get<ApiResponse<PageResponse<Order>>>('/admin/orders', { params });
    return res.data.data;
  },

  async getOrderById(orderId: string): Promise<Order> {
    const res = await api.get<ApiResponse<Order>>(`/admin/orders/${orderId}`);
    return res.data.data;
  },

  async updateOrderStatus(orderId: string, status: string, notes?: string): Promise<Order> {
    const res = await api.put<ApiResponse<Order>>(`/admin/orders/${orderId}/status`, { status, notes });
    return res.data.data;
  },

  async assignTechnician(orderId: string, technicianId: string, scheduledDate?: string, scheduledTimeSlot?: string): Promise<Order> {
    const res = await api.put<ApiResponse<Order>>(`/admin/orders/${orderId}/assign-technician`, {
      technicianId, scheduledDate, scheduledTimeSlot
    });
    return res.data.data;
  },

  async assignDelivery(orderId: string, deliveryExecutiveUserId: string, estimatedDeliveryDate?: string): Promise<Order> {
    const res = await api.put<ApiResponse<Order>>(`/admin/orders/${orderId}/assign-delivery`, {
      deliveryExecutiveUserId, estimatedDeliveryDate
    });
    return res.data.data;
  },

  // Audit Logs
  async getAuditLogs(params?: { page?: number; size?: number }): Promise<PageResponse<AuditLog>> {
    const res = await api.get<ApiResponse<PageResponse<AuditLog>>>('/admin/audit-logs', { params });
    return res.data.data;
  }
};

export default adminService;
