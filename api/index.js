const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const plateRecognition = require('../backend/services/plateRecognition');
// Usar PostgreSQL em produção, SQLite em desenvolvimento
const database = process.env.POSTGRES_URL 
  ? require('../backend/services/database-postgres')
  : require('../backend/services/database');
const alertSystem = require('../backend/services/alertSystem');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Configurar multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Socket.IO para atualizações em tempo real
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Fazer io disponível globalmente
app.set('io', io);

// Rotas da API

// Upload e reconhecimento de placa
app.post('/api/recognize', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    }

    const imagePath = req.file.path;
    const cameraId = req.body.cameraId || 1;

    // Reconhecer placa na imagem
    const result = await plateRecognition.recognizePlate(imagePath);
    
    if (!result.plate) {
      return res.status(400).json({ error: 'Nenhuma placa foi detectada na imagem' });
    }

    // Capturar coordenadas GPS se fornecidas
    const latitude = req.body.latitude ? parseFloat(req.body.latitude) : null;
    const longitude = req.body.longitude ? parseFloat(req.body.longitude) : null;

    // Salvar detecção no banco
    const detection = await database.saveDetection({
      plateNumber: result.plate,
      cameraId: cameraId,
      imagePath: imagePath,
      confidenceScore: result.confidence,
      latitude: latitude,
      longitude: longitude
    });

    // Verificar se a placa está sendo monitorada
    const monitoredPlate = await database.checkMonitoredPlate(result.plate);
    
    if (monitoredPlate) {
      // Placa encontrada na lista de monitoramento!
      await database.updateDetectionAsMonitored(detection.id, monitoredPlate.id);
      
      // Enviar alerta
      await alertSystem.sendAlert(detection, monitoredPlate);
      
      // Notificar via WebSocket
      io.emit('plate_alert', {
        detection: detection,
        monitoredPlate: monitoredPlate,
        timestamp: new Date()
      });
      
      res.json({
        success: true,
        plate: result.plate,
        confidence: result.confidence,
        alert: true,
        monitoredPlate: monitoredPlate,
        detection: detection
      });
    } else {
      // Placa normal, não monitorada
      io.emit('plate_detected', {
        detection: detection,
        timestamp: new Date()
      });
      
      res.json({
        success: true,
        plate: result.plate,
        confidence: result.confidence,
        alert: false,
        detection: detection
      });
    }

  } catch (error) {
    console.error('Erro no reconhecimento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar todas as detecções
app.get('/api/detections', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const detections = await database.getDetections(page, limit);
    res.json(detections);
  } catch (error) {
    console.error('Erro ao buscar detecções:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar placas monitoradas
app.get('/api/monitored-plates', async (req, res) => {
  try {
    const plates = await database.getMonitoredPlates();
    res.json(plates);
  } catch (error) {
    console.error('Erro ao buscar placas monitoradas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Adicionar placa para monitoramento
app.post('/api/monitored-plates', async (req, res) => {
  try {
    const plate = await database.addMonitoredPlate(req.body);
    res.json(plate);
  } catch (error) {
    console.error('Erro ao adicionar placa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Remover placa do monitoramento
app.delete('/api/monitored-plates/:id', async (req, res) => {
  try {
    await database.removeMonitoredPlate(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover placa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Dashboard - estatísticas
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const stats = await database.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Alertas recentes
app.get('/api/alerts/recent', async (req, res) => {
  try {
    const alerts = await database.getRecentAlerts();
    res.json(alerts);
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Câmeras
app.get('/api/cameras', async (req, res) => {
  try {
    const cameras = await database.getCameras();
    res.json(cameras);
  } catch (error) {
    console.error('Erro ao buscar câmeras:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
  server.listen(PORT, () => {
    console.log(`🚗 AutoVi - Servidor rodando na porta ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`📱 Mobile: http://localhost:8080/mobile-surveillance.html`);
  });
}

// Para Vercel (export do app)
module.exports = app;