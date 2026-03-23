FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json tsconfig.json ./
RUN npm install

# Copy source
COPY src/ ./src/
COPY ../config/ ./config/
COPY ../types/ ./types/
COPY ../ai-engine/ ./ai-engine/
COPY ../simulation-engine/ ./simulation-engine/
COPY ../agent-orchestrator/ ./agent-orchestrator/
COPY ../execution-engine/ ./execution-engine/

# Build
RUN npm run build

EXPOSE 4000

CMD ["node", "dist/index.js"]
