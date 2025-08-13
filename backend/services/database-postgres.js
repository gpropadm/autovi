const { Pool } = require('pg');

class PostgresDatabaseService {
  constructor() {
    // Configurar conexão PostgreSQL para produção (Vercel)
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    console.log('✅ Conectado ao PostgreSQL na Vercel');
    this.initDatabase();
  }

  async initDatabase() {
    const client = await this.pool.connect();
    
    try {
      // Criar tabelas
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role VARCHAR(50) DEFAULT 'operator',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS monitored_plates (
          id SERIAL PRIMARY KEY,
          plate_number VARCHAR(20) NOT NULL,
          status VARCHAR(50) NOT NULL,
          description TEXT,
          owner_name VARCHAR(255),
          vehicle_model VARCHAR(255),
          vehicle_color VARCHAR(100),
          added_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT true
        )
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS cameras (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          location TEXT,
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS detections (
          id SERIAL PRIMARY KEY,
          plate_number VARCHAR(20) NOT NULL,
          camera_id INTEGER REFERENCES cameras(id),
          image_path TEXT,
          confidence_score DECIMAL(5, 4),
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          is_monitored BOOLEAN DEFAULT false,
          monitored_plate_id INTEGER REFERENCES monitored_plates(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS alerts (
          id SERIAL PRIMARY KEY,
          detection_id INTEGER REFERENCES detections(id),
          monitored_plate_id INTEGER REFERENCES monitored_plates(id),
          alert_type VARCHAR(50) NOT NULL,
          message TEXT,
          is_sent BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Inserir dados iniciais se não existirem
      const { rows } = await client.query('SELECT COUNT(*) as count FROM monitored_plates');
      
      if (parseInt(rows[0].count) === 0) {
        await client.query(`
          INSERT INTO monitored_plates (plate_number, status, description, vehicle_model, vehicle_color) 
          VALUES 
          ('ABC1234', 'stolen', 'Veículo roubado - Honda Civic', 'Honda Civic 2020', 'Preto'),
          ('XYZ9876', 'suspicious', 'Investigação em andamento', 'Toyota Corolla', 'Prata'),
          ('VIP0001', 'vip', 'Acesso VIP autorizado', 'BMW X5', 'Branco')
        `);
        
        await client.query(`
          INSERT INTO cameras (name, location, latitude, longitude) 
          VALUES ('Camera Mobile', 'Vigilância Móvel', -23.5505, -46.6333)
        `);
        
        console.log('✅ Dados iniciais inseridos no PostgreSQL');
      }
      
    } catch (error) {
      console.error('❌ Erro ao inicializar PostgreSQL:', error);
    } finally {
      client.release();
    }
  }

  async addMonitoredPlate(plateData) {
    const client = await this.pool.connect();
    try {
      const { rows } = await client.query(`
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
      
      console.log('✅ Placa adicionada:', rows[0]);
      return rows[0];
    } finally {
      client.release();
    }
  }

  async getMonitoredPlates() {
    const client = await this.pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT * FROM monitored_plates 
        WHERE is_active = true 
        ORDER BY created_at DESC
      `);
      return rows;
    } finally {
      client.release();
    }
  }

  async checkMonitoredPlate(plateNumber) {
    const client = await this.pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT * FROM monitored_plates 
        WHERE plate_number = $1 AND is_active = true 
        LIMIT 1
      `, [plateNumber]);
      
      return rows.length > 0 ? rows[0] : null;
    } finally {
      client.release();
    }
  }

  async saveDetection(detectionData) {
    const client = await this.pool.connect();
    try {
      const { rows } = await client.query(`
        INSERT INTO detections (plate_number, camera_id, image_path, confidence_score, latitude, longitude)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        detectionData.plateNumber,
        detectionData.cameraId || 1,
        detectionData.imagePath,
        detectionData.confidenceScore,
        detectionData.latitude,
        detectionData.longitude
      ]);
      
      return rows[0];
    } finally {
      client.release();
    }
  }

  async updateDetectionAsMonitored(detectionId, monitoredPlateId) {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE detections 
        SET is_monitored = true, monitored_plate_id = $2
        WHERE id = $1
      `, [detectionId, monitoredPlateId]);
    } finally {
      client.release();
    }
  }

  async getDetections(page = 1, limit = 50) {
    const client = await this.pool.connect();
    try {
      const offset = (page - 1) * limit;
      const { rows } = await client.query(`
        SELECT d.*, mp.status, mp.description, c.name as camera_name
        FROM detections d
        LEFT JOIN monitored_plates mp ON d.monitored_plate_id = mp.id
        LEFT JOIN cameras c ON d.camera_id = c.id
        ORDER BY d.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      
      return rows;
    } finally {
      client.release();
    }
  }

  async getDashboardStats() {
    const client = await this.pool.connect();
    try {
      const [monitored, detections, alerts] = await Promise.all([
        client.query('SELECT COUNT(*) as count FROM monitored_plates WHERE is_active = true'),
        client.query('SELECT COUNT(*) as count FROM detections WHERE created_at >= NOW() - INTERVAL \'24 hours\''),
        client.query('SELECT COUNT(*) as count FROM detections WHERE is_monitored = true AND created_at >= NOW() - INTERVAL \'24 hours\'')
      ]);
      
      return {
        monitoredPlates: parseInt(monitored.rows[0].count),
        detectionsToday: parseInt(detections.rows[0].count),
        alertsToday: parseInt(alerts.rows[0].count)
      };
    } finally {
      client.release();
    }
  }

  async getRecentAlerts() {
    const client = await this.pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT d.*, mp.status, mp.description, mp.vehicle_model
        FROM detections d
        JOIN monitored_plates mp ON d.monitored_plate_id = mp.id
        WHERE d.is_monitored = true
        ORDER BY d.created_at DESC
        LIMIT 10
      `);
      
      return rows;
    } finally {
      client.release();
    }
  }

  async removeMonitoredPlate(id) {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE monitored_plates 
        SET is_active = false 
        WHERE id = $1
      `, [id]);
    } finally {
      client.release();
    }
  }

  async getCameras() {
    const client = await this.pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT * FROM cameras 
        WHERE is_active = true 
        ORDER BY created_at DESC
      `);
      return rows;
    } finally {
      client.release();
    }
  }
}

module.exports = new PostgresDatabaseService();