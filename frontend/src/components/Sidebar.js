import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Eye,
  Shield,
  Camera,
  Upload,
  X
} from 'lucide-react';

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      description: 'Visão geral do sistema'
    },
    {
      name: 'Detecções',
      path: '/detections',
      icon: Eye,
      description: 'Histórico de detecções'
    },
    {
      name: 'Placas Monitoradas',
      path: '/monitored-plates',
      icon: Shield,
      description: 'Gerenciar placas vigiadas'
    },
    {
      name: 'Câmeras',
      path: '/cameras',
      icon: Camera,
      description: 'Status das câmeras'
    },
    {
      name: 'Upload de Imagem',
      path: '/upload',
      icon: Upload,
      description: 'Analisar imagem'
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header da sidebar */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">LPR</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">Menu</span>
          </div>
          
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Navegação */}
        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => onClose()}
                    className={`
                      flex items-center px-4 py-3 rounded-lg transition-colors duration-200
                      ${active 
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon 
                      size={20} 
                      className={`mr-3 ${active ? 'text-blue-600' : 'text-gray-400'}`} 
                    />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500 hidden lg:block">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Informações do sistema */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-sm text-gray-500">
              Sistema LPR v1.0
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Reconhecimento de Placas
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;