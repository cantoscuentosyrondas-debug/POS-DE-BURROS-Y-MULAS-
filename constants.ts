
import { Product, Table, User } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { 
    id: 'h1', 
    name: 'Burro-Burguer Suprema', 
    price: 145, 
    category: 'Hamburguesas', 
    stock: 50, 
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', 
    description: 'Doble carne, aros de cebolla y salsa secreta neón.',
    instructions: '1. Sellar carne 3 min por lado. 2. Tostar pan con mantequilla. 3. Capa de salsa neón, lechuga, doble carne, aros de cebolla. 4. Pinchar con palillo decorativo.'
  },
  { 
    id: 'h2', 
    name: 'Mula Cheese BBQ', 
    price: 130, 
    category: 'Hamburguesas', 
    stock: 40, 
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400', 
    description: 'Bacon crujiente y mucha salsa BBQ.',
    instructions: '1. Sellar carne. 2. Freír bacon hasta que esté extra crujiente. 3. Bañar carne con BBQ mientras está en la plancha. 4. Montar con cebolla caramelizada.'
  },
  { 
    id: 'b1', 
    name: 'Limonada Galáctica', 
    price: 65, 
    category: 'Bebidas Virales', 
    stock: 200, 
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400', 
    description: 'Cambia de color con el pH. ¡Viral de TikTok!',
    instructions: '1. Llenar vaso con hielo frappé. 2. Verter base de jarabe de mariposa. 3. Servir el limón aparte para que el cliente haga el cambio de color en mesa.'
  },
];

export const TABLES: Table[] = Array.from({ length: 10 }, (_, i) => ({
  id: `t${i + 1}`,
  number: i + 1,
  status: 'FREE'
}));

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Dueño Burros', role: 'ADMIN', username: 'admin' },
  { id: 'u2', name: 'Mesero Pro', role: 'WAITER', username: 'mesero' },
  { id: 'u3', name: 'Chef Mulas', role: 'KITCHEN', username: 'chef' },
];
