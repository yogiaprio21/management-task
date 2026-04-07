import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

console.log('Test script started');
NestFactory.create(AppModule).then(() => {
  console.log('NestFactory.create() succeeded');
}).catch(err => {
  console.error('NestFactory.create() failed', err);
});
