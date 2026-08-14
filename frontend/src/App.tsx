import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import { useAuth } from './store/AuthContext';

// Layouts
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';
import TechnicianLayout from './layouts/TechnicianLayout';
import DeliveryLayout from './layouts/DeliveryLayout';

// Auth Pages
import CustomerLogin from './pages/auth/CustomerLogin';
import CustomerRegister from './pages/auth/CustomerRegister';
import OtpVerification from './pages/auth/OtpVerification';
import ForgotPassword from './pages/auth/ForgotPassword';
import AdminLogin from './pages/auth/AdminLogin';
import TechnicianLogin from './pages/auth/TechnicianLogin';
import DeliveryLogin from './pages/auth/DeliveryLogin';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import VehicleManagement from './pages/customer/VehicleManagement';
import ProductCatalog from './pages/customer/ProductCatalog';
import ProductDetail from './pages/customer/ProductDetail';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrderHistory from './pages/customer/OrderHistory';
import OrderDetail from './pages/customer/OrderDetail';
import CustomerProfile from './pages/customer/CustomerProfile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminVehicleModels from './pages/admin/AdminVehicleModels';
import AdminCompatibility from './pages/admin/AdminCompatibility';
import AdminInventory from './pages/admin/AdminInventory';
import AdminLowStockAlerts from './pages/admin/AdminLowStockAlerts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';

// Technician Pages
import TechnicianDashboard from './pages/technician/TechnicianDashboard';
import TechnicianJobs from './pages/technician/TechnicianJobs';
import TechnicianChangePassword from './pages/technician/TechnicianChangePassword';

// Delivery Pages
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import DeliveryOrders from './pages/delivery/DeliveryOrders';
import DeliveryChangePassword from './pages/delivery/DeliveryChangePassword';

export const App: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  const getHomeRedirect = () => {
    if (!isAuthenticated) return '/login';
    if (user?.role === 'ADMIN') return '/admin';
    if (user?.role === 'TECHNICIAN') return '/technician';
    if (user?.role === 'DELIVERY_EXECUTIVE') return '/delivery';
    return '/customer';
  };

  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to={getHomeRedirect()} replace />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<CustomerLogin />} />
      <Route path="/register" element={<CustomerRegister />} />
      <Route path="/verify-otp" element={<OtpVerification />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/technician/login" element={<TechnicianLogin />} />
      <Route path="/delivery/login" element={<DeliveryLogin />} />

      {/* Customer Portal Routes */}
      <Route
        path="/customer"
        element={
          <ProtectedRoute requiredRole="CUSTOMER" redirectTo="/login">
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CustomerDashboard />} />
        <Route path="vehicles" element={<VehicleManagement />} />
        <Route path="catalog" element={<ProductCatalog />} />
        <Route path="catalog/:id" element={<ProductDetail />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="orders" element={<OrderHistory />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="profile" element={<CustomerProfile />} />
      </Route>

      {/* Admin Portal Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="ADMIN" redirectTo="/admin/login">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="vehicle-models" element={<AdminVehicleModels />} />
        <Route path="compatibility" element={<AdminCompatibility />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="low-stock" element={<AdminLowStockAlerts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
      </Route>

      {/* Technician Portal Routes */}
      <Route
        path="/technician"
        element={
          <ProtectedRoute requiredRole="TECHNICIAN" redirectTo="/technician/login">
            <TechnicianLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<TechnicianDashboard />} />
        <Route path="jobs" element={<TechnicianJobs />} />
        <Route path="change-password" element={<TechnicianChangePassword />} />
      </Route>

      {/* Delivery Portal Routes */}
      <Route
        path="/delivery"
        element={
          <ProtectedRoute requiredRole="DELIVERY_EXECUTIVE" redirectTo="/delivery/login">
            <DeliveryLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DeliveryDashboard />} />
        <Route path="orders" element={<DeliveryOrders />} />
        <Route path="change-password" element={<DeliveryChangePassword />} />
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to={getHomeRedirect()} replace />} />
    </Routes>
  );
};

export default App;
