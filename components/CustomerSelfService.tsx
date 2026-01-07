
import React, { useState, useEffect } from 'react';
import { Table, Product, Order, OrderStatus, OrderItem, Customer } from '../types';

interface CustomerSelfServiceProps {
  customers: Customer[];
  tables: Table[];
  products: Product[];
  categories: string[];
  onAddOrder: (order: Order) => void;
  onUpdateOrder: (order: Order) => void;
  orders: Order[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onLogout: () => void;
  logoUrl: string;
  restaurantName: string;
}

const GIFTS = [
  { name: "Papas Neón Gratis", id: "gift_papas" },
  { name: "Bebida Galáctica", id: "gift_drink" },
  { name: "Taco Sorpresa", id: "gift_taco" },
  { name: "10% Descuento", id: "gift_desc" }
];

export const CustomerSelfService: React.FC<CustomerSelfServiceProps> = ({ 
  customers, tables, products, categories, onAddOrder, onUpdateOrder, orders, onUpdateStatus, onLogout, logoUrl, restaurantName 
}) => {
  const [step, setStep] = useState<'WELCOME' | 'TABLE_CHOICE' | 'SETUP' | 'MENU' | 'ROULETTE' | 'SUCCESS' | 'VIEW_BILL' | 'CHECKOUT'>('WELCOME');
  const [customerData, setCustomerData] = useState({ 
    name: '', 
    phone: '', 
    table: '', 
    peopleCount: 1,
    accountType: 'SINGLE' as 'SINGLE' | 'SEPARATE'
  });
  const [isExistingTable, setIsExistingTable] = useState(false);
  
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [category, setCategory] = useState(categories[0] || '');
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState<{name: string, id: string} | null>(null);
  
  const [productInSelection, setProductInSelection] = useState<Product | null>(null);
  const [customExclusions, setCustomExclusions] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | null>(null);
  const [tipPercentage, setTipPercentage] = useState<number | 'OTHER'>(10);
  const [customTip, setCustomTip] = useState<string>('0');

  useEffect(() => {
    const saved = localStorage.getItem('bm_customer_session');
    if (saved) {
      const data = JSON.parse(saved);
      const active = orders.some(o => o.tableId === data.table && o.status !== OrderStatus.PAID);
      if (active) {
        setCustomerData(data);
        setStep('MENU');
      }
    }
  }, [orders]);

  const myOrders = orders.filter(o => o.tableId === customerData.table && o.status !== OrderStatus.PAID);
  const subtotal = myOrders.reduce((sum, order) => sum + order.total, 0);
  const tipAmount = tipPercentage === 'OTHER' ? (parseInt(customTip) || 0) : Math.round(subtotal * (tipPercentage / 100));
  const finalTotal = subtotal + tipAmount;

  const handleOpenSelection = (p: Product) => {
    setProductInSelection(p);
    setCustomExclusions('');
  };

  const confirmAddToCart = (allIn: boolean) => {
    if (!productInSelection) return;
    setCart(prev => [...prev, { 
      productId: productInSelection.id, name: productInSelection.name, 
      price: productInSelection.price, quantity: 1,
      notes: allIn ? 'Con todo' : `SIN: ${customExclusions}`
    }]);
    setProductInSelection(null);
  };

  const validateAndEnter = () => {
    if (!customerData.name.trim() || !customerData.phone.trim() || !customerData.table) {
      return alert("Por favor completa todos los campos para continuar.");
    }
    
    const table = tables.find(t => t.id === customerData.table);
    
    if (isExistingTable) {
        const order = orders.find(o => o.tableId === customerData.table && o.status !== OrderStatus.PAID);
        if (order) {
            setStep('MENU');
            localStorage.setItem('bm_customer_session', JSON.stringify(customerData));
        } else {
            alert("No encontramos una cuenta activa en esa mesa. Elige 'Soy mesa nueva'.");
        }
    } else {
        if (table?.status === 'FREE' || table?.status === 'RESERVED') {
            setStep('MENU');
            localStorage.setItem('bm_customer_session', JSON.stringify(customerData));
        } else {
            alert("Mesa ocupada. Por favor elige otra o selecciona 'Ya estoy consumiendo'.");
        }
    }
  };

  const startOrderFlow = () => {
    const isNew = !customers.find(c => c.phone === customerData.phone);
    const hasPlayedLocal = localStorage.getItem(`played_${customerData.phone}`) === 'true';
    
    if (isNew && !hasPlayedLocal) {
      setStep('ROULETTE');
    } else {
      finalizeOrder();
    }
  };

  const spinRoulette = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setTimeout(() => {
      const prize = GIFTS[Math.floor(Math.random() * GIFTS.length)];
      setWonPrize(prize);
      setIsSpinning(false);
    }, 2500);
  };

  const finalizeOrder = (prize?: {name: string, id: string}) => {
    const orderItems = [...cart];
    if (prize) {
      orderItems.push({
        productId: prize.id,
        name: `🎁 REGALO: ${prize.name}`,
        price: 0,
        quantity: 1,
        notes: "Premio Ruleta"
      });
      localStorage.setItem(`played_${customerData.phone}`, 'true');
    }

    // BUSCAR SI YA HAY UNA ORDEN ABIERTA PARA ESTA MESA
    const existingOrder = orders.find(o => o.tableId === customerData.table && o.status !== OrderStatus.PAID);

    if (existingOrder) {
      // ACTUALIZAR ORDEN EXISTENTE (Fusionar productos extras)
      const additionalTotal = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const updatedOrder: Order = {
        ...existingOrder,
        items: [...existingOrder.items, ...orderItems],
        total: existingOrder.total + additionalTotal,
        status: OrderStatus.PENDING, // Volver a pendiente para que cocina lo vea
        updatedAt: Date.now()
      };
      onUpdateOrder(updatedOrder);
    } else {
      // CREAR NUEVA ORDEN
      const newOrder: Order = {
        id: `self_${Date.now()}`, 
        tableId: customerData.table, 
        items: orderItems,
        status: OrderStatus.PENDING, 
        timestamp: Date.now(),
        updatedAt: Date.now(),
        total: orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0),
        customerName: customerData.name, 
        customerPhone: customerData.phone, 
        peopleCount: customerData.peopleCount,
        accountType: customerData.accountType,
        source: 'DINE_IN'
      };
      onAddOrder(newOrder);
    }

    setCart([]);
    setStep('SUCCESS');
  };

  const requestFinalBill = () => {
    if (!paymentMethod) return alert("Por favor elige un método de pago.");
    myOrders.forEach(order => {
        onUpdateOrder({
            ...order,
            billRequested: true,
            paymentMethod,
            tipPercentage: typeof tipPercentage === 'number' ? tipPercentage : 0,
            tipAmount: order === myOrders[myOrders.length - 1] ? tipAmount : 0
        });
    });
    alert(`¡Mesero notificado! Tu cuenta total es de $${finalTotal}.`);
    localStorage.removeItem('bm_customer_session');
    onLogout();
  };

  if (step === 'WELCOME') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-12 animate-in fade-in">
        <div className="logo-pulse"><div className="custom-logo-container"><img src={logoUrl} className="logo-img" /></div></div>
        <h1 className="font-neon text-4xl neon-text-blue uppercase tracking-tighter leading-none">{restaurantName}</h1>
        <button onClick={() => setStep('TABLE_CHOICE')} className="bg-white text-black px-14 py-6 rounded-full font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">COMENZAR SERVICIO</button>
      </div>
    );
  }

  if (step === 'TABLE_CHOICE') {
    return (
        <div className="max-w-md mx-auto py-20 text-center space-y-12 animate-in zoom-in">
            <h2 className="font-neon text-3xl text-white uppercase tracking-tighter">¿Cómo deseas entrar?</h2>
            <div className="grid grid-cols-1 gap-6">
                <button 
                   onClick={() => { setIsExistingTable(true); setStep('SETUP'); }} 
                   className="w-full bg-[#111] border-4 border-slate-800 p-8 rounded-[3.5rem] hover:border-blue-500 transition-all flex flex-col items-center group"
                >
                    <i className="fas fa-user-check text-4xl mb-4 text-blue-400"></i>
                    <span className="font-black uppercase text-sm tracking-widest">Ya estoy consumiendo</span>
                </button>
                <button 
                   onClick={() => { setIsExistingTable(false); setStep('SETUP'); }} 
                   className="w-full bg-[#111] border-4 border-slate-800 p-8 rounded-[3.5rem] hover:border-pink-500 transition-all flex flex-col items-center group"
                >
                    <i className="fas fa-plus-circle text-4xl mb-4 text-pink-500"></i>
                    <span className="font-black uppercase text-sm tracking-widest">Soy una mesa nueva</span>
                </button>
            </div>
            <button onClick={() => setStep('WELCOME')} className="text-slate-600 uppercase font-black text-xs tracking-widest hover:text-white transition-colors">Volver</button>
        </div>
    );
  }

  if (step === 'SETUP') {
    return (
      <div className="max-w-md mx-auto py-10 space-y-8 animate-in slide-in-from-bottom">
        <h2 className="font-neon text-2xl text-center text-white uppercase">{isExistingTable ? 'Validar mi Sesión' : 'Configurar mi Mesa'}</h2>
        <div className="bg-[#111] p-10 rounded-[3rem] border border-slate-800 space-y-6 shadow-2xl overflow-y-auto max-h-[80vh] scrollbar-hide">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Tu Nombre:</label>
            <input className="w-full bg-black border border-slate-700 p-4 rounded-2xl text-white font-bold outline-none focus:border-blue-500" placeholder="Ejem: Juan Pérez" value={customerData.name} onChange={e => setCustomerData({...customerData, name: e.target.value})} />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">WhatsApp:</label>
            <input className="w-full bg-black border border-slate-700 p-4 rounded-2xl text-white font-bold outline-none focus:border-blue-500" placeholder="Número de celular" value={customerData.phone} onChange={e => setCustomerData({...customerData, phone: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Comensales:</label>
              <input type="number" min="1" max="20" className="w-full bg-black border border-slate-700 p-4 rounded-2xl text-white font-bold outline-none focus:border-blue-500 text-center" value={customerData.peopleCount} onChange={e => setCustomerData({...customerData, peopleCount: parseInt(e.target.value) || 1})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Mesa:</label>
              <select 
                className="w-full bg-black border border-slate-700 p-4 rounded-2xl text-white font-black uppercase text-xs outline-none focus:border-blue-500 cursor-pointer" 
                value={customerData.table} 
                onChange={e => setCustomerData({...customerData, table: e.target.value})}
              >
                  <option value="">-- ELIGE --</option>
                  {tables.map(t => {
                      const isOccupied = t.status === 'OCCUPIED';
                      if (isExistingTable) {
                          return <option key={t.id} value={t.id} disabled={!isOccupied}>Mesa #{t.number} {isOccupied ? '(Activa)' : '(Sin cuenta)'}</option>
                      }
                      return <option key={t.id} value={t.id} disabled={isOccupied}>Mesa #{t.number} {isOccupied ? '(Ocupada)' : '(Disponible)'}</option>
                  })}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Formato de Cuenta:</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setCustomerData({...customerData, accountType: 'SINGLE'})}
                className={`flex-1 py-4 rounded-2xl font-black text-[9px] uppercase border transition-all ${customerData.accountType === 'SINGLE' ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-black border-slate-800 text-slate-500'}`}
              >
                Cuenta Única
              </button>
              <button 
                onClick={() => setCustomerData({...customerData, accountType: 'SEPARATE'})}
                className={`flex-1 py-4 rounded-2xl font-black text-[9px] uppercase border transition-all ${customerData.accountType === 'SEPARATE' ? 'bg-pink-600 border-pink-400 text-white shadow-lg' : 'bg-black border-slate-800 text-slate-500'}`}
              >
                Por Separado
              </button>
            </div>
          </div>

          <button onClick={validateAndEnter} className="w-full bg-blue-600 py-6 rounded-2xl font-black uppercase text-white tracking-widest shadow-xl active:scale-95 transition-all">ACCEDER AL MENÚ</button>
        </div>
      </div>
    );
  }

  if (step === 'MENU') {
    return (
      <div className="max-w-lg mx-auto space-y-6 pb-40 animate-in fade-in">
        <div className="flex items-center justify-between bg-[#111] p-4 rounded-3xl border border-slate-800 sticky top-4 z-50 shadow-2xl backdrop-blur-md">
          <div className="flex items-center space-x-3">
             <div className="bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center font-black">M{customerData.table.replace('t','')}</div>
             <div className="flex flex-col">
                <p className="font-black text-[10px] uppercase text-white leading-none truncate max-w-[120px]">{customerData.name}</p>
                <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">{customerData.peopleCount} Pers. | {customerData.accountType === 'SINGLE' ? 'Única' : 'Sep.'}</p>
             </div>
          </div>
          <button onClick={() => setStep('VIEW_BILL')} className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-pink-500 shadow-lg"><i className="fas fa-receipt text-lg"></i></button>
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} className={`px-5 py-3 rounded-full font-black whitespace-nowrap uppercase text-[10px] border transition-all tracking-widest ${category === cat ? 'bg-pink-600 border-pink-400 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>{cat}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {products.filter(p => p.category === category).map(product => (
            <div key={product.id} className="bg-[#111] p-4 rounded-[2.5rem] border border-slate-800 flex gap-5 group hover:border-blue-500 transition-all active:scale-[0.98]">
              <div className="relative shrink-0">
                <img src={product.image} className="w-24 h-24 rounded-3xl object-cover border border-slate-800" />
              </div>
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                   <h4 className="font-black text-white text-sm uppercase tracking-tight">{product.name}</h4>
                   <p className="text-[9px] text-slate-500 uppercase mt-1 line-clamp-2">{product.description}</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xl font-black text-pink-500 tracking-tighter">${product.price}</span>
                  <button onClick={() => handleOpenSelection(product)} className="bg-blue-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"><i className="fas fa-plus"></i></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {productInSelection && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-6">
            <div className="bg-[#111] border border-blue-500/50 p-10 rounded-[3.5rem] w-full max-w-sm text-center space-y-8 animate-in zoom-in">
              <h3 className="font-neon text-xl text-blue-400 uppercase tracking-tight">{productInSelection.name}</h3>
              <p className="text-white font-black text-3xl mt-2 tracking-tighter">¿Alguna nota?</p>
              <textarea className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white text-xs outline-none focus:border-pink-500" placeholder="Ejem: Sin cebolla, extra picante..." value={customExclusions} onChange={(e) => setCustomExclusions(e.target.value)} rows={3} />
              <div className="space-y-4">
                <button onClick={() => confirmAddToCart(true)} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">¡AÑADIR A MI ORDEN! 🔥</button>
                <button onClick={() => setProductInSelection(null)} className="text-slate-600 font-black text-[9px] uppercase tracking-widest">CANCELAR</button>
              </div>
            </div>
          </div>
        )}

        {cart.length > 0 && (
          <div className="fixed bottom-8 left-6 right-6 max-w-md mx-auto bg-white text-black p-4 rounded-[2.5rem] shadow-[0_0_50px_rgba(255,255,255,0.2)] flex items-center justify-between z-[90] border-4 border-blue-400 animate-in slide-in-from-bottom">
             <div className="flex flex-col ml-4">
                <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Subtotal Selección</span>
                <span className="font-black text-2xl tracking-tighter leading-none">${cart.reduce((a,b)=>a+(b.price*b.quantity), 0)}</span>
             </div>
             <button onClick={startOrderFlow} className="bg-blue-600 px-8 py-4 rounded-2xl font-black uppercase text-[10px] text-white tracking-widest shadow-lg active:scale-95 transition-all">PEDIR AHORA <i className="fas fa-bolt ml-2"></i></button>
          </div>
        )}
      </div>
    );
  }

  if (step === 'ROULETTE') {
    return (
      <div className="max-w-md mx-auto py-10 text-center space-y-10 animate-in zoom-in duration-300">
        <h2 className="font-neon text-3xl neon-text-pink uppercase tracking-tighter">¡RULETA DE BIENVENIDA!</h2>
        <p className="text-slate-400 font-bold text-sm">Gira para ganar un premio sorpresa por ser nuevo cliente.</p>
        
        <div className="relative w-72 h-72 mx-auto">
          <div className={`w-full h-full rounded-full border-8 border-pink-600 flex items-center justify-center transition-all duration-[2500ms] ${isSpinning ? 'rotate-[1440deg]' : ''}`}>
             <i className="fas fa-gift text-7xl text-pink-500 shadow-neon"></i>
          </div>
          <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 w-8 h-12 bg-white rounded-b-full z-10 shadow-xl"></div>
        </div>

        {!wonPrize ? (
          <button 
            disabled={isSpinning}
            onClick={spinRoulette}
            className="bg-white text-black px-12 py-5 rounded-full font-black uppercase tracking-widest shadow-[0_0_30px_white] active:scale-95 transition-all"
          >
            {isSpinning ? 'GIRANDO...' : '¡GIRAR Y GANAR!'}
          </button>
        ) : (
          <div className="bg-emerald-600/10 border-2 border-emerald-500 p-8 rounded-[3rem] space-y-6 animate-in bounce-in">
            <h3 className="text-3xl font-black text-emerald-400 uppercase tracking-tighter">¡GANASTE!</h3>
            <p className="font-black text-white text-xl uppercase tracking-widest">{wonPrize.name}</p>
            <button 
              onClick={() => finalizeOrder(wonPrize)}
              className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              CONFIRMAR PEDIDO + REGALO
            </button>
          </div>
        )}
      </div>
    );
  }

  if (step === 'SUCCESS') {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-8 animate-in zoom-in">
        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-neon"><i className="fas fa-check text-5xl text-white"></i></div>
        <h2 className="font-neon text-3xl neon-text-blue uppercase tracking-tighter">¡LISTO!</h2>
        <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest mt-2">Tu pedido se está preparando.</p>
        <button onClick={() => setStep('MENU')} className="bg-white text-black px-12 py-5 rounded-full font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">Seguir Ordenando</button>
      </div>
    );
  }

  if (step === 'VIEW_BILL') {
    return (
      <div className="max-w-md mx-auto py-10 px-4 space-y-6 animate-in slide-in-from-right">
          <div className="flex justify-between items-center">
            <button onClick={() => setStep('MENU')} className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-800"><i className="fas fa-arrow-left"></i></button>
            <h2 className="font-neon text-xl text-pink-500 uppercase tracking-widest">Mi Cuenta</h2>
            <div className="w-12"></div>
          </div>
          <div className="bg-[#111] p-10 rounded-[3.5rem] border border-slate-800 space-y-6 shadow-2xl">
            {myOrders.length === 0 ? <p className="text-center py-20 opacity-20 font-black uppercase tracking-widest">Sin consumos aún</p> : (
              <div className="space-y-6">
                <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-hide">
                    {myOrders.flatMap(o => o.items).map((it, idx) => (
                    <div key={idx} className="flex justify-between text-xs font-bold border-b border-slate-800/50 pb-3 mb-3">
                        <div className="flex flex-col">
                           <span className="text-slate-300">x{it.quantity} {it.name}</span>
                           {it.notes && <span className="text-[8px] text-slate-600 italic uppercase">{it.notes}</span>}
                        </div>
                        <span className="text-white font-black">${it.price * it.quantity}</span>
                    </div>
                    ))}
                </div>
                <div className="pt-6 border-t-2 border-dashed border-slate-800 flex justify-between items-end">
                  <div className="text-left">
                     <p className="text-[10px] text-slate-500 font-black uppercase">Subtotal</p>
                     <p className="text-5xl font-black text-pink-500 tracking-tighter mt-1">${subtotal}</p>
                  </div>
                  <button onClick={() => setStep('CHECKOUT')} className="bg-pink-600 px-8 py-4 rounded-2xl font-black uppercase text-[10px] text-white tracking-widest shadow-xl">Pedir Cuenta <i className="fas fa-wallet ml-2"></i></button>
                </div>
              </div>
            )}
          </div>
      </div>
    );
  }

  if (step === 'CHECKOUT') {
    return (
      <div className="max-w-md mx-auto py-10 px-4 space-y-10 pb-20 animate-in slide-in-from-bottom">
        <h2 className="font-neon text-2xl text-center text-blue-400 uppercase tracking-tighter">Finalizar Servicio</h2>
        <div className="bg-[#111] p-10 rounded-[4rem] border border-slate-800 space-y-8 shadow-3xl">
          <div className="space-y-4">
             <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-4">¿Deseas agregar Propina?</label>
             <div className="grid grid-cols-2 gap-3">
                {[0, 10, 15, 20].map(pct => (
                  <button key={pct} onClick={() => setTipPercentage(pct)} className={`py-4 rounded-2xl font-black text-[10px] border transition-all tracking-widest ${tipPercentage === pct ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-black border-slate-800 text-slate-500'}`}>
                    {pct === 0 ? '0%' : `${pct}%`}
                  </button>
                ))}
             </div>
             <button onClick={() => setTipPercentage('OTHER')} className={`w-full py-4 rounded-2xl font-black text-[10px] border tracking-widest uppercase transition-all ${tipPercentage === 'OTHER' ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-black border-slate-800 text-slate-500'}`}>Monto Libre</button>
             {tipPercentage === 'OTHER' && <input type="number" className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white font-black text-center" value={customTip} onChange={e => setCustomTip(e.target.value)} placeholder="$ Cantidad" />}
          </div>
          <div className="space-y-4">
             <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest ml-4">Método de Pago:</label>
             <div className="flex gap-4">
                <button onClick={() => setPaymentMethod('CASH')} className={`flex-1 py-5 rounded-3xl border flex flex-col items-center transition-all ${paymentMethod === 'CASH' ? 'bg-pink-600 border-pink-400 text-white shadow-xl' : 'bg-black border-slate-800 text-slate-500'}`}><i className="fas fa-money-bill-wave mb-2 text-xl"></i><span className="text-[9px] font-black uppercase tracking-widest">Efectivo</span></button>
                <button onClick={() => setPaymentMethod('CARD')} className={`flex-1 py-5 rounded-3xl border flex flex-col items-center transition-all ${paymentMethod === 'CARD' ? 'bg-pink-600 border-pink-400 text-white shadow-xl' : 'bg-black border-slate-800 text-slate-500'}`}><i className="fas fa-credit-card mb-2 text-xl"></i><span className="text-[9px] font-black uppercase tracking-widest">Tarjeta</span></button>
             </div>
          </div>
          <div className="space-y-3 border-t border-slate-800 pt-8">
             <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest"><span>Consumo:</span> <span>${subtotal}</span></div>
             <div className="flex justify-between text-[11px] font-black text-blue-400 uppercase tracking-widest"><span>Propina:</span> <span>+${tipAmount}</span></div>
             <div className="flex justify-between items-end pt-5"><span className="text-sm font-black text-white uppercase tracking-widest">Total:</span><span className="text-5xl font-black neon-text-blue tracking-tighter">${finalTotal}</span></div>
          </div>
        </div>
        <button onClick={requestFinalBill} disabled={!paymentMethod} className="w-full py-7 bg-white text-black rounded-[3rem] font-black uppercase tracking-widest text-lg shadow-white shadow-2xl">SOLICITAR CUENTA</button>
      </div>
    );
  }

  return null;
};
