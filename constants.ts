
import { Product, Table, User } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { 
    id: 'h1', 
    name: 'Burro-Burguer Suprema', 
    price: 145, 
    category: 'Hamburguesas', 
    stock: 25, 
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', 
    description: 'Doble carne, aros de cebolla y salsa secreta neón.'
  },
  { 
    id: 'h2', 
    name: 'Mula Cheese BBQ', 
    price: 130, 
    category: 'Hamburguesas', 
    stock: 20, 
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400', 
    description: 'Bacon crujiente y mucha salsa BBQ.'
  },
  { 
    id: 'b1', 
    name: 'Limonada Galáctica', 
    price: 65, 
    category: 'Bebidas Virales', 
    stock: 50, 
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400', 
    description: 'Cambia de color con el pH. ¡Viral de TikTok!'
  },
];

export const TABLES: Table[] = Array.from({ length: 10 }, (_, i) => ({
  id: `t${i + 1}`,
  number: i + 1,
  status: 'FREE'
}));

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Admin Master', role: 'ADMIN', username: 'admin' },
  { id: 'u2', name: 'Carlos (Mesero)', role: 'WAITER', username: 'mesero' },
  { id: 'u3', name: 'Chef Elena', role: 'KITCHEN', username: 'chef' },
];
