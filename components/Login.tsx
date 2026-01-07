
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
  logoUrl: string;
  restaurantName: string;
}

export const Login: React.FC<LoginProps> = ({ onLogin, users, logoUrl, restaurantName }) => {
  const [showStaffSelect, setShowStaffSelect] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-600/10 rounded-full blur-[120px]"></div>

      <div className="mb-12 logo-pulse flex flex-col items-center z-10 text-center">
        <div className="custom-logo-container mb-6 w-44 h-44 border-4 border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.5)]">
          <img src={logoUrl} alt="Logo" className="logo-img" />
        </div>
        <h1 className="font-neon text-3xl font-black neon-text-blue tracking-tighter leading-none uppercase">{restaurantName}</h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.5em] mt-3">Smart POS System</p>
      </div>

      {!showStaffSelect ? (
        <div className="w-full max-w-sm flex flex-col items-center space-y-5 z-10">
          <button
            onClick={() => onLogin({ id: 'guest', name: 'Cliente', role: 'CUSTOMER' })}
            className="w-full py-6 rounded-[2.5rem] bg-white text-black font-black uppercase tracking-widest text-lg shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-95 transition-all flex items-center justify-center gap-4"
          >
            <i className="fas fa-qrcode text-pink-500"></i> AUTO-SERVICIO
          </button>
          
          <button 
            onClick={() => setShowStaffSelect(true)}
            className="w-full py-6 rounded-[2.5rem] bg-slate-900 text-blue-400 border border-slate-800 font-black uppercase tracking-widest text-lg active:scale-95 transition-all flex items-center justify-center gap-4"
          >
            <i className="fas fa-user-shield"></i> ACCESO STAFF
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md bg-[#111] rounded-[3rem] border border-slate-800 p-8 animate-in slide-in-from-bottom z-10 shadow-3xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-neon text-sm neon-text-blue uppercase tracking-widest">Seleccionar Usuario</h3>
            <button onClick={() => setShowStaffSelect(false)} className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 max-h-[50vh] overflow-y-auto pr-2 scrollbar-hide">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => onLogin(u)}
                className="w-full flex items-center justify-between p-5 rounded-3xl border border-slate-800 bg-black active:border-blue-500 hover:bg-slate-900/50 transition-all group"
              >
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 rounded-2xl border-2 border-slate-800 overflow-hidden group-hover:border-blue-500 transition-all">
                    <img src={u.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-white uppercase tracking-tight text-sm">{u.name}</p>
                    <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest">{u.role}</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <i className="fas fa-chevron-right"></i>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="absolute bottom-8 text-[9px] text-slate-600 font-black uppercase tracking-widest z-10">
        Powered by Cloud-POS Architecture
      </div>
    </div>
  );
};
