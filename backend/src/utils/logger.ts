import winston from 'winston';
import { logConfig } from '@/config';

// Formato personalizado para desarrollo
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Formato para producción
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Crear logger
export const logger = winston.createLogger({
  level: logConfig.level,
  format: logConfig.format === 'json' ? productionFormat : developmentFormat,
  defaultMeta: { service: 'syntra-backend' },
  transports: [
    // Consola
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
  ],
});

// Añadir archivo en producción
if (logConfig.file) {
  logger.add(new winston.transports.File({
    filename: logConfig.file,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }));
  
  // Archivo separado para errores
  logger.add(new winston.transports.File({
    filename: logConfig.file.replace('.log', '.error.log'),
    level: 'error',
    maxsize: 5242880,
    maxFiles: 5,
  }));
}

// Stream para Morgan
export const logStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Helper functions
export const logError = (error: Error, context?: any) => {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    context,
  });
};

export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logWarning = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

export default logger;
