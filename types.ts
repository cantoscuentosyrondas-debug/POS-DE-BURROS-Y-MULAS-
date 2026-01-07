
export type Role = 'ADMIN' | 'WAITER' | 'KITCHEN' | 'CUSTOMER' | 'DELIVERY_MANAGER';

export interface User {
  id: string;
  name: string;
  role: Role;
  username?: string;
  password?: string;
  photo?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  visits: number;
  lastVisit: number;
}

export type OrderSource = 'DINE_IN' | 'DELIVERY_OWN' | 'UBER_EATS' | 'RAPPI' | 'DIDI_FOOD' | 'PICKUP';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  description: string;
}

// Added IN_TRANSIT status for delivery workflow tracking
export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  IN_TRANSIT = 'IN_TRANSIT',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED'
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  notes?: string;
  isNew?: boolean; // Para marcar items recién añadidos por cliente
}

export interface Order {
  id: string;
  tableId?: string;
  items: OrderItem[];
  status: OrderStatus;
  timestamp: number;
  updatedAt?: number;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string; // Added to support delivery orders
  peopleCount?: number;
  accountType?: 'SINGLE' | 'SEPARATE'; // Added for customer self-service billing preferences
  total: number;
  source: OrderSource;
  billRequested?: boolean;
  paymentMethod?: 'CASH' | 'CARD';
  tipAmount?: number;
  tipPercentage?: number;
}

export interface Table {
  id: string;
  number: number;
  status: 'FREE' | 'OCCUPIED' | 'RESERVED';
}

export interface CashRegister {
  id: string;
  isOpen: boolean;
  initialBalance: number;
  currentBalance: number;
  transactions: any[];
}

// Added missing Supplier interface for Admin management
export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  category: string;
}

// Added missing AttendanceRecord interface for staff management
export interface AttendanceRecord {
  id: string;
  userId: string;
  timestamp: number;
  type: 'IN' | 'OUT';
}
