
import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  logoUrl: string;
  restaurantName: string;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, logoUrl, restaurantName }) => {
  return (
    <header className="bg-[#0a0a0a] border-b border-slate-800 text-white p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center overflow-hidden bg-black shadow-[0_0_10px_rgba(255,255,255,0.1)]">
             <img src={logoUrl} className="w-full h-full object-contain" alt="Logo mini" />
          </div>
          <h1 className="font-neon text-lg md:text-xl font-black tracking-tighter neon-text-blue uppercase">
            {restaurantName}
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold">{user.name}</span>
            <span className="text-[10px] uppercase tracking-widest text-blue-400">{user.role}</span>
          </div>
          <button 
            onClick={onLogout}
            className="w-10 h-10 border border-slate-700 rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors"
          >
            <i className="fas fa-power-off text-red-500"></i>
          </button>
        </div>
      </div>
    </header>
  );
};
