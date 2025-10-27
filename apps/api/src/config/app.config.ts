import * as dotenv from 'dotenv';

dotenv.config();

export const databaseConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD ,
  database: process.env.DB_DATABASE ,
};

export const serverConfig = {
  port: parseInt(process.env.PORT, 10),
  nodeEnv: process.env.NODE_ENV ,
  corsOrigin: process.env.CORS_ORIGIN ,
};

export const jwtConfig = {
  secret: process.env.JWT_SECRET ,
  expiresIn: process.env.JWT_EXPIRES_IN,
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
};

export const appConfig = {
  name: process.env.APP_NAME ,
  version: process.env.APP_VERSION ,
};
