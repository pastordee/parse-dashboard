FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application files
COPY Parse-Dashboard ./Parse-Dashboard
COPY bin ./bin

# Create config directory
RUN mkdir -p /app/config

EXPOSE 4040

ENTRYPOINT ["node", "Parse-Dashboard/index.js"]
CMD ["--config", "/app/config/parse-dashboard-config.json"]
