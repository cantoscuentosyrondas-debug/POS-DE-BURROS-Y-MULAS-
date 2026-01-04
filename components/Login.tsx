
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
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [pin, setPin] = useState('');

  const handleStaffClick = (user: User) => {
    setSelectedStaff(user);
    setPin('');
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1988') {
      if (selectedStaff) onLogin(selectedStaff);
    } else {
      alert("PIN Incorrecto. Intenta de nuevo.");
      setPin('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>

      <div className="mb-14 logo-pulse flex flex-col items-center z-10 text-center">
        <div className="custom-logo-container mb-6">
          <img src={logoUrl} alt="Logo" className="logo-img" />
        </div>
        <h1 className="font-neon text-3xl font-black neon-text-blue tracking-tighter leading-none">{restaurantName}</h1>
      </div>

      {!showStaffSelect ? (
        <div className="w-full max-w-sm flex flex-col items-center space-y-12 z-10">
          <div className="w-full space-y-4">
             <button
                onClick={() => onLogin({ id: 'guest', name: 'Cliente', role: 'CUSTOMER' })}
                className="w-full py-6 rounded-[2.5rem] bg-white text-black font-black uppercase tracking-widest text-lg shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all border-4 border-transparent hover:border-blue-400"
              >
                <i className="fas fa-qrcode mr-3 text-pink-500"></i> ENTRAR COMO CLIENTE
              </button>
              <p className="text-center text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em]">EXPERIENCIA AUTO-SERVICIO</p>
          </div>

          <button 
            onClick={() => setShowStaffSelect(true)}
            className="text-slate-500 hover:text-blue-400 font-bold text-[11px] uppercase tracking-widest transition-colors flex items-center space-x-2"
          >
            <i className="fas fa-user-shield"></i>
            <span>Acceso Staff</span>
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md bg-[#111] rounded-[3rem] border border-slate-800 p-8 animate-in slide-in-from-bottom duration-300 z-10">
          {!selectedStaff ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-neon text-sm neon-text-blue tracking-tighter uppercase">Selecciona tu Perfil</h3>
                <button onClick={() => setShowStaffSelect(false)} className="text-slate-500 hover:text-white">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="space-y-3">
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleStaffClick(u)}
                    className="w-full flex items-center justify-between p-5 rounded-2xl border border-slate-800 bg-black hover:border-blue-500/50 hover:bg-slate-900 transition-all group"
                  >
                    <div className="flex items-center space-x-4">
                      <img src={u.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed='+u.id} className="w-10 h-10 rounded-full border border-slate-700" />
                      <div className="text-left">
                        <div className="font-black text-slate-100 uppercase tracking-tighter text-lg">{u.name}</div>
                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{u.role}</div>
                      </div>
                    </div>
                    <i className="fas fa-lock text-slate-700 group-hover:text-blue-400"></i>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-6 animate-in zoom-in duration-200">
               <div className="flex items-center space-x-4">
                 <button onClick={() => setSelectedStaff(null)} className="text-slate-500 hover:text-white"><i className="fas fa-arrow-left"></i></button>
                 <h3 className="font-neon text-sm neon-text-blue tracking-tighter uppercase">Ingresa tu PIN</h3>
               </div>
               <div className="text-center space-y-2">
                 <img src={selectedStaff.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed='+selectedStaff.id} className="w-20 h-20 rounded-full mx-auto border-2 border-blue-500" />
                 <p className="font-black uppercase text-white">{selectedStaff.name}</p>
               </div>
               <form onSubmit={handlePinSubmit} className="space-y-4">
                 <input 
                   type="password" 
                   value={pin}
                   onChange={e => setPin(e.target.value)}
                   className="w-full bg-black border-2 border-slate-800 p-4 rounded-2xl text-white text-center text-2xl tracking-[1em] focus:border-blue-500 outline-none"
                   placeholder="****"
                   autoFocus
                   maxLength={4}
                 />
                 <button 
                   type="submit"
                   className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl"
                 >
                   Verificar Acceso
                 </button>
               </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
