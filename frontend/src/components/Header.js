import React from 'react';
import { Menu, Wifi, WifiOff, Bell } from 'lucide-react';

function Header({ onMenuClick, isConnected, alertsCount }) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <Menu size={24} className="text-gray-600" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">LPR</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 hidden sm:block">
              Sistema de Reconhecimento de Placas
            </h1>
            <h1 className="text-lg font-semibold text-gray-900 sm:hidden">
              LPR System
            </h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Status da conexão */}
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <>
                <Wifi size={20} className="text-green-500" />
                <span className="text-sm text-green-600 hidden sm:inline">
                  Conectado
                </span>
              </>
            ) : (
              <>
                <WifiOff size={20} className="text-red-500" />
                <span className="text-sm text-red-600 hidden sm:inline">
                  Desconectado
                </span>
              </>
            )}
          </div>

          {/* Contador de alertas */}
          {alertsCount > 0 && (
            <div className="relative">
              <Bell size={20} className="text-red-500 animate-pulse" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {alertsCount > 9 ? '9+' : alertsCount}
              </span>
            </div>
          )}

          {/* Info do usuário */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-sm font-medium">U</span>
            </div>
            <span className="text-sm text-gray-700 hidden sm:inline">
              Operador
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;