const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');

class PlateRecognitionService {
  constructor() {
    this.worker = null;
    this.initWorker();
  }

  async initWorker() {
    try {
      this.worker = await Tesseract.createWorker();
      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');
      await this.worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE,
      });
      console.log('✅ OCR Worker inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar OCR Worker:', error);
    }
  }

  async preprocessImage(imagePath) {
    try {
      const outputPath = imagePath.replace(path.extname(imagePath), '_processed' + path.extname(imagePath));
      
      // Pré-processamento da imagem para melhorar OCR
      await sharp(imagePath)
        .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
        .greyscale()
        .normalize()
        .sharpen()
        .threshold(128)
        .toFile(outputPath);
      
      return outputPath;
    } catch (error) {
      console.error('Erro no pré-processamento:', error);
      return imagePath; // Retorna imagem original em caso de erro
    }
  }

  async recognizePlate(imagePath) {
    try {
      if (!this.worker) {
        await this.initWorker();
      }

      // Pré-processar imagem
      const processedImagePath = await this.preprocessImage(imagePath);

      // Reconhecimento OCR
      const { data: { text, confidence } } = await this.worker.recognize(processedImagePath);
      
      // Limpar e validar texto da placa
      const cleanedText = this.cleanPlateText(text);
      const validatedPlate = this.validatePlate(cleanedText);

      console.log(`📸 Imagem processada: ${imagePath}`);
      console.log(`🔍 Texto detectado: "${text}" -> Placa: "${validatedPlate}"`);
      console.log(`📊 Confiança: ${confidence.toFixed(2)}%`);

      return {
        plate: validatedPlate,
        originalText: text,
        confidence: confidence,
        imagePath: imagePath
      };

    } catch (error) {
      console.error('❌ Erro no reconhecimento de placa:', error);
      throw error;
    }
  }

  cleanPlateText(text) {
    if (!text) return '';
    
    // Remove espaços, quebras de linha e caracteres especiais
    return text
      .replace(/[^A-Z0-9]/g, '') // Remove tudo exceto letras e números
      .trim()
      .toUpperCase();
  }

  validatePlate(plateText) {
    if (!plateText) return null;
    
    // Padrões de placas brasileiras
    const patterns = [
      /^[A-Z]{3}[0-9]{4}$/,     // Padrão antigo: ABC1234
      /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/, // Mercosul: ABC1D23
      /^[A-Z]{2}[0-9]{4}$/,     // Motos antigas: AB1234
    ];

    // Tenta cada padrão
    for (const pattern of patterns) {
      if (pattern.test(plateText)) {
        return plateText;
      }
    }

    // Se não encontrou padrão exato, tenta corrigir
    const corrected = this.attemptCorrection(plateText);
    if (corrected) return corrected;

    // Se ainda não conseguiu, retorna null se muito pequeno/grande
    if (plateText.length < 6 || plateText.length > 8) {
      return null;
    }

    // Retorna o texto limpo mesmo que não siga o padrão exato
    return plateText;
  }

  attemptCorrection(text) {
    // Correções comuns de OCR
    const corrections = {
      '0': 'O', 'O': '0',
      '1': 'I', 'I': '1',
      '5': 'S', 'S': '5',
      '8': 'B', 'B': '8',
      '2': 'Z', 'Z': '2'
    };

    // Tenta algumas correções se o texto tem tamanho apropriado
    if (text.length >= 6 && text.length <= 8) {
      // Padrão antigo (3 letras + 4 números)
      if (text.length === 7) {
        let corrected = text.substring(0, 3).replace(/[0-9]/g, char => corrections[char] || char);
        corrected += text.substring(3).replace(/[A-Z]/g, char => corrections[char] || char);
        
        if (/^[A-Z]{3}[0-9]{4}$/.test(corrected)) {
          return corrected;
        }
      }
    }

    return null;
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

module.exports = new PlateRecognitionService();