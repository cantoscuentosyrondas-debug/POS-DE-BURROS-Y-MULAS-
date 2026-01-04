
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
      setShowNamePrompt(true);
      setCart([]);
    } else {
      const mainOrder = tableOrders[0];
      setCustomerName(mainOrder?.customerName || 'Cliente');
      setCart([]);
      setShowNamePrompt(false);
    }
  };

  const startOrder = () => {
    if (!customerName.trim()) return alert("Ingresa un nombre.");
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
      const updatedOrder = {
        ...existingOrder,
        items: [...existingOrder.items, ...cart],
        total: existingOrder.total + cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
      };
      onUpdateOrder(updatedOrder);
      alert("Productos agregados a la cuenta existente.");
    } else {
      const newOrder: Order = {
        id: `ord_${Date.now()}`,
        tableId: selectedTable.id,
        items: cart,
        status: OrderStatus.PENDING,
        timestamp: Date.now(),
        total: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0),
        customerName: customerName,
        source: 'DINE_IN'
      };
      onAddOrder(newOrder);
      alert("Nueva comanda cargada.");
    }
    setCart([]);
  };

  const openCheckout = (order: Order) => {
    setClosingOrder(order);
    if (order.paymentMethod) setManualPaymentMethod(order.paymentMethod);
  };

  const processPayment = () => {
    if (!closingOrder) return;
    
    // Marcar orden como pagada y remover el billRequested
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
    alert(`Mesa cerrada. Pago recibido en ${manualPaymentMethod === 'CARD' ? 'Tarjeta' : 'Efectivo'}.`);
  };

  const currentTableOrders = selectedTable ? activeOrders.filter(o => o.tableId === selectedTable.id && o.status !== OrderStatus.PAID) : [];
  const accumulatedTotal = currentTableOrders.reduce((acc, o) => acc + o.total, 0);

  if (!selectedTable) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        <div className="flex justify-between items-center bg-[#111] p-6 rounded-[2.5rem] border border-slate-800">
           <h2 className="font-neon text-2xl neon-text-blue uppercase tracking-tighter">Terminal de Meseros</h2>
           <button 
             onClick={() => setShowNotifications(!showNotifications)}
             className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase border transition-all ${alerts.length > 0 ? 'bg-pink-600 border-pink-400 text-white animate-pulse shadow-lg shadow-pink-600/20' : 'bg-slate-900 text-slate-500'}`}
           >
             Alertas ({alerts.length}) <i className="fas fa-bell ml-2"></i>
           </button>
        </div>

        {showNotifications && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top duration-300">
            {alerts.map(alert => (
              <div key={alert.id} className={`p-6 rounded-[2rem] border-2 ${alert.billRequested ? 'bg-white text-black border-pink-500' : (alert.status === OrderStatus.READY ? 'bg-emerald-950 border-emerald-500 text-white' : 'bg-black border-blue-500 text-white')}`}>
                <p className="font-black uppercase text-[10px] mb-2">Mesa {alert.tableId?.replace('t','')}</p>
                <h4 className="font-black text-sm uppercase">
                  {alert.billRequested ? '¡PIDE CUENTA!' : (alert.status === OrderStatus.READY ? '¡LISTO EN COCINA!' : 'NUEVO PEDIDO')}
                </h4>
                <p className="text-[10px] mt-2 opacity-70 font-bold uppercase">Cliente: {alert.customerName}</p>
                {alert.billRequested && (
                  <div className="mt-2 text-[11px] font-black uppercase space-y-1 bg-slate-100 p-3 rounded-xl text-black">
                    <div className="flex justify-between"><span>Subtotal:</span> <span>${alert.total}</span></div>
                    <div className="flex justify-between text-pink-600"><span>Propina:</span> <span>${alert.tipAmount || 0}</span></div>
                    <div className="flex justify-between border-t border-slate-300 pt-1 text-xs"><span>TOTAL:</span> <span>${alert.total + (alert.tipAmount || 0)}</span></div>
                    <div className="text-[9px] mt-1 italic text-slate-500">Paga con: {alert.paymentMethod === 'CARD' ? 'Tarjeta' : 'Efectivo'}</div>
                  </div>
                )}
                <button 
                  onClick={() => alert.billRequested ? openCheckout(alert) : onUpdateStatus(alert.id, alert.status === OrderStatus.READY ? OrderStatus.SERVED : OrderStatus.PREPARING)}
                  className="w-full mt-4 py-3 bg-black text-white border border-white/20 rounded-xl text-[9px] font-black uppercase hover:bg-slate-900 transition-colors shadow-lg"
                >
                  {alert.billRequested ? 'Cerrar y Cobrar' : 'Confirmar'}
                </button>
              </div>
            ))}
            {alerts.length === 0 && <p className="col-span-full text-center text-slate-600 font-black uppercase text-[10px] py-4">Sin notificaciones</p>}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {tables.map(table => {
            const tableOrder = activeOrders.find(o => o.tableId === table.id && o.status !== OrderStatus.PAID);
            const isBillRequested = tableOrder?.billRequested;
            const isReady = tableOrder?.status === OrderStatus.READY;
            return (
              <button
                key={table.id}
                onClick={() => handleTableClick(table)}
                className={`aspect-square rounded-[2.5rem] border-4 flex flex-col items-center justify-center transition-all shadow-xl relative ${
                  table.status === 'OCCUPIED' 
                    ? (isBillRequested ? 'border-yellow-400 bg-white text-black animate-pulse' : (isReady ? 'border-emerald-500 bg-emerald-900/20 text-emerald-400' : 'border-pink-600 bg-pink-900/10 text-pink-500'))
                    : 'border-slate-800 bg-black text-slate-700 hover:border-blue-500'
                }`}
              >
                <span className="text-5xl font-black font-neon">{table.number}</span>
                <span className="text-[8px] font-black uppercase mt-2">
                  {isBillRequested ? 'COBRAR' : (isReady ? 'LISTO' : (table.status === 'OCCUPIED' ? 'OCUPADA' : 'LIBRE'))}
                </span>
                {table.status === 'OCCUPIED' && (
                  <span className="absolute bottom-4 text-[7px] font-black text-slate-400 truncate w-full px-2 text-center uppercase">{tableOrder?.customerName}</span>
                )}
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
        <div className="bg-[#111] p-6 rounded-[2rem] border border-slate-800 flex justify-between items-center shadow-xl">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSelectedTable(null)} className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-700 transition-colors"><i className="fas fa-arrow-left"></i></button>
            <h2 className="font-neon text-2xl neon-text-blue uppercase tracking-tighter">MESA {selectedTable.number}</h2>
          </div>
          {selectedTable.status === 'OCCUPIED' && (
            <button onClick={() => openCheckout(currentTableOrders[0])} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20">Cerrar y Cobrar <i className="fas fa-cash-register ml-2"></i></button>
          )}
        </div>

        {selectedTable.status === 'OCCUPIED' && (
          <div className="bg-black/50 p-6 rounded-[2rem] border border-slate-800 shadow-xl">
            <div className="flex justify-between items-center mb-4">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cuenta de: {customerName}</p>
               <span className="bg-blue-600/10 border border-blue-500/20 px-3 py-1 rounded-full text-[8px] font-black text-blue-400 uppercase tracking-widest">Servicio Activo</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
              {currentTableOrders.flatMap(o => o.items).map((it, idx) => (
                <div key={idx} className="flex justify-between text-xs font-bold border-b border-slate-800/30 pb-2 mb-2">
                  <div className="flex flex-col">
                     <span className="text-slate-200">x{it.quantity} {it.name}</span>
                     {it.notes && <span className="text-[8px] text-yellow-500 italic uppercase">Obs: {it.notes}</span>}
                  </div>
                  <span className="text-white font-black">${it.price * it.quantity}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
              <span className="font-black uppercase text-[10px] text-blue-400 tracking-widest">Total Acumulado:</span>
              <span className="font-black text-3xl neon-text-blue tracking-tighter">${accumulatedTotal}</span>
            </div>
          </div>
        )}

        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase border transition-all ${category === cat ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(51,204,255,0.3)]' : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-white'}`}>{cat}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.filter(p => p.category === category).map(product => (
            <div key={product.id} className="bg-[#111] p-4 rounded-[2rem] border border-slate-800 flex items-center justify-between hover:border-blue-500 transition-all group active:scale-95">
              <div className="flex items-center space-x-3">
                <img src={product.image} className="w-12 h-12 rounded-xl object-cover border border-slate-700" />
                <div>
                   <h4 className="font-bold text-white text-xs uppercase tracking-tight">{product.name}</h4>
                   <p className="text-pink-500 font-black text-sm">${product.price}</p>
                </div>
              </div>
              <button onClick={() => { setNotingProduct(product); setTempNotes(''); }} className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 hover:bg-blue-500 transition-colors"><i className="fas fa-plus"></i></button>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full md:w-80">
        <div className="bg-[#111] border border-slate-800 rounded-[3rem] p-8 flex flex-col h-full sticky top-24 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
             <h3 className="font-black text-xs uppercase text-blue-400 tracking-widest">Nueva Selección</h3>
             <button onClick={() => setCart([])} className="text-slate-600 hover:text-red-500 transition-colors"><i className="fas fa-trash-alt"></i></button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto scrollbar-hide mb-6">
            {cart.map((it, i) => (
              <div key={i} className="flex justify-between items-center text-[11px] font-bold border-b border-slate-800 pb-2">
                <div className="flex flex-col">
                  <span className="text-white">x{it.quantity} {it.name}</span>
                  {it.notes && <span className="text-[8px] text-yellow-500 italic uppercase">{it.notes}</span>}
                </div>
                <span className="text-pink-500 font-black">${it.price * it.quantity}</span>
              </div>
            ))}
            {cart.length === 0 && <p className="text-center py-10 text-slate-700 font-black uppercase text-[10px]">Sin productos</p>}
          </div>
          <div className="border-t border-slate-800 pt-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase">Subtotal:</span>
              <span className="text-xl font-black text-white tracking-tighter">${cart.reduce((a,b)=>a+(b.price*b.quantity), 0)}</span>
            </div>
          </div>
          <button 
            onClick={submitToTable}
            disabled={cart.length === 0}
            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest disabled:opacity-20 shadow-xl active:scale-95 transition-all"
          >
            {selectedTable.status === 'OCCUPIED' ? 'Agregar a Comanda' : 'Abrir Comanda'}
          </button>
        </div>
      </div>

      {/* MODAL DE COBRO (CHECKOUT) */}
      {closingOrder && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[400] flex items-center justify-center p-6">
          <div className="bg-[#111] border border-emerald-500/30 p-10 rounded-[4rem] w-full max-w-lg space-y-8 shadow-[0_0_60px_rgba(16,185,129,0.1)]">
             <div className="text-center">
                <h3 className="font-neon text-2xl text-emerald-400 uppercase tracking-tighter leading-none">Cerrar y Cobrar</h3>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-3">Mesa {closingOrder.tableId?.replace('t','')}</p>
             </div>

             <div className="bg-black/50 p-6 rounded-3xl border border-slate-800 space-y-3 max-h-56 overflow-y-auto scrollbar-hide">
                {closingOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs font-bold text-slate-400 border-b border-slate-800/50 pb-2">
                    <span>x{it.quantity} {it.name}</span>
                    <span className="text-white">${it.price * it.quantity}</span>
                  </div>
                ))}
             </div>

             <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-black uppercase text-slate-500 tracking-widest">
                   <span>Consumo Total:</span> <span>${closingOrder.total}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-black uppercase text-blue-400 tracking-widest">
                   <span>Propina (Cliente):</span> <span>+${closingOrder.tipAmount || 0}</span>
                </div>
                <div className="flex justify-between items-end border-t-2 border-dashed border-slate-800 pt-5">
                   <span className="font-black text-white uppercase tracking-widest text-sm">Gran Total:</span>
                   <span className="text-5xl font-black text-emerald-400 tracking-tighter leading-none">${closingOrder.total + (closingOrder.tipAmount || 0)}</span>
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Método de Pago Final:</label>
                <div className="flex gap-4">
                   <button 
                     onClick={() => setManualPaymentMethod('CASH')}
                     className={`flex-1 py-5 rounded-2xl font-black uppercase text-xs border-2 transition-all ${manualPaymentMethod === 'CASH' ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' : 'bg-black border-slate-800 text-slate-500'}`}
                   >
                     <i className="fas fa-money-bill-wave mr-2 text-lg"></i> Efectivo
                   </button>
                   <button 
                     onClick={() => setManualPaymentMethod('CARD')}
                     className={`flex-1 py-5 rounded-2xl font-black uppercase text-xs border-2 transition-all ${manualPaymentMethod === 'CARD' ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' : 'bg-black border-slate-800 text-slate-500'}`}
                   >
                     <i className="fas fa-credit-card mr-2 text-lg"></i> Tarjeta
                   </button>
                </div>
             </div>

             <div className="flex gap-4 pt-4">
                <button onClick={() => setClosingOrder(null)} className="flex-1 py-5 rounded-2xl bg-slate-900 text-slate-500 font-black uppercase text-[10px] tracking-widest">Cancelar</button>
                <button onClick={processPayment} className="flex-1 py-5 rounded-2xl bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all">Finalizar y Liberar Mesa</button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL DE NOTAS */}
      {notingProduct && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[300] flex items-center justify-center p-6">
          <div className="bg-[#111] border border-blue-500/50 p-8 rounded-[3.5rem] w-full max-w-sm space-y-6 shadow-3xl">
            <div className="text-center">
               <h3 className="font-neon text-xl text-blue-400 uppercase tracking-tight">{notingProduct.name}</h3>
               <p className="text-[9px] text-slate-500 font-black uppercase mt-1">Instrucciones Especiales</p>
            </div>
            <textarea 
              className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white text-xs outline-none focus:border-blue-500 placeholder:text-slate-800"
              placeholder="Ejem: Sin cebolla, extra salsa..."
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className="flex gap-4">
               <button onClick={() => setNotingProduct(null)} className="flex-1 py-4 bg-slate-900 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest">Descartar</button>
               <button onClick={addToCart} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE APERTURA DE MESA */}
      {showNamePrompt && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[250] flex items-center justify-center p-6">
          <div className="bg-[#111] border border-blue-500/30 p-10 rounded-[4rem] w-full max-w-sm text-center space-y-8 shadow-2xl">
            <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto border-2 border-blue-600/20">
               <i className="fas fa-user-plus text-3xl neon-text-blue"></i>
            </div>
            <div>
              <h3 className="font-neon text-2xl neon-text-blue uppercase tracking-tighter leading-none">Abrir Mesa {selectedTable.number}</h3>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-2">Nueva Comanda en Sitio</p>
            </div>
            <div className="space-y-4 text-left">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nombre del Cliente:</label>
              <input 
                type="text" 
                className="w-full bg-black border border-slate-800 p-5 rounded-2xl text-white text-center font-black uppercase outline-none focus:border-blue-500 placeholder:text-slate-800"
                placeholder="Ejem: Juan Pérez"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setSelectedTable(null)} className="flex-1 py-5 rounded-2xl bg-slate-900 text-slate-500 font-black uppercase text-[10px] tracking-widest">Atrás</button>
              <button onClick={startOrder} className="flex-1 py-5 rounded-2xl bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
