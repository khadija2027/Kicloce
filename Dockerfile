# Multi-stage Dockerfile for Tontine Digitale
# Build stage for frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy frontend source
COPY frontend/src ./src
COPY frontend/index.html ./
COPY frontend/vite.config.js ./
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.js ./
COPY frontend/tsconfig.json ./
COPY frontend/tsconfig.node.json ./

# Copy public directory with at least placeholder
COPY frontend/public ./public/

# Build frontend
RUN npm run build

# Final stage - Runtime
FROM node:18-alpine

WORKDIR /app

# Install backend dependencies
COPY POC-Tontine/package*.json ./

RUN npm ci --omit=dev

# Copy backend source
COPY POC-Tontine/src ./src
COPY POC-Tontine/scripts ./scripts

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/dist ./public

# Expose port (HF Spaces will use this)
EXPOSE 7860

# Set environment variables
ENV NODE_ENV=production
ENV PORT=7860

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:7860/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the backend server
CMD ["node", "src/app.js"]
