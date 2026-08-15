import api from './api';
import { ApiResponse, AuthResponse, UserProfile } from '../types';

export const authService = {
  async register(data: any): Promise<AuthResponse> {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return res.data.data;
  },

  async login(identifier: string, password: String): Promise<AuthResponse> {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', { identifier, password });
    return res.data.data;
  },

  async verifyOtp(emailOrPhone: string, otpCode: string): Promise<AuthResponse> {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/verify-otp', { emailOrPhone, otpCode });
    return res.data.data;
  },

  async resendOtp(emailOrPhone: string): Promise<void> {
    await api.post<ApiResponse<void>>(`/auth/resend-otp?emailOrPhone=${encodeURIComponent(emailOrPhone)}`);
  },

  async getProfile(): Promise<UserProfile> {
    const res = await api.get<ApiResponse<UserProfile>>('/users/profile');
    return res.data.data;
  },

  async updateProfile(name: string, phone?: string): Promise<UserProfile> {
    const res = await api.put<ApiResponse<UserProfile>>('/users/profile', { name, phone });
    return res.data.data;
  },

  async changePassword(oldPassword: string, newPassword: string, confirmNewPassword: string): Promise<void> {
    await api.post('/auth/change-password', { oldPassword, newPassword, confirmNewPassword });
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(email: string, otpCode: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', { email, otpCode, newPassword });
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore network error on logout
    }
  }
};

export default authService;
