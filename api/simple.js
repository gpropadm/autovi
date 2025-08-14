const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const Tesseract = require('tesseract.js');

const app = express();

// Configurar PostgreSQL - FORÇAR conexão
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://neondb_owner:npg_7pFfTcBPzAx8@ep-misty-recipe-acjc335i-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

// Middleware básico
app.use(cors({
  origin: ['http://localhost:3000', 'https://autovi.vercel.app', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Endpoint de teste simples
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'AutoVi API funcionando'
  });
});

// Endpoint para testar cadastro direto
app.get('/api/test-insert', async (req, res) => {
  try {
    const testPlate = {
      plate_number: 'REJ3H21',
      status: 'stolen',
      description: 'CARRO ESTA PARADO NO PATIO',
      owner_name: null,
      vehicle_model: 'HONDA CIVIC',
      vehicle_color: 'BRANCA'
    };
    
    const result = await pool.query(`
      INSERT INTO monitored_plates (plate_number, status, description, owner_name, vehicle_model, vehicle_color)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      testPlate.plate_number,
      testPlate.status,
      testPlate.description,
      testPlate.owner_name,
      testPlate.vehicle_model,
      testPlate.vehicle_color
    ]);
    
    res.json({
      success: true,
      message: 'Placa REJ3H21 cadastrada com sucesso!',
      plate: result.rows[0]
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      detail: error.detail
    });
  }
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
    console.log('📥 Dados recebidos:', JSON.stringify(plateData));
    
    // Validar dados obrigatórios
    if (!plateData.plate_number) {
      return res.status(400).json({ error: 'plate_number é obrigatório' });
    }
    
    const result = await pool.query(`
      INSERT INTO monitored_plates (plate_number, status, description, owner_name, vehicle_model, vehicle_color)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      plateData.plate_number,
      plateData.status || 'suspicious',
      plateData.description || '',
      plateData.owner_name || null,
      plateData.vehicle_model || null,
      plateData.vehicle_color || null
    ]);
    
    console.log('✅ PLACA SALVA NO POSTGRESQL:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ ERRO DETALHADO:', error.message);
    console.error('❌ STACK:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao salvar no PostgreSQL',
      message: error.message,
      detail: error.detail || 'Sem detalhes'
    });
  }
});

// Endpoint para reconhecimento de placas (mobile app)
app.post('/api/recognize', async (req, res) => {
  try {
    console.log('📷 Imagem recebida para OCR real');
    
    const { imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ 
        success: false, 
        error: 'ImageData é obrigatório' 
      });
    }
    
    // OCR Real usando TesseractJS no servidor
    let detectedPlate = null;
    
    try {
      if (imageData.startsWith('data:image/')) {
        console.log('📸 Processando imagem com TesseractJS...');
        
        // Usar TesseractJS real para OCR
        const { data: { text, confidence } } = await Tesseract.recognize(imageData, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        });
        
        console.log(`📖 Texto detectado: "${text}" (${confidence.toFixed(1)}%)`);
        
        // Limpar e buscar padrões de placa
        const cleanText = text.replace(/[^A-Z0-9]/g, '').toUpperCase();
        console.log(`🧹 Texto limpo: "${cleanText}"`);
        
        // Padrões de placas brasileiras
        const platePatterns = [
          /[A-Z]{3}[0-9]{4}/g,     // ABC1234
          /[A-Z]{3}[0-9][A-Z][0-9]{2}/g, // ABC1D23
          /[A-Z]{2}[0-9]{4}/g      // AB1234
        ];
        
        for (const pattern of platePatterns) {
          const matches = cleanText.match(pattern);
          if (matches && matches.length > 0) {
            detectedPlate = matches[0];
            console.log(`✅ Placa encontrada: ${detectedPlate} (padrão: ${pattern})`);
            break;
          }
        }
        
        if (!detectedPlate && confidence > 50) {
          // Se confiança alta mas não achou padrão, tentar texto limpo
          if (cleanText.length >= 6 && cleanText.length <= 8) {
            detectedPlate = cleanText;
            console.log(`⚠️ Usando texto completo como placa: ${detectedPlate}`);
          }
        }
        
      } else {
        console.log('❌ Formato de imagem inválido');
      }
      
    } catch (ocrError) {
      console.error('❌ Erro no OCR TesseractJS:', ocrError);
    }
    
    if (detectedPlate) {
      // Verificar se placa está monitorada
      const monitoredPlate = await pool.query(`
        SELECT * FROM monitored_plates 
        WHERE plate_number = $1 AND is_active = true 
        LIMIT 1
      `, [detectedPlate]);
      
      if (monitoredPlate.rows.length > 0) {
        // PLACA ENCONTRADA!
        console.log(`🚨 ALERTA! Placa ${detectedPlate} é ${monitoredPlate.rows[0].status}`);
        res.json({
          success: true,
          plate: detectedPlate,
          confidence: 0.95,
          alert: true,
          monitoredPlate: monitoredPlate.rows[0],
          message: `🚨 VEÍCULO ${monitoredPlate.rows[0].status.toUpperCase()} DETECTADO!`
        });
      } else {
        // Placa normal
        console.log(`✅ Placa ${detectedPlate} detectada (não monitorada)`);
        res.json({
          success: true,
          plate: detectedPlate,
          confidence: 0.85,
          alert: false
        });
      }
    } else {
      // Nenhuma placa detectada
      console.log('❌ Nenhuma placa detectada');
      res.json({
        success: false,
        message: 'Nenhuma placa detectada',
        confidence: 0
      });
    }
  } catch (error) {
    console.error('❌ Erro no OCR:', error);
    res.status(500).json({ error: 'Erro no reconhecimento' });
  }
});

// Endpoint para testar reconhecimento
app.get('/api/test-recognition', async (req, res) => {
  try {
    // Simular detecção da placa REJ3H21
    const plateNumber = 'REJ3H21';
    
    // Verificar se placa está monitorada
    const monitoredPlate = await pool.query(`
      SELECT * FROM monitored_plates 
      WHERE plate_number = $1 AND is_active = true 
      LIMIT 1
    `, [plateNumber]);
    
    if (monitoredPlate.rows.length > 0) {
      res.json({
        success: true,
        alert: true,
        plate_detected: plateNumber,
        monitored_plate: monitoredPlate.rows[0],
        message: '🚨 ALERTA! Placa REJ3H21 detectada como STOLEN!'
      });
    } else {
      res.json({
        success: true,
        alert: false,
        plate_detected: plateNumber,
        message: 'Placa não monitorada'
      });
    }
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Para Vercel
module.exports = app;