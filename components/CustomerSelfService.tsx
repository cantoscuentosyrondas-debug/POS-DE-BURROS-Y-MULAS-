
import React, { useState, useEffect } from 'react';
import { Table, Product, Order, OrderStatus, OrderItem } from '../types';

interface CustomerSelfServiceProps {
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

export const CustomerSelfService: React.FC<CustomerSelfServiceProps> = ({ 
  tables, products, categories, onAddOrder, onUpdateOrder, orders, onUpdateStatus, onLogout, logoUrl, restaurantName 
}) => {
  const [step, setStep] = useState<'WELCOME' | 'TABLE_CHOICE' | 'SETUP' | 'MENU' | 'ROULETTE' | 'SUCCESS' | 'VIEW_BILL' | 'CHECKOUT'>('WELCOME');
  const [customerData, setCustomerData] = useState({ name: '', phone: '', table: '' });
  const [isExistingTable, setIsExistingTable] = useState(false);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [category, setCategory] = useState(categories[0] || '');
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState<{id: string, name: string, code: string} | null>(null);
  
  const [productInSelection, setProductInSelection] = useState<Product | null>(null);
  const [customExclusions, setCustomExclusions] = useState('');

  // Checkout State
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
  }, []);

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
    if (!customerData.name || !customerData.table) return alert("Por favor ingresa tu nombre y selecciona una mesa.");
    
    if (isExistingTable) {
        const order = orders.find(o => o.tableId === customerData.table && o.status !== OrderStatus.PAID);
        if (order && order.customerName?.toLowerCase().includes(customerData.name.toLowerCase())) {
            setStep('MENU');
            localStorage.setItem('bm_customer_session', JSON.stringify(customerData));
        } else {
            alert("No encontramos una cuenta abierta con esos datos en la mesa seleccionada.");
        }
    } else {
        const table = tables.find(t => t.id === customerData.table);
        if (table?.status === 'FREE') {
            setStep('MENU');
            localStorage.setItem('bm_customer_session', JSON.stringify(customerData));
        } else {
            alert("Mesa no disponible. Elige una mesa libre o marca 'Ya tengo cuenta abierta'.");
        }
    }
  };

  const requestFinalBill = () => {
    if (!paymentMethod) return alert("Elige método de pago.");
    
    myOrders.forEach(order => {
        onUpdateOrder({
            ...order,
            billRequested: true,
            paymentMethod,
            tipPercentage: typeof tipPercentage === 'number' ? tipPercentage : 0,
            tipAmount: order === myOrders[myOrders.length - 1] ? tipAmount : 0
        });
    });

    alert(`¡Mesero notificado! Tu cuenta es de $${finalTotal}. Gracias por tu visita.`);
    localStorage.removeItem('bm_customer_session');
    onLogout();
  };

  if (step === 'WELCOME') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-12 animate-in fade-in duration-500">
        <div className="logo-pulse"><div className="custom-logo-container"><img src={logoUrl} className="logo-img" /></div></div>
        <div className="space-y-4">
           <h1 className="font-neon text-4xl neon-text-blue uppercase tracking-tighter leading-none">{restaurantName}</h1>
           <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.4em]">Experiencia Neón Auto-Servicio</p>
        </div>
        <button onClick={() => setStep('TABLE_CHOICE')} className="bg-white text-black px-12 py-5 rounded-full font-black uppercase tracking-widest shadow-[0_0_30px_white] hover:scale-105 active:scale-95 transition-all">COMENZAR ORDEN</button>
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
                   className="w-full bg-[#111] border-4 border-slate-800 p-8 rounded-[3.5rem] hover:border-blue-500 transition-all flex flex-col items-center group active:scale-95"
                >
                    <i className="fas fa-user-check text-4xl mb-4 text-blue-400 group-hover:scale-110 transition-transform"></i>
                    <span className="font-black uppercase text-sm tracking-widest">Ya tengo una cuenta abierta</span>
                </button>
                <button 
                   onClick={() => { setIsExistingTable(false); setStep('SETUP'); }} 
                   className="w-full bg-[#111] border-4 border-slate-800 p-8 rounded-[3.5rem] hover:border-pink-500 transition-all flex flex-col items-center group active:scale-95"
                >
                    <i className="fas fa-plus-circle text-4xl mb-4 text-pink-500 group-hover:scale-110 transition-transform"></i>
                    <span className="font-black uppercase text-sm tracking-widest">Soy una mesa nueva</span>
                </button>
            </div>
            <button onClick={() => setStep('WELCOME')} className="text-slate-600 uppercase font-black text-xs tracking-[0.2em] hover:text-white transition-colors">Regresar</button>
        </div>
    );
  }

  if (step === 'SETUP') {
    return (
      <div className="max-w-md mx-auto py-10 space-y-8 animate-in slide-in-from-bottom">
        <h2 className="font-neon text-2xl text-center text-white uppercase tracking-tight">{isExistingTable ? 'Validar mis Datos' : 'Abrir mi Mesa'}</h2>
        <div className="bg-[#111] p-10 rounded-[3rem] border border-slate-800 space-y-6 shadow-2xl">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nombre de la cuenta:</label>
            <input className="w-full bg-black border border-slate-700 p-4 rounded-2xl text-white font-bold outline-none focus:border-blue-500" placeholder="Ejem: Juan Pérez" value={customerData.name} onChange={e => setCustomerData({...customerData, name: e.target.value})} />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Teléfono (WhatsApp):</label>
            <input className="w-full bg-black border border-slate-700 p-4 rounded-2xl text-white font-bold outline-none focus:border-blue-500" placeholder="Tu número de contacto" value={customerData.phone} onChange={e => setCustomerData({...customerData, phone: e.target.value})} />
            <p className="text-[8px] text-slate-600 font-black uppercase tracking-tight italic ml-4">Genera tu historial y recibe beneficios.</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Tu número de Mesa:</label>
            <select 
              className="w-full bg-black border border-slate-700 p-4 rounded-2xl text-white font-black uppercase text-xs appearance-none cursor-pointer outline-none focus:border-blue-500" 
              value={customerData.table} 
              onChange={e => setCustomerData({...customerData, table: e.target.value})}
            >
                <option value="">-- Elige Número --</option>
                {tables.map(t => {
                    const isOccupied = t.status === 'OCCUPIED';
                    if (isExistingTable) {
                        return <option key={t.id} value={t.id} disabled={!isOccupied}>Mesa {t.number} {isOccupied ? '(Abierta)' : '(Vacía)'}</option>
                    }
                    return <option key={t.id} value={t.id} disabled={isOccupied}>Mesa {t.number} {isOccupied ? '(Ocupada)' : '(Disponible)'}</option>
                })}
            </select>
          </div>

          <button onClick={validateAndEnter} className="w-full bg-blue-600 py-6 rounded-2xl font-black uppercase text-white tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all">ACCEDER AL MENÚ</button>
          <button onClick={() => setStep('TABLE_CHOICE')} className="w-full text-slate-600 font-black uppercase text-[9px] tracking-widest text-center mt-2">Cambiar opción</button>
        </div>
      </div>
    );
  }

  if (step === 'MENU') {
    return (
      <div className="max-w-lg mx-auto space-y-6 pb-40 animate-in fade-in">
        <div className="flex items-center justify-between bg-[#111] p-4 rounded-3xl border border-slate-800 sticky top-4 z-50 shadow-2xl backdrop-blur-md">
          <div className="flex items-center space-x-3">
             <div className="bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-lg shadow-blue-600/20">M{customerData.table.replace('t','')}</div>
             <div className="flex flex-col">
                <p className="font-black text-[10px] uppercase text-white leading-none truncate max-w-[120px]">{customerData.name}</p>
                <p className="text-[8px] text-slate-500 font-bold uppercase mt-1 tracking-widest">Servicio Neón</p>
             </div>
          </div>
          <button onClick={() => setStep('VIEW_BILL')} className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-pink-500 shadow-lg active:scale-90 transition-all"><i className="fas fa-receipt text-lg"></i></button>
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
              <div className="w-24 h-24 mx-auto rounded-3xl overflow-hidden border-2 border-slate-800 shadow-xl">
                <img src={productInSelection.image} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-neon text-xl text-blue-400 uppercase tracking-tight">{productInSelection.name}</h3>
                <p className="text-white font-black text-3xl mt-2 tracking-tighter">¿Con todo?</p>
              </div>
              <div className="space-y-4">
                <button onClick={() => confirmAddToCart(true)} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">SÍ, CON TODO 🔥</button>
                <div className="relative">
                   <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                   <div className="relative flex justify-center text-[8px] font-black uppercase bg-[#111] px-4 text-slate-600">Personaliza tu orden</div>
                </div>
                <textarea className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white text-xs outline-none focus:border-pink-500" placeholder="Ejem: Sin cebolla, extra picante..." value={customExclusions} onChange={(e) => setCustomExclusions(e.target.value)} rows={2} />
                <button onClick={() => confirmAddToCart(false)} className="w-full py-4 bg-slate-900 text-pink-500 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Añadir con cambios</button>
                <button onClick={() => setProductInSelection(null)} className="text-slate-600 font-black text-[9px] uppercase tracking-[0.2em] hover:text-white transition-colors">Cancelar</button>
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
             <button onClick={() => {
                const newOrder: Order = {
                    id: `self_${Date.now()}`, tableId: customerData.table, items: cart,
                    status: OrderStatus.PENDING, timestamp: Date.now(),
                    total: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0),
                    customerName: customerData.name, customerPhone: customerData.phone, source: 'DINE_IN'
                };
                onAddOrder(newOrder); setCart([]); setStep('SUCCESS');
             }} className="bg-blue-600 px-8 py-4 rounded-2xl font-black uppercase text-[10px] text-white tracking-widest shadow-lg active:scale-95 transition-all">PEDIR AHORA <i className="fas fa-bolt ml-2"></i></button>
          </div>
        )}
      </div>
    );
  }

  if (step === 'SUCCESS') {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-8 animate-in zoom-in">
        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.5)] border-4 border-white/20">
           <i className="fas fa-check text-5xl text-white"></i>
        </div>
        <div>
           <h2 className="font-neon text-3xl neon-text-blue uppercase tracking-tighter">¡LISTO!</h2>
           <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.3em] mt-2">Tu pedido se está preparando en cocina</p>
        </div>
        <button onClick={() => setStep('MENU')} className="bg-white text-black px-12 py-5 rounded-full font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">Seguir Ordenando</button>
      </div>
    );
  }

  if (step === 'VIEW_BILL') {
    return (
      <div className="max-w-md mx-auto py-10 px-4 space-y-6 animate-in slide-in-from-right">
          <div className="flex justify-between items-center">
            <button onClick={() => setStep('MENU')} className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-800"><i className="fas fa-arrow-left"></i></button>
            <h2 className="font-neon text-xl text-pink-500 uppercase tracking-widest">Resumen Cuenta</h2>
            <div className="w-12"></div>
          </div>
          <div className="bg-[#111] p-10 rounded-[3.5rem] border border-slate-800 space-y-6 shadow-2xl">
            {myOrders.length === 0 ? (
                <div className="text-center py-20 opacity-20 flex flex-col items-center">
                   <i className="fas fa-receipt text-6xl mb-4"></i>
                   <p className="font-black uppercase tracking-widest text-[10px]">Aún no has realizado pedidos</p>
                </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-hide pr-2">
                    {myOrders.flatMap(o => o.items).map((it, idx) => (
                    <div key={idx} className="flex justify-between text-xs font-bold border-b border-slate-800/50 pb-3">
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
                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Consumo Acumulado</p>
                     <p className="text-5xl font-black text-pink-500 tracking-tighter leading-none mt-1">${subtotal}</p>
                  </div>
                  <button onClick={() => setStep('CHECKOUT')} className="bg-pink-600 px-8 py-4 rounded-2xl font-black uppercase text-[10px] text-white tracking-widest shadow-xl active:scale-95 transition-all">Pagar <i className="fas fa-wallet ml-2"></i></button>
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
        <div className="text-center space-y-4">
           <h2 className="font-neon text-2xl text-center text-blue-400 uppercase tracking-tighter">Finalizar mi Servicio</h2>
           <p className="text-slate-500 font-black uppercase text-[9px] tracking-[0.4em]">Gracias por visitarnos hoy, {customerData.name}</p>
        </div>

        <div className="bg-[#111] p-10 rounded-[4rem] border border-slate-800 space-y-8 shadow-3xl">
          <div className="space-y-4">
             <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-4">¿Deseas agregar Propina?</label>
             <div className="grid grid-cols-2 gap-3">
                {[0, 10, 15, 20].map(pct => (
                  <button key={pct} onClick={() => setTipPercentage(pct)} className={`py-4 rounded-2xl font-black text-[10px] border transition-all tracking-widest ${tipPercentage === pct ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-black border-slate-800 text-slate-500'}`}>
                    {pct === 0 ? '0% (Sin Propina)' : `${pct}%`}
                  </button>
                ))}
             </div>
             <button onClick={() => setTipPercentage('OTHER')} className={`w-full py-4 rounded-2xl font-black text-[10px] border tracking-widest uppercase transition-all ${tipPercentage === 'OTHER' ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-black border-slate-800 text-slate-500'}`}>Monto Personalizado</button>
             {tipPercentage === 'OTHER' && (
                <div className="animate-in slide-in-from-top mt-2">
                   <input type="number" className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white font-black text-center" value={customTip} onChange={e => setCustomTip(e.target.value)} placeholder="$ Ejem: 50" />
                </div>
             )}
          </div>

          <div className="space-y-4">
             <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest ml-4">¿Cómo prefieres pagar?</label>
             <div className="flex gap-4">
                <button onClick={() => setPaymentMethod('CASH')} className={`flex-1 py-5 rounded-3xl border flex flex-col items-center transition-all ${paymentMethod === 'CASH' ? 'bg-pink-600 border-pink-400 text-white shadow-xl shadow-pink-600/20' : 'bg-black border-slate-800 text-slate-500'}`}><i className="fas fa-money-bill-wave mb-2 text-xl"></i><span className="text-[9px] font-black uppercase tracking-widest">Efectivo</span></button>
                <button onClick={() => setPaymentMethod('CARD')} className={`flex-1 py-5 rounded-3xl border flex flex-col items-center transition-all ${paymentMethod === 'CARD' ? 'bg-pink-600 border-pink-400 text-white shadow-xl shadow-pink-600/20' : 'bg-black border-slate-800 text-slate-500'}`}><i className="fas fa-credit-card mb-2 text-xl"></i><span className="text-[9px] font-black uppercase tracking-widest">Tarjeta</span></button>
             </div>
          </div>

          <div className="space-y-3 border-t border-slate-800 pt-8">
             <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest"><span>Consumo:</span> <span>${subtotal}</span></div>
             <div className="flex justify-between text-[11px] font-black text-blue-400 uppercase tracking-widest"><span>Propina:</span> <span>+${tipAmount}</span></div>
             <div className="flex justify-between items-end pt-5"><span className="text-sm font-black text-white uppercase tracking-[0.2em]">Total Final:</span><span className="text-5xl font-black neon-text-blue tracking-tighter leading-none">${finalTotal}</span></div>
          </div>
        </div>
        
        <div className="space-y-4">
           <button onClick={requestFinalBill} disabled={!paymentMethod} className="w-full py-7 bg-white text-black rounded-[3rem] font-black uppercase tracking-widest text-lg disabled:opacity-20 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)]">SOLICITAR CUENTA</button>
           <p className="text-center italic text-slate-600 text-[10px] font-black uppercase tracking-widest">Tu mesero acudirá pronto con tu ticket <i className="fas fa-heart text-pink-500 ml-1"></i></p>
        </div>
      </div>
    );
  }

  return null;
};
