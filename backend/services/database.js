const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseService {
  constructor() {
    const dbPath = path.join(__dirname, '../database.sqlite');
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Erro ao conectar com SQLite:', err.message);
      } else {
        console.log('✅ Conectado ao banco SQLite');
        this.initDatabase();
      }
    });
  }

  async initDatabase() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'operator',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS monitored_plates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plate_number TEXT NOT NULL,
        status TEXT NOT NULL,
        description TEXT,
        owner_name TEXT,
        vehicle_model TEXT,
        vehicle_color TEXT,
        added_by INTEGER REFERENCES users(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1
      )`,
      
      `CREATE TABLE IF NOT EXISTS cameras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT,
        latitude REAL,
        longitude REAL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS detections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plate_number TEXT NOT NULL,
        camera_id INTEGER REFERENCES cameras(id),
        image_path TEXT,
        confidence_score REAL,
        latitude REAL,
        longitude REAL,
        is_monitored BOOLEAN DEFAULT 0,
        monitored_plate_id INTEGER REFERENCES monitored_plates(id),
        alert_sent BOOLEAN DEFAULT 0,
        processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        detection_id INTEGER REFERENCES detections(id),
        monitored_plate_id INTEGER REFERENCES monitored_plates(id),
        alert_type TEXT,
        recipient TEXT,
        message TEXT,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'sent'
      )`
    ];

    for (const table of tables) {
      this.db.run(table);
    }

    // Inserir dados iniciais
    this.insertInitialData();
  }

  insertInitialData() {
    // Aguardar um pouco para garantir que as tabelas foram criadas
    setTimeout(() => {
      // Usuários
      this.db.run(`INSERT OR IGNORE INTO users (id, username, email, password_hash, role) VALUES
        (1, 'admin', 'admin@sistema.com', '$2a$10$example_hash', 'admin')`, (err) => {
        if (err) console.log('Usuários já existem ou erro:', err.message);
      });

      // Câmeras
      this.db.run(`INSERT OR IGNORE INTO cameras (id, name, location, latitude, longitude) VALUES
        (1, 'Câmera Principal - Entrada', 'Portão Principal', -23.5505, -46.6333),
        (2, 'Câmera Garagem', 'Estacionamento Interno', -23.5510, -46.6340),
        (3, 'Câmera Saída', 'Portão de Saída', -23.5500, -46.6320)`, (err) => {
        if (err) console.log('Câmeras já existem ou erro:', err.message);
      });

      // Exemplos de placas monitoradas
      this.db.run(`INSERT OR IGNORE INTO monitored_plates (plate_number, status, description, owner_name, vehicle_model, vehicle_color, added_by) VALUES
        ('ABC1234', 'stolen', 'Veículo reportado como roubado em 10/08/2025', 'João Silva', 'Honda Civic 2020', 'Preto', 1),
        ('XYZ9876', 'suspicious', 'Placa suspeita - investigação em andamento', 'Maria Santos', 'Toyota Corolla 2019', 'Branco', 1),
        ('VIP0001', 'vip', 'Veículo da diretoria - acesso liberado', 'Carlos Diretor', 'BMW X5 2023', 'Azul', 1)`, (err) => {
        if (err) console.log('Placas já existem ou erro:', err.message);
        else console.log('✅ Dados iniciais inseridos com sucesso!');
      });
    }, 1000);
  }

  async saveDetection(data) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO detections (plate_number, camera_id, image_path, confidence_score, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      this.db.run(query, [
        data.plateNumber,
        data.cameraId,
        data.imagePath,
        data.confidenceScore,
        data.latitude,
        data.longitude
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, plate_number: data.plateNumber });
        }
      });
    });
  }

  async checkMonitoredPlate(plateNumber) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM monitored_plates 
        WHERE plate_number = ? AND is_active = 1
      `;
      
      this.db.get(query, [plateNumber], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  async updateDetectionAsMonitored(detectionId, monitoredPlateId) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE detections 
        SET is_monitored = 1, monitored_plate_id = ?
        WHERE id = ?
      `;
      
      this.db.run(query, [monitoredPlateId, detectionId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async getDetections(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          d.*,
          c.name as camera_name,
          c.location as camera_location,
          mp.status as monitored_status,
          mp.description as monitored_description
        FROM detections d
        LEFT JOIN cameras c ON d.camera_id = c.id
        LEFT JOIN monitored_plates mp ON d.monitored_plate_id = mp.id
        ORDER BY d.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      this.db.all(query, [limit, offset], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          this.db.get('SELECT COUNT(*) as count FROM detections', (err, countRow) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                detections: rows,
                pagination: {
                  page,
                  limit,
                  totalCount: countRow.count,
                  totalPages: Math.ceil(countRow.count / limit)
                }
              });
            }
          });
        }
      });
    });
  }

  async getMonitoredPlates() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          mp.*,
          COUNT(d.id) as detection_count,
          MAX(d.created_at) as last_detection
        FROM monitored_plates mp
        LEFT JOIN detections d ON mp.id = d.monitored_plate_id
        WHERE mp.is_active = 1
        GROUP BY mp.id
        ORDER BY mp.created_at DESC
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async addMonitoredPlate(plateData) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO monitored_plates 
        (plate_number, status, description, owner_name, vehicle_model, vehicle_color, added_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      this.db.run(query, [
        plateData.plateNumber,
        plateData.status || 'suspicious',
        plateData.description,
        plateData.ownerName,
        plateData.vehicleModel,
        plateData.vehicleColor,
        plateData.addedBy || 1
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  async removeMonitoredPlate(plateId) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE monitored_plates 
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      this.db.run(query, [plateId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async saveAlert(detectionId, monitoredPlateId, alertType, recipient, message) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO alerts (detection_id, monitored_plate_id, alert_type, recipient, message)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      this.db.run(query, [
        detectionId,
        monitoredPlateId,
        alertType,
        recipient,
        message
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  async getDashboardStats() {
    return new Promise((resolve, reject) => {
      const queries = [
        // Total de detecções hoje
        `SELECT COUNT(*) as count FROM detections WHERE DATE(created_at) = DATE('now')`,
        
        // Total de alertas hoje
        `SELECT COUNT(*) as count FROM detections WHERE DATE(created_at) = DATE('now') AND is_monitored = 1`,
        
        // Total de placas monitoradas
        `SELECT COUNT(*) as count FROM monitored_plates WHERE is_active = 1`,
        
        // Top 5 placas mais detectadas
        `SELECT plate_number, COUNT(*) as count FROM detections 
         WHERE created_at >= datetime('now', '-7 days')
         GROUP BY plate_number ORDER BY count DESC LIMIT 5`
      ];

      let results = [];
      let completed = 0;

      queries.forEach((query, index) => {
        this.db.all(query, [], (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          
          results[index] = rows;
          completed++;
          
          if (completed === queries.length) {
            resolve({
              todayDetections: results[0][0]?.count || 0,
              todayAlerts: results[1][0]?.count || 0,
              monitoredPlates: results[2][0]?.count || 0,
              topPlates: results[3] || []
            });
          }
        });
      });
    });
  }

  async getRecentAlerts(limit = 20) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          d.plate_number,
          d.created_at as detection_time,
          d.image_path,
          mp.status,
          mp.description,
          mp.owner_name,
          mp.vehicle_model,
          c.name as camera_name,
          c.location as camera_location
        FROM detections d
        JOIN monitored_plates mp ON d.monitored_plate_id = mp.id
        LEFT JOIN cameras c ON d.camera_id = c.id
        WHERE d.is_monitored = 1
        ORDER BY d.created_at DESC
        LIMIT ?
      `;
      
      this.db.all(query, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getCameras() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          c.*,
          COUNT(d.id) as detection_count,
          MAX(d.created_at) as last_detection
        FROM cameras c
        LEFT JOIN detections d ON c.id = d.camera_id
        GROUP BY c.id
        ORDER BY c.name
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async close() {
    this.db.close();
  }
}

module.exports = new DatabaseService();