import { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../entities/user.entity';
import { Task } from '../entities/task.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { Department } from '../entities/department.entity';
import { databaseConfig } from '../config/app.config';

dotenv.config();

const config: DataSourceOptions = {
  type: 'postgres',
  host: databaseConfig.host,
  port: databaseConfig.port,
  username: databaseConfig.username,
  password: databaseConfig.password,
  database: databaseConfig.database,
  entities: [User, Task, AuditLog, Department],
  synchronize: true,
  logging: true,
};

export default config;
