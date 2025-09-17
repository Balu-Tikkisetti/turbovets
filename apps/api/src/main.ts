import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

async function prepareDatabase() {
  const dbName = process.env.DB_DATABASE || 'turbovets';
  const client = new Client({
    user: process.env.DB_USERNAME || 'balu',
    password: process.env.DB_PASSWORD || 'balu',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
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
      console.log(`✅ Database "${dbName}" created successfully.`);
    } else {
      console.log(`✅ Database "${dbName}" already exists.`);
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
    origin: 'http://localhost:4200', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();