import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { graphqlUploadExpress } from 'graphql-upload';

import { AppModule } from './app.module';

import * as dotenv from 'dotenv';
// dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use(graphqlUploadExpress({ maxFileSize: 1000000, maxFiles: 10 }));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);
}
bootstrap();
