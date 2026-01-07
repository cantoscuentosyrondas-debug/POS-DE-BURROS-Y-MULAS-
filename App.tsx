
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Product, Order, OrderStatus, Table, CashRegister, Customer } from './types';
import { INITIAL_PRODUCTS, TABLES, MOCK_USERS } from './constants';
import { Login } from './components/Login';
import { WaiterTerminal } from './components/WaiterTerminal';
import { KitchenDisplay } from './components/KitchenDisplay';
import { AdminPanel } from './components/AdminPanel';
import { CustomerSelfService } from './components/CustomerSelfService';
import { Header } from './components/Header';
import { DeliveryPanel } from './components/DeliveryPanel';

const SYNC_KEY = 'pos_sync_v3';
const syncChannel = new BroadcastChannel(SYNC_KEY);

const App: React.FC = () => {
  const [logoUrl, setLogoUrl] = useState<string>('https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/burros-mulas-logo.png');
  const [restaurantName, setRestaurantName] = useState<string>('BURROS & MULAS');
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cashRegister, setCashRegister] = useState<CashRegister>({ id: 'reg1', isOpen: false, initialBalance: 0, currentBalance: 0, transactions: [] });

  const loadAllData = useCallback(() => {
    const get = (key: string, fallback: any) => {
      const saved = localStorage.getItem(key);
      try { return saved ? JSON.parse(saved) : fallback; } catch { return fallback; }
    };
    setOrders(get('pos_orders', []));
    setProducts(get('pos_products', INITIAL_PRODUCTS));
    setCategories(get('pos_categories', ['Hamburguesas', 'Tacos', 'Bebidas Virales', 'Postres']));
    setStaff(get('pos_staff', MOCK_USERS));
    setCustomers(get('pos_customers', []));
    setCashRegister(get('pos_register', { id: 'reg1', isOpen: false, initialBalance: 0, currentBalance: 0, transactions: [] }));
    setRestaurantName(get('pos_name', 'BURROS & MULAS'));
    setLogoUrl(get('pos_logo', 'https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/burros-mulas-logo.png'));
  }, []);

  useEffect(() => {
    loadAllData();
    syncChannel.onmessage = (e) => {
      if (e.data === 'refresh') loadAllData();
    };
    return () => syncChannel.close();
  }, [loadAllData]);

  const persist = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
    syncChannel.postMessage('refresh');
  };

  const handleAddOrder = (newOrder: Order) => {
    const updatedOrders = [...orders, newOrder];
    setOrders(updatedOrders);
    persist('pos_orders', updatedOrders);

    if (newOrder.customerPhone) {
      const existingIdx = customers.findIndex(c => c.phone === newOrder.customerPhone);
      let updatedCustomers = [...customers];
      if (existingIdx > -1) {
        updatedCustomers[existingIdx] = { ...updatedCustomers[existingIdx], visits: updatedCustomers[existingIdx].visits + 1, lastVisit: Date.now() };
      } else {
        updatedCustomers.push({ id: `c_${Date.now()}`, name: newOrder.customerName || 'Cliente', phone: newOrder.customerPhone, visits: 1, lastVisit: Date.now() });
      }
      setCustomers(updatedCustomers);
      persist('pos_customers', updatedCustomers);
    }
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    const updated = orders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
    setOrders(updated);
    persist('pos_orders', updated);
  };

  const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
    const target = orders.find(o => o.id === orderId);
    if (!target) return;

    if (status === OrderStatus.PAID) {
      const income = target.total + (target.tipAmount || 0);
      const newReg = {
        ...cashRegister,
        currentBalance: cashRegister.currentBalance + income,
        transactions: [...cashRegister.transactions, { 
          id: Date.now().toString(), 
          type: 'IN', 
          amount: income, 
          description: `Venta Mesa ${target.tableId?.replace('t','')} - ${target.customerName}`, 
          timestamp: Date.now() 
        }]
      };
      setCashRegister(newReg);
      persist('pos_register', newReg);
    }

    const updated = orders.map(o => o.id === orderId ? { ...o, status, updatedAt: Date.now() } : o);
    setOrders(updated);
    persist('pos_orders', updated);
  };

  const activeTables = useMemo(() => {
    const occupiedIds = orders.filter(o => o.status !== OrderStatus.PAID).map(o => o.tableId);
    return TABLES.map(t => ({ ...t, status: occupiedIds.includes(t.id) ? 'OCCUPIED' : 'FREE' })) as Table[];
  }, [orders]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      {user && user.role !== 'CUSTOMER' && (
        <Header user={user} onLogout={() => setUser(null)} logoUrl={logoUrl} restaurantName={restaurantName} />
      )}
      <main className="p-4 max-w-7xl mx-auto">
        {!user ? (
          <Login onLogin={setUser} users={staff} logoUrl={logoUrl} restaurantName={restaurantName} />
        ) : (
          <div className="animate-in fade-in duration-500">
            {user.role === 'WAITER' && (
              <WaiterTerminal 
                tables={activeTables} products={products} categories={categories} 
                activeOrders={orders.filter(o => o.status !== OrderStatus.PAID)}
                onAddOrder={handleAddOrder} onUpdateOrder={handleUpdateOrder} onUpdateStatus={handleUpdateStatus}
                restaurantName={restaurantName}
              />
            )}
            {user.role === 'KITCHEN' && (
              <KitchenDisplay 
                orders={orders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING)} 
                products={products} onUpdateStatus={handleUpdateStatus} 
              />
            )}
            {user.role === 'DELIVERY_MANAGER' && (
              <DeliveryPanel orders={orders} onUpdateStatus={handleUpdateStatus} onAddOrder={handleAddOrder} />
            )}
            {user.role === 'ADMIN' && (
              <AdminPanel 
                products={products} setProducts={(p) => { setProducts(p as any); persist('pos_products', p); }} 
                categories={categories} setCategories={(c) => { setCategories(c as any); persist('pos_categories', c); }}
                orders={orders} cashRegister={cashRegister} tables={activeTables}
                staff={staff} setStaff={(s) => { setStaff(s as any); persist('pos_staff', s); }}
                customers={customers} setCustomers={(c) => { setCustomers(c as any); persist('pos_customers', c); }}
                logoUrl={logoUrl} setLogoUrl={(l) => { setLogoUrl(l); persist('pos_logo', l); }}
                restaurantName={restaurantName} setRestaurantName={(n) => { setRestaurantName(n); persist('pos_name', n); }}
                onCashAction={(open, amt) => {
                  const reg = { ...cashRegister, isOpen: open, initialBalance: amt, currentBalance: amt, transactions: [] };
                  setCashRegister(reg); persist('pos_register', reg);
                }}
                suppliers={[]} setSuppliers={() => {}} attendance={[]} setAttendance={() => {}}
                accentColor="#33ccff" setAccentColor={() => {}} secondaryColor="#ff3399" setSecondaryColor={() => {}}
              />
            )}
            {user.role === 'CUSTOMER' && (
              <CustomerSelfService 
                customers={customers} tables={activeTables} products={products} categories={categories}
                orders={orders} onAddOrder={handleAddOrder} onUpdateOrder={handleUpdateOrder} 
                onUpdateStatus={handleUpdateStatus} onLogout={() => setUser(null)} logoUrl={logoUrl} restaurantName={restaurantName}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
