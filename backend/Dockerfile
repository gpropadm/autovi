# Usar Node.js como base
FROM node:18-alpine

# Instalar dependências do sistema para OpenCV e Tesseract
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    tesseract-ocr \
    tesseract-ocr-data-por \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências do Node.js
RUN npm ci --only=production && npm cache clean --force

# Copiar código da aplicação
COPY . .

# Criar diretório para uploads
RUN mkdir -p uploads logs

# Expor porta
EXPOSE 3001

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Definir permissões
RUN chown -R nodejs:nodejs /app
USER nodejs

# Comando para iniciar a aplicação
CMD ["node", "server.js"]