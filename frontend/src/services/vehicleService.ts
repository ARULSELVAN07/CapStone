import api from './api';
import { ApiResponse, Vehicle, VehicleModel } from '../types';

export const vehicleService = {
  async getVehicleModels(): Promise<VehicleModel[]> {
    const res = await api.get<ApiResponse<VehicleModel[]>>('/vehicle-models');
    return res.data.data;
  },

  async getUserVehicles(): Promise<Vehicle[]> {
    const res = await api.get<ApiResponse<Vehicle[]>>('/vehicles');
    return res.data.data;
  },

  async addVehicle(data: {
    vehicleModelId: string;
    vin: string;
    registrationNumber?: string;
    purchaseYear?: number;
  }): Promise<Vehicle> {
    const res = await api.post<ApiResponse<Vehicle>>('/vehicles', data);
    return res.data.data;
  },

  async deleteVehicle(id: string): Promise<void> {
    await api.delete(`/vehicles/${id}`);
  }
};

export default vehicleService;
