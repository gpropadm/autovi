const nodemailer = require('nodemailer');
const database = require('./database');

class AlertSystem {
  constructor() {
    this.emailTransporter = null;
    this.initEmailTransporter();
  }

  async initEmailTransporter() {
    try {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        console.log('✅ Sistema de email configurado');
      } else {
        console.log('⚠️  Email não configurado - apenas alertas no dashboard');
      }
    } catch (error) {
      console.error('❌ Erro ao configurar email:', error);
    }
  }

  async sendAlert(detection, monitoredPlate) {
    console.log(`🚨 ALERTA: Placa ${detection.plate_number} detectada!`);
    console.log(`📍 Localização: ${detection.camera_name || 'Câmera ' + detection.camera_id}`);
    console.log(`⚠️  Status: ${monitoredPlate.status.toUpperCase()}`);
    console.log(`📝 Descrição: ${monitoredPlate.description}`);

    // Preparar dados do alerta
    const alertData = {
      plateNumber: detection.plate_number,
      status: monitoredPlate.status,
      description: monitoredPlate.description,
      ownerName: monitoredPlate.owner_name,
      vehicleModel: monitoredPlate.vehicle_model,
      vehicleColor: monitoredPlate.vehicle_color,
      cameraLocation: detection.camera_location || 'Não informado',
      detectionTime: new Date(detection.created_at || Date.now()),
      imagePath: detection.image_path
    };

    // Enviar email se configurado
    if (this.emailTransporter && process.env.EMAIL_USER) {
      await this.sendEmailAlert(alertData, detection.id, monitoredPlate.id);
    }

    // Salvar alerta no banco
    await database.saveAlert(
      detection.id,
      monitoredPlate.id,
      'dashboard',
      'sistema',
      this.formatAlertMessage(alertData)
    );

    // Marcar detecção como alerta enviado
    await this.markAlertSent(detection.id);

    return true;
  }

  async sendEmailAlert(alertData, detectionId, monitoredPlateId) {
    const subject = `🚨 ALERTA: ${alertData.status.toUpperCase()} - Placa ${alertData.plateNumber}`;
    
    const htmlContent = this.generateEmailTemplate(alertData);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: this.getAlertRecipients(alertData.status),
      subject: subject,
      html: htmlContent
    };

    try {
      await this.emailTransporter.sendMail(mailOptions);
      console.log('📧 Email de alerta enviado com sucesso');

      // Salvar alerta de email no banco
      await database.saveAlert(
        detectionId,
        monitoredPlateId,
        'email',
        mailOptions.to,
        subject
      );

    } catch (error) {
      console.error('❌ Erro ao enviar email de alerta:', error);
      
      // Salvar alerta falhado no banco
      await database.saveAlert(
        detectionId,
        monitoredPlateId,
        'email',
        mailOptions.to,
        `FALHA: ${subject}`,
        'failed'
      );
    }
  }

  getAlertRecipients(status) {
    // Configurar destinatários baseado no status
    const recipients = {
      'stolen': 'seguranca@empresa.com,policia@local.gov.br',
      'suspicious': 'operador@empresa.com,supervisor@empresa.com',
      'vip': 'recepcao@empresa.com',
      'blocked': 'seguranca@empresa.com'
    };

    return recipients[status] || 'operador@empresa.com';
  }

  generateEmailTemplate(alertData) {
    const statusColors = {
      'stolen': '#dc2626',      // Vermelho
      'suspicious': '#f59e0b',  // Amarelo
      'vip': '#059669',         // Verde
      'blocked': '#7c2d12'      // Marrom
    };

    const statusLabels = {
      'stolen': '🔴 VEÍCULO ROUBADO',
      'suspicious': '🟡 SUSPEITO',
      'vip': '🟢 VIP',
      'blocked': '🔴 BLOQUEADO'
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Alerta de Segurança</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${statusColors[alertData.status]}; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px;">⚠️ ALERTA DE SEGURANÇA</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">${statusLabels[alertData.status]}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #333;">Detalhes da Detecção</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Placa:</td>
                    <td style="padding: 8px 0;">${alertData.plateNumber}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Data/Hora:</td>
                    <td style="padding: 8px 0;">${alertData.detectionTime.toLocaleString('pt-BR')}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Local:</td>
                    <td style="padding: 8px 0;">${alertData.cameraLocation}</td>
                </tr>
                ${alertData.ownerName ? `
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Proprietário:</td>
                    <td style="padding: 8px 0;">${alertData.ownerName}</td>
                </tr>
                ` : ''}
                ${alertData.vehicleModel ? `
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Veículo:</td>
                    <td style="padding: 8px 0;">${alertData.vehicleModel} - ${alertData.vehicleColor || 'Cor não informada'}</td>
                </tr>
                ` : ''}
            </table>
        </div>
        
        ${alertData.description ? `
        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #856404;">Observações:</h3>
            <p style="margin-bottom: 0; color: #856404;">${alertData.description}</p>
        </div>
        ` : ''}
        
        <div style="border-top: 1px solid #ddd; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>Sistema de Reconhecimento de Placas</p>
            <p>Gerado automaticamente em ${new Date().toLocaleString('pt-BR')}</p>
        </div>
    </body>
    </html>
    `;
  }

  formatAlertMessage(alertData) {
    return `ALERTA: Placa ${alertData.plateNumber} (${alertData.status}) detectada em ${alertData.cameraLocation} às ${alertData.detectionTime.toLocaleString('pt-BR')}`;
  }

  async markAlertSent(detectionId) {
    const query = `
      UPDATE detections 
      SET alert_sent = true 
      WHERE id = $1
    `;
    
    try {
      await database.pool.query(query, [detectionId]);
    } catch (error) {
      console.error('Erro ao marcar alerta como enviado:', error);
    }
  }

  // Função para testar o sistema de alertas
  async testAlert() {
    const testData = {
      plateNumber: 'TEST123',
      status: 'stolen',
      description: 'Teste do sistema de alertas',
      ownerName: 'Teste',
      vehicleModel: 'Teste Model 2023',
      vehicleColor: 'Preto',
      cameraLocation: 'Câmera de Teste',
      detectionTime: new Date(),
      imagePath: '/uploads/test.jpg'
    };

    await this.sendEmailAlert(testData, 0, 0);
    console.log('✅ Teste de alerta concluído');
  }
}

module.exports = new AlertSystem();