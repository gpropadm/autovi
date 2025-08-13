const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Configurar PostgreSQL
let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
}

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

// Endpoint para listar placas
app.get('/api/monitored-plates', async (req, res) => {
  try {
    if (pool) {
      // Usar PostgreSQL
      const result = await pool.query(`
        SELECT * FROM monitored_plates 
        WHERE is_active = true 
        ORDER BY created_at DESC
      `);
      res.json(result.rows);
    } else {
      // Fallback para mock
      const mockPlates = [
        { id: 1, plate_number: 'ABC1234', status: 'stolen', description: 'Veículo roubado', vehicle_model: 'Honda Civic' },
        { id: 2, plate_number: 'XYZ9876', status: 'suspicious', description: 'Suspeito', vehicle_model: 'Toyota Corolla' },
        { id: 3, plate_number: 'VIP0001', status: 'vip', description: 'VIP', vehicle_model: 'BMW X5' }
      ];
      res.json(mockPlates);
    }
  } catch (error) {
    console.error('Erro ao buscar placas:', error);
    res.status(500).json({ error: 'Erro ao buscar placas' });
  }
});

// Endpoint para adicionar placa
app.post('/api/monitored-plates', async (req, res) => {
  try {
    const plateData = req.body;
    
    if (pool) {
      // Salvar no PostgreSQL
      const result = await pool.query(`
        INSERT INTO monitored_plates (plate_number, status, description, owner_name, vehicle_model, vehicle_color)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        plateData.plate_number,
        plateData.status,
        plateData.description,
        plateData.owner_name,
        plateData.vehicle_model,
        plateData.vehicle_color
      ]);
      
      console.log('✅ Placa salva no PostgreSQL:', result.rows[0]);
      res.json(result.rows[0]);
    } else {
      // Fallback para mock
      const newPlate = {
        id: Date.now(),
        ...plateData,
        created_at: new Date().toISOString()
      };
      
      console.log('⚠️ Placa salva temporariamente:', newPlate);
      res.json(newPlate);
    }
  } catch (error) {
    console.error('❌ Erro ao adicionar placa:', error);
    res.status(500).json({ error: 'Erro ao adicionar placa: ' + error.message });
  }
});

// Para Vercel
module.exports = app;