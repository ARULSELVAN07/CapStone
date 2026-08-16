export type UserRole = 'CUSTOMER' | 'ADMIN' | 'TECHNICIAN' | 'DELIVERY_EXECUTIVE';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  employeeId?: string;
  createdAt?: string;
}

export interface AuthResponse {
  token?: string;
  tokenType?: string;
  userId: string;
  name: string;
  email: string;
  employeeId?: string;
  role: UserRole;
  requiresOtp: boolean;
  message?: string;
}

export interface VehicleModel {
  id: string;
  modelName: string;
  modelCode: string;
  modelYear: number;
  engineType: string;
  fuelType: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  vehicleModel: VehicleModel;
  vin: string;
  registrationNumber?: string;
  purchaseYear?: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface Product {
  id: string;
  category: Category;
  partNumber: string;
  name: string;
  description?: string;
  brand: string;
  price: number;
  warrantyMonths: number;
  imageUrl?: string;
  rating?: number;
  status: 'ACTIVE' | 'INACTIVE';
  availableQuantity: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  compatibleModels?: VehicleModel[];
  recommendationScore?: number;
  matchReason?: string;
}

export interface CompatibilityResponse {
  compatible: boolean;
  message: string;
  vehicleModelName?: string;
  partNumber?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  itemTotal: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  totalItems: number;
}

export interface Address {
  id?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export type FulfillmentType = 'PICKUP' | 'DELIVERY' | 'INSTALLATION';
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PACKED'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'TECHNICIAN_ASSIGNED'
  | 'INSTALLATION_SCHEDULED'
  | 'INSTALLATION_IN_PROGRESS'
  | 'INSTALLATION_COMPLETED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  product: Product;
  productName: string;
  partNumber: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PaymentInfo {
  id: string;
  paymentMethod: 'UPI' | 'CARD' | 'CASH_ON_PICKUP';
  status: string;
  transactionRef: string;
  amount: number;
  createdAt: string;
}

export interface DeliveryInfo {
  id: string;
  deliveryStatus: 'PENDING' | 'ASSIGNED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED';
  deliveryAddress?: Address;
  assignedPersonName?: string;
  assignedPersonPhone?: string;
  trackingReference?: string;
  estimatedDeliveryDate?: string;
  deliveredAt?: string;
}

export interface TechnicianInfo {
  id: string;
  userId?: string;
  employeeId?: string;
  name: string;
  phone: string;
  email?: string;
  status: 'AVAILABLE' | 'BUSY' | 'INACTIVE';
}

export interface InstallationInfo {
  id: string;
  technician?: TechnicianInfo;
  status: 'PENDING' | 'ASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledDate?: string;
  scheduledTimeSlot?: string;
  startedAt?: string;
  completedAt?: string;
  technicianNotes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: UserProfile;
  vehicle?: Vehicle;
  address?: Address;
  fulfillmentType: FulfillmentType;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  installationFee: number;
  totalAmount: number;
  pickupDate?: string;
  pickupTimeSlot?: string;
  notes?: string;
  items: OrderItem[];
  payment?: PaymentInfo;
  deliveryInfo?: DeliveryInfo;
  installationInfo?: InstallationInfo;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  product: Product;
  availableQuantity: number;
  reservedQuantity: number;
  minimumStockThreshold: number;
  calculatedStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  user?: UserProfile;
  action: string;
  entityType?: string;
  entityId?: string;
  description?: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNo: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
