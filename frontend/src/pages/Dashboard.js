import React, { useState, useEffect } from 'react';
import { Eye, Shield, Camera, AlertTriangle } from 'lucide-react';
import axios from 'axios';

function Dashboard({ socket, alerts }) {
  const [stats, setStats] = useState({
    todayDetections: 0,
    todayAlerts: 0,
    monitoredPlates: 0,
    activeCameras: 0
  });
  const [recentDetections, setRecentDetections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, detectionsResponse] = await Promise.all([
        axios.get('/api/dashboard/stats'),
        axios.get('/api/detections?limit=10')
      ]);

      setStats(statsResponse.data);
      setRecentDetections(detectionsResponse.data.detections);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, description }) => (
    <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <div className="mt-2">
            <div className="text-3xl font-bold" style={{ color }}>{value}</div>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
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

  const AlertCard = ({ alert }) => {
    const { detection, monitoredPlate, timestamp } = alert;
    const statusColors = {
      'stolen': 'red',
      'suspicious': 'yellow',
      'vip': 'green',
      'blocked': 'gray'
    };
    
    const statusLabels = {
      'stolen': 'ROUBADO',
      'suspicious': 'SUSPEITO',
      'vip': 'VIP',
      'blocked': 'BLOQUEADO'
    };

    const color = statusColors[monitoredPlate.status] || 'gray';
    
    return (
      <div className={`p-4 border-l-4 border-${color}-500 bg-${color}-50 rounded-r-lg`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900 plate-number">
              {detection.plate_number}
            </h4>
            <p className={`text-sm font-medium text-${color}-600`}>
              {statusLabels[monitoredPlate.status]}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(timestamp).toLocaleString('pt-BR')}
            </p>
          </div>
          <AlertTriangle className={`text-${color}-500`} size={20} />
        </div>
      </div>
    );
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Atualizar
        </button>
      </div>

      {/* Estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Detecções Hoje"
          value={stats.todayDetections}
          icon={Eye}
          color="#3b82f6"
          description="Placas detectadas hoje"
        />
        <StatCard
          title="Alertas Hoje"
          value={stats.todayAlerts}
          icon={AlertTriangle}
          color="#ef4444"
          description="Placas monitoradas encontradas"
        />
        <StatCard
          title="Placas Vigiadas"
          value={stats.monitoredPlates}
          icon={Shield}
          color="#f59e0b"
          description="Total em monitoramento"
        />
        <StatCard
          title="Câmeras Ativas"
          value={3} // Fixo por enquanto
          icon={Camera}
          color="#10b981"
          description="Dispositivos online"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas Ativos */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <AlertTriangle className="text-red-500 mr-2" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">
                Alertas Ativos ({alerts.length})
              </h2>
            </div>
          </div>
          <div className="p-6">
            {alerts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nenhum alerta ativo no momento
              </p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {alerts.map((alert, index) => (
                  <AlertCard key={index} alert={alert} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detecções Recentes */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <Eye className="text-blue-500 mr-2" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">
                Detecções Recentes
              </h2>
            </div>
          </div>
          <div className="p-6">
            {recentDetections.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nenhuma detecção registrada
              </p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recentDetections.map((detection) => (
                  <div key={detection.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 plate-number">
                        {detection.plate_number}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {detection.camera_name || `Câmera ${detection.camera_id}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(detection.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      {detection.is_monitored && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                          Monitorada
                        </span>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        {detection.confidence_score?.toFixed(1)}% confiança
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;