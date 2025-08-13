const { Pool } = require('pg');

let pool;

// Função para obter conexão
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,
      connectionTimeoutMillis: 10000
    });
  }
  return pool;
}

// Serviços do banco
const database = {
  async getMonitoredPlates() {
    const client = getPool();
    try {
      const { rows } = await client.query(`
        SELECT * FROM monitored_plates 
        WHERE is_active = true 
        ORDER BY created_at DESC
      `);
      return rows;
    } catch (error) {
      console.error('Erro ao buscar placas:', error);
      return [];
    }
  },

  async addMonitoredPlate(plateData) {
    const client = getPool();
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
      return rows[0];
    } catch (error) {
      console.error('Erro ao adicionar placa:', error);
      throw error;
    }
  },

  async checkMonitoredPlate(plateNumber) {
    const client = getPool();
    try {
      const { rows } = await client.query(`
        SELECT * FROM monitored_plates 
        WHERE plate_number = $1 AND is_active = true 
        LIMIT 1
      `, [plateNumber]);
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Erro ao verificar placa:', error);
      return null;
    }
  },

  async saveDetection(detectionData) {
    const client = getPool();
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
    } catch (error) {
      console.error('Erro ao salvar detecção:', error);
      throw error;
    }
  },

  async updateDetectionAsMonitored(detectionId, monitoredPlateId) {
    const client = getPool();
    try {
      await client.query(`
        UPDATE detections 
        SET is_monitored = true, monitored_plate_id = $2
        WHERE id = $1
      `, [detectionId, monitoredPlateId]);
    } catch (error) {
      console.error('Erro ao atualizar detecção:', error);
    }
  },

  async getDetections(page = 1, limit = 50) {
    const client = getPool();
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
    } catch (error) {
      console.error('Erro ao buscar detecções:', error);
      return [];
    }
  },

  async getDashboardStats() {
    const client = getPool();
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
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        monitoredPlates: 0,
        detectionsToday: 0,
        alertsToday: 0
      };
    }
  },

  async getRecentAlerts() {
    const client = getPool();
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
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      return [];
    }
  },

  async removeMonitoredPlate(id) {
    const client = getPool();
    try {
      await client.query(`
        UPDATE monitored_plates 
        SET is_active = false 
        WHERE id = $1
      `, [id]);
    } catch (error) {
      console.error('Erro ao remover placa:', error);
      throw error;
    }
  },

  async getCameras() {
    const client = getPool();
    try {
      const { rows } = await client.query(`
        SELECT * FROM cameras 
        WHERE is_active = true 
        ORDER BY created_at DESC
      `);
      return rows;
    } catch (error) {
      console.error('Erro ao buscar câmeras:', error);
      return [];
    }
  }
};

module.exports = database;