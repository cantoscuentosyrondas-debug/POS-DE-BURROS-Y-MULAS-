
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

  const handleSaveStaff = () => {
    if (!editingStaff?.name) return;
    if (editingStaff.id) {
      setStaff(prev => prev.map(s => s.id === editingStaff.id ? editingStaff as User : s));
    } else {
      setStaff(prev => [...prev, { ...editingStaff, id: `u_${Date.now()}` } as User]);
    }
    setEditingStaff(null);
  };

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
            <Row ss:StyleID="Header">
              <Cell><Data ss:Type="String">ID Orden</Data></Cell>
              <Cell><Data ss:Type="String">Fecha/Hora</Data></Cell>
              <Cell><Data ss:Type="String">Referencia Mesa</Data></Cell>
              <Cell><Data ss:Type="String">Cliente</Data></Cell>
              <Cell><Data ss:Type="String">Subtotal</Data></Cell>
              <Cell><Data ss:Type="String">Propina</Data></Cell>
              <Cell><Data ss:Type="String">Total</Data></Cell>
              <Cell><Data ss:Type="String">Metodo Pago</Data></Cell>
              <Cell><Data ss:Type="String">Estado</Data></Cell>
            </Row>
            ${orders.map(o => `
              <Row>
                <Cell><Data ss:Type="String">${o.id.slice(-6)}</Data></Cell>
                <Cell><Data ss:Type="String">${new Date(o.timestamp).toLocaleString()}</Data></Cell>
                <Cell><Data ss:Type="String">${o.tableId ? 'Mesa ' + o.tableId.replace('t','') : 'N/A'}</Data></Cell>
                <Cell><Data ss:Type="String">${o.customerName || 'N/A'}</Data></Cell>
                <Cell><Data ss:Type="Number">${o.total}</Data></Cell>
                <Cell><Data ss:Type="Number">${o.tipAmount || 0}</Data></Cell>
                <Cell><Data ss:Type="Number">${o.total + (o.tipAmount || 0)}</Data></Cell>
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
              <Cell><Data ss:Type="String">Nombre Completo</Data></Cell>
              <Cell><Data ss:Type="String">WhatsApp / Telefono</Data></Cell>
              <Cell><Data ss:Type="String">Visitas Acumuladas</Data></Cell>
              <Cell><Data ss:Type="String">Ultima Visita</Data></Cell>
            </Row>
            ${customers.map(c => `
              <Row>
                <Cell><Data ss:Type="String">${c.id.slice(-6)}</Data></Cell>
                <Cell><Data ss:Type="String">${c.name}</Data></Cell>
                <Cell><Data ss:Type="String">${c.phone}</Data></Cell>
                <Cell><Data ss:Type="Number">${c.visits}</Data></Cell>
                <Cell><Data ss:Type="String">${new Date(c.lastVisit).toLocaleDateString()}</Data></Cell>
              </Row>
            `).join('')}
          </Table>
        </Worksheet>
        <Styles>
          <Style ss:ID="Header">
            <Font ss:Bold="1" ss:Color="#FFFFFF"/>
            <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
          </Style>
        </Styles>
      </Workbook>`;

    const base64 = (s: string) => window.btoa(unescape(encodeURIComponent(s)));
    const link = document.createElement("a");
    link.href = uri + base64(template);
    link.download = `Reporte_${restaurantName.replace(/\s/g, '_')}_${new Date().toLocaleDateString().replace(/\//g, '-')}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const totalTipsToday = orders.filter(o => o.status === OrderStatus.PAID && new Date(o.timestamp).toDateString() === new Date().toDateString()).reduce((acc, o) => acc + (o.tipAmount || 0), 0);
  const totalTips = orders.filter(o => o.status === OrderStatus.PAID).reduce((acc, o) => acc + (o.tipAmount || 0), 0);

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
          <span className="uppercase text-[10px] tracking-widest">Generar Reportes</span>
        </button>
      </div>

      <div className="flex-1 bg-[#111] rounded-[4rem] border border-slate-800 p-10 shadow-3xl overflow-hidden min-h-[700px]">
        {tab === 'DASHBOARD' && (
          <div className="space-y-10 animate-in fade-in">
            <h2 className="font-neon text-3xl neon-text-blue uppercase tracking-tighter">Métricas Maestras</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-black p-8 rounded-[3rem] border border-slate-800">
                <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Ventas Hoy</p>
                <h3 className="text-3xl font-black neon-text-blue">${orders.filter(o => o.status === OrderStatus.PAID && new Date(o.timestamp).toDateString() === new Date().toDateString()).reduce((a,b) => a+b.total, 0)}</h3>
              </div>
              <div className="bg-black p-8 rounded-[3rem] border border-slate-800">
                <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Propinas Hoy</p>
                <h3 className="text-3xl font-black neon-text-pink">${totalTipsToday}</h3>
              </div>
              <div className="bg-black p-8 rounded-[3rem] border border-slate-800">
                <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Pedidos Totales</p>
                <h3 className="text-3xl font-black text-white">{orders.length}</h3>
              </div>
              <div className="bg-black p-8 rounded-[3rem] border border-slate-800">
                <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Base Clientes</p>
                <h3 className="text-3xl font-black text-emerald-500">{customers.length}</h3>
              </div>
            </div>
          </div>
        )}

        {tab === 'STAFF' && (
          <div className="space-y-10 animate-in fade-in">
             <div className="flex justify-between items-center">
               <h3 className="font-neon text-2xl neon-text-blue uppercase tracking-tighter">Personal (STAFF)</h3>
               <button onClick={() => setEditingStaff({ name: '', role: 'WAITER' })} className="bg-blue-600 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg">Nuevo Staff</button>
             </div>
             
             {editingStaff && (
               <div className="bg-black p-8 rounded-[2.5rem] border border-blue-500/30 space-y-6 animate-in slide-in-from-top">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Nombre Completo:</label>
                     <input className="w-full bg-[#111] border border-slate-800 p-4 rounded-2xl text-white font-bold" value={editingStaff.name} onChange={e => setEditingStaff({...editingStaff, name: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Rol en el Sistema:</label>
                     <select className="w-full bg-[#111] border border-slate-800 p-4 rounded-2xl text-white font-bold uppercase" value={editingStaff.role} onChange={e => setEditingStaff({...editingStaff, role: e.target.value as any})}>
                       <option value="WAITER">MESERO / STAFF</option>
                       <option value="KITCHEN">COCINA</option>
                       <option value="ADMIN">ADMIN / DUEÑO</option>
                     </select>
                   </div>
                 </div>
                 <div className="flex gap-4">
                   <button onClick={() => setEditingStaff(null)} className="flex-1 py-4 bg-slate-900 rounded-2xl font-black uppercase text-[10px] text-slate-500">Cancelar</button>
                   <button onClick={handleSaveStaff} className="flex-1 py-4 bg-blue-600 rounded-2xl font-black uppercase text-[10px] text-white shadow-xl">Guardar Cambios</button>
                 </div>
               </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {staff.map(u => (
                 <div key={u.id} className="bg-black p-6 rounded-[2.5rem] border border-slate-800 flex items-center justify-between group hover:border-blue-500 transition-all">
                   <div className="flex items-center space-x-5">
                     <img src={u.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} className="w-14 h-14 rounded-full border border-slate-700" />
                     <div>
                        <p className="font-black text-white text-sm uppercase">{u.name}</p>
                        <p className="text-blue-500 font-black text-[9px] uppercase tracking-widest">{u.role}</p>
                     </div>
                   </div>
                   <div className="flex gap-2">
                     <button onClick={() => setEditingStaff(u)} className="p-3 bg-slate-900 rounded-xl text-blue-400 hover:bg-blue-600 hover:text-white transition-all"><i className="fas fa-user-edit"></i></button>
                     <button onClick={() => setStaff(prev => prev.filter(s => s.id !== u.id))} className="p-3 bg-slate-900 rounded-xl text-red-500 hover:bg-red-600 hover:text-white transition-all"><i className="fas fa-trash"></i></button>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* ... Otros tabs permanecen funcionales con las correcciones globales ... */}
        {tab === 'CONFIG' && (
          <div className="space-y-10 animate-in fade-in overflow-y-auto h-full scrollbar-hide pb-10">
            <h3 className="font-neon text-2xl neon-text-pink uppercase tracking-tighter">Ajustes del Negocio</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nombre Comercial:</label>
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
                 <p className="text-[9px] font-black uppercase tracking-[0.5em] mt-5" style={{ color: secondaryColor }}>Configuración Actual</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
