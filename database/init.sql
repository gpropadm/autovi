-- Criação do banco de dados para sistema de reconhecimento de placas
CREATE DATABASE license_plate_db;

\c license_plate_db;

-- Tabela de usuários do sistema
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'operator',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de placas monitoradas (roubadas, suspeitas, VIPs, etc)
CREATE TABLE monitored_plates (
    id SERIAL PRIMARY KEY,
    plate_number VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'stolen', 'suspicious', 'vip', 'blocked'
    description TEXT,
    owner_name VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_color VARCHAR(50),
    added_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Tabela de câmeras/locais
CREATE TABLE cameras (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de detecções
CREATE TABLE detections (
    id SERIAL PRIMARY KEY,
    plate_number VARCHAR(10) NOT NULL,
    camera_id INTEGER REFERENCES cameras(id),
    image_path VARCHAR(500),
    confidence_score DECIMAL(5, 2),
    is_monitored BOOLEAN DEFAULT false,
    monitored_plate_id INTEGER REFERENCES monitored_plates(id),
    alert_sent BOOLEAN DEFAULT false,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de alertas enviados
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    detection_id INTEGER REFERENCES detections(id),
    monitored_plate_id INTEGER REFERENCES monitored_plates(id),
    alert_type VARCHAR(20), -- 'email', 'sms', 'dashboard'
    recipient VARCHAR(100),
    message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'sent' -- 'sent', 'failed', 'pending'
);

-- Índices para melhor performance
CREATE INDEX idx_monitored_plates_number ON monitored_plates(plate_number);
CREATE INDEX idx_detections_plate ON detections(plate_number);
CREATE INDEX idx_detections_created_at ON detections(created_at);
CREATE INDEX idx_alerts_sent_at ON alerts(sent_at);

-- Inserir dados iniciais
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@sistema.com', '$2a$10$example_hash', 'admin'),
('operador', 'operador@sistema.com', '$2a$10$example_hash', 'operator');

INSERT INTO cameras (name, location, latitude, longitude) VALUES
('Câmera Principal - Entrada', 'Portão Principal', -23.5505, -46.6333),
('Câmera Garagem', 'Estacionamento Interno', -23.5510, -46.6340),
('Câmera Saída', 'Portão de Saída', -23.5500, -46.6320);

-- Exemplos de placas monitoradas
INSERT INTO monitored_plates (plate_number, status, description, owner_name, vehicle_model, vehicle_color, added_by) VALUES
('ABC1234', 'stolen', 'Veículo reportado como roubado em 10/08/2025', 'João Silva', 'Honda Civic 2020', 'Preto', 1),
('XYZ9876', 'suspicious', 'Placa suspeita - investigação em andamento', 'Maria Santos', 'Toyota Corolla 2019', 'Branco', 1),
('VIP0001', 'vip', 'Veículo da diretoria - acesso liberado', 'Carlos Diretor', 'BMW X5 2023', 'Azul', 1);