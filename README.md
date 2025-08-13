# 🚗 AutoVi - Vigilância Automática de Placas

Sistema completo para reconhecimento automático de placas veiculares com alertas em tempo real para veículos monitorados.

## ✨ Funcionalidades

### 🔍 Reconhecimento Inteligente
- **OCR Avançado**: Reconhecimento automático usando TesseractJS
- **Múltiplos Formatos**: Suporte a placas antigas e Mercosul
- **Alta Precisão**: Pré-processamento de imagem para melhor OCR
- **Confiança**: Score de confiança para cada detecção

### 🚨 Sistema de Alertas
- **Placas Monitoradas**: Cadastro de veículos roubados, suspeitos, VIPs
- **Alertas Instantâneos**: Notificações em tempo real via WebSocket
- **Notificações Email**: Envio automático para autoridades
- **Dashboard Dinâmico**: Interface com alertas visuais e sonoros

### 📊 Dashboard Completo
- **Visão Geral**: Estatísticas em tempo real
- **Histórico**: Lista completa de detecções
- **Gerenciamento**: CRUD de placas monitoradas
- **Relatórios**: Análises e métricas do sistema

### 📱 Interface Moderna
- **Responsive**: Funciona em desktop e mobile
- **Tempo Real**: Atualizações instantâneas via WebSocket
- **Upload Fácil**: Drag & drop para análise de imagens
- **UX Intuitiva**: Interface limpa e profissional

## 🏗️ Arquitetura

### Backend (Node.js)
- **API REST**: Express.js para endpoints
- **WebSocket**: Socket.IO para tempo real
- **OCR**: TesseractJS + Sharp para processamento
- **Banco**: PostgreSQL para persistência
- **Notificações**: Nodemailer para emails

### Frontend (React)
- **Dashboard**: Interface administrativa
- **Componentes**: Modular e reutilizável
- **Estado**: React Hooks para gerenciamento
- **Estilo**: TailwindCSS para design
- **Comunicação**: Axios + Socket.IO

### Banco de Dados
```
📦 PostgreSQL
├── users (usuários do sistema)
├── monitored_plates (placas vigiadas)
├── cameras (câmeras/locais)
├── detections (histórico de detecções)
└── alerts (log de notificações)
```

## 🚀 Instalação

### Pré-requisitos
- Node.js (v16 ou superior)
- PostgreSQL (v12 ou superior)
- npm ou yarn

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd license-plate-system
```

### 2. Configure o Banco de Dados
```bash
# Instale o PostgreSQL
sudo apt install postgresql postgresql-contrib

# Acesse o PostgreSQL
sudo -u postgres psql

# Execute o script de criação
\i database/init.sql
```

### 3. Instale e Configure o Backend
```bash
cd backend

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Inicie o servidor
npm run dev
```

### 4. Instale e Configure o Frontend
```bash
cd frontend

# Instale as dependências
npm install

# Instale dependências adicionais
npm install axios socket.io-client react-router-dom react-dropzone react-toastify chart.js react-chartjs-2 date-fns lucide-react tailwindcss autoprefixer postcss

# Inicie a aplicação
npm start
```

## ⚙️ Configuração

### Variáveis de Ambiente (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=license_plate_db
DB_USER=postgres
DB_PASSWORD=sua_senha

# JWT
JWT_SECRET=sua_chave_secreta

# Email (para notificações)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_do_app

# Server
PORT=3001
```

### Configuração de Email
Para receber alertas por email:

1. **Gmail**: Ative a verificação em duas etapas e gere uma senha de app
2. **Outros**: Configure SMTP do seu provedor
3. **Opcional**: Configure Twilio para SMS (futuro)

## 📖 Como Usar

### 1. Acesse o Dashboard
```
http://localhost:3000
```

### 2. Cadastre Placas para Monitoramento
- Navegue até "Placas Monitoradas"
- Clique em "Nova Placa"
- Preencha informações:
  - **Placa**: ABC1234
  - **Status**: Roubado/Suspeito/VIP/Bloqueado
  - **Descrição**: Motivo do monitoramento
  - **Dados do Veículo**: Modelo, cor, proprietário

### 3. Upload de Imagens
- Vá para "Upload de Imagem"
- Arraste uma foto ou clique para selecionar
- Aguarde o processamento automático
- **Se a placa estiver monitorada**: 🚨 ALERTA VERMELHO

### 4. Monitoramento em Tempo Real
- Dashboard mostra detecções ao vivo
- Alertas aparecem instantaneamente
- Notificações são enviadas automaticamente
- Histórico fica salvo para consulta

## 🎯 Cenários de Uso

### 🚔 Segurança Pública
```javascript
// Exemplo: Veículo roubado detectado
{
  plate: "ABC1234",
  status: "stolen",
  description: "Honda Civic roubado em 10/08/2025",
  alert: "🚨 VEÍCULO ROUBADO DETECTADO!"
}
```

### 🏢 Controle de Acesso
```javascript
// Exemplo: VIP detectado
{
  plate: "VIP0001", 
  status: "vip",
  description: "Diretor da empresa",
  alert: "⭐ Acesso VIP autorizado"
}
```

### 🕵️ Investigação
```javascript
// Exemplo: Suspeito em monitoramento
{
  plate: "SUS9999",
  status: "suspicious", 
  description: "Investigação em andamento",
  alert: "⚠️ Veículo sob investigação"
}
```

## 🔧 API Endpoints

### Reconhecimento
```javascript
POST /api/recognize
// Upload de imagem para reconhecimento
// Retorna: placa detectada + alertas

GET /api/detections
// Lista histórico de detecções
// Suporte a paginação e filtros
```

### Monitoramento  
```javascript
GET /api/monitored-plates
// Lista placas monitoradas

POST /api/monitored-plates
// Adiciona nova placa ao monitoramento

DELETE /api/monitored-plates/:id
// Remove placa do monitoramento
```

### Dashboard
```javascript
GET /api/dashboard/stats
// Estatísticas em tempo real

GET /api/alerts/recent
// Alertas recentes

GET /api/cameras
// Status das câmeras
```

## 🔍 WebSocket Events

### Cliente → Servidor
```javascript
// Conexão
socket.on('connect', () => {
  console.log('Conectado ao servidor');
});
```

### Servidor → Cliente
```javascript
// Alerta de placa monitorada
socket.on('plate_alert', (data) => {
  // data.detection = dados da detecção
  // data.monitoredPlate = dados da placa monitorada  
  // data.timestamp = quando foi detectada
});

// Detecção normal
socket.on('plate_detected', (data) => {
  // data.detection = dados da detecção
  // data.timestamp = quando foi detectada
});
```

## 🎨 Screenshots

### Dashboard Principal
- Estatísticas em tempo real
- Lista de alertas ativos  
- Detecções recentes
- Status das câmeras

### Upload de Imagem
- Área de drag & drop
- Preview da imagem
- Resultado do reconhecimento
- Alertas visuais se encontrar placa monitorada

### Gerenciamento de Placas
- Lista de placas monitoradas
- Filtros por status
- Formulário de cadastro
- Histórico de detecções

## 🛠️ Desenvolvimento

### Estrutura do Projeto
```
license-plate-system/
├── backend/
│   ├── services/
│   │   ├── plateRecognition.js  # OCR e processamento
│   │   ├── database.js          # Queries PostgreSQL
│   │   └── alertSystem.js       # Notificações
│   ├── server.js               # Express app
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Componentes reutilizáveis
│   │   ├── pages/             # Páginas da aplicação
│   │   └── App.js             # Componente principal
│   └── package.json
└── database/
    └── init.sql               # Schema do banco
```

### Scripts Úteis
```bash
# Backend
npm run dev     # Servidor em modo desenvolvimento
npm start       # Servidor em produção
npm test        # Executar testes

# Frontend  
npm start       # Aplicação React
npm run build   # Build para produção
npm test        # Testes dos componentes
```

## 📈 Métricas e Performance

### OCR Performance
- **Tempo médio**: ~2-3 segundos por imagem
- **Precisão**: ~90% em condições ideais
- **Formatos**: JPG, PNG, GIF (até 10MB)
- **Resolução**: Melhor resultado com 800x600px+

### Banco de Dados
- **Índices**: Otimizado para consultas rápidas
- **Particionamento**: Por data para grandes volumes
- **Backup**: Configurar backup automático
- **Limpeza**: Script para limpar dados antigos

## 🔒 Segurança

### Autenticação
- JWT para autenticação de API
- Senhas hasheadas com bcrypt
- Rate limiting para uploads
- Validação de dados de entrada

### Privacidade
- Dados pessoais criptografados
- Logs de auditoria
- Retenção configurável de imagens
- GDPR compliance ready

## 🚀 Deploy em Produção

### Docker (Recomendado)
```bash
# Build das imagens
docker-compose build

# Subir o sistema
docker-compose up -d

# Logs
docker-compose logs -f
```

### VPS Tradicional
```bash
# Instalar PM2 para gerenciar processos
npm install -g pm2

# Backend
cd backend
pm2 start server.js --name "lpr-backend"

# Frontend (build + nginx)
cd frontend  
npm run build
# Servir build/ com nginx
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

### Problemas Comuns

**OCR não reconhece placas:**
- Verifique a qualidade da imagem (nitidez, iluminação)
- Certifique-se que a placa está bem visível
- Teste com diferentes ângulos

**Alertas não chegam por email:**
- Verifique as configurações SMTP no .env
- Confirme que a senha de app está correta
- Verifique os logs do servidor para erros

**WebSocket desconectando:**
- Verifique se o servidor está rodando na porta correta
- Confirme que não há proxy/firewall bloqueando
- Monitore os logs de conexão

### Contato
- **Issues**: Use o GitHub Issues para reportar bugs
- **Email**: contato@sistema-lpr.com
- **Documentação**: docs.sistema-lpr.com

---

**🚗 Desenvolvido para tornar as ruas mais seguras através da tecnologia! 🚗**