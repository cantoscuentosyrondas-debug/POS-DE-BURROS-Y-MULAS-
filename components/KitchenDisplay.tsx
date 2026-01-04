
import React, { useState, useEffect, useRef } from 'react';
import { Order, OrderStatus, Product } from '../types';

interface KitchenDisplayProps {
  orders: Order[];
  products: Product[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
}

export const KitchenDisplay: React.FC<KitchenDisplayProps> = ({ orders, products, onUpdateStatus }) => {
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'RECIPES'>('TICKETS');
  const prevOrderCount = useRef(orders.length);

  useEffect(() => {
    if (orders.length > prevOrderCount.current) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log("Audio interaction required"));
    }
    prevOrderCount.current = orders.length;
  }, [orders.length]);

  return (
    <div className="space-y-8 pb-32">
      <div className="flex flex-col sm:flex-row gap-6 justify-between bg-[#111] p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl">
        <div className="flex bg-black p-2 rounded-[1.5rem] border border-slate-800">
           <button 
             onClick={() => setActiveTab('TICKETS')}
             className={`px-10 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'TICKETS' ? 'bg-pink-600 text-white shadow-xl shadow-pink-600/20' : 'text-slate-500'}`}
           >
             Cola de Producción ({orders.length})
           </button>
           <button 
             onClick={() => setActiveTab('RECIPES')}
             className={`px-10 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'RECIPES' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500'}`}
           >
             Manual de Recetas
           </button>
        </div>
        <div className="flex items-center space-x-6 px-4">
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Status Cocina</span>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Online</span>
           </div>
           <div className="h-4 w-4 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
        </div>
      </div>

      {activeTab === 'TICKETS' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {orders.map(order => {
            const hasNotes = order.items.some(i => i.notes && i.notes.trim() !== '');
            return (
              <div 
                key={order.id} 
                className={`bg-[#111] rounded-[3rem] shadow-2xl overflow-hidden border-2 flex flex-col transform transition-all animate-in zoom-in duration-300 ${
                  hasNotes ? 'border-yellow-400 ring-4 ring-yellow-400/20 animate-pulse' : 'border-slate-800'
                }`}
              >
                <div className={`p-6 flex justify-between items-center ${order.status === OrderStatus.PENDING ? 'bg-pink-600 shadow-lg shadow-pink-600/20' : 'bg-blue-600 shadow-lg shadow-blue-600/20'} text-white`}>
                  <div className="flex flex-col">
                    <span className="text-4xl font-black font-neon leading-none">
                      {order.source === 'DINE_IN' ? `M-${order.tableId?.replace('t', '')}` : 'DELV'}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-70">
                      {order.customerName} - {order.source}
                    </span>
                  </div>
                  {hasNotes && (
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-pink-600 shadow-xl">
                       <i className="fas fa-exclamation-triangle text-xl"></i>
                    </div>
                  )}
                </div>
                <div className="p-8 flex-1 space-y-6">
                  {order.items.map((item, idx) => (
                    <div key={idx} className={`flex flex-col space-y-2 border-b border-slate-800/50 pb-4 last:border-0 last:pb-0 ${item.notes ? 'bg-yellow-400/5 -mx-4 px-4 py-3 rounded-2xl' : ''}`}>
                      <div className="flex items-start space-x-4">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${item.notes ? 'bg-yellow-400 text-black' : 'bg-white text-black'}`}>
                          {item.quantity}
                        </span>
                        <span className={`font-black uppercase text-sm leading-tight block ${item.notes ? 'text-yellow-400' : 'text-white'}`}>
                          {item.name}
                        </span>
                      </div>
                      {item.notes && (
                        <div className="bg-yellow-400 p-3 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                          <p className="text-[12px] text-black font-black uppercase italic leading-tight">
                            ⚠️ OBSERVACIÓN: {item.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-6 bg-black mt-auto">
                   <button 
                     onClick={() => onUpdateStatus(order.id, order.status === OrderStatus.PENDING ? OrderStatus.PREPARING : OrderStatus.READY)}
                     className={`w-full py-5 rounded-2xl font-black text-xs uppercase transition-all shadow-lg active:scale-95 ${
                       order.status === OrderStatus.PENDING 
                        ? 'bg-slate-800 hover:bg-pink-600 text-white' 
                        : 'bg-blue-600 hover:bg-emerald-600 text-white'
                     }`}
                   >
                     {order.status === OrderStatus.PENDING ? 'Empezar Preparación' : 'Marcar como Listo'}
                   </button>
                </div>
              </div>
            );
          })}
          {orders.length === 0 && (
            <div className="col-span-full py-32 text-center opacity-10 flex flex-col items-center">
              <i className="fas fa-utensils text-9xl mb-8"></i>
              <p className="font-neon text-4xl uppercase tracking-widest">Sin Pendientes</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
          {products.map(product => (
            <div key={product.id} className="bg-[#111] p-8 rounded-[3rem] border border-slate-800 space-y-6 shadow-2xl group hover:border-blue-500 transition-all">
              <div className="flex items-center space-x-6">
                 <img src={product.image || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-3xl object-cover border border-slate-700 shadow-xl" alt={product.name} />
                 <h4 className="font-black text-white uppercase text-md leading-tight">{product.name}</h4>
              </div>
              <div className="bg-black/40 p-5 rounded-2xl border border-slate-800/50">
                 <p className="text-xs text-slate-300 leading-relaxed font-medium italic">
                   {product.instructions || 'Sin instrucciones adicionales.'}
                 </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
