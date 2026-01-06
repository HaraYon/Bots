# Pureza Novatos Bot

Bot de detecção e engajamento de novos membros para grandes servidores.

## Funcionalidades
- Detecção automática de novos membros
- Cálculo de score de risco
- Engajamento automático via DM/Canal
- Dashboard de métricas para Staff

## Instalação

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure o ambiente:
   - Copie o arquivo `.env.example` para `.env`
   - Preencha os dados (Token do Bot, IDs dos canais)

3. Inicie o bot:
   ```bash
   # Para desenvolvimento (auto-reload)
   npm run dev
   
   # Para produção
   npm run build
   npm start
   ```

## Estrutura
- `src/`: Código fonte
- `data/novatos/`: Banco de dados JSON
