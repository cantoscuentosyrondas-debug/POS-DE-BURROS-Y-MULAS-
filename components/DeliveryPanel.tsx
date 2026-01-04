
import React, { useState } from 'react';
import { Order, OrderStatus, OrderSource } from '../types';

interface DeliveryPanelProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onAddOrder: (order: Order) => void;
}

export const DeliveryPanel: React.FC<DeliveryPanelProps> = ({ orders, onUpdateStatus, onAddOrder }) => {
  const [filter, setFilter] = useState<OrderSource | 'ALL'>('ALL');

  const deliveryOrders = orders.filter(o => o.source !== 'DINE_IN' && (filter === 'ALL' || o.source === filter));

  const getSourceIcon = (source: OrderSource) => {
    switch (source) {
      case 'UBER_EATS': return { icon: 'fa-utensils', color: 'text-emerald-500', label: 'Uber Eats' };
      case 'RAPPI': return { icon: 'fa-bicycle', color: 'text-orange-500', label: 'Rappi' };
      case 'DIDI_FOOD': return { icon: 'fa-motorcycle', color: 'text-orange-400', label: 'DiDi Food' };
      default: return { icon: 'fa-home', color: 'text-blue-400', label: 'Propio' };
    }
  };

  const createManualDelivery = () => {
    const address = prompt("Dirección de entrega:");
    const phone = prompt("Teléfono del cliente:");
    const name = prompt("Nombre del cliente:");
    
    if (!address || !name) return;

    const newOrder: Order = {
      id: `delv_${Date.now()}`,
      source: 'DELIVERY_OWN',
      status: OrderStatus.PENDING,
      items: [], // En un flujo real abriría un seleccionador de productos
      total: 0,
      timestamp: Date.now(),
      customerName: name,
      customerPhone: phone || '',
      customerAddress: address
    };
    onAddOrder(newOrder);
    alert("Pedido manual creado. Agregue productos desde la terminal.");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-[#111] p-8 rounded-[3rem] border border-slate-800 shadow-3xl">
        <div>
          <h2 className="font-neon text-3xl neon-text-orange uppercase tracking-tighter">Módulo de Delivery</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Gestión multicanal de pedidos externos</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={createManualDelivery}
            className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-orange-600/20 active:scale-95 transition-all"
          >
            Nuevo Envío Propio <i className="fas fa-plus ml-2"></i>
          </button>
        </div>
      </div>

      <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
        {['ALL', 'DELIVERY_OWN', 'UBER_EATS', 'RAPPI', 'DIDI_FOOD'].map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f as any)}
            className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] border tracking-widest transition-all ${filter === f ? 'bg-orange-600 border-orange-400 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
          >
            {f === 'ALL' ? 'Todos' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {deliveryOrders.map(order => {
          const info = getSourceIcon(order.source);
          return (
            <div key={order.id} className="bg-[#111] border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl group hover:border-orange-500 transition-all flex flex-col">
              <div className="p-6 bg-slate-900/50 flex justify-between items-center border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl bg-black flex items-center justify-center ${info.color}`}>
                    <i className={`fas ${info.icon}`}></i>
                  </div>
                  <div>
                    <h4 className="font-black text-white text-xs uppercase tracking-widest">{info.label}</h4>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">ID: {order.id.slice(-6)}</p>
                  </div>
                </div>
                <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                  order.status === OrderStatus.PENDING ? 'bg-pink-600/10 text-pink-500' : 
                  order.status === OrderStatus.IN_TRANSIT ? 'bg-orange-600/10 text-orange-500' : 'bg-blue-600/10 text-blue-400'
                }`}>
                  {order.status}
                </span>
              </div>
              
              <div className="p-8 flex-1 space-y-4">
                <div className="space-y-1">
                  <p className="text-white font-black uppercase text-sm">{order.customerName}</p>
                  <p className="text-[10px] text-slate-400 font-medium italic"><i className="fas fa-map-marker-alt mr-2 text-orange-500"></i> {order.customerAddress || 'Recoger en local'}</p>
                  <p className="text-[10px] text-slate-400 font-medium"><i className="fas fa-phone mr-2 text-emerald-500"></i> {order.customerPhone}</p>
                </div>
                
                <div className="pt-4 border-t border-slate-800">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[9px] font-black text-slate-500 uppercase">Productos</span>
                    <span className="text-orange-500 font-black tracking-tighter text-lg">${order.total}</span>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-2 scrollbar-hide">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-[11px] text-slate-300">
                        <span>x{item.quantity} {item.name}</span>
                        <span className="text-slate-500">${item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-black border-t border-slate-800 grid grid-cols-1 gap-3">
                {order.status === OrderStatus.READY && (
                  <button 
                    onClick={() => onUpdateStatus(order.id, OrderStatus.IN_TRANSIT)}
                    className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl"
                  >
                    Marcar: En Reparto <i className="fas fa-motorcycle ml-2"></i>
                  </button>
                )}
                {order.status === OrderStatus.IN_TRANSIT && (
                  <button 
                    onClick={() => onUpdateStatus(order.id, OrderStatus.PAID)}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl"
                  >
                    Confirmar Entrega <i className="fas fa-check-circle ml-2"></i>
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {deliveryOrders.length === 0 && (
          <div className="col-span-full py-32 text-center opacity-10 flex flex-col items-center">
            <i className="fas fa-shipping-fast text-9xl mb-8"></i>
            <p className="font-neon text-4xl uppercase tracking-widest">Canal Limpio</p>
          </div>
        )}
      </div>
    </div>
  );
};
