import api from './api';
import { ApiResponse, InstallationInfo, Order, PageResponse } from '../types';

export const technicianService = {
  async getProfile(): Promise<any> {
    const res = await api.get<ApiResponse<any>>('/technician/profile');
    return res.data.data;
  },

  async getMyJobs(params?: { page?: number; size?: number }): Promise<PageResponse<any>> {
    const res = await api.get<ApiResponse<PageResponse<any>>>('/technician/jobs', { params });
    return res.data.data;
  },

  async getJobById(jobId: string): Promise<any> {
    const res = await api.get<ApiResponse<any>>(`/technician/jobs/${jobId}`);
    return res.data.data;
  },

  async updateJobStatus(jobId: string, data: { status: string; technicianNotes?: string; checklistItemsCompleted?: string[]; installationPhotos?: string[] }): Promise<any> {
    const res = await api.put<ApiResponse<any>>(`/technician/jobs/${jobId}/status`, data);
    return res.data.data;
  },

  async changePassword(oldPassword: string, newPassword: string, confirmNewPassword: string): Promise<void> {
    await api.post('/auth/change-password', { oldPassword, newPassword, confirmNewPassword });
  }
};

export default technicianService;
