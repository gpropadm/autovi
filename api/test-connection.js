const { Pool } = require('pg');
const express = require('express');
const app = express();

app.use(express.json());

// Endpoint para testar todas as variáveis de conexão
app.get('/api/test-connection', async (req, res) => {
  const connections = [
    'DATABASE_URL',
    'POSTGRES_URL', 
    'DATABASE_URL_UNPOOLED',
    'POSTGRES_URL_NON_POOLING',
    'POSTGRES_URL_NO_SSL'
  ];
  
  const results = {};
  
  for (const envVar of connections) {
    try {
      if (process.env[envVar]) {
        const pool = new Pool({
          connectionString: process.env[envVar],
          ssl: { rejectUnauthorized: false }
        });
        
        const result = await pool.query('SELECT 1 as test');
        results[envVar] = {
          status: 'SUCCESS',
          value: process.env[envVar].substring(0, 50) + '...',
          test: result.rows[0]
        };
        await pool.end();
      } else {
        results[envVar] = {
          status: 'NOT_SET',
          value: null
        };
      }
    } catch (error) {
      results[envVar] = {
        status: 'ERROR',
        value: process.env[envVar] ? process.env[envVar].substring(0, 50) + '...' : null,
        error: error.message
      };
    }
  }
  
  res.json({
    timestamp: new Date().toISOString(),
    results: results
  });
});

module.exports = app;