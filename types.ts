
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
  hasPlayedRoulette?: boolean;
}

export type OrderSource = 'DINE_IN' | 'DELIVERY_OWN' | 'UBER_EATS' | 'RAPPI' | 'DIDI_FOOD' | 'PICKUP';

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  checkIn: number;
  checkOut?: number;
  date: string;
}

export interface Supplier {
  id: string;
  businessName: string;
  category: string;
  contactName: string;
  phone: string;
  location: string;
  deliveryDays: string[];
  method: 'DELIVERY' | 'PICKUP';
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  description: string;
  instructions?: string;
  isPromo?: boolean;
  originalPrice?: number;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  IN_TRANSIT = 'IN_TRANSIT',
  SERVED = 'SERVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED'
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  notes?: string;
}

export interface Order {
  id: string;
  tableId?: string;
  items: OrderItem[];
  status: OrderStatus;
  timestamp: number;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  peopleCount?: number;
  accountType?: 'SINGLE' | 'SEPARATE';
  waiterId?: string;
  total: number;
  source: OrderSource;
  estimatedTime?: number;
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
  openedAt?: number;
  closedAt?: number;
  initialBalance: number;
  currentBalance: number;
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  type: 'IN' | 'OUT';
  amount: number;
  description: string;
  timestamp: number;
}
