
import React, { useState, useMemo } from 'react';
import { Table, Product, Order, OrderStatus, OrderItem } from '../types';

interface WaiterTerminalProps {
  tables: Table[];
  products: Product[];
  categories: string[];
  activeOrders: Order[];
  onAddOrder: (order: Order) => void;
  onUpdateOrder: (order: Order) => void;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  restaurantName: string;
}

export const WaiterTerminal: React.FC<WaiterTerminalProps> = ({ 
  tables, products, categories, activeOrders, onAddOrder, onUpdateOrder, onUpdateStatus, restaurantName 
}) => {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [category, setCategory] = useState<string>(categories[0] || '');
  const [showSetup, setShowSetup] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', people: 1 });
  const [notingProduct, setNotingProduct] = useState<Product | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  
  const [closingOrder, setClosingOrder] = useState<Order | null>(null);
  const [tipPercentage, setTipPercentage] = useState<number | 'OTHER'>(10);
  const [customTip, setCustomTip] = useState('0');
  const [payMethod, setPayMethod] = useState<'CASH' | 'CARD'>('CASH');

  const currentOrder = useMemo(() => 
    selectedTable ? activeOrders.find(o => o.tableId === selectedTable.id) : null
  , [selectedTable, activeOrders]);

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    if (table.status === 'FREE') {
      setCustomerInfo({ name: '', phone: '', people: 1 });
      setShowSetup(true);
    } else {
      setShowSetup(false);
    }
    setCart([]);
  };

  const startNewTable = () => {
    if (!customerInfo.name) return alert("Nombre requerido");
    setShowSetup(false);
  };

  const sendToKitchen = () => {
    if (!selectedTable || cart.length === 0) return;

    if (currentOrder) {
      const updated: Order = {
        ...currentOrder,
        items: [...currentOrder.items, ...cart],
        total: currentOrder.total + cart.reduce((a, b) => a + (b.price * b.quantity), 0),
        status: OrderStatus.PENDING,
        updatedAt: Date.now()
      };
      onUpdateOrder(updated);
    } else {
      const newOrder: Order = {
        id: `ord_${Date.now()}`,
        tableId: selectedTable.id,
        items: cart,
        status: OrderStatus.PENDING,
        timestamp: Date.now(),
        total: cart.reduce((a, b) => a + (b.price * b.quantity), 0),
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        peopleCount: customerInfo.people,
        source: 'DINE_IN'
      };
      onAddOrder(newOrder);
    }
    setCart([]);
    alert("¡Pedido enviado!");
  };

  const handleCheckout = () => {
    if (!closingOrder) return;
    const subtotal = closingOrder.total;
    const tip = tipPercentage === 'OTHER' ? parseFloat(customTip) || 0 : Math.round(subtotal * (tipPercentage / 100));
    
    onUpdateOrder({ ...closingOrder, tipAmount: tip, paymentMethod: payMethod, status: OrderStatus.PAID });
    onUpdateStatus(closingOrder.id, OrderStatus.PAID);
    setClosingOrder(null);
    setSelectedTable(null);
  };

  if (!selectedTable) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 py-6">
        {tables.map(t => {
          const order = activeOrders.find(o => o.tableId === t.id);
          const isOcupied = t.status === 'OCCUPIED';
          return (
            <button key={t.id} onClick={() => handleTableClick(t)} className={`aspect-square rounded-3xl border-4 flex flex-col items-center justify-center transition-all ${isOcupied ? (order?.billRequested ? 'bg-yellow-400 border-white text-black' : 'bg-pink-900/20 border-pink-500 text-pink-500') : 'bg-slate-900/50 border-slate-800 text-slate-500'}`}>
              <span className="text-3xl font-black">{t.number}</span>
              <span className="text-[9px] font-black uppercase">{isOcupied ? `${order?.customerName}` : 'LIBRE'}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-in slide-in-from-right">
      <div className="bg-[#111] p-4 rounded-3xl border border-slate-800 flex justify-between items-center sticky top-2 z-50">
        <button onClick={() => setSelectedTable(null)} className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center"><i className="fas fa-arrow-left"></i></button>
        <h2 className="font-neon text-blue-400 uppercase">Mesa {selectedTable.number}</h2>
        {currentOrder && <button onClick={() => setClosingOrder(currentOrder)} className="bg-emerald-600 px-4 py-2 rounded-xl text-xs font-black uppercase"><i className="fas fa-wallet mr-2"></i> Cobrar</button>}
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(c => (
          <button key={c} onClick={() => setCategory(c)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase border whitespace-nowrap ${category === c ? 'bg-blue-600 border-blue-400' : 'bg-slate-900 border-slate-800'}`}>{c}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {products.filter(p => p.category === category).map(p => (
          <div key={p.id} onClick={() => setNotingProduct(p)} className="bg-[#111] p-3 rounded-2xl border border-slate-800 flex items-center justify-between active:scale-95 transition-all">
            <div className="flex items-center space-x-3">
              <img src={p.image} className="w-12 h-12 rounded-xl object-cover" />
              <div><p className="text-[10px] font-black text-white uppercase">{p.name}</p><p className="text-pink-500 font-black text-[10px]">${p.price}</p></div>
            </div>
            <i className="fas fa-plus-circle text-blue-500 text-xl"></i>
          </div>
        ))}
      </div>

      {/* Resumen de Comanda */}
      {(cart.length > 0 || (currentOrder?.items.length || 0) > 0) && (
        <div className="bg-[#0a0a0a] p-6 rounded-3xl border border-slate-800 mt-4 space-y-4">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resumen de Cuenta:</h3>
          {currentOrder?.items.map((it, i) => (
            <div key={`old-${i}`} className="flex justify-between text-xs opacity-60"><span>x{it.quantity} {it.name}</span><span>${it.price * it.quantity}</span></div>
          ))}
          {cart.map((it, i) => (
            <div key={`new-${i}`} className="flex justify-between text-xs text-blue-400 font-bold"><span>x{it.quantity} {it.name} *</span><span>${it.price * it.quantity}</span></div>
          ))}
          <div className="pt-3 border-t border-slate-800 flex justify-between items-end">
            <span className="text-xl font-black text-white">${(currentOrder?.total || 0) + cart.reduce((a,b)=>a+(b.price*b.quantity), 0)}</span>
            {cart.length > 0 && <button onClick={sendToKitchen} className="bg-blue-600 px-6 py-3 rounded-2xl font-black uppercase text-[10px]">Actualizar Pedido</button>}
          </div>
        </div>
      )}

      {showSetup && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111] p-8 rounded-[3rem] border border-blue-500/30 w-full max-w-sm space-y-6">
            <h3 className="font-neon text-center text-blue-400">ABRIR MESA {selectedTable.number}</h3>
            <input className="w-full bg-black p-4 rounded-2xl border border-slate-800 text-white" placeholder="Nombre Cliente" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
            <input className="w-full bg-black p-4 rounded-2xl border border-slate-800 text-white" placeholder="WhatsApp (Opcional)" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} />
            <div className="flex gap-2">
              <button onClick={() => setSelectedTable(null)} className="flex-1 py-4 bg-slate-900 rounded-2xl text-slate-500 font-black">CANCELAR</button>
              <button onClick={startNewTable} className="flex-1 py-4 bg-blue-600 rounded-2xl text-white font-black">ACEPTAR</button>
            </div>
          </div>
        </div>
      )}

      {notingProduct && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111] p-8 rounded-[3rem] border border-pink-500/30 w-full max-w-sm space-y-6">
            <h4 className="font-black text-white text-center uppercase">{notingProduct.name}</h4>
            <textarea className="w-full bg-black p-4 rounded-2xl border border-slate-800 text-white text-xs" rows={3} placeholder="Instrucciones especiales..." value={tempNotes} onChange={e => setTempNotes(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => setNotingProduct(null)} className="flex-1 py-4 bg-slate-900 rounded-2xl text-[10px] font-black uppercase">Cerrar</button>
              <button onClick={() => { setCart([...cart, { productId: notingProduct.id, name: notingProduct.name, price: notingProduct.price, quantity: 1, notes: tempNotes }]); setNotingProduct(null); setTempNotes(''); }} className="flex-1 py-4 bg-pink-600 rounded-2xl text-[10px] font-black uppercase">Añadir</button>
            </div>
          </div>
        </div>
      )}

      {closingOrder && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="bg-[#111] p-10 rounded-[3.5rem] border border-emerald-500/30 w-full max-w-lg space-y-8">
            <div className="text-center"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cobro Mesa {selectedTable.number}</p><h3 className="text-3xl font-black text-white">${closingOrder.total + (tipPercentage === 'OTHER' ? parseFloat(customTip) || 0 : Math.round(closingOrder.total * (tipPercentage / 100)))}</h3></div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Propina:</label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 10, 15, 20].map(p => <button key={p} onClick={() => setTipPercentage(p)} className={`py-4 rounded-2xl font-black text-[10px] border ${tipPercentage === p ? 'bg-blue-600 border-blue-400' : 'bg-black border-slate-800 text-slate-500'}`}>{p}%</button>)}
              </div>
              <button onClick={() => setTipPercentage('OTHER')} className={`w-full py-4 rounded-2xl font-black text-[10px] border ${tipPercentage === 'OTHER' ? 'bg-blue-600 border-blue-400' : 'bg-black border-slate-800 text-slate-500'}`}>Monto Libre</button>
              {tipPercentage === 'OTHER' && <input className="w-full bg-black p-4 rounded-2xl border border-slate-800 text-center font-black" type="number" value={customTip} onChange={e => setCustomTip(e.target.value)} placeholder="$ Cantidad" />}
            </div>
            <div className="flex gap-4">
              <button onClick={() => setPayMethod('CASH')} className={`flex-1 py-5 rounded-2xl border flex flex-col items-center ${payMethod === 'CASH' ? 'bg-pink-600 border-pink-400' : 'bg-black border-slate-800 text-slate-500'}`}><i className="fas fa-money-bill-wave mb-2"></i><span className="text-[8px] font-black uppercase">Efectivo</span></button>
              <button onClick={() => setPayMethod('CARD')} className={`flex-1 py-5 rounded-2xl border flex flex-col items-center ${payMethod === 'CARD' ? 'bg-pink-600 border-pink-400' : 'bg-black border-slate-800 text-slate-500'}`}><i className="fas fa-credit-card mb-2"></i><span className="text-[8px] font-black uppercase">Tarjeta</span></button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setClosingOrder(null)} className="flex-1 py-5 bg-slate-900 rounded-2xl font-black text-xs text-slate-500">ATRÁS</button>
              <button onClick={handleCheckout} className="flex-1 py-5 bg-emerald-600 rounded-2xl font-black text-xs text-white shadow-xl shadow-emerald-600/20">REGISTRAR PAGO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
