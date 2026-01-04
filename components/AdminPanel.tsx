
import React, { useState, useRef } from 'react';
import { Product, Order, CashRegister, Table, OrderStatus, User, Supplier, AttendanceRecord } from '../types';

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
  staff, setStaff, suppliers, setSuppliers, attendance, setAttendance, logoUrl, setLogoUrl,
  restaurantName, setRestaurantName, accentColor, setAccentColor, secondaryColor, setSecondaryColor
}) => {
  const [tab, setTab] = useState<'DASHBOARD' | 'MENU_EDITOR' | 'STAFF' | 'SUPPLIERS' | 'CONFIG' | 'CASH'>('DASHBOARD');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingStaff, setEditingStaff] = useState<Partial<User> | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productImgInputRef = useRef<HTMLInputElement>(null);
  const staffImgInputRef = useRef<HTMLInputElement>(null);

  const DAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  const handleFileRead = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => callback(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileRead(file, setLogoUrl);
  };

  const handleProductImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editingProduct) {
      handleFileRead(file, (base64) => setEditingProduct({...editingProduct, image: base64}));
    }
  };

  const handleStaffImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editingStaff) {
      handleFileRead(file, (base64) => setEditingStaff({...editingStaff, photo: base64}));
    }
  };

  // Menu logic
  const handleSaveProduct = () => {
    if (!editingProduct?.name || !editingProduct.price) return;
    if (editingProduct.id) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct as Product : p));
    } else {
      setProducts(prev => [...prev, { ...editingProduct, id: `p_${Date.now()}`, stock: 100 } as Product]);
    }
    setEditingProduct(null);
  };

  // Categories logic
  const handleAddCategory = () => {
    if (newCategoryName.trim() && !categories.includes(newCategoryName)) {
      setCategories(prev => [...prev, newCategoryName.trim()]);
      setNewCategoryName('');
    }
  };

  const handleRemoveCategory = (cat: string) => {
    if (window.confirm(`¿Eliminar categoría "${cat}"? Los productos de esta categoría dejarán de ser visibles.`)) {
      setCategories(prev => prev.filter(c => c !== cat));
    }
  };

  // Personal Logic
  const handleSaveStaff = () => {
    if (!editingStaff?.name || !editingStaff.username) return;
    if (editingStaff.id) {
      setStaff(prev => prev.map(s => s.id === editingStaff.id ? editingStaff as User : s));
    } else {
      setStaff(prev => [...prev, { ...editingStaff, id: `u_${Date.now()}` } as User]);
    }
    setEditingStaff(null);
  };

  const handleAttendance = (user: User, type: 'IN' | 'OUT') => {
    if (type === 'IN') {
      const record: AttendanceRecord = {
        id: `att_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        checkIn: Date.now(),
        date: new Date().toLocaleDateString()
      };
      setAttendance(prev => [record, ...prev]);
    } else {
      setAttendance(prev => prev.map(a => 
        (a.userId === user.id && !a.checkOut) ? { ...a, checkOut: Date.now() } : a
      ));
    }
    alert(`Asistencia registrada: ${type === 'IN' ? 'Entrada' : 'Salida'} para ${user.name}`);
  };

  // Suppliers Logic
  const handleSaveSupplier = () => {
    if (!editingSupplier?.businessName) return;
    if (editingSupplier.id) {
      setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? editingSupplier as Supplier : s));
    } else {
      setSuppliers(prev => [...prev, { ...editingSupplier, id: `sup_${Date.now()}` } as Supplier]);
    }
    setEditingSupplier(null);
  };

  const handleRemoveSupplier = (id: string) => {
    if(window.confirm('¿Eliminar este proveedor?')) {
      setSuppliers(prev => prev.filter(s => s.id !== id));
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 pb-32">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-72 space-y-2 shrink-0">
        {[
          { id: 'DASHBOARD', icon: 'fa-chart-pie', label: 'Resumen' },
          { id: 'MENU_EDITOR', icon: 'fa-hamburger', label: 'Platillos y Cat.' },
          { id: 'STAFF', icon: 'fa-users-cog', label: 'Personal' },
          { id: 'SUPPLIERS', icon: 'fa-truck-loading', label: 'Proveedores' },
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

      {/* Content Area */}
      <div className="flex-1 bg-[#111] rounded-[3.5rem] border border-slate-800 p-8 shadow-3xl overflow-hidden">
        
        {/* DASHBOARD */}
        {tab === 'DASHBOARD' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <h2 className="font-neon text-2xl neon-text-blue uppercase">Resumen General</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-black p-8 rounded-[2.5rem] border border-slate-800">
                <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Ingresos Hoy</p>
                <h3 className="text-3xl font-black neon-text-blue">${orders.filter(o => o.status === OrderStatus.PAID).reduce((a,b) => a+b.total, 0)}</h3>
              </div>
              <div className="bg-black p-8 rounded-[2.5rem] border border-slate-800">
                <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Comandas Totales</p>
                <h3 className="text-3xl font-black neon-text-pink">{orders.length}</h3>
              </div>
              <div className="bg-black p-8 rounded-[2.5rem] border border-slate-800">
                <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Platillos en Menú</p>
                <h3 className="text-3xl font-black text-white">{products.length}</h3>
              </div>
            </div>
          </div>
        )}

        {/* MENU EDITOR & CATEGORIES */}
        {tab === 'MENU_EDITOR' && (
          <div className="space-y-12 animate-in fade-in duration-300 overflow-y-auto max-h-[80vh] pr-2 scrollbar-hide">
            {/* Categories Management Sub-section */}
            <div className="space-y-6">
              <h3 className="font-neon text-xl neon-text-pink uppercase">1. Gestionar Categorías</h3>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Nueva categoría..." 
                  className="flex-1 bg-black border border-slate-800 p-4 rounded-2xl text-white font-bold outline-none focus:neon-border-pink"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <button onClick={handleAddCategory} className="bg-pink-600 px-8 py-4 rounded-2xl font-black text-white uppercase tracking-widest shadow-lg active:scale-95 transition-all">Agregar</button>
              </div>
              <div className="flex flex-wrap gap-3">
                {categories.map(cat => (
                  <div key={cat} className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 flex items-center space-x-3 group hover:border-pink-500 transition-all">
                    <span className="text-white font-black uppercase text-[10px] tracking-widest">{cat}</span>
                    <button onClick={() => handleRemoveCategory(cat)} className="text-slate-600 hover:text-red-500 transition-colors"><i className="fas fa-times-circle"></i></button>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-slate-800" />

            {/* Products Management Sub-section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-neon text-xl neon-text-blue uppercase">2. Lista de Platillos</h3>
                <button 
                  onClick={() => setEditingProduct({ name: '', price: 0, category: categories[0] || '', image: '', description: '' })}
                  className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                >
                  Nuevo Platillo <i className="fas fa-plus ml-2"></i>
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {products.map(p => (
                  <div key={p.id} className="bg-black p-4 rounded-3xl border border-slate-800 flex items-center justify-between hover:border-blue-500/50 transition-all group">
                    <div className="flex items-center space-x-4">
                      <img src={p.image || 'https://via.placeholder.com/150'} className="w-12 h-12 rounded-xl object-cover border border-slate-700" />
                      <div>
                        <p className="font-bold text-white uppercase text-sm">{p.name}</p>
                        <p className="text-blue-400 font-black text-xs">${p.price} | <span className="text-slate-500">{p.category}</span></p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => setEditingProduct(p)} className="p-3 bg-slate-900 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><i className="fas fa-edit"></i></button>
                      <button onClick={() => setProducts(prev => prev.filter(x => x.id !== p.id))} className="p-3 bg-slate-900 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all"><i className="fas fa-trash"></i></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STAFF */}
        {tab === 'STAFF' && (
          <div className="space-y-8 animate-in fade-in duration-300 overflow-y-auto max-h-[80vh] pr-2 scrollbar-hide">
            <div className="flex justify-between items-center">
               <h3 className="font-neon text-2xl neon-text-blue uppercase tracking-tighter">Gestión de Personal</h3>
               <button onClick={() => setEditingStaff({ role: 'WAITER' })} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Nuevo Trabajador</button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {staff.map(u => (
                <div key={u.id} className="bg-black p-6 rounded-[2rem] border border-slate-800 flex items-center justify-between group hover:border-blue-500/50 transition-all">
                  <div className="flex items-center space-x-6">
                    <img src={u.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed='+u.id} className="w-14 h-14 rounded-full border-2 border-slate-800 object-cover" />
                    <div>
                      <p className="font-black text-white text-lg uppercase tracking-tight">{u.name}</p>
                      <p className="text-blue-400 font-black text-[10px] uppercase tracking-widest">{u.role} | @{u.username}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleAttendance(u, 'IN')} className="px-4 py-2 bg-emerald-600/10 text-emerald-500 border border-emerald-600/30 rounded-xl text-[9px] font-black uppercase tracking-widest">Entrada</button>
                    <button onClick={() => handleAttendance(u, 'OUT')} className="px-4 py-2 bg-red-600/10 text-red-500 border border-red-600/30 rounded-xl text-[9px] font-black uppercase tracking-widest">Salida</button>
                    <button onClick={() => setEditingStaff(u)} className="w-10 h-10 bg-slate-900 text-slate-500 rounded-xl flex items-center justify-center hover:text-white transition-all"><i className="fas fa-edit"></i></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUPPLIERS */}
        {tab === 'SUPPLIERS' && (
          <div className="space-y-8 animate-in fade-in duration-300 overflow-y-auto max-h-[80vh] pr-2 scrollbar-hide">
            <div className="flex justify-between items-center">
               <h3 className="font-neon text-2xl neon-text-pink uppercase tracking-tighter">Proveedores</h3>
               <button onClick={() => setEditingSupplier({ businessName: '', category: '', contactName: '', phone: '', deliveryDays: [], method: 'DELIVERY' })} className="bg-pink-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Añadir Proveedor</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {suppliers.map(s => (
                <div key={s.id} className="bg-black p-6 rounded-[2.5rem] border border-slate-800 space-y-4 hover:border-pink-500/50 transition-all relative group">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-white text-lg uppercase leading-none">{s.businessName}</h4>
                      <p className="text-pink-500 font-bold text-[9px] uppercase tracking-widest mt-2">{s.category}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${s.method === 'DELIVERY' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'bg-orange-600/10 text-orange-400 border border-orange-600/20'}`}>
                      {s.method === 'DELIVERY' ? 'Domicilio' : 'Recolección'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-800/50">
                    <p className="text-[10px] text-slate-500 font-bold truncate"><i className="fas fa-user-circle mr-2"></i> {s.contactName}</p>
                    <p className="text-[10px] text-slate-500 font-bold truncate"><i className="fas fa-phone mr-2"></i> {s.phone}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {DAYS.map(d => (
                      <span key={d} className={`text-[8px] font-black px-2 py-1 rounded-md ${s.deliveryDays.includes(d) ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-600'}`}>
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingSupplier(s)} className="flex-1 py-3 bg-slate-900 rounded-xl text-[9px] font-black uppercase text-slate-500 hover:text-blue-400 transition-all">Editar</button>
                    <button onClick={() => handleRemoveSupplier(s.id)} className="w-12 py-3 bg-slate-900 rounded-xl text-red-500 hover:bg-red-600 hover:text-white transition-all"><i className="fas fa-trash"></i></button>
                  </div>
                </div>
              ))}
              {suppliers.length === 0 && (
                <div className="col-span-full py-20 text-center opacity-20 flex flex-col items-center">
                  <i className="fas fa-box-open text-6xl mb-4"></i>
                  <p className="font-bold uppercase tracking-widest">No hay proveedores registrados</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONFIGURATION */}
        {tab === 'CONFIG' && (
          <div className="space-y-10 animate-in fade-in duration-300 overflow-y-auto max-h-[80vh] pr-2 scrollbar-hide">
             <h3 className="font-neon text-2xl neon-text-blue uppercase">Identidad del Restaurante</h3>
             <div className="bg-black p-8 rounded-[3rem] border border-slate-800 space-y-10">
                
                {/* Logo Section */}
                <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-10">
                   <div className="relative group">
                      <div className="w-40 h-40 bg-slate-900 rounded-full border-4 border-slate-800 flex items-center justify-center overflow-hidden shadow-2xl">
                         <img src={logoUrl} className="w-full h-full object-contain" />
                      </div>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-2 right-2 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center border-2 border-black hover:scale-110 transition-transform"
                      >
                        <i className="fas fa-camera"></i>
                      </button>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                   </div>
                   <div className="flex-1 space-y-4 w-full">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-4">Nombre del Establecimiento:</label>
                        <input 
                          className="w-full bg-[#0a0a0a] border border-slate-800 p-4 rounded-2xl text-white font-bold focus:neon-border-blue outline-none" 
                          value={restaurantName} 
                          onChange={e => setRestaurantName(e.target.value)}
                        />
                      </div>
                      <p className="text-[9px] text-slate-600 font-bold italic px-4">Este nombre aparecerá en tickets, login y encabezados.</p>
                   </div>
                </div>

                {/* Colors Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-4">Color Principal (Acento):</label>
                      <div className="flex items-center space-x-4">
                         <input type="color" className="w-16 h-16 bg-transparent border-none cursor-pointer" value={accentColor} onChange={e => setAccentColor(e.target.value)} />
                         <span className="text-white font-mono text-sm uppercase">{accentColor}</span>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest ml-4">Color Secundario:</label>
                      <div className="flex items-center space-x-4">
                         <input type="color" className="w-16 h-16 bg-transparent border-none cursor-pointer" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} />
                         <span className="text-white font-mono text-sm uppercase">{secondaryColor}</span>
                      </div>
                   </div>
                </div>

                <button className="w-full py-5 bg-blue-600 rounded-3xl font-black uppercase tracking-widest text-white shadow-2xl hover:scale-[1.02] transition-transform">Actualizar Imagen Corporativa</button>
             </div>
          </div>
        )}

        {/* CASH SECTION */}
        {tab === 'CASH' && (
          <div className="space-y-10 animate-in fade-in duration-300 overflow-y-auto max-h-[80vh] pr-2 scrollbar-hide">
             <h3 className="font-neon text-2xl neon-text-blue uppercase tracking-tighter">Flujo de Caja</h3>
             <div className="bg-black p-10 rounded-[3rem] border border-slate-800 flex items-center justify-between shadow-2xl">
                <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Balance Actual en Caja</p>
                   <p className="text-6xl font-black text-white tracking-tighter mt-2">${cashRegister.currentBalance}</p>
                </div>
                <button 
                  onClick={() => onCashAction(!cashRegister.isOpen, 0)}
                  className={`px-12 py-5 rounded-2xl font-black uppercase tracking-widest transition-all ${cashRegister.isOpen ? 'bg-red-600 shadow-red-600/20' : 'bg-emerald-600 shadow-emerald-600/20'} text-white shadow-2xl hover:scale-105`}
                >
                  {cashRegister.isOpen ? 'Cerrar Caja' : 'Abrir Caja'}
                </button>
             </div>
          </div>
        )}

      </div>

      {/* MODAL EDIT PRODUCT */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[300] flex items-center justify-center p-6">
          <div className="bg-[#111] border border-slate-800 p-10 rounded-[4rem] w-full max-w-2xl space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
             <h3 className="font-neon text-2xl neon-text-blue uppercase tracking-tighter">Ficha de Platillo</h3>
             <div className="flex flex-col items-center mb-6">
                <div 
                  className="w-32 h-32 rounded-3xl bg-black border-2 border-slate-800 flex items-center justify-center overflow-hidden mb-4 cursor-pointer"
                  onClick={() => productImgInputRef.current?.click()}
                >
                  {editingProduct.image ? (
                    <img src={editingProduct.image} className="w-full h-full object-cover" />
                  ) : (
                    <i className="fas fa-image text-slate-700 text-3xl"></i>
                  )}
                </div>
                <button 
                  onClick={() => productImgInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-400"
                >
                  Cargar Imagen desde Dispositivo
                </button>
                <input type="file" ref={productImgInputRef} className="hidden" accept="image/*" onChange={handleProductImageUpload} />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white font-bold" placeholder="Nombre" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                <input className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white font-bold" type="number" placeholder="Precio" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} />
                <select className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white font-black uppercase text-xs" value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-slate-400 text-xs" placeholder="O URL de Imagen" value={editingProduct.image} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} />
                <textarea className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white text-sm col-span-full" placeholder="Descripción corta" rows={2} value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
             </div>
             <div className="flex gap-4">
                <button onClick={() => setEditingProduct(null)} className="flex-1 py-4 bg-slate-900 rounded-2xl font-black uppercase text-slate-500 tracking-widest text-[10px]">Cancelar</button>
                <button onClick={handleSaveProduct} className="flex-1 py-4 bg-blue-600 rounded-2xl font-black uppercase text-white shadow-xl tracking-widest text-[10px]">Guardar Platillo</button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL STAFF */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[300] flex items-center justify-center p-6">
          <div className="bg-[#111] border border-slate-800 p-10 rounded-[4rem] w-full max-w-lg space-y-8 shadow-2xl overflow-y-auto max-h-[90vh]">
             <h3 className="font-neon text-2xl neon-text-blue uppercase tracking-tighter">Ficha de Personal</h3>
             <div className="flex flex-col items-center">
                <div 
                  className="w-24 h-24 rounded-full bg-black border-2 border-slate-800 flex items-center justify-center overflow-hidden mb-4 cursor-pointer"
                  onClick={() => staffImgInputRef.current?.click()}
                >
                  {editingStaff.photo ? (
                    <img src={editingStaff.photo} className="w-full h-full object-cover" />
                  ) : (
                    <i className="fas fa-user-circle text-slate-700 text-3xl"></i>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => staffImgInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[8px] font-black uppercase tracking-widest text-blue-400"
                  >
                    Cargar / Tomar Foto
                  </button>
                </div>
                <input type="file" ref={staffImgInputRef} className="hidden" accept="image/*" capture="user" onChange={handleStaffImageUpload} />
             </div>
             <div className="space-y-5">
                <input className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white font-bold text-sm" placeholder="Nombre completo" value={editingStaff.name} onChange={e => setEditingStaff({...editingStaff, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                   <input className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white font-bold text-sm" placeholder="Usuario" value={editingStaff.username} onChange={e => setEditingStaff({...editingStaff, username: e.target.value})} />
                   <input className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white font-bold text-sm" type="password" placeholder="Contraseña" value={editingStaff.password} onChange={e => setEditingStaff({...editingStaff, password: e.target.value})} />
                </div>
                <select className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white font-black uppercase text-xs" value={editingStaff.role} onChange={e => setEditingStaff({...editingStaff, role: e.target.value as any})}>
                   <option value="WAITER">MESERO</option>
                   <option value="KITCHEN">CHEF / COCINA</option>
                   <option value="ADMIN">ADMINISTRADOR</option>
                </select>
             </div>
             <div className="flex gap-4">
                <button onClick={() => setEditingStaff(null)} className="flex-1 py-4 bg-slate-900 rounded-2xl font-black uppercase text-slate-500 tracking-widest text-[10px]">Cancelar</button>
                <button onClick={handleSaveStaff} className="flex-1 py-4 bg-blue-600 rounded-2xl font-black uppercase text-white shadow-xl tracking-widest text-[10px]">Guardar Trabajador</button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL SUPPLIER */}
      {editingSupplier && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[300] flex items-center justify-center p-6">
          <div className="bg-[#111] border border-slate-800 p-10 rounded-[4rem] w-full max-w-lg space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
             <h3 className="font-neon text-2xl neon-text-pink uppercase tracking-tighter">Ficha de Proveedor</h3>
             <div className="space-y-4">
                <input className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white font-bold" placeholder="Nombre del Negocio" value={editingSupplier.businessName} onChange={e => setEditingSupplier({...editingSupplier, businessName: e.target.value})} />
                <input className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white font-bold" placeholder="Categoría (Ej. Insumos, Bebidas)" value={editingSupplier.category} onChange={e => setEditingSupplier({...editingSupplier, category: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                   <input className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white font-bold" placeholder="Contacto" value={editingSupplier.contactName} onChange={e => setEditingSupplier({...editingSupplier, contactName: e.target.value})} />
                   <input className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white font-bold" placeholder="Teléfono" value={editingSupplier.phone} onChange={e => setEditingSupplier({...editingSupplier, phone: e.target.value})} />
                </div>
                
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Modalidad:</label>
                   <select className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white font-black uppercase text-xs" value={editingSupplier.method} onChange={e => setEditingSupplier({...editingSupplier, method: e.target.value as any})}>
                      <option value="DELIVERY">NOS LO TRAE (DOMICILIO)</option>
                      <option value="PICKUP">TENEMOS QUE IR POR ÉL (RECOLECCIÓN)</option>
                   </select>
                </div>

                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Días de Surtido:</label>
                   <div className="flex flex-wrap gap-2">
                      {DAYS.map(d => (
                        <button 
                          key={d} 
                          onClick={() => {
                            const current = editingSupplier.deliveryDays || [];
                            setEditingSupplier({
                              ...editingSupplier, 
                              deliveryDays: current.includes(d) ? current.filter(x => x !== d) : [...current, d]
                            });
                          }}
                          className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${editingSupplier.deliveryDays?.includes(d) ? 'bg-pink-600 border-pink-400 text-white' : 'bg-black border-slate-800 text-slate-600'}`}
                        >
                          {d}
                        </button>
                      ))}
                   </div>
                </div>
             </div>
             <div className="flex gap-4 pt-4">
                <button onClick={() => setEditingSupplier(null)} className="flex-1 py-4 bg-slate-900 rounded-2xl font-black uppercase text-slate-500 tracking-widest text-[10px]">Cancelar</button>
                <button onClick={handleSaveSupplier} className="flex-1 py-4 bg-pink-600 rounded-2xl font-black uppercase text-white shadow-xl tracking-widest text-[10px]">Guardar Proveedor</button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};
