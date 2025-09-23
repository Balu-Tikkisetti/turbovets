import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as dotenv from 'dotenv';
import { Client } from 'pg';
import { ValidationPipe } from '@nestjs/common';
import { databaseConfig, serverConfig } from './config/database.config';

dotenv.config();

async function prepareDatabase() {
  const dbName = databaseConfig.database;
  const client = new Client({
    user: databaseConfig.username,
    password: databaseConfig.password,
    host: databaseConfig.host,
    port: databaseConfig.port,
    database: 'postgres',
  });

  try {
    await client.connect();
    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName],
    );

    if (res.rowCount === 0) {
      console.log(`⚡ Database "${dbName}" not found. Creating...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(` Database "${dbName}" created successfully.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (error) {
    console.error('Failed to prepare database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function bootstrap() {
  await prepareDatabase();
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  
  
  app.enableCors({
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'Pragma',
      'X-CSRF-Token',
      'X-Access-Token',
      'X-Refresh-Token'
    ],
    exposedHeaders: [
      'Authorization',
      'X-Total-Count',
      'X-Page-Count',
      'X-Current-Page',
      'X-Per-Page',
      'X-Access-Token',
      'X-Refresh-Token'
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  const port = serverConfig.port;
  await app.listen(port);
  Logger.log(
    `Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();