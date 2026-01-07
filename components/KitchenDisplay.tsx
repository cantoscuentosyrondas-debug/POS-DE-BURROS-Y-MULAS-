
import React, { useState, useEffect, useRef } from 'react';
import { Order, OrderStatus, Product } from '../types';

interface KitchenDisplayProps {
  orders: Order[];
  products: Product[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
}

export const KitchenDisplay: React.FC<KitchenDisplayProps> = ({ orders, products, onUpdateStatus }) => {
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'RECIPES'>('TICKETS');
  const prevOrdersJson = useRef(JSON.stringify(orders));

  useEffect(() => {
    const currentJson = JSON.stringify(orders);
    if (currentJson !== prevOrdersJson.current) {
      const currentObj = JSON.parse(currentJson);
      const prevObj = JSON.parse(prevOrdersJson.current);
      
      // Si hay más órdenes o si una orden existente tiene más items
      if (currentObj.length > prevObj.length || currentObj.some((o: Order, i: number) => prevObj[i] && o.items.length > prevObj[i].items.length)) {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});
      }
      prevOrdersJson.current = currentJson;
    }
  }, [orders]);

  return (
    <div className="space-y-8 pb-32">
      <div className="flex bg-[#111] p-2 rounded-2xl border border-slate-800 w-fit mx-auto md:mx-0">
         <button onClick={() => setActiveTab('TICKETS')} className={`px-10 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'TICKETS' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>COMANDAS ({orders.length})</button>
         <button onClick={() => setActiveTab('RECIPES')} className={`px-10 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'RECIPES' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>RECETAS</button>
      </div>

      {activeTab === 'TICKETS' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.map(order => {
            const minutesSinceUpdate = Math.floor((Date.now() - (order.updatedAt || order.timestamp)) / 60000);
            const isUrgent = minutesSinceUpdate > 15;
            
            return (
              <div key={order.id} className={`bg-[#111] rounded-[2.5rem] overflow-hidden border-2 flex flex-col transition-all shadow-2xl ${order.status === OrderStatus.PENDING ? 'border-pink-500/50' : 'border-blue-500/50'}`}>
                <div className={`p-5 flex justify-between items-center ${order.status === OrderStatus.PENDING ? 'bg-pink-600' : 'bg-blue-600'} text-white`}>
                  <div className="flex flex-col">
                    <span className="text-3xl font-black font-neon leading-none">M-{order.tableId?.replace('t', '')}</span>
                    <span className="text-[8px] font-black uppercase opacity-70 mt-1">{order.customerName || 'SIN NOMBRE'}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase">{minutesSinceUpdate} min</span>
                    {isUrgent && <span className="bg-red-500 text-[8px] px-2 py-1 rounded-full animate-pulse mt-1">RETRASO</span>}
                  </div>
                </div>
                
                <div className="p-6 flex-1 space-y-4 max-h-[400px] overflow-y-auto scrollbar-hide">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col border-b border-white/5 pb-4 last:border-0">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <span className="bg-white text-black w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0">{item.quantity}</span>
                          <span className="font-black text-sm uppercase text-white leading-tight">{item.name}</span>
                        </div>
                      </div>
                      {item.notes && (
                        <div className="bg-pink-600/10 p-2 rounded-xl mt-2 border border-pink-600/20">
                           <p className="text-[9px] text-pink-400 font-black uppercase italic"><i className="fas fa-exclamation-circle mr-1"></i> {item.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-5 bg-black/40 border-t border-white/5 space-y-3">
                   <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase">
                     <span>Origen: {order.source}</span>
                     <span>Total: ${order.total}</span>
                   </div>
                   <button 
                     onClick={() => onUpdateStatus(order.id, order.status === OrderStatus.PENDING ? OrderStatus.PREPARING : OrderStatus.READY)}
                     className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                       order.status === OrderStatus.PENDING ? 'bg-slate-800 hover:bg-pink-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                     }`}
                   >
                     {order.status === OrderStatus.PENDING ? 'COMENZAR PREPARACIÓN' : 'MARCAR COMO LISTO'}
                   </button>
                </div>
              </div>
            );
          })}
          {orders.length === 0 && (
             <div className="col-span-full py-40 flex flex-col items-center justify-center opacity-10">
                <i className="fas fa-check-double text-9xl mb-6"></i>
                <p className="font-neon text-3xl uppercase tracking-widest">Cocina en Orden</p>
             </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom">
          {products.map(p => (
            <div key={p.id} className="bg-[#111] p-5 rounded-3xl border border-slate-800 flex items-center space-x-5 hover:border-blue-500 transition-all group">
               <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-800 group-hover:border-blue-500 transition-all">
                  <img src={p.image} className="w-full h-full object-cover" />
               </div>
               <div className="flex-1">
                 <h4 className="font-black text-white uppercase text-xs tracking-tight">{p.name}</h4>
                 <p className="text-[9px] text-slate-500 uppercase mt-1 line-clamp-2">{p.description}</p>
                 <span className="inline-block mt-2 px-3 py-1 bg-blue-600/10 text-blue-400 text-[8px] font-black rounded-full uppercase tracking-widest">{p.category}</span>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
