import React, { useState, useEffect } from 'react';
import { Camera, MapPin, Eye, Activity, RefreshCw } from 'lucide-react';
import axios from 'axios';

function Cameras({ socket }) {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCameras();
  }, []);

  const fetchCameras = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/cameras');
      setCameras(response.data);
    } catch (error) {
      console.error('Erro ao buscar câmeras:', error);
    } finally {
      setLoading(false);
    }
  };

  const CameraCard = ({ camera }) => {
    const isActive = camera.is_active;
    const lastDetection = camera.last_detection;
    const detectionCount = camera.detection_count || 0;

    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header do card */}
        <div className={`p-4 ${isActive ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                <Camera className={`${isActive ? 'text-green-600' : 'text-red-600'}`} size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{camera.name}</h3>
                <div className="flex items-center space-x-2 text-sm">
                  <Activity 
                    className={`${isActive ? 'text-green-500' : 'text-red-500'}`} 
                    size={16} 
                  />
                  <span className={`font-medium ${isActive ? 'text-green-700' : 'text-red-700'}`}>
                    {isActive ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{detectionCount}</div>
              <div className="text-sm text-gray-500">detecções</div>
            </div>
          </div>
        </div>

        {/* Conteúdo do card */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Localização */}
            {camera.location && (
              <div className="flex items-start space-x-3">
                <MapPin className="text-gray-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-gray-900">Localização</div>
                  <div className="text-sm text-gray-600">{camera.location}</div>
                  {(camera.latitude && camera.longitude) && (
                    <div className="text-xs text-gray-400 mt-1">
                      {camera.latitude.toFixed(6)}, {camera.longitude.toFixed(6)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Última detecção */}
            <div className="flex items-start space-x-3">
              <Eye className="text-gray-400 mt-0.5" size={18} />
              <div>
                <div className="text-sm font-medium text-gray-900">Última Detecção</div>
                <div className="text-sm text-gray-600">
                  {lastDetection 
                    ? new Date(lastDetection).toLocaleString('pt-BR')
                    : 'Nenhuma detecção registrada'
                  }
                </div>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{detectionCount}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {camera.daily_count || 0}
                </div>
                <div className="text-sm text-gray-500">Hoje</div>
              </div>
            </div>

            {/* Status detalhado */}
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">ID:</span>
                  <span className="text-gray-900">#{camera.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Criada em:</span>
                  <span className="text-gray-900">
                    {new Date(camera.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="bg-gray-50 px-6 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (camera.latitude && camera.longitude) {
                  window.open(
                    `https://www.google.com/maps?q=${camera.latitude},${camera.longitude}`,
                    '_blank'
                  );
                }
              }}
              disabled={!camera.latitude || !camera.longitude}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Ver no Mapa
            </button>
            <div className="flex space-x-2">
              <button
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                title="Mais detalhes"
              >
                <Eye size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const StatCard = ({ title, value, subtitle, color, icon: Icon }) => (
    <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <div className="mt-2">
            <div className="text-3xl font-bold" style={{ color }}>{value}</div>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
        </div>
        <div className="ml-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
            <Icon size={24} style={{ color }} />
          </div>
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

  const activeCameras = cameras.filter(c => c.is_active).length;
  const totalDetections = cameras.reduce((acc, c) => acc + (c.detection_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Câmeras</h1>
        <button
          onClick={fetchCameras}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={20} className="mr-2" />
          Atualizar
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Câmeras Ativas"
          value={activeCameras}
          subtitle={`de ${cameras.length} total`}
          color="#10b981"
          icon={Camera}
        />
        <StatCard
          title="Total de Detecções"
          value={totalDetections}
          subtitle="Todas as câmeras"
          color="#3b82f6"
          icon={Eye}
        />
        <StatCard
          title="Média por Câmera"
          value={cameras.length > 0 ? Math.round(totalDetections / cameras.length) : 0}
          subtitle="Detecções por câmera"
          color="#f59e0b"
          icon={Activity}
        />
      </div>

      {/* Lista de Câmeras */}
      {cameras.length === 0 ? (
        <div className="bg-white rounded-lg shadow">
          <div className="text-center py-12">
            <Camera className="mx-auto text-gray-400" size={48} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhuma câmera configurada</h3>
            <p className="mt-2 text-gray-500">Configure câmeras para começar o monitoramento</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cameras.map((camera) => (
            <CameraCard key={camera.id} camera={camera} />
          ))}
        </div>
      )}

      {/* Mapa de Localização (placeholder) */}
      {cameras.some(c => c.latitude && c.longitude) && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <MapPin className="mr-2" size={20} />
              Localização das Câmeras
            </h2>
          </div>
          <div className="p-6">
            <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="mx-auto text-gray-400 mb-2" size={48} />
                <p className="text-gray-500">Mapa interativo em desenvolvimento</p>
                <p className="text-sm text-gray-400 mt-1">
                  {cameras.filter(c => c.latitude && c.longitude).length} câmeras georreferenciadas
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cameras;