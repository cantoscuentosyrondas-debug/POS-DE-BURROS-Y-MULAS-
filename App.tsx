
import React, { useState, useEffect, useCallback } from 'react';
import { User, Role, Product, Order, OrderStatus, Table, CashRegister, Supplier, AttendanceRecord, OrderSource, Customer } from './types';
import { INITIAL_PRODUCTS, TABLES, MOCK_USERS } from './constants';
import { Login } from './components/Login';
import { WaiterTerminal } from './components/WaiterTerminal';
import { KitchenDisplay } from './components/KitchenDisplay';
import { AdminPanel } from './components/AdminPanel';
import { CustomerSelfService } from './components/CustomerSelfService';
import { DeliveryPanel } from './components/DeliveryPanel';
import { Header } from './components/Header';

const App: React.FC = () => {
  const [logoUrl, setLogoUrl] = useState<string>('https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/burros-mulas-logo.png');
  const [restaurantName, setRestaurantName] = useState<string>('BURROS & MULAS');
  const [accentColor, setAccentColor] = useState<string>('#33ccff');
  const [secondaryColor, setSecondaryColor] = useState<string>('#ff3399');

  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<string[]>(['Hamburguesas', 'Tacos', 'Bebidas Virales', 'Postres']);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>(TABLES);
  const [staff, setStaff] = useState<User[]>(MOCK_USERS);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  
  const [cashRegister, setCashRegister] = useState<CashRegister>({
    id: 'reg1',
    isOpen: false,
    initialBalance: 0,
    currentBalance: 0,
    transactions: []
  });

  useEffect(() => {
    const load = (key: string, fallback: any) => {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    };

    setOrders(load('gastro_orders', []));
    setCashRegister(load('gastro_register', cashRegister));
    setProducts(load('gastro_products', INITIAL_PRODUCTS));
    setCategories(load('gastro_categories', categories));
    setStaff(load('gastro_staff', MOCK_USERS));
    setCustomers(load('gastro_customers', []));
    setSuppliers(load('gastro_suppliers', []));
    setAttendance(load('gastro_attendance', []));
    setLogoUrl(load('gastro_logo', 'https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/burros-mulas-logo.png'));
    setRestaurantName(load('gastro_name', 'BURROS & MULAS'));
    setAccentColor(load('gastro_color_accent', '#33ccff'));
    setSecondaryColor(load('gastro_color_secondary', '#ff3399'));
  }, []);

  useEffect(() => {
    localStorage.setItem('gastro_orders', JSON.stringify(orders));
    localStorage.setItem('gastro_register', JSON.stringify(cashRegister));
    localStorage.setItem('gastro_products', JSON.stringify(products));
    localStorage.setItem('gastro_categories', JSON.stringify(categories));
    localStorage.setItem('gastro_staff', JSON.stringify(staff));
    localStorage.setItem('gastro_customers', JSON.stringify(customers));
    localStorage.setItem('gastro_suppliers', JSON.stringify(suppliers));
    localStorage.setItem('gastro_attendance', JSON.stringify(attendance));
    localStorage.setItem('gastro_logo', JSON.stringify(logoUrl));
    localStorage.setItem('gastro_name', JSON.stringify(restaurantName));
    localStorage.setItem('gastro_color_accent', JSON.stringify(accentColor));
    localStorage.setItem('gastro_color_secondary', JSON.stringify(secondaryColor));

    document.documentElement.style.setProperty('--neon-blue', accentColor);
    document.documentElement.style.setProperty('--neon-pink', secondaryColor);
  }, [orders, cashRegister, products, categories, staff, customers, suppliers, attendance, logoUrl, restaurantName, accentColor, secondaryColor]);

  const handleLogin = (u: User) => setUser(u);
  const handleLogout = () => setUser(null);

  const addOrder = useCallback((newOrder: Order) => {
    setOrders(prev => [...prev, newOrder]);
    
    if (newOrder.source === 'DINE_IN' && newOrder.tableId) {
      setTables(prev => prev.map(t => t.id === newOrder.tableId ? { ...t, status: 'OCCUPIED' } : t));
    }
    
    if (newOrder.customerPhone) {
      setCustomers(prev => {
        const existing = prev.find(c => c.phone === newOrder.customerPhone);
        if (existing) {
          return prev.map(c => c.phone === newOrder.customerPhone ? { ...c, visits: c.visits + 1, lastVisit: Date.now() } : c);
        }
        return [...prev, { id: `c_${Date.now()}`, name: newOrder.customerName || 'Cliente', phone: newOrder.customerPhone || '', visits: 1, lastVisit: Date.now() }];
      });
    }
    
    setProducts(prev => prev.map(p => {
      const orderItem = newOrder.items.find(item => item.productId === p.id);
      if (orderItem) {
        return { ...p, stock: p.stock - orderItem.quantity };
      }
      return p;
    }));
  }, []);

  const updateOrder = (updated: Order) => {
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => {
      const targetOrder = prev.find(o => o.id === orderId);
      if (!targetOrder) return prev;
      if (status === OrderStatus.PAID) {
        if (targetOrder.source === 'DINE_IN' && targetOrder.tableId) {
          setTables(tPrev => tPrev.map(t => t.id === targetOrder.tableId ? { ...t, status: 'FREE' } : t));
        }
        const income = targetOrder.total + (targetOrder.tipAmount || 0);
        setCashRegister(cPrev => ({
          ...cPrev,
          currentBalance: cPrev.currentBalance + income,
          transactions: [...cPrev.transactions, {
            id: Date.now().toString(),
            type: 'IN',
            amount: income,
            description: `Cobro ${targetOrder.tableId ? 'Mesa ' + targetOrder.tableId.replace('t','') : 'Delivery'}`,
            timestamp: Date.now()
          }]
        }));
      }
      return prev.map(o => o.id === orderId ? { ...o, status } : o);
    });
  };

  const handleCashAction = (isOpen: boolean, amount: number) => {
    setCashRegister(prev => ({
      ...prev,
      isOpen,
      openedAt: isOpen ? Date.now() : prev.openedAt,
      closedAt: !isOpen ? Date.now() : prev.closedAt,
      initialBalance: isOpen ? amount : prev.initialBalance,
      currentBalance: isOpen ? amount : prev.currentBalance,
      transactions: isOpen ? [] : prev.transactions
    }));
  };

  const renderContent = () => {
    if (!user) return <Login onLogin={handleLogin} users={staff} logoUrl={logoUrl} restaurantName={restaurantName} />;
    switch (user.role) {
      case 'WAITER':
        return (
          <div className="space-y-12">
            <WaiterTerminal tables={tables} products={products} categories={categories} onAddOrder={addOrder} onUpdateOrder={updateOrder} onUpdateStatus={updateOrderStatus} activeOrders={orders.filter(o => o.status !== OrderStatus.PAID)} restaurantName={restaurantName} />
            <DeliveryPanel orders={orders.filter(o => o.status !== OrderStatus.PAID)} onUpdateStatus={updateOrderStatus} onAddOrder={addOrder} />
          </div>
        );
      case 'KITCHEN':
        return <KitchenDisplay orders={orders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING)} products={products} onUpdateStatus={updateOrderStatus} />;
      case 'ADMIN':
        return (
          <AdminPanel 
            products={products} setProducts={setProducts} 
            categories={categories} setCategories={setCategories} 
            orders={orders} cashRegister={cashRegister} 
            onCashAction={handleCashAction} tables={tables}
            staff={staff} setStaff={setStaff}
            customers={customers} setCustomers={setCustomers}
            suppliers={suppliers} setSuppliers={setSuppliers}
            attendance={attendance} setAttendance={setAttendance}
            logoUrl={logoUrl} setLogoUrl={setLogoUrl}
            restaurantName={restaurantName} setRestaurantName={setRestaurantName}
            accentColor={accentColor} setAccentColor={setAccentColor}
            secondaryColor={secondaryColor} setSecondaryColor={setSecondaryColor}
          />
        );
      case 'CUSTOMER':
        return <CustomerSelfService customers={customers} tables={tables} products={products} categories={categories} onAddOrder={addOrder} onUpdateOrder={updateOrder} orders={orders} onUpdateStatus={updateOrderStatus} onLogout={handleLogout} logoUrl={logoUrl} restaurantName={restaurantName} />;
      default:
        return <div>Rol no reconocido</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {user && <Header user={user} onLogout={handleLogout} logoUrl={logoUrl} restaurantName={restaurantName} />}
      <main className="flex-1 container mx-auto p-4 max-w-7xl">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
