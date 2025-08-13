# Estágio 1: Build da aplicação React
FROM node:18-alpine as builder

WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código fonte
COPY . .

# Fazer build da aplicação
RUN npm run build

# Estágio 2: Servir com Nginx
FROM nginx:alpine

# Copiar arquivos buildados do estágio anterior
COPY --from=builder /app/build /usr/share/nginx/html

# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

# Comando padrão do nginx
CMD ["nginx", "-g", "daemon off;"]