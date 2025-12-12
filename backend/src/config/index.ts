import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  database: {
    url: process.env.DATABASE_URL || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  },

  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE || '2097152', 10), // 2MB
    maxMeshSize: parseInt(process.env.MAX_MESH_SIZE || '5242880', 10), // 5MB
  },

  dev: {
    email: process.env.DEV_EMAIL || 'dev@localrule.app',
    password: process.env.DEV_PASSWORD || 'DevPass123!',
  },

  isDevelopment: () => config.nodeEnv === 'development',
  isProduction: () => config.nodeEnv === 'production',
  isTest: () => config.nodeEnv === 'test',
};
