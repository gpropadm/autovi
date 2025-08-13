import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Trash2, AlertTriangle } from 'lucide-react';
import axios from 'axios';

function MonitoredPlates({ socket }) {
  const [plates, setPlates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchPlates();
  }, []);

  const fetchPlates = async () => {
    try {
      const response = await axios.get('/api/monitored-plates');
      setPlates(response.data);
    } catch (error) {
      console.error('Erro ao buscar placas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePlate = async (plateId) => {
    if (!window.confirm('Tem certeza que deseja remover esta placa do monitoramento?')) {
      return;
    }

    try {
      await axios.delete(`/api/monitored-plates/${plateId}`);
      await fetchPlates();
    } catch (error) {
      console.error('Erro ao remover placa:', error);
    }
  };

  const filteredPlates = plates.filter(plate => {
    const matchesSearch = plate.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plate.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plate.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || plate.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const statusLabels = {
    'stolen': 'ROUBADO',
    'suspicious': 'SUSPEITO',
    'vip': 'VIP',
    'blocked': 'BLOQUEADO'
  };

  const statusColors = {
    'stolen': 'red',
    'suspicious': 'yellow',
    'vip': 'green',
    'blocked': 'gray'
  };

  const StatusBadge = ({ status }) => {
    const color = statusColors[status] || 'gray';
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}>
        {statusLabels[status] || status.toUpperCase()}
      </span>
    );
  };

  const AddPlateModal = ({ isOpen, onClose, onAdd }) => {
    const [formData, setFormData] = useState({
      plateNumber: '',
      status: 'suspicious',
      description: '',
      ownerName: '',
      vehicleModel: '',
      vehicleColor: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await axios.post('/api/monitored-plates', formData);
        await fetchPlates();
        setFormData({
          plateNumber: '',
          status: 'suspicious',
          description: '',
          ownerName: '',
          vehicleModel: '',
          vehicleColor: ''
        });
        onClose();
      } catch (error) {
        console.error('Erro ao adicionar placa:', error);
      }
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Adicionar Placa ao Monitoramento</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placa *
              </label>
              <input
                type="text"
                placeholder="ABC1234"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.plateNumber}
                onChange={(e) => setFormData({...formData, plateNumber: e.target.value.toUpperCase()})}
                required
                maxLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                required
              >
                <option value="suspicious">Suspeito</option>
                <option value="stolen">Roubado</option>
                <option value="blocked">Bloqueado</option>
                <option value="vip">VIP</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição *
              </label>
              <textarea
                placeholder="Motivo do monitoramento..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proprietário
              </label>
              <input
                type="text"
                placeholder="Nome do proprietário"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.ownerName}
                onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modelo do Veículo
                </label>
                <input
                  type="text"
                  placeholder="Honda Civic 2020"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData({...formData, vehicleModel: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cor
                </label>
                <input
                  type="text"
                  placeholder="Preto"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.vehicleColor}
                  onChange={(e) => setFormData({...formData, vehicleColor: e.target.value})}
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Adicionar
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
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
        <h1 className="text-2xl font-bold text-gray-900">Placas Monitoradas</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Nova Placa
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por placa, proprietário ou descrição..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos os Status</option>
              <option value="stolen">Roubado</option>
              <option value="suspicious">Suspeito</option>
              <option value="blocked">Bloqueado</option>
              <option value="vip">VIP</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Placas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredPlates.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto text-gray-400" size={48} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhuma placa encontrada</h3>
            <p className="mt-2 text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Adicione uma placa para começar o monitoramento'
              }
            </p>
          </div>
        ) : (
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
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detecções
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPlates.map((plate) => (
                  <tr key={plate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 plate-number">
                          {plate.plate_number}
                        </div>
                        {plate.vehicle_model && (
                          <div className="text-sm text-gray-500">
                            {plate.vehicle_model} - {plate.vehicle_color || 'Cor não informada'}
                          </div>
                        )}
                        {plate.owner_name && (
                          <div className="text-xs text-gray-400">
                            {plate.owner_name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={plate.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={plate.description}>
                        {plate.description}
                      </div>
                      <div className="text-xs text-gray-500">
                        Adicionada em {new Date(plate.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Eye size={16} className="text-gray-400 mr-1" />
                        {plate.detection_count || 0}
                        {plate.last_detection && (
                          <div className="text-xs text-gray-500 ml-2">
                            Última: {new Date(plate.last_detection).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleRemovePlate(plate.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Remover do monitoramento"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddPlateModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={fetchPlates}
      />
    </div>
  );
}

export default MonitoredPlates;