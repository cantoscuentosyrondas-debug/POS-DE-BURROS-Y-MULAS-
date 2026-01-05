
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
  const [tab, setTab] = useState<'DASHBOARD' | 'MENU_EDITOR' | 'STAFF' | 'CUSTOMERS' | 'TIPS' | 'CASH' | 'CONFIG'>('DASHBOARD');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingStaff, setEditingStaff] = useState<Partial<User> | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [cashAmount, setCashAmount] = useState<string>('');
  
  const logoInputRef = useRef<HTMLInputElement>(null);

  // --- Multi-Sheet Excel Export Logic (using XML Spreadsheet 2003) ---
  const exportToExcel = () => {
    const uri = 'data:application/vnd.ms-excel;base64,';
    const template = `
      <xml version="1.0"?>
      <?mso-application progid="Excel.Sheet"?>
      <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
                xmlns:o="urn:schemas-microsoft-com:office:office"
                xmlns:x="urn:schemas-microsoft-com:office:excel"
                xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
                xmlns:html="http://www.w3.org/TR/REC-html40">
        <Worksheet ss:Name="Ventas y Propinas">
          <Table>
            <Row>
              <Cell><Data ss:Type="String">ID Orden</Data></Cell>
              <Cell><Data ss:Type="String">Fecha</Data></Cell>
              <Cell><Data ss:Type="String">Cliente</Data></Cell>
              <Cell><Data ss:Type="String">Total Venta</Data></Cell>
              <Cell><Data ss:Type="String">Propina</Data></Cell>
              <Cell><Data ss:Type="String">Metodo Pago</Data></Cell>
              <Cell><Data ss:Type="String">Estado</Data></Cell>
            </Row>
            ${orders.map(o => `
              <Row>
                <Cell><Data ss:Type="String">${o.id}</Data></Cell>
                <Cell><Data ss:Type="String">${new Date(o.timestamp).toLocaleString()}</Data></Cell>
                <Cell><Data ss:Type="String">${o.customerName || 'N/A'}</Data></Cell>
                <Cell><Data ss:Type="Number">${o.total}</Data></Cell>
                <Cell><Data ss:Type="Number">${o.tipAmount || 0}</Data></Cell>
                <Cell><Data ss:Type="String">${o.paymentMethod || 'N/A'}</Data></Cell>
                <Cell><Data ss:Type="String">${o.status}</Data></Cell>
              </Row>
            `).join('')}
          </Table>
        </Worksheet>
        <Worksheet ss:Name="Base de Datos Clientes">
          <Table>
            <Row>
              <Cell><Data ss:Type="String">ID Cliente</Data></Cell>
              <Cell><Data ss:Type="String">Nombre</Data></Cell>
              <Cell><Data ss:Type="String">WhatsApp</Data></Cell>
              <Cell><Data ss:Type="String">Visitas</Data></Cell>
              <Cell><Data ss:Type="String">Ultima Visita</Data></Cell>
            </Row>
            ${customers.map(c => `
              <Row>
                <Cell><Data ss:Type="String">${c.id}</Data></Cell>
                <Cell><Data ss:Type="String">${c.name}</Data></Cell>
                <Cell><Data ss:Type="String">${c.phone}</Data></Cell>
                <Cell><Data ss:Type="Number">${c.visits}</Data></Cell>
                <Cell><Data ss:Type="String">${new Date(c.lastVisit).toLocaleString()}</Data></Cell>
              </Row>
            `).join('')}
          </Table>
        </Worksheet>
      </Workbook>`;

    const base64 = (s: string) => window.btoa(unescape(encodeURIComponent(s)));
    const link = document.createElement("a");
    link.href = uri + base64(template);
    link.download = `Reporte_GastroPos_${new Date().toLocaleDateString().replace(/\//g, '-')}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    alert(`Asistencia registrada para ${user.name}`);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone.includes(customerSearch)
  );

  // Totales de Propinas
  const totalTips = orders.filter(o => o.status === OrderStatus.PAID).reduce((acc, o) => acc + (o.tipAmount || 0), 0);
  const totalTipsToday = orders.filter(o => o.status === OrderStatus.PAID && new Date(o.timestamp).toDateString() === new Date().toDateString()).reduce((acc, o) => acc + (o.tipAmount || 0), 0);

  return (
    <div className="flex flex-col md:flex-row gap-8 pb-32">
      <div className="w-full md:w-72 space-y-2 shrink-0">
        {[
          { id: 'DASHBOARD', icon: 'fa-chart-pie', label: 'Resumen' },
          { id: 'MENU_EDITOR', icon: 'fa-hamburger', label: 'Platillos' },
          { id: 'STAFF', icon: 'fa-users-cog', label: 'Personal' },
          { id: 'CUSTOMERS', icon: 'fa-address-book', label: 'Clientes' },
          { id: 'TIPS', icon: 'fa-hand-holding-usd', label: 'Propinas' },
          { id: 'CASH', icon: 'fa-vault', label: 'Caja' },
          { id: 'CONFIG', icon: 'fa-cog', label: 'Ajustes' }
        ].map(nav => (
          <button
            key={nav.id}
            onClick={() => setTab(nav.id as any)}
            className={`w-full flex items-center space-x-5 px-8 py-4 rounded-[2rem] font-black transition-all ${
              tab === nav.id ? 'bg-blue-600 text-white shadow-2xl scale-105' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'
            }`}
          >
            <i className={`fas ${nav.icon} text-sm`}></i>
            <span className="uppercase text-[10px] tracking-widest">{nav.label}</span>
          </button>
        ))}
        
        <button 
          onClick={exportToExcel}
          className="w-full mt-6 flex items-center space-x-5 px-8 py-6 rounded-[2rem] font-black bg-emerald-600 text-white shadow-xl hover:bg-emerald-500 transition-all active:scale-95"
        >
          <i className="fas fa-file-excel"></i>
          <span className="uppercase text-[10px] tracking-widest">Exportar Excel</span>
        </button>
      </div>

      <div className="flex-1 bg-[#111] rounded-[4rem] border border-slate-800 p-10 shadow-3xl overflow-hidden min-h-[700px]">
        
        {tab === 'DASHBOARD' && (
          <div className="space-y-10 animate-in fade-in">
            <h2 className="font-neon text-3xl neon-text-blue uppercase tracking-tighter">Métricas Maestras</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-black p-8 rounded-[3rem] border border-slate-800">
                <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Ventas Brutas</p>
                <h3 className="text-3xl font-black neon-text-blue">${orders.filter(o => o.status === OrderStatus.PAID && new Date(o.timestamp).toDateString() === new Date().toDateString()).reduce((a,b) => a+b.total, 0)}</h3>
              </div>
              <div className="bg-black p-8 rounded-[3rem] border border-slate-800">
                <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Propinas Hoy</p>
                <h3 className="text-3xl font-black neon-text-pink">${totalTipsToday}</h3>
              </div>
              <div className="bg-black p-8 rounded-[3rem] border border-slate-800">
                <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Pedidos Hoy</p>
                <h3 className="text-3xl font-black text-white">{orders.filter(o => new Date(o.timestamp).toDateString() === new Date().toDateString()).length}</h3>
              </div>
              <div className="bg-black p-8 rounded-[3rem] border border-slate-800">
                <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Clientes VIP</p>
                <h3 className="text-3xl font-black text-emerald-500">{customers.length}</h3>
              </div>
            </div>
          </div>
        )}

        {tab === 'CUSTOMERS' && (
          <div className="space-y-8 animate-in fade-in h-full flex flex-col">
            <div className="flex justify-between items-center">
               <h3 className="font-neon text-2xl neon-text-pink uppercase tracking-tighter">Directorio VIP</h3>
               <div className="relative w-64">
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"></i>
                  <input 
                    type="text" 
                    placeholder="Buscar cliente..." 
                    className="w-full bg-black border border-slate-800 py-3 pl-12 pr-4 rounded-2xl text-white font-bold text-xs outline-none focus:border-pink-500"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide pr-2">
               <table className="w-full text-left border-separate border-spacing-y-4">
                  <thead>
                    <tr className="text-[9px] font-black uppercase text-slate-500 tracking-[0.3em]">
                      <th className="px-6 pb-2">Cliente</th>
                      <th className="px-6 pb-2">WhatsApp</th>
                      <th className="px-6 pb-2 text-center">Frecuencia</th>
                      <th className="px-6 pb-2">Última Visita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map(c => (
                      <tr key={c.id} className="bg-black border border-slate-800 rounded-3xl group hover:border-pink-500 transition-all">
                        <td className="px-6 py-5 rounded-l-3xl font-black text-white uppercase text-xs">{c.name}</td>
                        <td className="px-6 py-5 text-pink-500 font-bold text-xs">{c.phone}</td>
                        <td className="px-6 py-5 text-center">
                          <span className="bg-slate-900 px-4 py-1 rounded-full text-[10px] font-black">{c.visits} veces</span>
                        </td>
                        <td className="px-6 py-5 rounded-r-3xl text-slate-500 text-[10px] uppercase font-bold">{new Date(c.lastVisit).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {tab === 'TIPS' && (
          <div className="space-y-10 animate-in fade-in h-full flex flex-col">
             <div className="flex justify-between items-end">
                <div>
                   <h3 className="font-neon text-2xl neon-text-blue uppercase tracking-tighter">Gestión de Propinas</h3>
                   <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Acumulado total de servicios</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total Histórico</p>
                   <h2 className="text-5xl font-black neon-text-blue tracking-tighter">${totalTips}</h2>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {orders.filter(o => o.status === OrderStatus.PAID && (o.tipAmount || 0) > 0).slice().reverse().map(o => (
                      <div key={o.id} className="bg-black p-6 rounded-3xl border border-slate-800 flex flex-col justify-between group hover:border-pink-500 transition-all">
                         <div className="flex justify-between items-start">
                            <div>
                               <p className="text-[9px] text-slate-500 font-black uppercase">Orden {o.id.slice(-6)}</p>
                               <p className="text-xs font-black text-white uppercase mt-1">{o.customerName || 'Cliente en Mesa'}</p>
                            </div>
                            <span className="text-pink-500 font-black text-lg">+${o.tipAmount}</span>
                         </div>
                         <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between items-center text-[9px] font-black uppercase text-slate-500">
                            <span>{new Date(o.timestamp).toLocaleDateString()}</span>
                            <span className="text-white">{o.paymentMethod}</span>
                         </div>
                      </div>
                   ))}
                </div>
                {orders.filter(o => o.status === OrderStatus.PAID && (o.tipAmount || 0) > 0).length === 0 && (
                   <div className="text-center py-20 opacity-20">
                      <i className="fas fa-hand-holding-heart text-6xl mb-4"></i>
                      <p className="font-black uppercase tracking-widest text-xs">Aún no hay propinas registradas</p>
                   </div>
                )}
             </div>
          </div>
        )}

        {tab === 'CASH' && (
          <div className="space-y-10 animate-in fade-in">
            <h3 className="font-neon text-2xl neon-text-blue uppercase tracking-tighter">Terminal de Caja</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-black p-8 rounded-[3rem] border border-slate-800 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Estado de Turno</p>
                    <h4 className={`text-xl font-black uppercase ${cashRegister.isOpen ? 'text-emerald-500' : 'text-red-500'}`}>
                      {cashRegister.isOpen ? 'OPERANDO' : 'CERRADA'}
                    </h4>
                  </div>
                  <i className={`fas ${cashRegister.isOpen ? 'fa-cash-register text-emerald-500' : 'fa-lock text-red-500'} text-3xl`}></i>
                </div>
                <div className="pt-4">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Saldo Disponible</p>
                  <h3 className="text-5xl font-black neon-text-blue tracking-tighter">${cashRegister.currentBalance}</h3>
                </div>
                {!cashRegister.isOpen ? (
                  <div className="space-y-4 pt-6">
                    <input type="number" placeholder="Fondo Inicial $" className="w-full bg-[#111] border border-slate-800 p-5 rounded-2xl text-white font-bold outline-none focus:border-blue-500" value={cashAmount} onChange={e => setCashAmount(e.target.value)} />
                    <button onClick={() => { onCashAction(true, Number(cashAmount)); setCashAmount(''); }} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Abrir Caja</button>
                  </div>
                ) : (
                  <button onClick={() => { if(window.confirm('¿Confirmar arqueo y cierre?')) onCashAction(false, 0); }} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl mt-6 active:scale-95 transition-all">Realizar Cierre</button>
                )}
              </div>
              <div className="bg-black p-8 rounded-[3rem] border border-slate-800 flex flex-col h-[400px]">
                <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-6">Auditoría de Movimientos</h4>
                <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide">
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
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'CONFIG' && (
          <div className="space-y-10 animate-in fade-in overflow-y-auto h-full scrollbar-hide pb-10">
            <h3 className="font-neon text-2xl neon-text-pink uppercase tracking-tighter">Configuración Visual</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nombre del Establecimiento:</label>
                  <input type="text" className="w-full bg-black border border-slate-800 p-5 rounded-2xl text-white font-black uppercase outline-none focus:border-blue-500" value={restaurantName} onChange={e => setRestaurantName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Color Primario:</label>
                      <input type="color" className="w-full h-14 bg-black border border-slate-800 rounded-2xl p-1 cursor-pointer" value={accentColor} onChange={e => setAccentColor(e.target.value)} />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Color Neón:</label>
                      <input type="color" className="w-full h-14 bg-black border border-slate-800 rounded-2xl p-1 cursor-pointer" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} />
                   </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Enlace de Logo:</label>
                  <div className="flex gap-4">
                    <input type="text" className="flex-1 bg-black border border-slate-800 p-5 rounded-2xl text-slate-400 text-xs outline-none focus:border-blue-500" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} />
                    <button onClick={() => logoInputRef.current?.click()} className="bg-slate-900 border border-slate-800 px-6 rounded-2xl text-white hover:bg-slate-800 transition-colors"><i className="fas fa-image"></i></button>
                    <input ref={logoInputRef} type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  </div>
                </div>
              </div>
              <div className="bg-black rounded-[4rem] border border-slate-800/50 p-10 flex flex-col items-center justify-center text-center">
                 <div className="custom-logo-container mb-10" style={{ borderColor: accentColor, boxShadow: `0 0 40px ${accentColor}` }}>
                    <img src={logoUrl} className="logo-img" alt="Logo Preview" />
                 </div>
                 <h1 className="font-neon text-4xl font-black uppercase tracking-tighter" style={{ color: accentColor, textShadow: `0 0 15px ${accentColor}` }}>{restaurantName}</h1>
                 <p className="text-[9px] font-black uppercase tracking-[0.5em] mt-5" style={{ color: secondaryColor }}>Vista Previa</p>
              </div>
            </div>
            <div className="flex justify-end pt-10">
               <button onClick={() => { alert('¡Configuración de identidad guardada exitosamente!'); }} className="bg-blue-600 text-white px-12 py-5 rounded-full font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Guardar Cambios</button>
            </div>
          </div>
        )}

        {tab === 'MENU_EDITOR' && (
          <div className="space-y-12 animate-in fade-in overflow-y-auto max-h-[80vh] scrollbar-hide">
            <div className="space-y-6">
              <h3 className="font-neon text-xl neon-text-pink uppercase">Gestión de Categorías</h3>
              <div className="flex gap-4">
                <input type="text" placeholder="Nueva..." className="flex-1 bg-black border border-slate-800 p-5 rounded-2xl text-white font-bold outline-none focus:border-pink-500" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                <button onClick={handleAddCategory} className="bg-pink-600 px-10 py-5 rounded-2xl font-black text-white uppercase text-[10px] tracking-widest">Crear</button>
              </div>
              <div className="flex flex-wrap gap-4">
                {categories.map(cat => (
                  <div key={cat} className="bg-slate-900 px-5 py-3 rounded-2xl border border-slate-800 flex items-center space-x-4">
                    <span className="text-white font-black uppercase text-[10px] tracking-widest">{cat}</span>
                    <button onClick={() => handleRemoveCategory(cat)} className="text-slate-600 hover:text-red-500 transition-colors"><i className="fas fa-minus-circle"></i></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-neon text-xl neon-text-blue uppercase tracking-tight">Menú de Productos</h3>
                <button onClick={() => setEditingProduct({ name: '', price: 0, category: categories[0] || '', image: '', description: '' })} className="bg-blue-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Nuevo Item</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map(p => (
                  <div key={p.id} className="bg-black p-6 rounded-[3rem] border border-slate-800 flex items-center justify-between group hover:border-blue-500 transition-all">
                    <div className="flex items-center space-x-5">
                      <img src={p.image} className="w-16 h-16 rounded-2xl object-cover border border-slate-800" />
                      <div>
                         <p className="font-black text-white uppercase text-xs tracking-tight">{p.name}</p>
                         <p className="text-blue-400 font-black text-sm mt-1">${p.price}</p>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button onClick={() => setEditingProduct(p)} className="p-3 bg-slate-900 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-colors"><i className="fas fa-pencil-alt"></i></button>
                      <button onClick={() => { if(window.confirm('¿Eliminar producto?')) setProducts(prev => prev.filter(x => x.id !== p.id)) }} className="p-3 bg-slate-900 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-colors"><i className="fas fa-trash-alt"></i></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'STAFF' && (
          <div className="space-y-10 animate-in fade-in overflow-y-auto max-h-[80vh] scrollbar-hide">
            <div className="flex justify-between items-center">
               <h3 className="font-neon text-2xl neon-text-blue uppercase tracking-tighter">Nómina de Personal</h3>
               <button onClick={() => setEditingStaff({ role: 'WAITER', name: '' })} className="bg-blue-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Nuevo Registro</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {staff.map(u => (
                <div key={u.id} className="bg-black p-8 rounded-[3.5rem] border border-slate-800 flex items-center justify-between group hover:border-blue-500 transition-all">
                  <div className="flex items-center space-x-6">
                    <img src={u.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} className="w-16 h-16 rounded-full border-2 border-slate-800 group-hover:border-blue-500 transition-colors" />
                    <div>
                       <p className="font-black text-white text-lg uppercase tracking-tight leading-none">{u.name}</p>
                       <p className="text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] mt-2">{u.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingStaff(u)} className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-blue-400 hover:bg-blue-600 hover:text-white transition-all"><i className="fas fa-id-card"></i></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Product Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[300] flex items-center justify-center p-6">
          <div className="bg-[#111] border border-slate-800 p-12 rounded-[5rem] w-full max-w-2xl space-y-8 shadow-2xl overflow-y-auto max-h-[90vh]">
             <h3 className="font-neon text-3xl neon-text-blue uppercase tracking-tighter text-center">Ficha Técnica de Item</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nombre:</label>
                  <input className="w-full bg-black border border-slate-800 p-5 rounded-3xl text-white font-black" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Precio Venta $:</label>
                  <input className="w-full bg-black border border-slate-800 p-5 rounded-3xl text-white font-black" type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Categoría:</label>
                  <select className="w-full bg-black border border-slate-800 p-5 rounded-3xl text-white font-black uppercase text-xs" value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Link Imagen:</label>
                  <input className="w-full bg-black border border-slate-800 p-5 rounded-3xl text-slate-400 text-xs" value={editingProduct.image} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} />
                </div>
                <div className="space-y-3 col-span-full">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Reseña del Plato:</label>
                  <textarea className="w-full bg-black border border-slate-800 p-6 rounded-[2.5rem] text-white text-sm" rows={2} value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                </div>
             </div>
             <div className="flex gap-6">
                <button onClick={() => setEditingProduct(null)} className="flex-1 py-6 bg-slate-900 rounded-3xl font-black uppercase tracking-widest text-slate-500 active:scale-95 transition-all">Cancelar</button>
                <button onClick={handleSaveProduct} className="flex-1 py-6 bg-blue-600 rounded-3xl font-black uppercase text-white tracking-widest shadow-xl active:scale-95 transition-all">Sincronizar Item</button>
             </div>
          </div>
        </div>
      )}

      {/* Staff Edit Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[300] flex items-center justify-center p-6">
          <div className="bg-[#111] border border-slate-800 p-12 rounded-[4rem] w-full max-w-md space-y-8 shadow-2xl">
            <h3 className="font-neon text-3xl neon-text-blue uppercase tracking-tighter text-center">Ficha Laboral</h3>
            <div className="space-y-6">
               <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nombre Completo:</label>
                  <input className="w-full bg-black border border-slate-800 p-5 rounded-3xl text-white font-black uppercase" value={editingStaff.name} onChange={e => setEditingStaff({...editingStaff, name: e.target.value})} />
               </div>
               <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Rol en Sistema:</label>
                  <select className="w-full bg-black border border-slate-800 p-5 rounded-3xl text-white font-black uppercase text-xs" value={editingStaff.role} onChange={e => setEditingStaff({...editingStaff, role: e.target.value as any})}>
                     <option value="WAITER">EQUIPO DE SALA</option>
                     <option value="KITCHEN">EQUIPO DE COCINA</option>
                     <option value="ADMIN">GERENCIA / SISTEMAS</option>
                  </select>
               </div>
            </div>
            <div className="flex gap-6">
              <button onClick={() => setEditingStaff(null)} className="flex-1 py-6 bg-slate-900 rounded-3xl font-black uppercase tracking-widest text-slate-500 active:scale-95 transition-all">Atrás</button>
              <button onClick={() => {
                if(!editingStaff.name) return;
                if(editingStaff.id) setStaff(prev => prev.map(s => s.id === editingStaff.id ? editingStaff as User : s));
                else setStaff(prev => [...prev, { ...editingStaff, id: `u_${Date.now()}` } as User]);
                setEditingStaff(null);
              }} className="flex-1 py-6 bg-blue-600 rounded-3xl font-black uppercase text-white shadow-xl active:scale-95 transition-all">Registrar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
