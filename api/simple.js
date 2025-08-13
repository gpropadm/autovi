const express = require('express');
const cors = require('cors');

const app = express();

// Middleware básico
app.use(cors());
app.use(express.json());

// Endpoint de teste simples
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'AutoVi API funcionando'
  });
});

// Endpoint para listar placas mockadas (para teste)
app.get('/api/monitored-plates', (req, res) => {
  const mockPlates = [
    { id: 1, plate_number: 'ABC1234', status: 'stolen', description: 'Veículo roubado', vehicle_model: 'Honda Civic' },
    { id: 2, plate_number: 'XYZ9876', status: 'suspicious', description: 'Suspeito', vehicle_model: 'Toyota Corolla' },
    { id: 3, plate_number: 'VIP0001', status: 'vip', description: 'VIP', vehicle_model: 'BMW X5' }
  ];
  
  res.json(mockPlates);
});

// Endpoint para adicionar placa (mock)
app.post('/api/monitored-plates', (req, res) => {
  const plateData = req.body;
  
  // Simular salvamento
  const newPlate = {
    id: Date.now(),
    ...plateData,
    created_at: new Date().toISOString()
  };
  
  console.log('Nova placa cadastrada:', newPlate);
  
  res.json(newPlate);
});

// Para Vercel
module.exports = app;