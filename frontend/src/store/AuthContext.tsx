import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AuthResponse, UserProfile, UserRole, Vehicle } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  activeVehicle: Vehicle | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: () => boolean;
  isCustomer: () => boolean;
  isTechnician: () => boolean;
  isDelivery: () => boolean;
  login: (response: AuthResponse) => void;
  logout: () => void;
  setActiveVehicle: (vehicle: Vehicle | null) => void;
  updateUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('sparehub_token');
    const storedUser = localStorage.getItem('sparehub_user');
    const storedVehicle = localStorage.getItem('sparehub_vehicle');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        if (storedVehicle) setActiveVehicle(JSON.parse(storedVehicle));
      } catch (e) {
        localStorage.removeItem('sparehub_token');
        localStorage.removeItem('sparehub_user');
        localStorage.removeItem('sparehub_vehicle');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((response: AuthResponse) => {
    if (response.token) {
      localStorage.setItem('sparehub_token', response.token);
      const userProfile: UserProfile = {
        id: response.userId,
        name: response.name,
        email: response.email,
        phone: '',
        role: response.role,
        status: 'ACTIVE',
        employeeId: response.employeeId,
      };
      localStorage.setItem('sparehub_user', JSON.stringify(userProfile));
      setToken(response.token);
      setUser(userProfile);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sparehub_token');
    localStorage.removeItem('sparehub_user');
    localStorage.removeItem('sparehub_vehicle');
    setToken(null);
    setUser(null);
    setActiveVehicle(null);
  }, []);

  const handleSetActiveVehicle = useCallback((vehicle: Vehicle | null) => {
    setActiveVehicle(vehicle);
    if (vehicle) {
      localStorage.setItem('sparehub_vehicle', JSON.stringify(vehicle));
    } else {
      localStorage.removeItem('sparehub_vehicle');
    }
  }, []);

  const updateUser = useCallback((updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('sparehub_user', JSON.stringify(updatedUser));
  }, []);

  const isAdmin = () => user?.role === 'ADMIN';
  const isCustomer = () => user?.role === 'CUSTOMER';
  const isTechnician = () => user?.role === 'TECHNICIAN';
  const isDelivery = () => user?.role === 'DELIVERY_EXECUTIVE';

  return (
    <AuthContext.Provider value={{
      user, token, activeVehicle, isLoading,
      isAuthenticated: !!token && !!user,
      isAdmin, isCustomer, isTechnician, isDelivery,
      login, logout,
      setActiveVehicle: handleSetActiveVehicle,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;
