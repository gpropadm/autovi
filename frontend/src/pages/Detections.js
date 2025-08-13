import React, { useState, useEffect } from 'react';
import { Eye, Camera, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

function Detections({ socket }) {
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchDetections();
  }, [pagination.page]);

  const fetchDetections = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/detections?page=${pagination.page}&limit=${pagination.limit}`);
      setDetections(response.data.detections);
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination
      }));
    } catch (error) {
      console.error('Erro ao buscar detecções:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatusBadge = ({ isMonitored, status }) => {
    if (!isMonitored) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Normal
        </span>
      );
    }

    const statusColors = {
      'stolen': 'bg-red-100 text-red-800',
      'suspicious': 'bg-yellow-100 text-yellow-800',
      'vip': 'bg-green-100 text-green-800',
      'blocked': 'bg-gray-100 text-gray-800'
    };

    const statusLabels = {
      'stolen': '🚨 ROUBADO',
      'suspicious': '⚠️ SUSPEITO', 
      'vip': '⭐ VIP',
      'blocked': '🚫 BLOQUEADO'
    };

    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
    const label = statusLabels[status] || status?.toUpperCase() || 'MONITORADO';

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {label}
      </span>
    );
  };

  const PaginationControls = () => (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
          disabled={pagination.page === 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <button
          onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
          disabled={pagination.page === pagination.totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Próximo
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Mostrando{' '}
            <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
            {' '}até{' '}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
            </span>
            {' '}de{' '}
            <span className="font-medium">{pagination.totalCount}</span>
            {' '}resultados
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            
            {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
              const pageNum = i + Math.max(1, pagination.page - 2);
              if (pageNum > pagination.totalPages) return null;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    pageNum === pagination.page
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Detecções</h1>
        <button
          onClick={fetchDetections}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Atualizar
        </button>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Eye className="text-blue-500 mr-2" size={20} />
            <div>
              <div className="text-2xl font-bold text-gray-900">{pagination.totalCount}</div>
              <div className="text-sm text-gray-500">Total de Detecções</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <AlertTriangle className="text-red-500 mr-2" size={20} />
            <div>
              <div className="text-2xl font-bold text-red-600">
                {detections.filter(d => d.is_monitored).length}
              </div>
              <div className="text-sm text-gray-500">Alertas Ativos</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Camera className="text-green-500 mr-2" size={20} />
            <div>
              <div className="text-2xl font-bold text-gray-900">3</div>
              <div className="text-sm text-gray-500">Câmeras Ativas</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Eye className="text-purple-500 mr-2" size={20} />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {detections.length > 0 ? (detections.reduce((acc, d) => acc + (d.confidence_score || 0), 0) / detections.length).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-gray-500">Confiança Média</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Detecções */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {detections.length === 0 ? (
          <div className="text-center py-12">
            <Eye className="mx-auto text-gray-400" size={48} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhuma detecção encontrada</h3>
            <p className="mt-2 text-gray-500">As detecções aparecerão aqui quando as câmeras identificarem placas</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Placa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Câmera
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confiança
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Imagem
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {detections.map((detection) => (
                    <tr key={detection.id} className={`hover:bg-gray-50 ${detection.is_monitored ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 plate-number">
                          {detection.plate_number}
                        </div>
                        {detection.monitored_description && (
                          <div className="text-xs text-gray-500 max-w-xs truncate">
                            {detection.monitored_description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge 
                          isMonitored={detection.is_monitored} 
                          status={detection.monitored_status} 
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Camera size={16} className="text-gray-400 mr-2" />
                          <div>
                            <div>{detection.camera_name || `Câmera ${detection.camera_id}`}</div>
                            {detection.camera_location && (
                              <div className="text-xs text-gray-500">{detection.camera_location}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-900">
                            {detection.confidence_score ? `${detection.confidence_score.toFixed(1)}%` : 'N/A'}
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-1 ml-2">
                            <div 
                              className="bg-blue-600 h-1 rounded-full" 
                              style={{ width: `${detection.confidence_score || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          {new Date(detection.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(detection.created_at).toLocaleTimeString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {detection.image_path ? (
                          <button
                            onClick={() => window.open(`http://localhost:3001/${detection.image_path}`, '_blank')}
                            className="text-blue-600 hover:text-blue-900 underline"
                          >
                            Ver Imagem
                          </button>
                        ) : (
                          <span className="text-gray-400">Sem imagem</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls />
          </>
        )}
      </div>
    </div>
  );
}

export default Detections;