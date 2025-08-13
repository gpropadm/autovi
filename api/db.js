const { Pool } = require('pg');

// Pool de conexão única para todas as funções
let pool = null;

function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

// Funções básicas do banco
async function query(text, params = []) {
  const client = getPool();
  if (!client) {
    throw new Error('Database not configured');
  }
  
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

module.exports = {
  query,
  
  async getMonitoredPlates() {
    const result = await query(`
      SELECT * FROM monitored_plates 
      WHERE is_active = true 
      ORDER BY created_at DESC
    `);
    return result.rows;
  },

  async addMonitoredPlate(data) {
    const result = await query(`
      INSERT INTO monitored_plates (plate_number, status, description, owner_name, vehicle_model, vehicle_color)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [data.plate_number, data.status, data.description, data.owner_name, data.vehicle_model, data.vehicle_color]);
    return result.rows[0];
  },

  async checkMonitoredPlate(plateNumber) {
    const result = await query(`
      SELECT * FROM monitored_plates 
      WHERE plate_number = $1 AND is_active = true 
      LIMIT 1
    `, [plateNumber]);
    
    return result.rows[0] || null;
  },

  async saveDetection(data) {
    const result = await query(`
      INSERT INTO detections (plate_number, camera_id, image_path, confidence_score, latitude, longitude)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [data.plateNumber, data.cameraId || 1, data.imagePath, data.confidenceScore, data.latitude, data.longitude]);
    
    return result.rows[0];
  },

  async updateDetectionAsMonitored(detectionId, monitoredPlateId) {
    await query(`
      UPDATE detections 
      SET is_monitored = true, monitored_plate_id = $2
      WHERE id = $1
    `, [detectionId, monitoredPlateId]);
  },

  async getDetections(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const result = await query(`
      SELECT d.*, mp.status, mp.description
      FROM detections d
      LEFT JOIN monitored_plates mp ON d.monitored_plate_id = mp.id
      ORDER BY d.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    return result.rows;
  },

  async getDashboardStats() {
    try {
      const [monitored, detections, alerts] = await Promise.all([
        query('SELECT COUNT(*) as count FROM monitored_plates WHERE is_active = true'),
        query('SELECT COUNT(*) as count FROM detections WHERE created_at >= NOW() - INTERVAL \'24 hours\''),
        query('SELECT COUNT(*) as count FROM detections WHERE is_monitored = true AND created_at >= NOW() - INTERVAL \'24 hours\'')
      ]);
      
      return {
        monitoredPlates: parseInt(monitored.rows[0].count),
        detectionsToday: parseInt(detections.rows[0].count),
        alertsToday: parseInt(alerts.rows[0].count)
      };
    } catch (error) {
      return { monitoredPlates: 0, detectionsToday: 0, alertsToday: 0 };
    }
  },

  async getRecentAlerts() {
    const result = await query(`
      SELECT d.*, mp.status, mp.description, mp.vehicle_model
      FROM detections d
      JOIN monitored_plates mp ON d.monitored_plate_id = mp.id
      WHERE d.is_monitored = true
      ORDER BY d.created_at DESC
      LIMIT 10
    `);
    
    return result.rows;
  },

  async removeMonitoredPlate(id) {
    await query(`
      UPDATE monitored_plates 
      SET is_active = false 
      WHERE id = $1
    `, [id]);
  },

  async getCameras() {
    const result = await query(`
      SELECT * FROM cameras 
      WHERE is_active = true 
      ORDER BY created_at DESC
    `);
    return result.rows;
  }
};