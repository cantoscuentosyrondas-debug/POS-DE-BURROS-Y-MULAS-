
import React, { useState, useRef } from 'react';
import { Product, Order, CashRegister, Table, OrderStatus, User, Supplier, AttendanceRecord, Customer } from '../types';

interface AdminPanelProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  orders: Order[];
  cashRegister: CashRegister;
  onCashAction: (isOpen: boolean, amount: number) => void;
  tables: Table[];
  staff: User[];
  setStaff: React.Dispatch<React.SetStateAction<User[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  attendance: AttendanceRecord[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  logoUrl: string;
  setLogoUrl: (url: string) => void;
  restaurantName: string;
  setRestaurantName: (name: string) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  secondaryColor: string;
  setSecondaryColor: (color: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  products, setProducts, categories, setCategories, orders, cashRegister, onCashAction, tables,
  staff, setStaff, customers, setCustomers, suppliers, setSuppliers, attendance, setAttendance, logoUrl, setLogoUrl,
  restaurantName, setRestaurantName, accentColor, setAccentColor, secondaryColor, setSecondaryColor
}) => {
  const [tab, setTab] = useState<'DASHBOARD' | 'MENU_EDITOR' | 'STAFF' | 'CUSTOMERS' | 'SUPPLIERS' | 'CONFIG' | 'CASH'>('DASHBOARD');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingStaff, setEditingStaff] = useState<Partial<User> | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [cashAmount, setCashAmount] = useState<string>('');
  
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleFileRead = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => callback(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileRead(file, setLogoUrl);
  };

  const handleSaveProduct = () => {
    if (!editingProduct?.name || !editingProduct.price) return;
    if (editingProduct.id) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct as Product : p));
    } else {
      setProducts(prev => [...prev, { ...editingProduct, id: `p_${Date.now()}`, stock: 100 } as Product]);
    }
    setEditingProduct(null);
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim() && !categories.includes(newCategoryName)) {
      setCategories(prev => [...prev, newCategoryName.trim()]);
      setNewCategoryName('');
    }
  };

  const handleRemoveCategory = (cat: string) => {
    if (window.confirm(`¿Eliminar categoría "${cat}"?`)) {
      setCategories(prev => prev.filter(c => c !== cat));
    }
  };

  const handleAttendance = (user: User, type: 'IN' | 'OUT') => {
    if (type === 'IN') {
      const record: AttendanceRecord = {
        id: `att_${Date.now()}`, userId: user.id, userName: user.name, checkIn: Date.now(), date: new Date().toLocaleDateString()
      };
      setAttendance(prev => [record, ...prev]);
    } else {
      setAttendance(prev => prev.map(a => (a.userId === user.id && !a.checkOut) ? { ...a, checkOut: Date.now() } : a));
    }
    alert(`Asistencia registrada: ${type === 'IN' ? 'Entrada' : 'Salida'} para ${user.name}`);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone.includes(customerSearch)
  );

  return (
    <div className="flex flex-col md:flex-row gap-8 pb-32">
      <div className="w-full md:w-72 space-y-2 shrink-0">
        {[
          { id: 'DASHBOARD', icon: 'fa-chart-pie', label: 'Resumen' },
          { id: 'MENU_EDITOR', icon: 'fa-hamburger', label: 'Platillos' },
          { id: 'STAFF', icon: 'fa-users-cog', label: 'Personal' },
          { id: 'CUSTOMERS', icon: 'fa-address-book', label: 'Clientes' },
          { id: 'CASH', icon: 'fa-vault', label: 'Caja' },
          { id: 'CONFIG', icon: 'fa-cog', label: 'Configuración' }
        ].map(nav => (
          <button
            key={nav.id}
            onClick={() => setTab(nav.id as any)}
            className={`w-full flex items-center space-x-5 px-8 py-4 rounded-[2rem] font-black transition-all ${
              tab === nav.id ? 'bg-blue-600 text-white shadow-2xl' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'
            }`}
          >
            <i className={`fas ${nav.icon} text-sm`}></i>
            <span className="uppercase text-[10px] tracking-widest">{nav.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 bg-[#111] rounded-[3.5rem] border border-slate-800 p-8 shadow-3xl overflow-hidden min-h-[600px]">
        
        {tab === 'DASHBOARD' && (
          <div className="space-y-8 animate-in fade-in">
            <h2 className="font-neon text-2xl neon-text-blue uppercase tracking-tighter">Panel Principal</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-black p-8 rounded-[2.5rem] border border-slate-800">
                <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Ventas Hoy</p>
                <h3 className="text-3xl font-black neon-text-blue">${orders.filter(o => o.status === OrderStatus.PAID && new Date(o.timestamp).toDateString() === new Date().toDateString()).reduce((a,b) => a+b.total, 0)}</h3>
              </div>
              <div className="bg-black p-8 rounded-[2.5rem] border border-slate-800">
                <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Clientes en Base</p>
                <h3 className="text-3xl font-black neon-text-pink">{customers.length}</h3>
              </div>
              <div className="bg-black p-8 rounded-[2.5rem] border border-slate-800">
                <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Visitas Totales</p>
                <h3 className="text-3xl font-black text-white">{customers.reduce((a,b) => a + b.visits, 0)}</h3>
              </div>
            </div>
          </div>
        )}

        {tab === 'CUSTOMERS' && (
          <div className="space-y-8 animate-in fade-in h-full flex flex-col">
            <div className="flex justify-between items-center">
               <h3 className="font-neon text-2xl neon-text-pink uppercase tracking-tighter">Clientes VIP</h3>
               <div className="relative w-64">
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"></i>
                  <input 
                    type="text" 
                    placeholder="Buscar..." 
                    className="w-full bg-black border border-slate-800 py-3 pl-12 pr-4 rounded-2xl text-white font-bold text-xs"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
               <table className="w-full text-left border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                      <th className="px-6">Nombre</th>
                      <th className="px-6">WhatsApp</th>
                      <th className="px-6 text-center">Visitas</th>
                      <th className="px-6">Última</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map(c => (
                      <tr key={c.id} className="bg-black border border-slate-800 rounded-2xl hover:border-pink-500 transition-all">
                        <td className="px-6 py-4 rounded-l-2xl font-black text-white uppercase text-xs">{c.name}</td>
                        <td className="px-6 py-4 text-pink-500 font-bold text-xs">{c.phone}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-slate-900 px-3 py-1 rounded-full text-[10px] font-black">{c.visits}</span>
                        </td>
                        <td className="px-6 py-4 rounded-r-2xl text-slate-500 text-[10px] uppercase font-bold">{new Date(c.lastVisit).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {tab === 'CASH' && (
          <div className="space-y-10 animate-in fade-in">
            <h3 className="font-neon text-2xl neon-text-blue uppercase tracking-tighter">Control de Caja</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-black p-8 rounded-[3rem] border border-slate-800 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Estado Actual</p>
                    <h4 className={`text-xl font-black uppercase ${cashRegister.isOpen ? 'text-emerald-500' : 'text-red-500'}`}>
                      {cashRegister.isOpen ? 'Caja Abierta' : 'Caja Cerrada'}
                    </h4>
                  </div>
                  <i className={`fas ${cashRegister.isOpen ? 'fa-unlock text-emerald-500' : 'fa-lock text-red-500'} text-3xl`}></i>
                </div>
                
                <div className="pt-4">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Balance en Efectivo</p>
                  <h3 className="text-5xl font-black neon-text-blue tracking-tighter">${cashRegister.currentBalance}</h3>
                </div>

                {!cashRegister.isOpen ? (
                  <div className="space-y-4 pt-6">
                    <input 
                      type="number" 
                      placeholder="Monto inicial $" 
                      className="w-full bg-[#111] border border-slate-800 p-4 rounded-2xl text-white font-bold"
                      value={cashAmount}
                      onChange={e => setCashAmount(e.target.value)}
                    />
                    <button 
                      onClick={() => { onCashAction(true, Number(cashAmount)); setCashAmount(''); }}
                      className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl"
                    >
                      Abrir Turno de Caja
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => { if(window.confirm('¿Confirmar arqueo y cierre?')) onCashAction(false, 0); }}
                    className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl mt-6"
                  >
                    Cerrar y Retirar Efectivo
                  </button>
                )}
              </div>

              <div className="bg-black p-8 rounded-[3rem] border border-slate-800 flex flex-col h-full">
                <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-6">Últimos Movimientos</h4>
                <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide max-h-[300px]">
                  {cashRegister.transactions.slice().reverse().map(t => (
                    <div key={t.id} className="flex justify-between items-center border-b border-slate-800/50 pb-3">
                      <div>
                        <p className="text-xs font-black text-white uppercase">{t.description}</p>
                        <p className="text-[9px] text-slate-500 uppercase">{new Date(t.timestamp).toLocaleTimeString()}</p>
                      </div>
                      <span className={`font-black text-sm ${t.type === 'IN' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {t.type === 'IN' ? '+' : '-'}${t.amount}
                      </span>
                    </div>
                  ))}
                  {cashRegister.transactions.length === 0 && <p className="text-center py-10 text-slate-700 text-[10px] font-black uppercase tracking-widest">Sin transacciones hoy</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'CONFIG' && (
          <div className="space-y-10 animate-in fade-in">
            <h3 className="font-neon text-2xl neon-text-pink uppercase tracking-tighter">Identidad del Restaurante</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nombre Comercial:</label>
                  <input 
                    type="text" 
                    className="w-full bg-black border border-slate-800 p-5 rounded-2xl text-white font-black uppercase tracking-tighter outline-none focus:border-blue-500"
                    value={restaurantName}
                    onChange={e => setRestaurantName(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Colores del Neón:</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-slate-500">Primario (Blue)</span>
                      <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-8 h-8 rounded-full border-0 bg-transparent cursor-pointer" />
                    </div>
                    <div className="bg-black p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-slate-500">Secundario (Pink)</span>
                      <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-8 h-8 rounded-full border-0 bg-transparent cursor-pointer" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Logo del Negocio:</label>
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      className="flex-1 bg-black border border-slate-800 p-4 rounded-2xl text-slate-400 text-xs outline-none focus:border-blue-500"
                      value={logoUrl}
                      onChange={e => setLogoUrl(e.target.value)}
                      placeholder="URL de imagen..."
                    />
                    <button 
                      onClick={() => logoInputRef.current?.click()}
                      className="bg-slate-900 border border-slate-800 px-6 rounded-2xl text-white hover:bg-slate-800 transition-colors"
                    >
                      <i className="fas fa-upload"></i>
                    </button>
                    <input ref={logoInputRef} type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-10 bg-black rounded-[4rem] border border-slate-800/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${accentColor} 0%, transparent 70%)` }}></div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-10">Vista Previa de Login</p>
                <div className="custom-logo-container mb-8" style={{ borderColor: accentColor, boxShadow: `0 0 30px ${accentColor}, inset 0 0 15px ${accentColor}` }}>
                  <img src={logoUrl} className="logo-img" alt="Preview Logo" />
                </div>
                <h1 className="font-neon text-3xl font-black tracking-tighter uppercase text-center" style={{ color: accentColor, textShadow: `0 0 15px ${accentColor}` }}>
                  {restaurantName}
                </h1>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] mt-3" style={{ color: secondaryColor }}>Auto-Servicio Digital</p>
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-800 flex justify-end">
              <button onClick={() => alert('Configuración guardada en el navegador.')} className="bg-blue-600 text-white px-12 py-5 rounded-full font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all">Guardar Cambios</button>
            </div>
          </div>
        )}

        {tab === 'MENU_EDITOR' && (
          <div className="space-y-12 animate-in fade-in overflow-y-auto max-h-[80vh] scrollbar-hide">
            <div className="space-y-6">
              <h3 className="font-neon text-xl neon-text-pink uppercase">Categorías</h3>
              <div className="flex gap-4">
                <input type="text" placeholder="Nueva..." className="flex-1 bg-black border border-slate-800 p-4 rounded-2xl text-white font-bold outline-none focus:border-pink-500" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                <button onClick={handleAddCategory} className="bg-pink-600 px-8 py-4 rounded-2xl font-black text-white uppercase text-[10px] tracking-widest">Añadir</button>
              </div>
              <div className="flex flex-wrap gap-3">
                {categories.map(cat => (
                  <div key={cat} className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 flex items-center space-x-3">
                    <span className="text-white font-black uppercase text-[10px] tracking-widest">{cat}</span>
                    <button onClick={() => handleRemoveCategory(cat)} className="text-slate-600 hover:text-red-500"><i className="fas fa-times-circle"></i></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-neon text-xl neon-text-blue uppercase">Carta / Menú</h3>
                <button onClick={() => setEditingProduct({ name: '', price: 0, category: categories[0] || '', image: '', description: '' })} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase">Nuevo Platillo</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map(p => (
                  <div key={p.id} className="bg-black p-4 rounded-3xl border border-slate-800 flex items-center justify-between group hover:border-blue-500 transition-all">
                    <div className="flex items-center space-x-4">
                      <img src={p.image} className="w-14 h-14 rounded-xl object-cover" />
                      <div><p className="font-bold text-white uppercase text-xs">{p.name}</p><p className="text-blue-400 font-black text-sm">${p.price}</p></div>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => setEditingProduct(p)} className="p-3 bg-slate-900 text-blue-400 rounded-xl"><i className="fas fa-edit"></i></button>
                      <button onClick={() => setProducts(prev => prev.filter(x => x.id !== p.id))} className="p-3 bg-slate-900 text-red-500 rounded-xl"><i className="fas fa-trash"></i></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'STAFF' && (
          <div className="space-y-8 animate-in fade-in overflow-y-auto max-h-[80vh] scrollbar-hide">
            <div className="flex justify-between items-center">
               <h3 className="font-neon text-2xl neon-text-blue uppercase">Equipo de Trabajo</h3>
               <button onClick={() => setEditingStaff({ role: 'WAITER', name: '' })} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase">Registrar</button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {staff.map(u => (
                <div key={u.id} className="bg-black p-6 rounded-[2rem] border border-slate-800 flex items-center justify-between group hover:border-blue-500 transition-all">
                  <div className="flex items-center space-x-6">
                    <img src={u.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} className="w-14 h-14 rounded-full border border-slate-700" />
                    <div><p className="font-black text-white text-lg uppercase tracking-tight">{u.name}</p><p className="text-blue-400 font-black text-[10px] uppercase">{u.role}</p></div>
                  </div>
                  <div className="flex space-x-3">
                    <button onClick={() => handleAttendance(u, 'IN')} className="px-4 py-2 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[9px] font-black uppercase">Entrada</button>
                    <button onClick={() => handleAttendance(u, 'OUT')} className="px-4 py-2 bg-red-600/10 text-red-500 border border-red-500/20 rounded-xl text-[9px] font-black uppercase">Salida</button>
                    <button onClick={() => setEditingStaff(u)} className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-blue-400"><i className="fas fa-edit"></i></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {editingProduct && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[300] flex items-center justify-center p-6">
          <div className="bg-[#111] border border-slate-800 p-10 rounded-[4rem] w-full max-w-2xl space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
             <h3 className="font-neon text-2xl neon-text-blue uppercase">Detalles del Platillo</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Nombre:</label>
                  <input className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white font-bold" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Precio $:</label>
                  <input className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white font-bold" type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Categoría:</label>
                  <select className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white font-black uppercase text-xs" value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-4">URL Imagen:</label>
                  <input className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-slate-400 text-xs" value={editingProduct.image} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-full">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Descripción Corta:</label>
                  <textarea className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white text-sm" rows={2} value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                </div>
             </div>
             <div className="flex gap-4">
                <button onClick={() => setEditingProduct(null)} className="flex-1 py-4 bg-slate-900 rounded-2xl font-black uppercase tracking-widest text-slate-500">Cancelar</button>
                <button onClick={handleSaveProduct} className="flex-1 py-4 bg-blue-600 rounded-2xl font-black uppercase text-white tracking-widest shadow-xl">Guardar</button>
             </div>
          </div>
        </div>
      )}

      {editingStaff && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[300] flex items-center justify-center p-6">
          <div className="bg-[#111] border border-slate-800 p-10 rounded-[4rem] w-full max-w-md space-y-6 shadow-2xl">
            <h3 className="font-neon text-2xl neon-text-blue uppercase text-center">Datos de Personal</h3>
            <div className="space-y-4">
               <input className="w-full bg-black border border-slate-800 p-5 rounded-2xl text-white font-bold" placeholder="Nombre completo" value={editingStaff.name} onChange={e => setEditingStaff({...editingStaff, name: e.target.value})} />
               <select className="w-full bg-black border border-slate-800 p-5 rounded-2xl text-white font-black uppercase text-xs" value={editingStaff.role} onChange={e => setEditingStaff({...editingStaff, role: e.target.value as any})}>
                  <option value="WAITER">MESERO</option>
                  <option value="KITCHEN">COCINERO</option>
                  <option value="ADMIN">ADMINISTRADOR</option>
               </select>
               <input className="w-full bg-black border border-slate-800 p-5 rounded-2xl text-slate-400 text-xs" placeholder="URL Foto Perfil" value={editingStaff.photo} onChange={e => setEditingStaff({...editingStaff, photo: e.target.value})} />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setEditingStaff(null)} className="flex-1 py-4 bg-slate-900 rounded-2xl font-black uppercase tracking-widest text-slate-500">Volver</button>
              <button onClick={() => {
                if(!editingStaff.name) return;
                if(editingStaff.id) setStaff(prev => prev.map(s => s.id === editingStaff.id ? editingStaff as User : s));
                else setStaff(prev => [...prev, { ...editingStaff, id: `u_${Date.now()}` } as User]);
                setEditingStaff(null);
              }} className="flex-1 py-4 bg-blue-600 rounded-2xl font-black uppercase text-white shadow-xl">Confirmar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
