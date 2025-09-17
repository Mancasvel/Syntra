import dotenv from 'dotenv';

dotenv.config();

interface Config {
  NODE_ENV: string;
  PORT: number;
  
  // URLs
  FRONTEND_URL: string;
  MOBILE_APP_URL?: string;
  
  // Base de datos
  DATABASE_URL: string;
  
  // Redis
  REDIS_URL: string;
  
  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  
  // APIs Externas
  OPENAI_API_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
  
  // AWS
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  AWS_S3_BUCKET?: string;
  
  // Email
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  
  // MQTT para IoT/NFC
  MQTT_URL?: string;
  MQTT_USERNAME?: string;
  MQTT_PASSWORD?: string;
}

const requiredVars = [
  'DATABASE_URL',
  'REDIS_URL', 
  'JWT_SECRET'
];

// Validar variables de entorno requeridas
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
}

export const config: Config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  
  // URLs
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  MOBILE_APP_URL: process.env.MOBILE_APP_URL,
  
  // Base de datos
  DATABASE_URL: process.env.DATABASE_URL!,
  
  // Redis
  REDIS_URL: process.env.REDIS_URL!,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // APIs Externas
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  
  // AWS
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION || 'eu-west-1',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
  
  // Email
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  
  // MQTT
  MQTT_URL: process.env.MQTT_URL || 'mqtt://localhost:1883',
  MQTT_USERNAME: process.env.MQTT_USERNAME,
  MQTT_PASSWORD: process.env.MQTT_PASSWORD,
};

// Configuraciones específicas por entorno
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTesting = config.NODE_ENV === 'test';

// Configuración de logging
export const logConfig = {
  level: isDevelopment ? 'debug' : 'info',
  format: isProduction ? 'json' : 'simple',
  file: isProduction ? './logs/syntra.log' : undefined,
};

// Configuración de CORS
export const corsConfig = {
  origin: isDevelopment 
    ? ['http://localhost:3000', 'http://localhost:19006'] // Web + Expo
    : [config.FRONTEND_URL, config.MOBILE_APP_URL].filter(Boolean),
  credentials: true,
};

// Configuración de rate limiting
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isDevelopment ? 1000 : 100, // más permisivo en desarrollo
};

export default config;
