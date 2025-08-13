const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Configurar PostgreSQL - FORÇAR conexão
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://neondb_owner:npg_7pFfTcBPzAx8@ep-misty-recipe-acjc335i-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

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

// Endpoint para listar placas - SEMPRE PostgreSQL
app.get('/api/monitored-plates', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM monitored_plates 
      WHERE is_active = true 
      ORDER BY created_at DESC
    `);
    console.log('✅ Placas carregadas:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro PostgreSQL:', error);
    res.status(500).json({ 
      error: 'Erro no banco PostgreSQL',
      message: error.message 
    });
  }
});

// Endpoint para adicionar placa - SEMPRE PostgreSQL
app.post('/api/monitored-plates', async (req, res) => {
  try {
    const plateData = req.body;
    console.log('📥 Dados recebidos:', plateData);
    
    const result = await pool.query(`
      INSERT INTO monitored_plates (plate_number, status, description, owner_name, vehicle_model, vehicle_color)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      plateData.plate_number,
      plateData.status || 'suspicious',
      plateData.description,
      plateData.owner_name,
      plateData.vehicle_model,
      plateData.vehicle_color
    ]);
    
    console.log('✅ PLACA SALVA NO POSTGRESQL:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ ERRO AO SALVAR PLACA:', error);
    res.status(500).json({ 
      error: 'Erro ao salvar no PostgreSQL',
      message: error.message 
    });
  }
});

// Para Vercel
module.exports = app;