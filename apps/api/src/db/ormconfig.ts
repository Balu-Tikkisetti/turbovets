import { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../entities/user.entity';

dotenv.config();

const config: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'balu',
  password: process.env.DB_PASSWORD || 'balu',
  database: process.env.DB_DATABASE || 'turbovets',
  entities: [User],
  synchronize: true,  // ⚠️ dev only
  logging: true,
};

export default config;
