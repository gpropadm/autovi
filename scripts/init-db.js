const { Pool } = require('pg');

// Script para inicializar o banco PostgreSQL
async function initDatabase() {
  const pool = new Pool({
    connectionString: 'postgres://neondb_owner:npg_7pFfTcBPzAx8@ep-misty-recipe-acjc335i-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  
  try {
    console.log('🔄 Criando tabelas...');
    
    // Criar tabela users
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
    console.log('✅ Tabela users criada');
    
    // Criar tabela monitored_plates
    await client.query(`
      CREATE TABLE IF NOT EXISTS monitored_plates (
        id SERIAL PRIMARY KEY,
        plate_number VARCHAR(20) NOT NULL,
        status VARCHAR(50) NOT NULL,
        description TEXT,
        owner_name VARCHAR(255),
        vehicle_model VARCHAR(255),
        vehicle_color VARCHAR(100),
        added_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `);
    console.log('✅ Tabela monitored_plates criada');
    
    // Criar tabela cameras
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
    console.log('✅ Tabela cameras criada');
    
    // Criar tabela detections
    await client.query(`
      CREATE TABLE IF NOT EXISTS detections (
        id SERIAL PRIMARY KEY,
        plate_number VARCHAR(20) NOT NULL,
        camera_id INTEGER,
        image_path TEXT,
        confidence_score DECIMAL(5, 4),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        is_monitored BOOLEAN DEFAULT false,
        monitored_plate_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela detections criada');
    
    // Criar tabela alerts
    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        detection_id INTEGER,
        monitored_plate_id INTEGER,
        alert_type VARCHAR(50) NOT NULL,
        message TEXT,
        is_sent BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela alerts criada');

    // Verificar se já existem dados de exemplo
    const { rows } = await client.query('SELECT COUNT(*) as count FROM monitored_plates');
    
    if (parseInt(rows[0].count) === 0) {
      // Inserir dados de exemplo
      await client.query(`
        INSERT INTO monitored_plates (plate_number, status, description, vehicle_model, vehicle_color) 
        VALUES 
        ('ABC1234', 'stolen', 'Veículo roubado - Honda Civic', 'Honda Civic 2020', 'Preto'),
        ('XYZ9876', 'suspicious', 'Investigação em andamento', 'Toyota Corolla', 'Prata'),
        ('VIP0001', 'vip', 'Acesso VIP autorizado', 'BMW X5', 'Branco')
      `);
      console.log('✅ Placas de exemplo inseridas');
      
      await client.query(`
        INSERT INTO cameras (name, location, latitude, longitude) 
        VALUES ('Camera Mobile', 'Vigilância Móvel', -23.5505, -46.6333)
      `);
      console.log('✅ Camera padrão inserida');
    } else {
      console.log('ℹ️ Dados já existem no banco');
    }

    // Verificar tabelas criadas
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tabelas criadas:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Verificar placas cadastradas
    const plates = await client.query('SELECT plate_number, status FROM monitored_plates WHERE is_active = true');
    console.log('\n🚨 Placas monitoradas:');
    plates.rows.forEach(plate => {
      console.log(`  - ${plate.plate_number} (${plate.status})`);
    });

    console.log('\n🎉 Banco inicializado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar inicialização
initDatabase();