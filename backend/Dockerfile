FROM node:18-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache python3 make g++

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente
COPY . .

# Generar Prisma client
RUN npx prisma generate

# Construir aplicación
RUN npm run build

# Crear usuario no root
RUN addgroup -g 1001 -S nodejs && adduser -S syntra -u 1001

# Cambiar ownership de archivos
RUN chown -R syntra:nodejs /app
USER syntra

# Exponer puerto
EXPOSE 3001

# Comando de inicio
CMD ["npm", "start"]
