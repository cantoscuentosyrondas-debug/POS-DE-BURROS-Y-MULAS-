
import React, { useState } from 'react';
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
  const [customerName, setCustomerName] = useState('');
  const [peopleCount, setPeopleCount] = useState(1);
  const [accountType, setAccountType] = useState<'SINGLE' | 'SEPARATE'>('SINGLE');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [category, setCategory] = useState<string>(categories[0] || '');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [closingOrder, setClosingOrder] = useState<Order | null>(null);
  const [manualPaymentMethod, setManualPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  
  const [notingProduct, setNotingProduct] = useState<Product | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  const alerts = activeOrders.filter(o => 
    o.status === OrderStatus.PENDING || o.status === OrderStatus.READY || o.billRequested
  );

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    const tableOrders = activeOrders.filter(o => o.tableId === table.id && o.status !== OrderStatus.PAID);
    
    if (table.status === 'FREE') {
      setCustomerName('');
      setPeopleCount(1);
      setAccountType('SINGLE');
      setShowNamePrompt(true);
      setCart([]);
    } else {
      const mainOrder = tableOrders[0];
      setCustomerName(mainOrder?.customerName || 'Cliente');
      setPeopleCount(mainOrder?.peopleCount || 1);
      setAccountType(mainOrder?.accountType || 'SINGLE');
      setCart([]);
      setShowNamePrompt(false);
    }
  };

  const startOrder = () => {
    if (!customerName.trim()) return alert("Ingresa un nombre para identificar la mesa.");
    setShowNamePrompt(false);
  };

  const addToCart = () => {
    if (!notingProduct) return;
    setCart(prev => [...prev, { 
      productId: notingProduct.id, 
      name: notingProduct.name, 
      price: notingProduct.price, 
      quantity: 1,
      notes: tempNotes || 'Con todo' 
    }]);
    setNotingProduct(null);
    setTempNotes('');
  };

  const submitToTable = () => {
    if (!selectedTable || cart.length === 0) return;
    
    const existingOrder = activeOrders.find(o => o.tableId === selectedTable.id && o.status !== OrderStatus.PAID);

    if (existingOrder) {
      // Si la cuenta ya existe, añadimos los productos y REINICIAMOS el estado a PENDING
      // para que el Chef vuelva a ver el ticket en la pantalla de cocina
      const updatedOrder = {
        ...existingOrder,
        items: [...existingOrder.items, ...cart],
        status: OrderStatus.PENDING, 
        updatedAt: Date.now(),
        total: existingOrder.total + cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
      };
      onUpdateOrder(updatedOrder);
      alert("Comanda actualizada. Enviada a cocina.");
    } else {
      const newOrder: Order = {
        id: `ord_${Date.now()}`,
        tableId: selectedTable.id,
        items: cart,
        status: OrderStatus.PENDING,
        timestamp: Date.now(),
        updatedAt: Date.now(),
        total: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0),
        customerName: customerName,
        peopleCount: peopleCount,
        accountType: accountType,
        source: 'DINE_IN'
      };
      onAddOrder(newOrder);
      alert("Comanda abierta con éxito.");
    }
    setCart([]);
  };

  const openCheckout = (order: Order) => {
    setClosingOrder(order);
    if (order.paymentMethod) setManualPaymentMethod(order.paymentMethod);
  };

  const processPayment = () => {
    if (!closingOrder) return;
    const finalOrder = {
      ...closingOrder,
      paymentMethod: manualPaymentMethod,
      billRequested: false,
      status: OrderStatus.PAID
    };
    onUpdateOrder(finalOrder);
    onUpdateStatus(finalOrder.id, OrderStatus.PAID);
    setClosingOrder(null);
    setSelectedTable(null);
    alert(`Mesa #${closingOrder.tableId?.replace('t','')} pagada y liberada.`);
  };

  const currentTableOrders = selectedTable ? activeOrders.filter(o => o.tableId === selectedTable.id && o.status !== OrderStatus.PAID) : [];
  const accumulatedTotal = currentTableOrders.reduce((acc, o) => acc + o.total, 0);

  if (!selectedTable) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        <div className="flex justify-between items-center bg-[#111] p-6 rounded-[2.5rem] border border-slate-800 shadow-xl">
           <h2 className="font-neon text-2xl neon-text-blue uppercase tracking-tighter">Mesas Activas</h2>
           <button onClick={() => setShowNotifications(!showNotifications)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase border transition-all ${alerts.length > 0 ? 'bg-pink-600 border-pink-400 text-white animate-pulse shadow-lg' : 'bg-slate-900 text-slate-500'}`}>Notificaciones ({alerts.length})</button>
        </div>

        {showNotifications && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top duration-300">
            {alerts.map(alert => (
              <div key={alert.id} className={`p-6 rounded-[2rem] border-2 ${alert.billRequested ? 'bg-white text-black border-pink-500 shadow-[0_0_20px_white]' : (alert.status === OrderStatus.READY ? 'bg-emerald-950 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-black border-blue-500 text-white shadow-[0_0_20px_rgba(51,204,255,0.3)]')}`}>
                <p className="font-black uppercase text-[10px] mb-2 opacity-60">Mesa #{alert.tableId?.replace('t','')}</p>
                <h4 className="font-black text-sm uppercase leading-none">{alert.billRequested ? '¡SOLICITUD DE CUENTA!' : (alert.status === OrderStatus.READY ? 'PEDIDO LISTO' : 'NUEVO PEDIDO')}</h4>
                <button onClick={() => alert.billRequested ? openCheckout(alert) : onUpdateStatus(alert.id, alert.status === OrderStatus.READY ? OrderStatus.SERVED : OrderStatus.PREPARING)} className="w-full mt-4 py-3 bg-black text-white border border-white/20 rounded-xl text-[9px] font-black uppercase shadow-lg active:scale-95 transition-all">Atender</button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {tables.slice(0, 10).map(table => {
            const tableOrder = activeOrders.find(o => o.tableId === table.id && o.status !== OrderStatus.PAID);
            const isBillRequested = tableOrder?.billRequested;
            const isReady = tableOrder?.status === OrderStatus.READY;
            return (
              <button
                key={table.id}
                onClick={() => handleTableClick(table)}
                className={`aspect-square rounded-[2.5rem] border-4 flex flex-col items-center justify-center transition-all shadow-xl relative group ${
                  table.status === 'OCCUPIED' 
                    ? (isBillRequested ? 'border-yellow-400 bg-white text-black animate-pulse' : (isReady ? 'border-emerald-500 bg-emerald-900/20 text-emerald-400' : 'border-pink-600 bg-pink-900/10 text-pink-500'))
                    : 'border-slate-800 bg-black text-slate-700 hover:border-blue-500 active:scale-95'
                }`}
              >
                <span className="text-4xl font-black font-neon">{table.number}</span>
                <span className="text-[8px] font-black uppercase mt-1 tracking-widest">{table.status === 'OCCUPIED' ? `${tableOrder?.peopleCount}P | ${tableOrder?.accountType === 'SINGLE' ? 'U' : 'S'}` : 'LIBRE'}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 pb-32 animate-in slide-in-from-right">
      <div className="flex-1 space-y-6">
        <div className="bg-[#111] p-6 rounded-[2rem] border border-slate-800 flex justify-between items-center shadow-2xl">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSelectedTable(null)} className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-700 transition-colors shadow-lg"><i className="fas fa-arrow-left"></i></button>
            <h2 className="font-neon text-xl neon-text-blue uppercase tracking-tight">MESA #{selectedTable.number}</h2>
          </div>
          {selectedTable.status === 'OCCUPIED' && (
            <button onClick={() => openCheckout(currentTableOrders[0])} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-[9px] shadow-lg hover:bg-emerald-500 active:scale-95 transition-all">Cobrar / Cerrar</button>
          )}
        </div>

        {selectedTable.status === 'OCCUPIED' && (
          <div className="bg-black/50 p-6 rounded-[2rem] border border-slate-800 shadow-xl space-y-4">
            <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">
               <span>{customerName}</span>
               <span className="text-blue-400">{peopleCount} Comensales | Cuenta {accountType === 'SINGLE' ? 'Única' : 'Separada'}</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide px-2">
              {currentTableOrders.flatMap(o => o.items).map((it, idx) => (
                <div key={idx} className="flex justify-between text-xs font-bold border-b border-slate-800/30 pb-2 mb-2">
                  <div className="flex flex-col">
                    <span className="text-slate-200">x{it.quantity} {it.name}</span>
                    {it.notes && <span className="text-[8px] text-slate-600 uppercase italic">({it.notes})</span>}
                  </div>
                  <span className="text-white font-black">${it.price * it.quantity}</span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-slate-800 flex justify-between items-end px-2">
              <span className="text-[10px] font-black uppercase text-slate-500">Subtotal Mesa:</span>
              <span className="font-black text-3xl neon-text-blue tracking-tighter leading-none">${accumulatedTotal}</span>
            </div>
          </div>
        )}

        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} className={`px-5 py-3 rounded-full text-[10px] font-black uppercase border transition-all tracking-widest ${category === cat ? 'bg-blue-600 text-white border-blue-400 shadow-lg' : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-white'}`}>{cat}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.filter(p => p.category === category).map(product => (
            <div key={product.id} className="bg-[#111] p-4 rounded-[2rem] border border-slate-800 flex items-center justify-between group hover:border-blue-500 transition-all active:scale-[0.98]">
              <div className="flex items-center space-x-4">
                <img src={product.image} className="w-12 h-12 rounded-2xl object-cover border border-slate-800" />
                <div>
                   <h4 className="font-bold text-white text-xs uppercase leading-none">{product.name}</h4>
                   <p className="text-[10px] text-pink-500 font-black mt-1">${product.price}</p>
                </div>
              </div>
              <button onClick={() => { setNotingProduct(product); setTempNotes(''); }} className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"><i className="fas fa-plus"></i></button>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full md:w-80 h-full">
        <div className="bg-[#111] border border-slate-800 rounded-[3rem] p-8 flex flex-col min-h-[400px] shadow-2xl sticky top-24">
          <h3 className="font-black text-[10px] uppercase text-blue-400 tracking-widest mb-6 text-center">Ticket en Preparación</h3>
          <div className="flex-1 space-y-4 overflow-y-auto scrollbar-hide mb-8">
            {cart.map((it, i) => (
              <div key={i} className="flex justify-between items-start text-[10px] font-bold border-b border-slate-800 pb-3">
                <div className="flex flex-col">
                  <span className="text-white">x{it.quantity} {it.name}</span>
                  <span className="text-[8px] text-slate-600 italic uppercase">{it.notes}</span>
                </div>
                <span className="text-pink-500 font-black">${it.price * it.quantity}</span>
              </div>
            ))}
            {cart.length === 0 && <p className="text-center py-10 opacity-20 text-xs font-black uppercase tracking-widest">Carrito Vacío</p>}
          </div>
          <div className="pt-4 border-t border-slate-800 mb-6 flex justify-between items-center">
             <span className="text-[9px] font-black text-slate-500 uppercase">Total Selección</span>
             <span className="text-xl font-black text-white">${cart.reduce((a, b) => a + (b.price * b.quantity), 0)}</span>
          </div>
          <button onClick={submitToTable} disabled={cart.length === 0} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest disabled:opacity-20 shadow-xl active:scale-95 transition-all">MANDAR A COMANDA</button>
        </div>
      </div>

      {showNamePrompt && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[250] flex items-center justify-center p-6">
          <div className="bg-[#111] border border-blue-500/30 p-10 rounded-[4rem] w-full max-w-sm text-center space-y-8 shadow-3xl animate-in zoom-in">
            <h3 className="font-neon text-2xl neon-text-blue uppercase tracking-tight">ABRIR MESA #{selectedTable.number}</h3>
            <div className="space-y-4 text-left">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nombre Referencia:</label>
                <input className="w-full bg-black border border-slate-800 p-5 rounded-3xl text-white font-black uppercase outline-none focus:border-blue-500" placeholder="Juan Pérez" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Comensales:</label>
                    <input type="number" min="1" className="w-full bg-black border border-slate-800 p-5 rounded-3xl text-white font-black text-center outline-none focus:border-blue-500" value={peopleCount} onChange={e => setPeopleCount(parseInt(e.target.value) || 1)} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Tipo de Pago:</label>
                    <select className="w-full bg-black border border-slate-800 p-5 rounded-3xl text-white font-black text-[9px] uppercase cursor-pointer outline-none focus:border-blue-500" value={accountType} onChange={e => setAccountType(e.target.value as any)}>
                      <option value="SINGLE">ÚNICA</option>
                      <option value="SEPARATE">SEPARADA</option>
                    </select>
                 </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setSelectedTable(null)} className="flex-1 py-5 bg-slate-900 text-slate-500 font-black uppercase text-[10px] rounded-2xl tracking-widest">CANCELAR</button>
              <button onClick={startOrder} className="flex-1 py-5 bg-blue-600 text-white font-black uppercase text-[10px] rounded-2xl shadow-xl tracking-widest active:scale-95 transition-all">INICIAR MESA</button>
            </div>
          </div>
        </div>
      )}

      {notingProduct && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[300] flex items-center justify-center p-6">
          <div className="bg-[#111] border border-blue-500/50 p-8 rounded-[3.5rem] w-full max-w-sm space-y-6 shadow-3xl text-center animate-in zoom-in">
            <h3 className="font-neon text-xl text-blue-400 uppercase tracking-tight">{notingProduct.name}</h3>
            <textarea className="w-full bg-black border border-slate-800 p-5 rounded-2xl text-white text-xs outline-none focus:border-pink-500" placeholder="Sin cebolla, extra picante..." value={tempNotes} onChange={(e) => setTempNotes(e.target.value)} rows={3} />
            <div className="flex gap-4">
               <button onClick={() => setNotingProduct(null)} className="flex-1 py-4 bg-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest">VOLVER</button>
               <button onClick={addToCart} className="flex-1 py-4 bg-blue-600 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">AGREGAR</button>
            </div>
          </div>
        </div>
      )}

      {closingOrder && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[400] flex items-center justify-center p-6">
          <div className="bg-[#111] border border-emerald-500/30 p-12 rounded-[5rem] w-full max-w-lg space-y-8 shadow-3xl animate-in zoom-in">
             <div className="text-center space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em]">Resumen de Mesa #{closingOrder.tableId?.replace('t','')}</p>
                <h3 className="font-neon text-3xl text-emerald-400 uppercase tracking-tighter">CERRAR CUENTA</h3>
             </div>
             <div className="space-y-6">
                <div className="bg-black/50 p-6 rounded-[2.5rem] border border-slate-800 space-y-3">
                   <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest"><span>Consumo Subtotal:</span> <span>${closingOrder.total}</span></div>
                   <div className="flex justify-between text-[11px] font-black text-emerald-400 uppercase tracking-widest"><span>Propina Sugerida:</span> <span>+${closingOrder.tipAmount || 0}</span></div>
                   <div className="flex justify-between items-end border-t border-slate-800 pt-5">
                      <span className="font-black text-white uppercase text-sm tracking-widest">Gran Total:</span>
                      <span className="text-5xl font-black text-emerald-400 tracking-tighter">${closingOrder.total + (closingOrder.tipAmount || 0)}</span>
                   </div>
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Método de Pago:</label>
                   <div className="flex gap-4">
                      <button onClick={() => setManualPaymentMethod('CASH')} className={`flex-1 py-4 rounded-2xl border font-black text-[9px] uppercase tracking-widest transition-all ${manualPaymentMethod === 'CASH' ? 'bg-emerald-600 border-emerald-400 text-white shadow-xl' : 'bg-black border-slate-800 text-slate-500'}`}><i className="fas fa-money-bill-wave mr-2"></i> Efectivo</button>
                      <button onClick={() => setManualPaymentMethod('CARD')} className={`flex-1 py-4 rounded-2xl border font-black text-[9px] uppercase tracking-widest transition-all ${manualPaymentMethod === 'CARD' ? 'bg-emerald-600 border-emerald-400 text-white shadow-xl' : 'bg-black border-slate-800 text-slate-500'}`}><i className="fas fa-credit-card mr-2"></i> Tarjeta</button>
                   </div>
                </div>
             </div>
             <div className="flex gap-4">
                <button onClick={() => setClosingOrder(null)} className="flex-1 py-6 bg-slate-900 text-slate-500 font-black uppercase text-[10px] rounded-3xl tracking-widest active:scale-95 transition-all">VOLVER</button>
                <button onClick={processPayment} className="flex-1 py-6 bg-emerald-600 text-white font-black uppercase text-[10px] rounded-3xl shadow-xl shadow-emerald-600/20 tracking-widest active:scale-95 transition-all">CONFIRMAR PAGO</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
